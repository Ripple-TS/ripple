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
//   - bump_sweep        — bump every C{1,11,...,91} in sequence; total update
//                         cost across all 10 stateful nodes.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function timeInPage(page, fnName) {
	return await page.evaluate(async (fnName) => {
		const fn = window[fnName];
		if (typeof fn !== 'function') throw new Error('missing ' + fnName);
		const t0 = performance.now();
		fn();
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => setTimeout(r, 0));
		return performance.now() - t0;
	}, fnName);
}

// In-page sweep — bump every stateful index once and report the elapsed
// time for the whole batch. Single rAF gate at the end means GC/paint
// overhead is shared across the 10 bumps rather than paid per call.
async function timeSweepInPage(page, indices) {
	return await page.evaluate(async (indices) => {
		const t0 = performance.now();
		for (const i of indices) {
			const fn = window['__bumpAt' + i];
			if (typeof fn !== 'function') throw new Error('missing __bumpAt' + i);
			fn();
		}
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => setTimeout(r, 0));
		return performance.now() - t0;
	}, indices);
}

async function freshPage(browser, url) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10_000 });
	return { ctx, page };
}

function summarize(samples) {
	const sorted = [...samples].sort((a, b) => a - b);
	const median = sorted[sorted.length >> 1];
	const min = sorted[0];
	const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
	return { median, min, p95 };
}

async function measureMount(browser, url) {
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const { ctx, page } = await freshPage(browser, url);
		const dt = await timeInPage(page, '__mount');
		if (i >= WARMUP) samples.push(dt);
		await ctx.close();
	}
	return summarize(samples);
}

async function measureBump(browser, url, idx) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const dt = await timeInPage(page, '__bumpAt' + idx);
		if (i >= WARMUP) samples.push(dt);
		await sleep(20);
	}
	await ctx.close();
	return summarize(samples);
}

async function measureSweep(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const dt = await timeSweepInPage(page, STATEFUL_INDICES);
		if (i >= WARMUP) samples.push(dt);
		await sleep(20);
	}
	await ctx.close();
	return summarize(samples);
}

async function measureUnmount(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		await page.evaluate(() => window.__mount());
		await sleep(40);
		const dt = await timeInPage(page, '__unmount');
		if (i >= WARMUP) samples.push(dt);
		await page.evaluate(() => window.__reset());
		await sleep(20);
	}
	await ctx.close();
	return summarize(samples);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox'],
	});
	console.error(`  → mount`);
	const mount = await measureMount(browser, t.url);
	console.error(`  → bump_shallow (C1)`);
	const bump_shallow = await measureBump(browser, t.url, 1);
	console.error(`  → bump_middle (C51)`);
	const bump_middle = await measureBump(browser, t.url, 51);
	console.error(`  → bump_deep (C91)`);
	const bump_deep = await measureBump(browser, t.url, 91);
	console.error(`  → bump_sweep (10 in lockstep)`);
	const bump_sweep = await measureSweep(browser, t.url);
	console.error(`  → unmount`);
	const unmount = await measureUnmount(browser, t.url);
	await browser.close();
	return { mount, bump_shallow, bump_middle, bump_deep, bump_sweep, unmount };
}

const OPS = ['mount', 'bump_shallow', 'bump_middle', 'bump_deep', 'bump_sweep', 'unmount'];

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
	for (const op of OPS) {
		const row = [op.padEnd(14)];
		for (const c of cols) {
			const r = all[c][op];
			row.push(
				`${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, p95 ${r.p95.toFixed(2)})`.padEnd(W),
			);
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
				const ratio = r[op].median / baseline[op].median;
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
			const ratio = r.bump_shallow.median / r.bump_deep.median;
			console.log(`  ${c.padEnd(14)} ${ratio.toFixed(2)}x  (hooks expect ~10x, signals ~1x)`);
		}
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
