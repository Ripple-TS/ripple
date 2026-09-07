// Ripple-only anchor-shape diagnostic preserved from the previous suite.
import fs from 'node:fs';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';
import { chromium } from 'playwright';

const ITER = parseInt(process.argv[2] || '25', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : 8;
const YIELD_MS = 5;
const N = parseInt(process.env.N || '1000', 10);
const BASE = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)[0].url
	: process.env.URL || 'http://localhost:5190/';
const SHAPES = process.env.SHAPES
	? JSON.parse(process.env.SHAPES)
	: ['direct', 'wrapped', 'single', 'switch'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const summarize = summarizeSamples;

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
	const { ctx, page } = await freshPage(browser, urlFor(shape));
	try {
		await page.evaluate((n) => {
			window.__mount();
			const read = () => Array.from(document.querySelectorAll('.row'));
			const before = read();
			if (before.length !== n || before.some((row, i) => row.textContent !== 'item-' + i))
				throw Error('Incorrect mounted rows');
			window.__reverse();
			if (read().some((row, i) => row !== before[n - 1 - i]))
				throw Error('Reverse lost row identity or order');
			window.__resetRand();
			let seed = 4660;
			const random = () => {
				seed |= 0;
				seed = (seed + 1831565813) | 0;
				let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
				t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
				return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
			};
			const expected = before.slice().reverse();
			for (let k = expected.length - 1; k > 0; k--) {
				const j = Math.floor(random() * (k + 1));
				[expected[k], expected[j]] = [expected[j], expected[k]];
			}
			window.__shuffle();
			if (read().some((row, i) => row !== expected[i]))
				throw Error('Shuffle lost identity or order');
			window.__reset();
			if (read().length) throw Error('Reset retained rows');
		}, N);
	} finally {
		await ctx.close();
	}

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
	if (process.env.BENCH_JSON)
		fs.writeFileSync(
			process.env.BENCH_JSON,
			JSON.stringify({
				suite: 'reconcile-anchors',
				iterations: ITER,
				targets: [
					{
						name: 'ripple',
						ops: Object.fromEntries(
							SHAPES.flatMap((shape) =>
								OPS.map((op) => [shape + '.' + op, timingStatForJson(all[shape][op])]),
							),
						),
					},
				],
			}),
		);

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
