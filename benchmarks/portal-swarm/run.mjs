// portal-swarm bench harness — drives every framework fixture via Playwright.
//
// A 200-item list where EVERY item conditionally portals a 3-element tooltip.
// Portal perf has zero coverage in the sibling benches; this suite isolates it.
// Three fixture sections cover octane's two portal entry points plus a bail probe:
//
//   A        — compiled child-position `{createPortal(() => @{…}, target)}` in
//              .tsrx → the `portal()` runtime fast path.
//   B        — value-position PortalDescriptors built by a plain-.ts helper and
//              rendered through a children hole (childSlot) — the shape every
//              @octanejs binding produces (Radix / floating-ui / lexical).
//   B_stable — section B with module-level REFERENCE-STABLE descriptors
//              (children + props identity never changes) — probes whether any
//              bail path exists for unchanged portals.
//
// For React the A/B split collapses (both are ReactDOM.createPortal elements);
// for Solid all three collapse (<Portal> is its only mechanism) — see README.
//
// Ops (all synchronous inside the adapter call — octane/react flushSync, solid
// flush(); gc() before every timed sample; sub-0.5ms ops loop-and-divide):
//   mount_closed             — full app mount, all portals closed (fresh page/sample).
//   open_all                 — 0 → 600 open portals (all three sections, one flush).
//   rerender_open_A/B/B_stable — bump a section's unrelated tick state with its
//                              200 portals open (×10 per sample, /10). The
//                              portal re-render + $$portalParent restamp path.
//   open_close_cycle         — 5× (openAll + closeAll) per sample, /5. Shared
//                              document.body target: the delegated-listener
//                              refcount absorbs 599 of 600 attaches.
//   open_close_distinct      — the SAME op with 200 distinct container targets:
//                              the per-target listener attach/detach loop runs
//                              200×. The delta vs open_close_cycle is the
//                              registerDelegationTarget cost.
//   dispatch_through_portal  — 200 in-page .click()s on buttons INSIDE open
//                              portals, /200. Handlers bump window.__hits only
//                              (no setState), so the timed window is pure event
//                              dispatch: delegation lookup + the $$portalParent
//                              bubble hop (octane) / retargeted synthetic
//                              dispatch (react) / delegated-container hop (solid).
//
// Correctness gates (hard, news-style): a full untimed verification pass runs
// before timing — counts, tooltip shape, shared-vs-distinct placement, teardown,
// dispatch hit counting — plus cheap per-sample gates inside the loops. Any
// failure exits 1 (and BENCH_JSON, if requested, records the reason).
//
// Servers must be running first (production preview recommended):
//   pnpm --filter octane-tsrx-portal-swarm-bench preview   # :5210
//   pnpm --filter react-portal-swarm-bench       preview   # :5211
//   pnpm --filter solid-portal-swarm-bench       preview   # :5212
// (swap `preview` → `dev` for the unminified dev build).
//
// Usage:  node run.mjs [iter]   # default 20
// BENCH_JSON=/path/out.json node run.mjs   # also write machine-readable results

import { chromium } from 'playwright';
import fs from 'node:fs';
import { censusDomNodes } from '../lib/dom-nodes.mjs';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : 5;
const YIELD_MS = 5;
const N = 200; // items per section
const SECTIONS = 3; // A, B, B_stable
const RERENDER_REPS = 10; // rerender ops loop-and-divide (sub-ms for solid)
const CYCLE_REPS = 5; // open+close pairs per sample
const BASE_URLS = {
	'octane-tsrx': 'http://localhost:5210/',
	react: 'http://localhost:5211/',
	solid: 'http://localhost:5212/',
	ripple: 'http://localhost:5224/',
	'vue-vapor': 'http://localhost:5181/',
	preact: 'http://localhost:5268/',
	svelte: 'http://localhost:5279/',
	inferno: 'http://localhost:5332/',
};

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: BASE_URLS['octane-tsrx'] },
			{ name: 'react', url: BASE_URLS.react },
			{ name: 'solid', url: BASE_URLS.solid },
			{ name: 'ripple', url: BASE_URLS.ripple },
			{ name: 'vue-vapor', url: BASE_URLS['vue-vapor'] },
			{ name: 'preact', url: BASE_URLS.preact },
			{ name: 'svelte', url: BASE_URLS.svelte },
			{ name: 'inferno', url: BASE_URLS.inferno },
		];

const OPS = [
	'mount_closed',
	'open_all',
	'rerender_open_A',
	'rerender_open_B',
	'rerender_open_B_stable',
	'open_close_cycle',
	'open_close_distinct',
	'dispatch_through_portal',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class GateError extends Error {}
function gate(cond, reason) {
	if (!cond) throw new GateError(`correctness gate failed: ${reason}`);
}

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

// One DOM census the gates read. `.tip` nodes live in the portal TARGETS
// (document.body in shared mode, the 200 `.pt` containers in distinct mode),
// never under #main — that displacement is the thing being verified.
const snapshot = (page) =>
	page.evaluate(() => {
		const q = (sel) => document.querySelectorAll(sel).length;
		return {
			rowsA: q('.secA .item'),
			rowsB: q('.secB .item'),
			rowsBS: q('.secBS .item'),
			containers: q('.pt'),
			tips: q('.tip'),
			tipsA: q('.tipA'),
			tipsB: q('.tipB'),
			tipsBS: q('.tipBS'),
			bodyTips: q('body > .tip'),
			badTips: [...document.querySelectorAll('.tip')].filter(
				(t) =>
					t.children.length !== 2 ||
					!t.querySelector(':scope > .tip-label') ||
					!t.querySelector(':scope > .tip-btn'),
			).length,
			fullContainers: [...document.querySelectorAll('.pt')].filter(
				(c) => c.querySelectorAll('.tip').length === 3,
			).length,
		};
	});

// ── Untimed hard verification pass (news-style gate, once per target) ────────
async function verifyTarget(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(30);

	let s = await snapshot(page);
	gate(
		s.rowsA === N && s.rowsB === N && s.rowsBS === N,
		`mount rows A/B/BS = ${s.rowsA}/${s.rowsB}/${s.rowsBS}, want ${N} each`,
	);
	gate(s.containers === N, `distinct-target containers = ${s.containers}, want ${N}`);
	gate(s.tips === 0, `portals must start closed (found ${s.tips} tips)`);

	// Shared mode: open everything → 600 tips, all in document.body, all 3-element.
	await page.evaluate(() => window.__openAll());
	s = await snapshot(page);
	gate(
		s.tipsA === N && s.tipsB === N && s.tipsBS === N,
		`open_all tips A/B/BS = ${s.tipsA}/${s.tipsB}/${s.tipsBS}, want ${N} each`,
	);
	gate(s.badTips === 0, `${s.badTips} tooltips are not the 3-element div>(span+button) shape`);
	gate(
		s.bodyTips === SECTIONS * N,
		`shared mode: ${s.bodyTips} tips in body, want ${SECTIONS * N}`,
	);

	// Dispatch: a click inside a portalled tooltip bumps the counter by exactly 1.
	const oneHit = await page.evaluate(() => {
		const before = window.__hits;
		document.querySelector('.tipA .tip-btn').click();
		return window.__hits - before;
	});
	gate(oneHit === 1, `tooltip click bumped __hits by ${oneHit}, want 1`);

	// Full teardown.
	await page.evaluate(() => window.__closeAll());
	s = await snapshot(page);
	gate(s.tips === 0, `closeAll left ${s.tips} tips behind`);

	// Distinct mode: every container holds exactly its 3 tips; body holds none.
	await page.evaluate(() => {
		window.__setDistinct(true);
		window.__openAll();
	});
	s = await snapshot(page);
	gate(s.tips === SECTIONS * N, `distinct open: ${s.tips} tips, want ${SECTIONS * N}`);
	gate(s.bodyTips === 0, `distinct mode: ${s.bodyTips} tips leaked into document.body`);
	gate(s.fullContainers === N, `distinct mode: ${s.fullContainers}/${N} containers hold 3 tips`);
	await page.evaluate(() => {
		window.__closeAll();
		window.__setDistinct(false);
	});
	s = await snapshot(page);
	gate(s.tips === 0, `distinct closeAll left ${s.tips} tips behind`);

	// Re-render with open portals: tick advances, portals survive.
	await page.evaluate(() => {
		window.__openA();
		window.__rerenderA();
	});
	const tickText = await page.evaluate(() => document.querySelector('.secA .tick').textContent);
	gate(
		/^A:[1-9]\d*$/.test(tickText),
		`rerender did not advance the tick header (got "${tickText}")`,
	);
	s = await snapshot(page);
	gate(s.tipsA === N, `rerender with open portals kept ${s.tipsA}/${N} tips alive`);

	await ctx.close();
}

// ── Timed ops ─────────────────────────────────────────────────────────────────

// MOUNT — fresh page per sample (quiescent start); time __mount() with a
// freshly-collected heap. All portals closed. An adapter whose commit is
// scheduler-deferred returns a thenable (Preact and vue-vapor do); every timed
// window below extends until it settles, so the
// scheduling cost stays inside the measurement.
async function measureMountClosed(browser, url) {
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

// OPEN_ALL — mount once; per sample close everything (untimed), then time the
// single flush that opens all 600 portals.
async function measureOpenAll(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = await page.evaluate(
		async ({ WARMUP, ITER, YIELD_MS, want }) => {
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				window.__closeAll();
				await new Promise((r) => setTimeout(r, YIELD_MS));
				gc();
				const t0 = performance.now();
				const r = window.__openAll();
				if (r && typeof r.then === 'function') await r;
				const dt = performance.now() - t0;
				const tips = document.querySelectorAll('.tip').length;
				if (tips !== want) throw new Error(`open_all sample gate: ${tips} tips, want ${want}`);
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			window.__closeAll();
			return out;
		},
		{ WARMUP, ITER, YIELD_MS, want: SECTIONS * N },
	);
	await ctx.close();
	return summarize(samples);
}

// RERENDER — with a section's 200 portals open, bump its unrelated tick state
// RERENDER_REPS× per sample and divide (a single bump is sub-ms — far sub-ms for
// solid, whose fine-grained update touches one text node).
async function measureRerender(browser, url, sec, tipSel) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = await page.evaluate(
		async ({ sec, tipSel, WARMUP, ITER, YIELD_MS, REPS, N }) => {
			const open = window['__open' + sec];
			const rerender = window['__rerender' + sec];
			if (typeof open !== 'function' || typeof rerender !== 'function')
				throw new Error('missing __open/__rerender hooks for section ' + sec);
			window.__closeAll();
			open();
			await new Promise((r) => setTimeout(r, 30));
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const t0 = performance.now();
				// Async-commit targets await the flush BETWEEN reps — without it the
				// REPS tick bumps would coalesce into a single commit.
				for (let k = 0; k < REPS; k++) {
					const r = rerender();
					if (r && typeof r.then === 'function') await r;
				}
				const dt = (performance.now() - t0) / REPS;
				const tips = document.querySelectorAll(tipSel).length;
				if (tips !== N) throw new Error(`rerender_${sec} sample gate: ${tips} tips, want ${N}`);
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			window.__closeAll();
			return out;
		},
		{ sec, tipSel, WARMUP, ITER, YIELD_MS, REPS: RERENDER_REPS, N },
	);
	await ctx.close();
	return summarize(samples);
}

// CYCLE — CYCLE_REPS× (openAll + closeAll) per sample, /CYCLE_REPS. `distinct`
// switches the portal targets to the 200 container divs (set while closed).
async function measureCycle(browser, url, distinct) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = await page.evaluate(
		async ({ WARMUP, ITER, YIELD_MS, REPS, distinct }) => {
			window.__closeAll();
			window.__setDistinct(distinct);
			await new Promise((r) => setTimeout(r, 30));
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const t0 = performance.now();
				// Async-commit targets await after EACH half of the pair — an open
				// and close coalesced into one flush would be a no-op commit.
				for (let k = 0; k < REPS; k++) {
					const ro = window.__openAll();
					if (ro && typeof ro.then === 'function') await ro;
					const rc = window.__closeAll();
					if (rc && typeof rc.then === 'function') await rc;
				}
				const dt = (performance.now() - t0) / REPS;
				const tips = document.querySelectorAll('.tip').length;
				if (tips !== 0) throw new Error(`cycle sample gate: ${tips} tips left after close`);
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			window.__setDistinct(false);
			return out;
		},
		{ WARMUP, ITER, YIELD_MS, REPS: CYCLE_REPS, distinct },
	);
	await ctx.close();
	return summarize(samples);
}

// DISPATCH — 200 in-page .click()s on buttons INSIDE section A's open portals,
// /200. Handlers only bump window.__hits (no setState), so the sample is pure
// event dispatch. The button list is cached OUTSIDE the timed window.
async function measureDispatch(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = await page.evaluate(
		async ({ WARMUP, ITER, YIELD_MS, N }) => {
			window.__closeAll();
			window.__openA();
			await new Promise((r) => setTimeout(r, 30));
			const btns = [...document.querySelectorAll('.tipA .tip-btn')];
			if (btns.length !== N) throw new Error(`dispatch gate: ${btns.length} buttons, want ${N}`);
			const gc = window.gc || (() => {});
			const out = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				const before = window.__hits;
				const t0 = performance.now();
				for (let k = 0; k < N; k++) btns[k].click();
				const dt = (performance.now() - t0) / N;
				const got = window.__hits - before;
				if (got !== N) throw new Error(`dispatch sample gate: ${got} hits, want ${N}`);
				if (i >= WARMUP) out.push(dt);
				await new Promise((r) => setTimeout(r, YIELD_MS));
			}
			window.__closeAll();
			return out;
		},
		{ WARMUP, ITER, YIELD_MS, N },
	);
	await ctx.close();
	return summarize(samples);
}

// Portals split their DOM between #main and foreign targets under body. Record
// both scopes while closed and open so site placeholders and target-owned
// ranges stay attributable.
async function measureDomShape(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(async () => {
		const r = window.__mount();
		if (r && typeof r.then === 'function') await r;
	});
	const closedMain = await page.evaluate(censusDomNodes, '#main');
	await page.evaluate(async () => {
		const r = window.__openAll();
		if (r && typeof r.then === 'function') await r;
	});
	const openMain = await page.evaluate(censusDomNodes, '#main');
	const openBody = await page.evaluate(censusDomNodes, 'body');
	await page.evaluate(async () => {
		const r = window.__closeAll();
		if (r && typeof r.then === 'function') await r;
	});
	await ctx.close();
	return { closedMain, openMain, openBody };
}

async function runTarget(t) {
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

	console.error(`  → verify (correctness gates)`);
	await verifyTarget(browser, t.url);
	console.error(`  → mount_closed`);
	const mount_closed = await measureMountClosed(browser, t.url);
	console.error(`  → open_all`);
	const open_all = await measureOpenAll(browser, t.url);
	console.error(`  → rerender_open_A`);
	const rerender_open_A = await measureRerender(browser, t.url, 'A', '.tipA');
	console.error(`  → rerender_open_B`);
	const rerender_open_B = await measureRerender(browser, t.url, 'B', '.tipB');
	console.error(`  → rerender_open_B_stable`);
	const rerender_open_B_stable = await measureRerender(browser, t.url, 'BS', '.tipBS');
	console.error(`  → open_close_cycle (shared body target)`);
	const open_close_cycle = await measureCycle(browser, t.url, false);
	console.error(`  → open_close_distinct (200 container targets)`);
	const open_close_distinct = await measureCycle(browser, t.url, true);
	console.error(`  → dispatch_through_portal`);
	const dispatch_through_portal = await measureDispatch(browser, t.url);
	console.error(`  → DOM census (closed/open, main/body)`);
	const dom = await measureDomShape(browser, t.url);
	await browser.close();
	return {
		results: {
			mount_closed,
			open_all,
			rerender_open_A,
			rerender_open_B,
			rerender_open_B_stable,
			open_close_cycle,
			open_close_distinct,
			dispatch_through_portal,
		},
		meta: {
			gates: 'pass',
			items: N,
			sections: SECTIONS,
			portalsAtOpenAll: SECTIONS * N,
			hitsPerDispatchSample: N,
			dom,
		},
	};
}

function writeBenchJson(all, failed) {
	if (!process.env.BENCH_JSON) return;
	const payload = {
		suite: 'portal-swarm',
		iterations: ITER,
		targets: TARGETS.filter((t) => all[t.name]).map((t) => ({
			name: t.name,
			ops: Object.fromEntries(OPS.map((op) => [op, timingStatForJson(all[t.name].results[op])])),
			meta: all[t.name].meta,
		})),
	};
	if (failed) payload.failed = failed;
	fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, 2));
}

const all = {};
try {
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER} (+${WARMUP} warmup)…`);
		all[t.name] = await runTarget(t);
	}
} catch (e) {
	console.error(e instanceof GateError ? `✗ ${e.message}` : e);
	writeBenchJson(all, e.message);
	process.exit(1);
}

const cols = TARGETS.map((t) => t.name);
const W = 32;
// Sub-0.1ms ops (dispatch, solid rerenders) need finer precision than ms-scale mounts.
const fmt = (x) => (x < 0.1 ? x.toFixed(3) : x.toFixed(2));
console.log();
console.log('Op                      | ' + cols.map((c) => c.padEnd(W)).join('| '));
console.log('------------------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
for (const op of OPS) {
	const row = [op.padEnd(23)];
	for (const c of cols) {
		const r = all[c].results[op];
		row.push(`${fmt(r.median)} (min ${fmt(r.min)}, sd ${fmt(r.stddev)})`.padEnd(W));
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
			const base = scoreOf(baseline[op]);
			if (base === 0) {
				console.log(`  ${op.padEnd(23)}   —    (baseline ~0, sub-resolution)`);
				continue;
			}
			const ratio = scoreOf(r[op]) / base;
			const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
			console.log(`  ${op.padEnd(23)} ${ratio.toFixed(2)}x  ${tag}`);
		}
		console.log();
	}

	// Distinct-target overhead: same 600-portal open+close cycle, shared body
	// target vs 200 per-item containers. The delta is the per-target delegated-
	// listener attach/detach loop (octane registerDelegationTarget, react
	// listenToAllSupportedEvents-per-container, solid delegated-container
	// registration).
	console.log('distinct-target ratio (open_close_distinct / open_close_cycle, ~1.0 = free):');
	for (const c of cols) {
		const r = all[c].results;
		const base = scoreOf(r.open_close_cycle);
		const ratioStr = base === 0 ? '—' : (scoreOf(r.open_close_distinct) / base).toFixed(2) + 'x';
		console.log(`  ${c.padEnd(23)} ${ratioStr}`);
	}

	// Stable-descriptor bail: rerender with reference-stable portal children vs
	// rebuilt-per-render children. Far below 1.0 means a bail path exists for
	// unchanged portals (react bails on element identity; octane's compiled hole
	// skips on descriptor identity).
	console.log(
		'\nstable-bail ratio (rerender_open_B_stable / rerender_open_B, lower = bail path works):',
	);
	for (const c of cols) {
		const r = all[c].results;
		const base = scoreOf(r.rerender_open_B);
		const ratioStr = base === 0 ? '—' : (scoreOf(r.rerender_open_B_stable) / base).toFixed(2) + 'x';
		console.log(`  ${c.padEnd(23)} ${ratioStr}`);
	}
}

writeBenchJson(all, null);
