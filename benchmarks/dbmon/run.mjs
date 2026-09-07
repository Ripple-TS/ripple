// dbmon bench harness — drives every framework fixture via Playwright.
//
// dbmon (dbmonster) stresses the UPDATE path: a table of DB_COUNT rows × 7 cells
// whose text + threshold class churn every frame. Where js-framework measures
// bulk create/clear and recursive-context measures deep Context fan-out, this
// isolates per-cell diff throughput + bulk keyed remount.
//
// Methodology mirrors the sibling benches: every op mutates the DOM inside its
// adapter call — synchronously where the framework allows it (octane/react via
// flushSync, solid via flush()); adapters using native async scheduling (Preact
// and vue-vapor) return a thenable and the timed window extends until it settles.
// Either way we time ONLY the framework's JS work, and force a GC right before
// each timed sample so a stray collection can't inflate it. Medians are
// framework cost, not paint.
//
// Ops:
//   mount        — render the full table (DB_COUNT rows).
//   tick         — full update: every row's count + 5 queries churn; same keys,
//                  so all rows reconcile in place and every cell diffs.
//   tick_partial — only ~10% of rows change; the rest are value-identical, so
//                  the per-binding diff-skip should make this far cheaper.
//   remount      — every key is new: all rows unmount + a fresh set mounts.
//   sort         — toggle sort order: worst-case keyed reorder (LIS moves).
//   unmount      — tear the whole table down.
//
// Servers must be running first (production preview recommended):
//   pnpm --filter octane-tsrx-dbmon-bench preview   # :5196
//   pnpm --filter octane-jsx-dbmon-bench  preview   # :5197
//   pnpm --filter react-dbmon-bench       preview   # :5198
//   pnpm --filter ripple-dbmon-bench      preview   # :5199
//   pnpm --filter solid-dbmon-bench       preview   # :5200
//   pnpm --filter vue-vapor-dbmon-bench   preview   # :5220
// (swap `preview` → `dev` for the unminified dev build).
//
// Usage:  node run.mjs [iter]   # default 30

import { chromium } from 'playwright';
import fs from 'node:fs';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '30', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : 10;
const YIELD_MS = 5;

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5196/' },
			{ name: 'octane-jsx', url: 'http://localhost:5197/' },
			{ name: 'ripple', url: 'http://localhost:5199/' },
			{ name: 'solid', url: 'http://localhost:5200/' },
			{ name: 'react', url: 'http://localhost:5198/' },
			{ name: 'vue-vapor', url: 'http://localhost:5220/' },
			{ name: 'preact', url: 'http://localhost:5263/' },
			{ name: 'svelte', url: 'http://localhost:5274/' },
			{ name: 'inferno', url: 'http://localhost:5326/' },
		];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function summarize(samples) {
	return summarizeSamples(samples);
}

async function freshPage(browser, url) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10_000 });
	return { ctx, page };
}

// Untimed fatal gate: prove the target implements the dbmon state/key contract
// before accepting any measurements from it.
async function semanticGate(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	try {
		return await page.evaluate(async () => {
			const errors = [];
			const expect = (condition, message) => {
				if (!condition) errors.push(message);
			};
			const call = async (name) => {
				const fn = window[name];
				if (typeof fn !== 'function') throw new Error(`missing ${name}`);
				const result = fn();
				if (result && typeof result.then === 'function') await result;
			};
			const rows = () => Array.from(document.querySelectorAll('.dbmon tbody > tr'));
			const rowText = (row) => row?.textContent ?? '';

			await call('__mount');
			let current = rows();
			expect(current.length === 1000, `mount rendered ${current.length} rows, expected 1000`);
			expect(
				current.every((row) => row.cells.length === 7),
				'mount did not render exactly 7 cells per row',
			);
			expect(
				current[0]?.querySelector('.dbname')?.textContent === 'cluster-0' &&
					current[999]?.querySelector('.dbname')?.textContent === 'cluster-999',
				'mount row identities are not cluster-0…cluster-999',
			);

			const firstRow = current[0];
			const fullBefore = document.querySelector('.dbmon tbody')?.textContent ?? '';
			await call('__tick');
			current = rows();
			expect(current.length === 1000, `full tick left ${current.length} rows`);
			expect(current[0] === firstRow, 'full tick replaced a surviving keyed row');
			expect(
				(document.querySelector('.dbmon tbody')?.textContent ?? '') !== fullBefore,
				'full tick did not update table values',
			);

			const changedBefore = rowText(current[0]);
			const unchangedBefore = rowText(current[100]);
			const unchangedRow = current[100];
			await call('__tickPartial');
			current = rows();
			expect(rowText(current[0]) !== changedBefore, 'partial tick did not update a selected row');
			expect(
				rowText(current[100]) === unchangedBefore,
				'partial tick changed a row outside the 10%',
			);
			expect(current[100] === unchangedRow, 'partial tick replaced an unchanged keyed row');

			const preRemountRows = new Set(current);
			await call('__remount');
			current = rows();
			expect(current.length === 1000, `remount rendered ${current.length} rows`);
			expect(
				current.every((row) => !preRemountRows.has(row)),
				'remount retained DOM nodes after every key changed',
			);
			expect(
				current[0]?.querySelector('.dbname')?.textContent === 'cluster-1000' &&
					current[999]?.querySelector('.dbname')?.textContent === 'cluster-1999',
				'remount did not advance the full key range',
			);

			const preSortRows = new Set(current);
			const preSortOrder = current
				.map((row) => row.querySelector('.dbname')?.textContent)
				.join('|');
			await call('__sort');
			current = rows();
			expect(current.length === 1000, `sort left ${current.length} rows`);
			expect(
				current.every((row) => preSortRows.has(row)),
				'sort rebuilt rows instead of moving keyed survivors',
			);
			expect(
				current.map((row) => row.querySelector('.dbname')?.textContent).join('|') !== preSortOrder,
				'sort did not change row order',
			);

			await call('__unmount');
			expect(document.querySelectorAll('.dbmon tbody > tr').length === 0, 'unmount left rows');
			const root = document.getElementById('main');
			expect(
				root?.querySelector('*') === null && root.textContent?.trim() === '',
				'unmount left rendered root content',
			);
			await call('__reset');
			expect(document.getElementById('main')?.childNodes.length === 0, 'reset left root DOM');
			return errors;
		});
	} finally {
		await ctx.close();
	}
}

// MOUNT — fresh page per sample (quiescent start); time __mount() with a
// freshly-collected heap. An adapter whose commit is scheduler-deferred
// returns a thenable (Preact and vue-vapor do) — the timed
// window extends until it settles, so the scheduling cost stays inside the
// measurement.
async function measureMount(browser, url) {
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const { ctx, page } = await freshPage(browser, url);
		const dt = await page.evaluate(async () => {
			(window.gc || (() => {}))();
			const t0 = performance.now();
			const r = window.__mount();
			if (r && typeof r.then === 'function') await r;
			return performance.now() - t0;
		});
		if (i >= WARMUP) samples.push(dt);
		await ctx.close();
	}
	return summarize(samples);
}

// LOOP op (tick / tick_partial / remount / sort) — mount once, time the op in a
// tight in-page loop with gc() before each sample.
async function measureLoop(browser, url, op) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(async () => {
		const result = window.__mount();
		if (result && typeof result.then === 'function') await result;
	});
	await sleep(50);
	const samples = await page.evaluate(
		async ({ op, WARMUP, ITER, YIELD_MS }) => {
			const fn = window[op];
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const t0 = performance.now();
				const r = fn();
				if (r && typeof r.then === 'function') await r;
				const dt = performance.now() - t0;
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			return out;
		},
		{ op, WARMUP, ITER, YIELD_MS },
	);
	await ctx.close();
	return summarize(samples);
}

// UNMOUNT — per sample: mount (untimed), settle, time the synchronous
// __unmount(), reset.
async function measureUnmount(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	const samples = await page.evaluate(
		async ({ WARMUP, ITER, YIELD_MS }) => {
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				const mounted = window.__mount();
				if (mounted && typeof mounted.then === 'function') await mounted;
				await new Promise((r) => setTimeout(r, YIELD_MS));
				gc();
				const t0 = performance.now();
				const r = window.__unmount();
				if (r && typeof r.then === 'function') await r;
				const dt = performance.now() - t0;
				const reset = window.__reset();
				if (reset && typeof reset.then === 'function') await reset;
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			return out;
		},
		{ WARMUP, ITER, YIELD_MS },
	);
	await ctx.close();
	return summarize(samples);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox', '--js-flags=--expose-gc'],
	});

	try {
		console.error(`  → semantic gate`);
		const gateErrors = await semanticGate(browser, t.url);
		if (gateErrors.length > 0) return { gateErrors, results: null };

		const { ctx, page } = await freshPage(browser, t.url);
		const hasGc = await page.evaluate(() => typeof window.gc === 'function');
		await ctx.close();
		if (!hasGc) {
			console.error(
				'  ! window.gc unavailable (need --js-flags=--expose-gc) — results will be noisier',
			);
		}

		console.error(`  → mount`);
		const mount = await measureMount(browser, t.url);
		console.error(`  → tick`);
		const tick = await measureLoop(browser, t.url, '__tick');
		console.error(`  → tick_partial`);
		const tick_partial = await measureLoop(browser, t.url, '__tickPartial');
		console.error(`  → remount`);
		const remount = await measureLoop(browser, t.url, '__remount');
		console.error(`  → sort`);
		const sort = await measureLoop(browser, t.url, '__sort');
		console.error(`  → unmount`);
		const unmount = await measureUnmount(browser, t.url);
		return {
			gateErrors: [],
			results: { mount, tick, tick_partial, remount, sort, unmount },
		};
	} finally {
		await browser.close();
	}
}

const OPS = ['mount', 'tick', 'tick_partial', 'remount', 'sort', 'unmount'];

(async () => {
	const all = {};
	const failures = [];
	const failedTargets = new Set();
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER} (+${WARMUP} warmup)…`);
		try {
			const { gateErrors, results } = await runTarget(t);
			if (gateErrors.length > 0) {
				failedTargets.add(t.name);
				for (const error of gateErrors) {
					const message = `${t.name}: semantic gate: ${error}`;
					failures.push(message);
					console.error(`  ✗ ${message}`);
				}
				continue;
			}
			all[t.name] = results;
		} catch (error) {
			failedTargets.add(t.name);
			const message = `${t.name}: ${error instanceof Error ? error.message : String(error)}`;
			failures.push(message);
			console.error(`  ✗ ${message}`);
		}
	}

	const successfulTargets = TARGETS.filter((t) => all[t.name]);
	const cols = successfulTargets.map((t) => t.name);
	const W = 32;
	console.log();
	console.log('Op               | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('-----------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.padEnd(16)];
		for (const c of cols) {
			const r = all[c][op];
			row.push(
				`${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, sd ${r.stddev.toFixed(2)})`.padEnd(W),
			);
		}
		console.log(row.join('| '));
	}

	if (successfulTargets.length > 1) {
		const baselineName =
			successfulTargets.find((target) => target.name === 'vue-vapor')?.name ??
			successfulTargets.at(-1).name;
		const baseline = all[baselineName];
		console.log();
		for (const t of successfulTargets) {
			if (t.name === baselineName) continue;
			const r = all[t.name];
			console.log(`${t.name} / ${baselineName} ratio (score; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const ratio = scoreOf(r[op]) / scoreOf(baseline[op]);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.padEnd(16)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}

		// Diff-skip ratio — a partial tick (~10% of rows) should be far cheaper
		// than a full tick if the per-binding diff skips unchanged cells.
		console.log('diff-skip ratio (tick_partial / tick, lower = better skipping):');
		for (const c of cols) {
			const r = all[c];
			const ratio = scoreOf(r.tick_partial) / scoreOf(r.tick);
			console.log(`  ${c.padEnd(16)} ${ratio.toFixed(3)}x  (ideal: ~0.1)`);
		}
	}

	// Machine-readable results for the unified bench runner (see the BENCH_JSON
	// contract in benchmarks/README.md): milliseconds, one ops map per target.
	if (process.env.BENCH_JSON) {
		const payload = {
			suite: 'dbmon',
			iterations: ITER,
			targets: TARGETS.map((t) => ({
				name: t.name,
				ops: all[t.name]
					? Object.fromEntries(
							OPS.map((op) => {
								const r = all[t.name][op];
								return [op, timingStatForJson(r)];
							}),
						)
					: {},
				meta: { gates: failedTargets.has(t.name) ? 'fail' : 'pass' },
			})),
		};
		if (failures.length > 0) payload.failed = failures.join('; ');
		fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
		console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
	}

	if (failures.length > 0) {
		console.error(`\n✗ ${failures.length} failure(s):`);
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exitCode = 1;
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
