// effectful-list bench harness — drives every framework fixture via Playwright.
//
// Where js-framework measures raw keyed-list DOM throughput on effect-free
// rows, this suite makes every row LIFECYCLE-BEARING: a cross-module Row
// carrying a useEffect (mount/cleanup pair keyed on item.id), a
// useLayoutEffect keyed on item.value (layout read on every 10th row only),
// and a SHARED module-level callback ref that returns a cleanup. The numbers
// isolate the effect/ref machinery itself: effect-queue drain (splice+sort),
// effect ordering walks, per-(ref,element) cleanup bookkeeping, and deps-array
// Object.is churn — costs js-framework's effect-free rows never touch.
//
// Methodology mirrors the sibling benches: every op commits its DOM mutation
// AND its effect dispatch inside the adapter call — synchronously where the
// framework allows it (octane: flushSync + drainPassiveEffects; react:
// flushSync — React 19 flushes passives synchronously at the tail of a
// sync-lane commit; solid: flush(); ripple: flushSync). Native async adapters
// (Preact and vue-vapor) return a thenable and the timed window extends until it
// settles after the DOM mutation. Either way we time ONLY the
// framework's JS work, with a forced GC before each timed sample.
// Sub-millisecond ops (update_nodeps / update_deps on the fine-grained
// targets) loop N times inside the timed window and divide, to beat timer
// quantization — awaiting BETWEEN iterations on async-commit targets so the
// N state changes can't coalesce into one commit.
//
// CORRECTNESS GATE (load-bearing): before timing each op, the harness resets
// the fixture's window.__fx counters, applies the op once, and asserts the
// counters equal the analytically expected values (e.g. clear from a fresh 1k
// → cleanups +1000 and refCleanups +1000, everything else 0). A fixture whose
// effects over- or under-fire would otherwise silently measure the wrong
// workload. Any mismatch → exit 1 (BENCH_JSON still written, with `failed`).
//
// Ops (expected __fx deltas from a reset, per 1k rows):
//   mount_1k     empty → 1000 rows        mounts 1000, refs 1000, layouts 100, h>0
//   update_nodeps bump unrelated tick     all counters 0 (rows re-render in the
//                                         VDOM targets; every deps unchanged)
//   update_deps  bump every item.value    layouts 100 (1000 layout refires,
//                                         100 probe reads), h>0, others 0
//   clear        1000 → 0                 cleanups 1000, refCleanups 1000
//   remount      all-new keys             mounts+cleanups 1000, refs+refCleanups 1000,
//                                         layouts 100, h>0
//   remove_100_scattered  drop every 10th cleanups 100, refCleanups 100
//
// Servers must be running first (production preview recommended):
//   pnpm --filter octane-tsrx-effectful-list-bench preview   # :5201
//   pnpm --filter octane-jsx-effectful-list-bench  preview   # :5202
//   pnpm --filter react-effectful-list-bench       preview   # :5203
//   pnpm --filter solid-effectful-list-bench       preview   # :5204
//   pnpm --filter ripple-effectful-list-bench      preview   # :5205
//   pnpm --filter vue-vapor-effectful-list-bench   preview   # :5221
// (swap `preview` → `dev` for the unminified dev build).
//
// Usage:  node run.mjs [iter]   # default 30
// Env:    TARGETS='[{"name":"octane-tsrx","url":"http://localhost:5201/"}]'
//         BENCH_JSON=/path/out.json   # machine-readable results

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '30', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : Math.min(10, Math.max(2, ITER));
const YIELD_MS = 5;

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5201/' },
			{ name: 'octane-jsx', url: 'http://localhost:5202/' },
			{ name: 'react', url: 'http://localhost:5203/' },
			{ name: 'solid', url: 'http://localhost:5204/' },
			{ name: 'ripple', url: 'http://localhost:5205/' },
			{ name: 'vue-vapor', url: 'http://localhost:5221/' },
			{ name: 'preact', url: 'http://localhost:5266/' },
			{ name: 'svelte', url: 'http://localhost:5277/' },
			{ name: 'inferno', url: 'http://localhost:5330/' },
		];

// perSamplePre: the op consumes its pre-state (empty / fresh 1k), so the pre
// step re-runs (untimed) before EVERY sample. inner: timed-window inner-loop
// count (sample = total / inner) for ops that are sub-millisecond on the
// fine-grained targets. expect: exact __fx deltas (h is sign-checked only —
// its magnitude is row-height dependent). rowsAfter: tbody tr count gate.
const OPS = [
	{
		name: 'mount_1k',
		pre: '__toEmpty',
		op: '__opMount1k',
		perSamplePre: true,
		inner: 1,
		rowsAfter: 1000,
		expect: {
			mounts: 1000,
			cleanups: 0,
			refs: 1000,
			refCleanups: 0,
			layouts: 100,
			hPositive: true,
		},
	},
	{
		name: 'update_nodeps',
		pre: '__toFresh1k',
		op: '__opUpdateNodeps',
		perSamplePre: false,
		inner: 10,
		rowsAfter: 1000,
		expect: { mounts: 0, cleanups: 0, refs: 0, refCleanups: 0, layouts: 0, hPositive: false },
	},
	{
		name: 'update_deps',
		pre: '__toFresh1k',
		op: '__opUpdateDeps',
		perSamplePre: false,
		inner: 10,
		rowsAfter: 1000,
		expect: { mounts: 0, cleanups: 0, refs: 0, refCleanups: 0, layouts: 100, hPositive: true },
	},
	{
		name: 'clear',
		pre: '__toFresh1k',
		op: '__opClear',
		perSamplePre: true,
		inner: 1,
		rowsAfter: 0,
		expect: { mounts: 0, cleanups: 1000, refs: 0, refCleanups: 1000, layouts: 0, hPositive: false },
	},
	{
		name: 'remount',
		pre: '__toFresh1k',
		op: '__opRemount',
		perSamplePre: false, // self-sustaining: each remount replaces 1000 with 1000 new keys
		inner: 1,
		rowsAfter: 1000,
		expect: {
			mounts: 1000,
			cleanups: 1000,
			refs: 1000,
			refCleanups: 1000,
			layouts: 100,
			hPositive: true,
		},
	},
	{
		name: 'remove_100_scattered',
		pre: '__toFresh1k',
		op: '__opRemove100',
		perSamplePre: true,
		inner: 1,
		rowsAfter: 900,
		expect: { mounts: 0, cleanups: 100, refs: 0, refCleanups: 100, layouts: 0, hPositive: false },
	},
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

// Run pre → resetFx → op ONCE (untimed, settled with macrotask yields so even
// an adapter that defers effect flush past its sync op has fired everything),
// then assert the exact counter deltas + row count. Returns the list of
// mismatch strings (empty === gate passed). The caller records the failure and
// keeps going so ONE broken (target, op) can't blank out every other number —
// the run still exits non-zero with a top-level `failed` field (BENCH_JSON
// contract), and every failed op is flagged per-target in meta.fxGate.
async function gateCheck(page, op) {
	await page.evaluate((pre) => window[pre](), op.pre);
	await sleep(50);
	await page.evaluate(() => window.__resetFx());
	await page.evaluate((o) => window[o](), op.op);
	await sleep(50);
	const got = await page.evaluate(() => ({
		fx: { ...window.__fx },
		rows: document.querySelectorAll('tbody tr').length,
	}));
	const errs = [];
	for (const k of ['mounts', 'cleanups', 'refs', 'refCleanups', 'layouts']) {
		if (got.fx[k] !== op.expect[k]) errs.push(`${k}: expected ${op.expect[k]}, got ${got.fx[k]}`);
	}
	if (op.expect.hPositive ? !(got.fx.h > 0) : got.fx.h !== 0) {
		errs.push(`h: expected ${op.expect.hPositive ? '> 0' : '0'}, got ${got.fx.h}`);
	}
	if (got.rows !== op.rowsAfter) errs.push(`rows: expected ${op.rowsAfter}, got ${got.rows}`);
	return errs;
}

// Timed loop, entirely in-page: (optional per-sample pre) → gc() → inner×op →
// divide. Yields a macrotask between samples so the page stays responsive and
// deferred work can't bleed into the next sample. An op that returns a
// thenable (Preact/vue-vapor; see the methodology note) is
// awaited BETWEEN inner iterations, so each iteration commits — the inner
// state changes would otherwise coalesce into one commit and the sample
// would time a single net update instead of `inner` full ones.
async function measureOp(page, op) {
	const samples = await page.evaluate(
		async ({ preName, opName, perSamplePre, inner, WARMUP, ITER, YIELD_MS }) => {
			const pre = window[preName];
			const fn = window[opName];
			const gc = window.gc || (() => {});
			const yieldTask = () => new Promise((r) => setTimeout(r, YIELD_MS));
			const out = [];
			if (!perSamplePre) {
				pre();
				await yieldTask();
			}
			for (let i = 0; i < WARMUP + ITER; i++) {
				if (perSamplePre) {
					pre();
					await yieldTask();
				}
				gc();
				const t0 = performance.now();
				for (let k = 0; k < inner; k++) {
					const r = fn();
					if (r && typeof r.then === 'function') await r;
				}
				const dt = (performance.now() - t0) / inner;
				if (i >= WARMUP) out.push(dt);
				await yieldTask();
			}
			return out;
		},
		{
			preName: op.pre,
			opName: op.op,
			perSamplePre: op.perSamplePre,
			inner: op.inner,
			WARMUP,
			ITER,
			YIELD_MS,
		},
	);
	return summarize(samples);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox', '--js-flags=--expose-gc'],
	});
	try {
		const { page } = await freshPage(browser, t.url);
		const hasGc = await page.evaluate(() => typeof window.gc === 'function');
		if (!hasGc) {
			console.error(
				'  ! window.gc unavailable (need --js-flags=--expose-gc) — results will be noisier',
			);
		}
		await page.evaluate(() => window.__mount());
		await sleep(50);

		const ops = {};
		const gateFailures = [];
		for (const op of OPS) {
			console.error(`  → ${op.name} (gate)`);
			const errs = await gateCheck(page, op);
			if (errs.length > 0) {
				console.error(`    ✗ GATE FAIL: ${errs.join('; ')}`);
				gateFailures.push({ op: op.name, errs });
				// Skip timing a mis-firing op — its number would measure the wrong
				// workload. Other ops still run so the target isn't blanked out.
				continue;
			}
			console.error(`  → ${op.name}`);
			ops[op.name] = await measureOp(page, op);
		}
		return { ops, gateFailures };
	} finally {
		await browser.close();
	}
}

function writeBenchJson(all, failed) {
	const path = process.env.BENCH_JSON;
	if (!path) return;
	const payload = {
		suite: 'effectful-list',
		iterations: ITER,
		targets: TARGETS.filter((t) => all[t.name]).map((t) => {
			const res = all[t.name];
			const fails = res.gateFailures;
			return {
				name: t.name,
				ops: Object.fromEntries(
					OPS.filter((op) => res.ops[op.name]).map((op) => {
						const r = res.ops[op.name];
						return [op.name, timingStatForJson(r)];
					}),
				),
				meta:
					fails.length === 0
						? { fxGate: 'pass' }
						: {
								fxGate: 'fail',
								fxGateFailures: fails.map((f) => ({ op: f.op, details: f.errs })),
							},
			};
		}),
	};
	if (failed) payload.failed = failed;
	writeFileSync(path, JSON.stringify(payload, null, 1));
}

(async () => {
	const all = {};
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER} (+${WARMUP} warmup)…`);
		all[t.name] = await runTarget(t);
	}

	const cols = TARGETS.map((t) => t.name);
	const W = 30;
	const cell = (r) =>
		r ? `${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, sd ${r.stddev.toFixed(2)})` : 'GATE FAIL';
	console.log();
	console.log('Op                   | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('---------------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.name.padEnd(20)];
		for (const c of cols) row.push(cell(all[c].ops[op.name]).padEnd(W));
		console.log(row.join('| '));
	}

	// Pairwise ratio block — FIRST target (octane-tsrx) is the baseline. Ops
	// where either side failed its gate are skipped (no comparable number).
	if (TARGETS.length > 1) {
		const baselineName = TARGETS[0].name;
		const baseline = all[baselineName].ops;
		console.log();
		for (const t of TARGETS.slice(1)) {
			const r = all[t.name].ops;
			console.log(`${t.name} / ${baselineName} ratio (score; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const a = r[op.name];
				const b = baseline[op.name];
				if (!a || !b) {
					console.log(`  ${op.name.padEnd(20)} —      (gate fail)`);
					continue;
				}
				const ratio = scoreOf(a) / scoreOf(b);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.name.padEnd(20)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}
	}

	// Aggregate gate outcome across every target; exit non-zero (with a written
	// `failed` reason) if ANY (target, op) gate mis-fired — the BENCH_JSON
	// contract — while still having produced numbers for every passing op above.
	const failedTargets = TARGETS.filter((t) => all[t.name].gateFailures.length > 0);
	if (failedTargets.length > 0) {
		const reason = failedTargets
			.map(
				(t) =>
					`${t.name}: ${all[t.name].gateFailures
						.map((f) => `${f.op} (${f.errs.join(', ')})`)
						.join('; ')}`,
			)
			.join(' | ');
		console.error(`\nCORRECTNESS GATE FAILURE\n${reason}`);
		writeBenchJson(all, reason);
		process.exit(1);
	}

	writeBenchJson(all, null);
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
