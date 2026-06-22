// signal-favoring bench harness — drives the 100-component chain with
// stateful counters at C1, C11, C21, ..., C91 (10 stateful in total).
//
// Ops measured per target:
//   - mount             — initial render of all 100 components
//   - bump_shallow      — bump C1; in hook frameworks this cascades through
//                         C1→C100 (99 component re-renders). In signal
//                         frameworks (solid, ripple) only the single `{v}`
//                         text expression inside C1 recomputes.
//   - bump_middle       — bump C51; ~50 cascading renders for hooks, 1 expr
//                         for signals.
//   - bump_deep         — bump C91; ~10 cascading renders for hooks, 1 expr
//                         for signals.
//   - bump_sweep        — bump all 10 stateful nodes, flushing after EACH
//                         (flush-on-every-change); 10 separate commits.
//   - bump_sweep_batched— bump all 10, then a SINGLE flush; the framework's
//                         natural microtask coalescing (one commit). The gap
//                         vs bump_sweep is what batching buys.
//   - unmount           — full teardown via the framework's unmount API.
//
// The bench is named "signal-favoring" because bump_shallow has a clear
// structural advantage for signals — but at this scale the absolute gap is
// often small enough that the choice doesn't dominate real-world apps.
//
// Usage:
//   pnpm --filter ripple-new-signal-bench dev   # :5190
//   pnpm --filter solid-signal-bench dev        # :5191
//   pnpm --filter react-signal-bench dev        # :5192
//   pnpm --filter ripple-signal-bench dev       # :5193
//   node benchmarks/signal-favoring/run.mjs [iter]   # default 20

import { chromium } from 'playwright';

const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = 5;
const STATEFUL_INDICES = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'ripple-new', url: 'http://localhost:5190/' },
			{ name: 'solid', url: 'http://localhost:5191/' },
			{ name: 'react', url: 'http://localhost:5192/' },
			{ name: 'ripple', url: 'http://localhost:5193/' },
		];

const YIELD_MS = 5; // breathe between samples: let paint settle, don't block the page
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// All ops mutate the DOM SYNCHRONOUSLY inside the adapter call (ripple /
// ripple-new / react via flushSync, solid via flush()), so we time ONLY the
// synchronous op and force a GC right before each timed sample. This isolates
// framework JS work from browser paint + GC jitter — the prior rAF + task wait
// added ~16ms of frame latency that swamped the sub-ms signal and made medians
// swing run-to-run. See recursive-context/run.mjs for the same methodology.

async function freshPage(browser, url) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10_000 });
	return { ctx, page };
}

function summarize(samples) {
	const sorted = [...samples].sort((a, b) => a - b);
	const n = sorted.length;
	const mean = sorted.reduce((a, b) => a + b, 0) / n;
	const stddev = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
	return {
		median: sorted[n >> 1],
		min: sorted[0],
		p95: sorted[Math.min(n - 1, Math.floor(n * 0.95))],
		stddev,
	};
}

// MOUNT — fresh page per sample; time the synchronous __mount() on a clean heap.
async function measureMount(browser, url) {
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const { ctx, page } = await freshPage(browser, url);
		const dt = await page.evaluate(() => {
			(window.gc || (() => {}))();
			const t0 = performance.now();
			window.__mount();
			return performance.now() - t0;
		});
		if (i >= WARMUP) samples.push(dt);
		await ctx.close();
	}
	return summarize(samples);
}

// A single bump is one text-node update for a signal framework — far below
// performance.now()'s effective resolution. So each timed sample loops BUMP_REPS
// bumps and divides, giving a stable per-bump time that's meaningful at 2-decimal
// precision (instead of rounding to 0.00ms). Standard micro-benchmark practice.
const BUMP_REPS = 50;

// BUMP — mount once, time per-bump cost (BUMP_REPS bumps per sample) in a tight
// in-page loop with gc() before each sample.
async function measureBump(browser, url, idx) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = await page.evaluate(
		async ({ idx, REPS, WARMUP, ITER, YIELD_MS }) => {
			const fn = window['__bumpAt' + idx];
			if (typeof fn !== 'function') throw new Error('missing __bumpAt' + idx);
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const t0 = performance.now();
				for (let k = 0; k < REPS; k++) fn();
				const dt = (performance.now() - t0) / REPS;
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			return out;
		},
		{ idx, REPS: BUMP_REPS, WARMUP, ITER, YIELD_MS },
	);
	await ctx.close();
	return summarize(samples);
}

// SWEEP — bump all 10 stateful nodes per sample, in one of two modes:
//   batched=false → each bump flushes (10 separate commits, "flush on every
//                   change"); the worst case, no coalescing.
//   batched=true  → all 10 enqueue, then ONE flush (__sweepBatched); the
//                   framework's natural microtask coalescing, bounded
//                   synchronously. The gap between the two is what batching buys.
// Both end in the same DOM; only the commit count (and so the flush overhead
// paid) differs. Timed synchronously with gc() before each sample.
async function measureSweep(browser, url, batched) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = await page.evaluate(
		async ({ indices, batched, WARMUP, ITER, YIELD_MS }) => {
			const gc = window.gc || (() => {});
			const sweepBatched = window.__sweepBatched;
			if (batched && typeof sweepBatched !== 'function') throw new Error('missing __sweepBatched');
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const t0 = performance.now();
				if (batched) {
					sweepBatched();
				} else {
					for (const idx of indices) {
						const fn = window['__bumpAt' + idx];
						if (typeof fn !== 'function') throw new Error('missing __bumpAt' + idx);
						fn();
					}
				}
				const dt = performance.now() - t0;
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			return out;
		},
		{ indices: STATEFUL_INDICES, batched, WARMUP, ITER, YIELD_MS },
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
				window.__mount();
				await new Promise((r) => setTimeout(r, YIELD_MS));
				gc();
				const t0 = performance.now();
				window.__unmount();
				const dt = performance.now() - t0;
				window.__reset();
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
	console.error(`  → mount`);
	const mount = await measureMount(browser, t.url);
	console.error(`  → bump_shallow (C1)`);
	const bump_shallow = await measureBump(browser, t.url, 1);
	console.error(`  → bump_middle (C51)`);
	const bump_middle = await measureBump(browser, t.url, 51);
	console.error(`  → bump_deep (C91)`);
	const bump_deep = await measureBump(browser, t.url, 91);
	console.error(`  → bump_sweep (10 bumps, flush each)`);
	const bump_sweep = await measureSweep(browser, t.url, false);
	console.error(`  → bump_sweep_batched (10 bumps, 1 flush)`);
	const bump_sweep_batched = await measureSweep(browser, t.url, true);
	console.error(`  → unmount`);
	const unmount = await measureUnmount(browser, t.url);
	await browser.close();
	return { mount, bump_shallow, bump_middle, bump_deep, bump_sweep, bump_sweep_batched, unmount };
}

const OPS = [
	'mount',
	'bump_shallow',
	'bump_middle',
	'bump_deep',
	'bump_sweep',
	'bump_sweep_batched',
	'unmount',
];

(async () => {
	const all = {};
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER} (+${WARMUP} warmup)…`);
		all[t.name] = await runTarget(t);
	}

	const cols = TARGETS.map((t) => t.name);
	const W = 32;
	console.log();
	console.log('Op             | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('---------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	// Sub-0.1ms ops (single-signal bumps are ~µs) need finer precision than the
	// ms-scale mount; show 3 decimals below 0.1, 2 otherwise.
	const fmt = (x) => (x < 0.1 ? x.toFixed(3) : x.toFixed(2));
	for (const op of OPS) {
		const row = [op.padEnd(14)];
		for (const c of cols) {
			const r = all[c][op];
			row.push(`${fmt(r.median)} (min ${fmt(r.min)}, sd ${fmt(r.stddev)})`.padEnd(W));
		}
		console.log(row.join('| '));
	}

	if (TARGETS.length > 1) {
		// Last target is the baseline; others printed as ratios.
		const baselineName = TARGETS[TARGETS.length - 1].name;
		const baseline = all[baselineName];
		console.log();
		for (const t of TARGETS.slice(0, -1)) {
			const r = all[t.name];
			console.log(`${t.name} / ${baselineName} ratio (median; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const base = baseline[op].median;
				if (base === 0) {
					console.log(`  ${op.padEnd(14)}   —    (baseline ~0, sub-resolution)`);
					continue;
				}
				const ratio = r[op].median / base;
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.padEnd(14)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}

		// Cascade-cost ratio: bump_shallow / bump_deep. Hook frameworks pay ~10x
		// more for shallow than deep (99 cascading renders vs 10). Signal
		// frameworks should pay roughly the same for both. This ratio quantifies
		// the cascade-vs-targeted-update axis the bench was built to expose.
		console.log('cascade ratio (bump_shallow / bump_deep, signal frameworks should be near 1.0):');
		for (const c of cols) {
			const r = all[c];
			const deep = r.bump_deep.median;
			const ratioStr = deep === 0 ? '—' : (r.bump_shallow.median / deep).toFixed(2) + 'x';
			console.log(`  ${c.padEnd(14)} ${ratioStr}  (hooks expect ~10x, signals ~1x)`);
		}

		// Coalescing benefit: batched (1 flush) vs per-bump (10 flushes) for the
		// same 10 mutations. <1 means batching is cheaper; the further below 1, the
		// more the framework's queue saves by committing once instead of per write.
		console.log(
			'\ncoalescing ratio (bump_sweep_batched / bump_sweep, lower = bigger win from batching):',
		);
		for (const c of cols) {
			const r = all[c];
			const perOp = r.bump_sweep.median;
			const ratioStr = perOp === 0 ? '—' : (r.bump_sweep_batched.median / perOp).toFixed(2) + 'x';
			console.log(`  ${c.padEnd(14)} ${ratioStr}`);
		}
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
