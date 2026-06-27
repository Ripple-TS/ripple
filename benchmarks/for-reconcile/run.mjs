// for-reconcile bench harness — drives the ripple fixture via Playwright against
// the PRODUCTION build (vite build + vite preview), so numbers reflect the
// minified bundle on a real (Chromium) DOM, not the dev server / jsdom.
//
// Methodology mirrors ../recursive-context/run.mjs: every op flushes its DOM
// mutation synchronously (ripple `flushSync`), so we time ONLY the synchronous
// op with a freshly-collected heap (gc() before each sample), isolating
// framework + browser-DOM cost from paint/GC jitter.
//
// What it measures, per item shape (direct / wrapped / single / switch):
//   mount    — build N keyed rows from empty
//   reverse  — items.reverse() (maximal reordering: every middle row moves)
//   shuffle  — seeded Fisher–Yates (realistic mixed move/insert pattern)
//
// `single` / `switch` are the #1307 wrapper-elided shapes whose reconcile now
// resolves anchors by descending child blocks; `direct` / `wrapped` keep the
// O(1) s.start path. Comparing them shows the descent's real-DOM cost.
//
// Usage:
//   1) cd ripple && pnpm build && pnpm preview   # serve prod build on :5190
//   2) node run.mjs [iter]                       # default 25
//
// Compare versions by rebuilding the fixture against a different ripple:
//   - current (workspace, with fix): as-is
//   - 0.3.84: set ripple/@ripple-ts deps to 0.3.84 in ripple/package.json,
//     pnpm install, rebuild, re-serve, re-run. Same source, different compiler+
//     runtime → apples-to-apples for the user's "vs 0.3.84" question.

import { chromium } from 'playwright';

const ITER = parseInt(process.argv[2] || '25', 10);
const WARMUP = 8;
const YIELD_MS = 5;
const N = parseInt(process.env.N || '1000', 10);
const BASE = process.env.URL || 'http://localhost:5190/';
const SHAPES = process.env.SHAPES
	? JSON.parse(process.env.SHAPES)
	: ['direct', 'wrapped', 'single', 'switch'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function urlFor(shape) {
	return `${BASE}?shape=${shape}&n=${N}`;
}

async function freshPage(browser, url) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10_000 });
	return { ctx, page };
}

// MOUNT — fresh page per sample; time the synchronous __mount() after gc().
async function measureMount(browser, shape) {
	const url = urlFor(shape);
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

// REORDER op (reverse / shuffle) — mount once, loop the op with gc() before each
// timed sample. resetRand keeps the shuffle sequence deterministic per page.
async function measureReorder(browser, shape, op) {
	const url = urlFor(shape);
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => {
		window.__mount();
		window.__resetRand();
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
				fn();
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

async function runShape(browser, shape) {
	console.error(`  ${shape} → mount`);
	const mount = await measureMount(browser, shape);
	console.error(`  ${shape} → reverse`);
	const reverse = await measureReorder(browser, shape, '__reverse');
	console.error(`  ${shape} → shuffle`);
	const shuffle = await measureReorder(browser, shape, '__shuffle');
	return { mount, reverse, shuffle };
}

const OPS = ['mount', 'reverse', 'shuffle'];

(async () => {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox', '--js-flags=--expose-gc'],
	});

	const { ctx, page } = await freshPage(browser, urlFor(SHAPES[0]));
	const hasGc = await page.evaluate(() => typeof window.gc === 'function');
	await ctx.close();
	if (!hasGc) console.error('  ! window.gc unavailable — results will be noisier');

	console.error(`for-reconcile bench — N=${N} rows, ${ITER} iter (+${WARMUP} warmup), ${BASE}`);
	const all = {};
	for (const shape of SHAPES) all[shape] = await runShape(browser, shape);
	await browser.close();

	const W = 30;
	console.log();
	console.log('Op       | ' + SHAPES.map((s) => s.padEnd(W)).join('| '));
	console.log('---------+-' + SHAPES.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.padEnd(8)];
		for (const s of SHAPES) {
			const r = all[s][op];
			row.push(
				`${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, sd ${r.stddev.toFixed(2)})`.padEnd(W),
			);
		}
		console.log(row.join('| '));
	}

	// Descent overhead: single/switch (s.start null → descend) vs wrapped (O(1)).
	if (SHAPES.includes('wrapped')) {
		console.log();
		console.log('descent overhead vs wrapped (median ratio; >1 means slower):');
		for (const s of SHAPES) {
			if (s === 'wrapped') continue;
			for (const op of OPS) {
				const ratio = all[s][op].median / all.wrapped[op].median;
				const tag = ratio < 1.05 ? '== ~equal' : ratio < 1.2 ? '~  minor' : '-- slower';
				console.log(`  ${(s + '.' + op).padEnd(18)} ${ratio.toFixed(2)}x  ${tag}`);
			}
		}
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
