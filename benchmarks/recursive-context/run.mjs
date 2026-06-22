// recursive-context bench harness — drives ripple-new / solid / react / ripple
// via Playwright.
//
// Methodology: every op (mount, update_root, update_partial, partial_unmount /
// remount, unmount) mutates the DOM SYNCHRONOUSLY inside its adapter call — all
// four adapters flush synchronously (ripple / ripple-new / react via `flushSync`,
// solid via `flush()`). So we time ONLY the synchronous op (the framework's JS
// work) and force a GC right before each timed sample, so a surprise mid-sample
// collection can't inflate it. This isolates framework cost from browser paint
// and GC jitter and yields low-variance medians.
//
// (The previous harness awaited a `requestAnimationFrame` + task after each op;
// that ~16ms frame wait + paint + non-deterministic GC swamped the ~1–4ms of
// real work, making `update_root` in particular swing wildly run to run. The
// numbers below are smaller AND far more reproducible — they're the framework
// cost, not the browser's paint cycle.)
//
// NOTE: this measures framework JS work, not pixels-on-screen latency. Adapters
// MUST flush their DOM mutations synchronously within the op call.
//
// Usage:
//   node run.mjs [iter]   # default 20 (bench:long passes 40)

import { chromium } from 'playwright';

const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = 10;
const YIELD_MS = 5; // breathe between samples: let paint settle, don't block the page

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'ripple-new', url: 'http://localhost:5185/' },
			{ name: 'solid', url: 'http://localhost:5187/' },
			{ name: 'react', url: 'http://localhost:5186/' },
			{ name: 'ripple', url: 'http://localhost:5184/' },
		];

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

async function freshPage(browser, url) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10_000 });
	return { ctx, page };
}

// MOUNT — fresh page per sample (module-eval amortized by goto, quiescent start);
// time the synchronous __mount() with a freshly-collected heap.
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

// LOOP op (update_root / update_partial) — mount once, time the op in a tight
// in-page loop with gc() before each sample.
async function measureLoop(browser, url, op) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
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

// PARTIAL unmount/remount — mount once; each iter time __partialUnmount then
// __partialRemount (mirrored work), recording both halves of the cycle.
async function measurePartialUnmountRemount(browser, url) {
	const { ctx, page } = await freshPage(browser, url);
	await page.evaluate(() => window.__mount());
	await sleep(50);
	const { u, r } = await page.evaluate(
		async ({ WARMUP, ITER, YIELD_MS }) => {
			const gc = window.gc || (() => {});
			const u = [];
			const r = [];
			for (let i = 0; i < WARMUP + ITER; i++) {
				gc();
				let t0 = performance.now();
				window.__partialUnmount();
				const du = performance.now() - t0;
				await new Promise((res) => setTimeout(res, YIELD_MS));
				gc();
				t0 = performance.now();
				window.__partialRemount();
				const dr = performance.now() - t0;
				if (i >= WARMUP) {
					u.push(du);
					r.push(dr);
				}
				await new Promise((res) => setTimeout(res, YIELD_MS));
			}
			return { u, r };
		},
		{ WARMUP, ITER, YIELD_MS },
	);
	await ctx.close();
	return { partial_unmount: summarize(u), partial_remount: summarize(r) };
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
				`${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, sd ${r.stddev.toFixed(2)})`.padEnd(W),
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
