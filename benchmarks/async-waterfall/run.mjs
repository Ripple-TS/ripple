// async-waterfall harness — measures how each framework's async model handles
// a 10-level nested async tree (each level fetches independent data with a
// fixed simulated latency, DELAY=16ms — see any target's src/data.js):
//
//   init   — mount → deepest level rendered. React/Octane nested `use()`
//            suspends level N until N-1 resolved, so the fetches SERIALIZE:
//            expected ≈ LEVELS × DELAY (the waterfall this suite exists to
//            demonstrate — octane plans compiler-parallelized `use`, see
//            docs/suspense-parallel-use-plan.md). Solid 2.0 (async memos) and
//            ripple (effect-filled tracked values) create the whole tree
//            immediately, so fetches run in PARALLEL: expected ≈ 1 × DELAY.
//   update — version bump (startTransition for React/Octane; a signal/tracked
//            write for Solid/ripple) → deepest level shows the new value.
//            Same shape: re-render cascade re-serializes for React/Octane,
//            fine-grained frameworks refetch all levels at once.
//
// The numbers are latency-dominated by design (the point is the waterfall
// FACTOR, not scheduler micro-costs): report also prints init/DELAY.
//
// Each app implements the same window contract:
//   __init(): Promise<ms>    (fresh page only)   __update(): Promise<ms>
//
// Usage: node benchmarks/async-waterfall/run.mjs [iterations]   (default 10)

import fs from 'node:fs';
import { chromium } from 'playwright';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '10', 10);
const LEVELS = 10;
const DELAY = 16;

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5216/' },
			{ name: 'react', url: 'http://localhost:5217/' },
			{ name: 'solid', url: 'http://localhost:5218/' },
			{ name: 'ripple', url: 'http://localhost:5219/' },
			{ name: 'preact', url: 'http://localhost:5269/' },
			{ name: 'svelte', url: 'http://localhost:5280/' },
			{ name: 'inferno', url: 'http://localhost:5333/' },
		];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const summarize = (samples, options) => {
	return summarizeSamples(samples, options);
};

async function runTarget(t) {
	const browser = await chromium.launch({ headless: true, args: ['--disable-extensions'] });
	const context = await browser.newContext();

	const initSamples = [];
	const updateSamples = [];
	// init must be cold (fresh page + fresh promise cache), so every iteration
	// gets its own page; the same page then contributes one update sample.
	for (let i = 0; i < ITER; i++) {
		const page = await context.newPage();
		await page.goto(t.url, { waitUntil: 'load' });
		await page.waitForFunction(() => typeof window.__init === 'function', { timeout: 10000 });
		initSamples.push(await page.evaluate(() => window.__init()));
		await sleep(30);
		updateSamples.push(await page.evaluate(() => window.__update()));
		await page.close();
	}

	await browser.close();
	return {
		// Each init and paired first-update sample comes from an independent fresh
		// page, not an ordered JIT warmup sequence. Score both full populations.
		init: summarize(initSamples, { scoreMode: 'mean' }),
		update: summarize(updateSamples, { scoreMode: 'mean' }),
	};
}

(async () => {
	const all = {};
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER}…`);
		all[t.name] = await runTarget(t);
	}

	console.log();
	console.log(
		`${LEVELS} levels × ${DELAY}ms simulated latency — waterfall floor ${LEVELS * DELAY}ms, parallel floor ${DELAY}ms`,
	);
	console.log();
	console.log(
		'Op     | ' + TARGETS.map((t) => t.name.padEnd(26)).join('| ') + '| (score ms, ×DELAY)',
	);
	console.log('-------+-' + TARGETS.map(() => '-'.repeat(26)).join('+-'));
	for (const op of ['init', 'update']) {
		const row = [op.padEnd(6)];
		for (const t of TARGETS) {
			const r = all[t.name][op];
			row.push(`${r.score.toFixed(1)} (${(r.score / DELAY).toFixed(1)}x)`.padEnd(26));
		}
		console.log(row.join('| '));
	}

	if (process.env.BENCH_JSON) {
		const payload = {
			suite: 'async-waterfall',
			iterations: ITER,
			targets: TARGETS.map((t) => ({
				name: t.name,
				ops: Object.fromEntries(
					Object.entries(all[t.name]).map(([op, r]) => [op, timingStatForJson(r)]),
				),
				meta: { levels: LEVELS, delayMs: DELAY },
			})),
		};
		fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
		console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
