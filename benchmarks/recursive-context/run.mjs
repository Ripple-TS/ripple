// recursive-context bench harness — drives ripple-new and ripple via Playwright.
// Each adapter installs window.__mount/__updateRoot/__updatePartial/__unmount/__reset/__ready.
//
// Four operations are measured:
//   - mount:          fresh page per sample (module-eval already paid by goto)
//   - update_root:    full fan-out re-render (all 1024 leaves)
//   - update_partial: scoped subtree update (32 leaves at depth 5)
//   - unmount:        full teardown
//
// Each timed call wraps the framework op in performance.now() *inside* the page —
// no per-call CDP IPC overhead, no JS↔CDP marshaling cost.
//
// Usage:
//   pnpm --filter ripple-new-recursive-bench dev   # :5185
//   pnpm --filter ripple-recursive-bench dev       # :5184
//   node benchmarks/recursive-context/run.mjs [iter]   # default 20

import { chromium } from 'playwright';

const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = 5;

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'ripple-new', url: 'http://localhost:5185/' },
			{ name: 'solid', url: 'http://localhost:5187/' },
			{ name: 'react', url: 'http://localhost:5186/' },
			{ name: 'ripple', url: 'http://localhost:5184/' },
		];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In-page op timer: awaits one rAF + one task to ensure the framework flushed
// to the DOM, then returns the elapsed wall time.
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
	// Fresh page per sample so each mount starts from a quiescent state.
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const { ctx, page } = await freshPage(browser, url);
		const dt = await timeInPage(page, '__mount');
		if (i >= WARMUP) samples.push(dt);
		await ctx.close();
	}
	return summarize(samples);
}

async function measureLoop(browser, url, opName) {
	// One page; mount once; loop the op.
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		const dt = await timeInPage(page, opName);
		if (i >= WARMUP) samples.push(dt);
		await sleep(20);
	}
	await ctx.close();
	return summarize(samples);
}

async function measureUnmount(browser, url) {
	// One page; per-iter: mount (untimed), time unmount, reset, sleep.
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

// Partial unmount/remount: hide/show the 32-leaf Mid subtree without tearing
// down the rest of the tree. Mounted once; each iteration alternates
// __partialUnmount + __partialRemount and records both halves of the cycle
// — so any GC/JIT noise hits both ops symmetrically.
async function measurePartialUnmountRemount(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const unmountSamples = [];
	const remountSamples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		// Mid subtree currently mounted (start state).
		const dtUnmount = await timeInPage(page, '__partialUnmount');
		await sleep(10);
		const dtRemount = await timeInPage(page, '__partialRemount');
		if (i >= WARMUP) {
			unmountSamples.push(dtUnmount);
			remountSamples.push(dtRemount);
		}
		await sleep(20);
	}
	await ctx.close();
	return {
		partial_unmount: summarize(unmountSamples),
		partial_remount: summarize(remountSamples),
	};
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox'],
	});
	console.error(`  → mount`);
	const mount = await measureMount(browser, t.url);
	console.error(`  → update_root`);
	const update_root = await measureLoop(browser, t.url, '__updateRoot');
	console.error(`  → update_partial`);
	const update_partial = await measureLoop(browser, t.url, '__updatePartial');
	console.error(`  → partial_unmount/remount`);
	const { partial_unmount, partial_remount } = await measurePartialUnmountRemount(browser, t.url);
	console.error(`  → unmount`);
	const unmount = await measureUnmount(browser, t.url);
	await browser.close();
	return { mount, update_root, update_partial, partial_unmount, partial_remount, unmount };
}

const OPS = [
	'mount',
	'update_root',
	'update_partial',
	'partial_unmount',
	'partial_remount',
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
	console.log('Op               | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('-----------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.padEnd(16)];
		for (const c of cols) {
			const r = all[c][op];
			row.push(
				`${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, p95 ${r.p95.toFixed(2)})`.padEnd(W),
			);
		}
		console.log(row.join('| '));
	}

	if (TARGETS.length > 1) {
		const baselineName = TARGETS[TARGETS.length - 1].name;
		const baseline = all[baselineName];
		console.log();
		for (const t of TARGETS.slice(0, -1)) {
			const r = all[t.name];
			console.log(`${t.name} / ${baselineName} ratio (median; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const ratio = r[op].median / baseline[op].median;
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.padEnd(16)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}

		// Locality ratio — partial should be far cheaper than full root fan-out.
		// 32-of-1024 leaves means the floor is ~1/32 = 0.03; anything close to 1
		// means the framework is re-running unaffected branches.
		console.log('locality ratio (update_partial / update_root, lower = better scoping):');
		for (const c of cols) {
			const r = all[c];
			const ratio = r.update_partial.median / r.update_root.median;
			console.log(`  ${c.padEnd(16)} ${ratio.toFixed(3)}x  (ideal: ~0.03)`);
		}
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
