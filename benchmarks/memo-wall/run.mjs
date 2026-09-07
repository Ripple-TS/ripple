// memo-wall bench harness — drives every framework fixture via Playwright.
//
// memo-wall isolates the cost of a MEMO WALL: 1000 `memo(Row)` children under
// one parent, where a parent re-render must be absorbed by 1000 shallow-equal
// prop bails (octane: tryMemoBail → shallowEqualProps), a single prop change
// must re-render exactly one row, and a context bump above the wall must
// refresh the 1000 Leaf consumers WITHOUT re-running any bailed Row/Inner body
// (octane: refreshContextConsumers walking stacked bailed boundaries). Two
// walls sit on the same page, differing only in how <Row> is put on screen:
//
//   wall A — compiled list position (`@for` / keyed `.map`): componentSlot →
//            the componentSlot arm of tryMemoBail.
//   wall B — value-position createElement descriptors from a plain-.ts helper
//            through a `{rows}` children hole: childSlot's keyed de-opt list →
//            the childSlot arm of tryMemoBail (the @octanejs bindings shape).
//
// CORRECTNESS GATE (the load-bearing part): every fixture body increments a
// window.__renders counter, and after each op's timed loop the harness runs
// ONE verification invocation with fresh counters and asserts the EXACT
// expected render counts — parent_rerender_equal_* MUST show 0 row-body
// invocations. Without that gate, one reference-unstable prop silently turns
// this suite into a full-re-render measurement. Any gate failure → exit 1
// (BENCH_JSON is still written, with a top-level `failed` field).
//
// Methodology mirrors the sibling benches: ops commit inside the timed hook —
// synchronously where the framework allows it (react flushSync, solid flush());
// Preact and vue-vapor hooks return a thenable the harness awaits inside the
// timed window — gc() is forced before every timed sample, and sub-millisecond
// ops loop enough invocations inside the timed window to keep newly auto-memoized
// regions above performance.now()'s resolution before dividing by the rep count.
//
// FINE-GRAINED COLUMNS (solid / vue-vapor): there is no memo wall — component
// bodies run once, so the probes count CREATIONS plus leaf TEXT-EFFECT re-runs
// (the fine-grained analog of a Leaf re-render), and the keyed lists key by
// row-object identity so one_change_* recreates exactly one row. The exact-
// count gates hold with the same expectations; parent_rerender_equal_* being
// near-zero for them is the honest model number (nothing to bail), not a bug —
// see their fixture comments.
//
// Servers must be running first (production preview recommended):
//   pnpm --filter octane-tsrx-memowall-bench preview   # :5206
//   pnpm --filter octane-jsx-memowall-bench  preview   # :5207
//   pnpm --filter react-memowall-bench       preview   # :5208 uncompiled control
//   pnpm --filter react-compiler-memowall-bench preview # :5226 canonical React
// (swap `preview` → `dev` for the unminified dev build).
//
// Usage:  node run.mjs [iter]   # default 20
//   TARGETS env (JSON array of {name,url}) overrides the default target list.
//   BENCH_JSON=<path> additionally writes machine-readable results there.

import { chromium } from 'playwright';
import fs from 'node:fs';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : 5;
const YIELD_MS = 5;
const TARGET_BATCH_MS = 8;
const MAX_REPS = 65_536;
const ROWS = 1000;

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5206/' },
			{ name: 'octane-jsx', url: 'http://localhost:5207/' },
			{ name: 'react', url: 'http://localhost:5226/' },
			{ name: 'react-uncompiled', url: 'http://localhost:5208/' },
			{ name: 'solid', url: 'http://localhost:5182/' },
			{ name: 'ripple', url: 'http://localhost:5225/' },
			{ name: 'vue-vapor', url: 'http://localhost:5223/' },
			{ name: 'preact', url: 'http://localhost:5267/' },
			{ name: 'svelte', url: 'http://localhost:5278/' },
		];

const Z = { rowA: 0, innerA: 0, leafA: 0, rowB: 0, innerB: 0, leafB: 0 };

// Per op: the window hook, the calibration's initial rep count, and the EXACT expected
// window.__renders delta for ONE invocation. `zeroRowLoop` additionally
// asserts that the counters stayed at zero across the WHOLE timed loop (every
// warmup + timed invocation must bail, not just the verification one).
const OPS = [
	{
		name: 'mount',
		hook: null,
		reps: 1,
		expect: { rowA: ROWS, innerA: ROWS, leafA: ROWS, rowB: ROWS, innerB: ROWS, leafB: ROWS },
	},
	{
		name: 'parent_rerender_equal_A',
		hook: '__tickA',
		reps: 10,
		expect: { ...Z },
		zeroRowLoop: true,
	},
	{
		name: 'parent_rerender_equal_B',
		hook: '__tickB',
		reps: 10,
		expect: { ...Z },
		zeroRowLoop: true,
	},
	{
		name: 'one_change_A',
		hook: '__oneChangeA',
		reps: 10,
		expect: { ...Z, rowA: 1, innerA: 1, leafA: 1 },
	},
	{
		name: 'one_change_B',
		hook: '__oneChangeB',
		reps: 10,
		expect: { ...Z, rowB: 1, innerB: 1, leafB: 1 },
	},
	{ name: 'ctx_through_wall_A', hook: '__ctxA', reps: 5, expect: { ...Z, leafA: ROWS } },
	{ name: 'ctx_through_wall_B', hook: '__ctxB', reps: 5, expect: { ...Z, leafB: ROWS } },
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

// In-page DOM snapshot, taken after the verification invocation: proves the
// render actually reached the document (leaf text = current theme, the changed
// row's inner cell shows the bumped value, both walls still hold 1000 rows).
// Duplicated inline in each page.evaluate (evaluate can't share host closures).

// MOUNT — fresh page per sample (quiescent start, freshly-collected heap);
// time the synchronous __mount(). One extra fresh page runs the verification
// (render counts + DOM snapshot).
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
	const { ctx, page } = await freshPage(browser, url);
	const verify = await page.evaluate(async () => {
		window.__resetRenders();
		const r = window.__mount();
		if (r && typeof r.then === 'function') await r;
		const state = window.__state();
		const t = (s) => {
			const el = document.querySelector(s);
			return el ? el.textContent : null;
		};
		const dom = {
			rowsA: document.querySelectorAll('#wall-a .rows > .item').length,
			rowsB: document.querySelectorAll('#wall-b .rows > .item').length,
			leafA0: t('#wall-a .rows > .item .leaf'),
			leafB0: t('#wall-b .rows > .item .leaf'),
			midInnerA: t('#wall-a .rows > .item:nth-child(' + (state.mid + 1) + ') .inner'),
			midInnerB: t('#wall-b .rows > .item:nth-child(' + (state.mid + 1) + ') .inner'),
		};
		return { delta: { ...window.__renders }, state, dom };
	});
	await ctx.close();
	return { samples, ...verify };
}

// LOOP op — mount once (untimed), calibrate the target-specific repetition
// count to an 8ms batch, then time that batch and divide by its reps. Afterwards:
// capture the whole-loop counters, then run ONE verification invocation with
// fresh counters + a DOM snapshot.
async function measureLoop(browser, url, op) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const res = await page.evaluate(
		async ({ hook, initialReps, WARMUP, ITER, YIELD_MS, TARGET_BATCH_MS, MAX_REPS }) => {
			const fn = window[hook];
			if (typeof fn !== 'function') throw new Error('missing ' + hook);
			const gc = window.gc || (() => {});
			const runBatch = async (count) => {
				const t0 = performance.now();
				// Async-commit targets (Preact and vue-vapor) await the flush BETWEEN
				// reps so they don't coalesce into one commit; sync targets are unchanged.
				for (let k = 0; k < count; k++) {
					const r = fn();
					if (r && typeof r.then === 'function') await r;
				}
				return performance.now() - t0;
			};

			// Warm the operation before calibration, then scale until the measured
			// batch clears the timer-resolution floor. Calibration is untimed work;
			// its render counters are reset before the sampled loop below.
			let reps = initialReps;
			await runBatch(reps);
			while (reps < MAX_REPS) {
				gc();
				const elapsed = await runBatch(reps);
				if (elapsed >= TARGET_BATCH_MS) break;
				const estimated = elapsed > 0 ? Math.ceil((reps * TARGET_BATCH_MS) / elapsed) : reps * 10;
				reps = Math.min(MAX_REPS, Math.max(reps * 2, estimated));
			}
			await new Promise((r) => setTimeout(r, YIELD_MS));
			window.__resetRenders();
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const dt = (await runBatch(reps)) / reps;
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			const loop = { ...window.__renders };
			window.__resetRenders();
			{
				const r = fn();
				if (r && typeof r.then === 'function') await r;
			}
			const delta = { ...window.__renders };
			const state = window.__state();
			const t = (s) => {
				const el = document.querySelector(s);
				return el ? el.textContent : null;
			};
			const dom = {
				rowsA: document.querySelectorAll('#wall-a .rows > .item').length,
				rowsB: document.querySelectorAll('#wall-b .rows > .item').length,
				leafA0: t('#wall-a .rows > .item .leaf'),
				leafB0: t('#wall-b .rows > .item .leaf'),
				midInnerA: t('#wall-a .rows > .item:nth-child(' + (state.mid + 1) + ') .inner'),
				midInnerB: t('#wall-b .rows > .item:nth-child(' + (state.mid + 1) + ') .inner'),
			};
			return { samples: out, reps, loop, delta, state, dom };
		},
		{
			hook: op.hook,
			initialReps: op.reps,
			WARMUP,
			ITER,
			YIELD_MS,
			TARGET_BATCH_MS,
			MAX_REPS,
		},
	);
	await ctx.close();
	return res;
}

const countersEqual = (got, expect) => Object.keys(Z).every((k) => got[k] === expect[k]);
const fmtCounts = (c) => JSON.stringify(c);

// Gate check for one op's verification results. Returns a list of failure
// strings (empty = pass).
function checkGates(op, res) {
	const errs = [];
	if (!countersEqual(res.delta, op.expect)) {
		errs.push(
			`${op.name}: render-count delta ${fmtCounts(res.delta)} !== expected ${fmtCounts(op.expect)}`,
		);
	}
	if (op.zeroRowLoop && res.loop && !countersEqual(res.loop, Z)) {
		errs.push(
			`${op.name}: timed loop invoked component bodies ${fmtCounts(res.loop)} — a prop is reference-unstable; this run measured full re-renders`,
		);
	}
	if (res.dom.rowsA !== ROWS || res.dom.rowsB !== ROWS) {
		errs.push(`${op.name}: DOM rows A=${res.dom.rowsA} B=${res.dom.rowsB}, expected ${ROWS} each`);
	}
	if (
		(op.name === 'ctx_through_wall_A' || op.name === 'mount') &&
		res.dom.leafA0 !== res.state.themeA
	) {
		errs.push(`${op.name}: wall A leaf text "${res.dom.leafA0}" !== theme "${res.state.themeA}"`);
	}
	if (
		(op.name === 'ctx_through_wall_B' || op.name === 'mount') &&
		res.dom.leafB0 !== res.state.themeB
	) {
		errs.push(`${op.name}: wall B leaf text "${res.dom.leafB0}" !== theme "${res.state.themeB}"`);
	}
	if (
		op.name === 'one_change_A' &&
		!String(res.dom.midInnerA).startsWith(String(res.state.midValueA))
	) {
		errs.push(
			`${op.name}: changed row inner text "${res.dom.midInnerA}" does not show value ${res.state.midValueA}`,
		);
	}
	if (
		op.name === 'one_change_B' &&
		!String(res.dom.midInnerB).startsWith(String(res.state.midValueB))
	) {
		errs.push(
			`${op.name}: changed row inner text "${res.dom.midInnerB}" does not show value ${res.state.midValueB}`,
		);
	}
	return errs;
}

async function runTarget(t, failures) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox', '--js-flags=--expose-gc'],
	});

	const { ctx, page } = await freshPage(browser, t.url);
	const hasGc = await page.evaluate(() => typeof window.gc === 'function');
	await ctx.close();
	if (!hasGc) {
		console.error(
			'  ! window.gc unavailable (need --js-flags=--expose-gc) — results will be noisier',
		);
	}

	const results = {};
	const meta = { gates: 'pass', reps: { mount: 1 } };
	for (const op of OPS) {
		console.error(`  → ${op.name}`);
		const res =
			op.hook === null ? await measureMount(browser, t.url) : await measureLoop(browser, t.url, op);
		if (op.hook !== null) {
			meta.reps[op.name] = res.reps;
			console.error(`    calibrated ${res.reps} reps/sample`);
		}
		results[op.name] = { ...summarize(res.samples), samples: res.samples.length };
		if (op.name === 'mount') meta.mountRenders = res.delta;
		const errs = checkGates(op, res);
		if (errs.length > 0) {
			meta.gates = 'fail';
			for (const e of errs) {
				failures.push(`${t.name}: ${e}`);
				console.error(`  ✗ GATE ${e}`);
			}
		}
	}
	await browser.close();
	return { results, meta };
}

(async () => {
	const all = {};
	const failures = [];
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER} (+${WARMUP} warmup)…`);
		all[t.name] = await runTarget(t, failures);
	}

	const cols = TARGETS.map((t) => t.name);
	const W = 32;
	console.log();
	console.log('Op                       | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('-------------------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.name.padEnd(24)];
		for (const c of cols) {
			const r = all[c].results[op.name];
			row.push(`${r.median.toFixed(3)} (min ${r.min.toFixed(3)}, sd ${r.sd.toFixed(3)})`.padEnd(W));
		}
		console.log(row.join('| '));
	}

	// Pairwise ratio: the FIRST target is the baseline (js-framework convention).
	if (TARGETS.length > 1) {
		const baselineName = TARGETS[0].name;
		const baseline = all[baselineName].results;
		console.log();
		for (const t of TARGETS.slice(1)) {
			const r = all[t.name].results;
			console.log(`${t.name} / ${baselineName} ratio (score; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const ratio = scoreOf(r[op.name]) / scoreOf(baseline[op.name]);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.name.padEnd(24)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}
	}

	if (process.env.BENCH_JSON) {
		const json = {
			suite: 'memo-wall',
			iterations: ITER,
			targets: TARGETS.map((t) => ({
				name: t.name,
				ops: Object.fromEntries(
					OPS.map((op) => {
						const r = all[t.name].results[op.name];
						return [op.name, timingStatForJson(r)];
					}),
				),
				meta: all[t.name].meta,
			})),
		};
		if (failures.length > 0) json.failed = failures.join('; ');
		fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(json, null, '\t') + '\n');
		console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
	}

	if (failures.length > 0) {
		console.error(`\n✗ ${failures.length} correctness gate failure(s):`);
		for (const f of failures) console.error(`  - ${f}`);
		process.exit(1);
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
