// Local benchmark runner — drives octane (and optionally other targets)
// via Playwright. Times each js-framework-benchmark operation and prints a
// table. Uses page.evaluate(() => el.click()) to fire clicks SYNCHRONOUSLY
// inside the page, bypassing per-click CDP mouse-simulation IPC overhead
// (~10ms/click).
//
// Usage:
//   pnpm --filter octane-tsrx-jsbench dev   # .tsrx variant on 5176
//   pnpm --filter octane-jsx-jsbench dev    # .tsx (JSX) variant on 5177
//   node benchmarks/js-framework/run.mjs [iterations]   # default 8
//   BENCH_JSON=results/js-framework.json node run.mjs   # + machine-readable copy
//
// By default this drives BOTH octane authoring dialects and reports the
// jsx/tsrx ratio. Both lower to the SAME compiled output: `.tsrx`
// `@for (...; key)` and React-style `.tsx` `items.map(... key=)` each compile
// to octane's keyed forBlock fast path (the compiler recognizes a keyed JSX
// `.map` and compiles it like `@for`), so the ratio is expected to sit ~1.0.
// It exists as a regression tripwire: a ratio drifting above 1 means a change
// knocked the JSX dialect off the fast path. Run only one by passing a
// TARGETS env.
//
// To compare against an inferno-next baseline (or any other target whose
// bench app exposes the same DOM contract), keep its dev server running
// and pass a TARGETS env var:
//   TARGETS='[{"name":"octane-tsrx","url":"http://localhost:5176/","ready":"#run"},
//             {"name":"inferno-next","url":"http://localhost:5175/","ready":"#run"}]' \
//     node run.mjs

import fs from 'node:fs';
import { chromium } from 'playwright';
import { timeClick } from './click.mjs';
import { deterministicCount } from '../lib/dom-nodes.mjs';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

// Opt-in diagnostic matching the older 1k clear comparison. Keep the canonical
// 10k suite and its historical baseline unchanged.
const CLEAR_1K = process.env.CLEAR_1K === '1';
const ITER = parseInt(process.argv[2] || (CLEAR_1K ? '15' : '8'), 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : CLEAR_1K ? 5 : 3;
const ROW_COUNT = 1000;
const ROW_COUNT_LARGE = 10000; // matches the canonical suite's runlots / clear table size
const CPU_THROTTLE = Number(process.env.CPU_THROTTLE || 1);
if (!Number.isFinite(CPU_THROTTLE) || CPU_THROTTLE < 1) {
	throw new Error('CPU_THROTTLE must be a number >= 1');
}

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5176/', ready: '#run' },
			{ name: 'octane-jsx', url: 'http://localhost:5177/', ready: '#run' },
			{ name: 'react', url: 'http://localhost:5175/', ready: '#run' },
			{ name: 'ripple', url: 'http://localhost:5178/', ready: '#run' },
			{ name: 'solid', url: 'http://localhost:5179/', ready: '#run' },
			{ name: 'vue-vapor', url: 'http://localhost:5180/', ready: '#run' },
			{ name: 'preact', url: 'http://localhost:5260/', ready: '#run' },
			{ name: 'svelte', url: 'http://localhost:5271/', ready: '#run' },
			{ name: 'inferno', url: 'http://localhost:5320/', ready: '#run' },
		];

const CANONICAL_OPS = [
	{ name: 'run', pre: 'empty', click: '#run' },
	{ name: 'replace', pre: 'rows', click: '#run' },
	// Canonical krausest "append 1,000 rows to a table of 1,000 rows". The
	// next op's ensureState sees 2000 rows ≠ 1000 and rebuilds via #run.
	{ name: 'add', pre: 'rows', click: '#add' },
	{ name: 'update', pre: 'rows', click: '#update' },
	{
		name: 'select',
		pre: 'rows',
		click: 'tbody tr:nth-child(5) td:nth-child(2) a',
		alternateClick: 'tbody tr:nth-child(6) td:nth-child(2) a',
	},
	{ name: 'swap', pre: 'rows', click: '#swaprows' },
	{ name: 'remove', pre: 'rows', click: 'tbody tr:nth-child(5) td:nth-child(3) a' },
	{ name: 'runlots', pre: 'empty', click: '#runlots' },
	{
		name: 'select_lots',
		pre: 'rows-large',
		click: 'tbody tr:nth-child(5000) td:nth-child(2) a',
		alternateClick: 'tbody tr:nth-child(5001) td:nth-child(2) a',
	},
	// Canonical js-framework-benchmark `clear` measures clearing the
	// 10K-row table that `runlots` populated — NOT the 1K-row table from
	// `run`. The previous `pre: 'rows'` rebuilt 1K rows before the timed
	// click, so reported numbers were ~10x too fast and not comparable to
	// the upstream suite. Use `rows-large` to ensure the 10K state first.
	{ name: 'clear', pre: 'rows-large', click: '#clear' },
];

const OPS = CLEAR_1K ? [{ name: 'clear_1k', pre: 'rows', click: '#clear' }] : CANONICAL_OPS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Use the same data stream for every target. Label generation is inside the
// measured create operations, so uncontrolled randomness would add dialect
// noise through different string lengths and allocation patterns.
const seedRandom = (page) =>
	page.evaluate(() => {
		let state = 0x5eed5eed >>> 0;
		Math.random = () => {
			state = (state + 0x6d2b79f5) | 0;
			let value = Math.imul(state ^ (state >>> 15), 1 | state);
			value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
	});

async function ensureState(page, pre) {
	if (pre === 'empty') {
		await page.evaluate(() => {
			const btn = document.getElementById('clear');
			if (btn) btn.click();
		});
		await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 0, {
			timeout: 5000,
		});
	} else if (pre === 'rows') {
		const cnt = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
		if (cnt !== ROW_COUNT) {
			await page.evaluate(() => document.getElementById('run').click());
			await page.waitForFunction(
				(n) => document.querySelectorAll('tbody tr').length === n,
				ROW_COUNT,
				{ timeout: 5000 },
			);
		}
	} else if (pre === 'rows-large') {
		const cnt = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
		if (cnt !== ROW_COUNT_LARGE) {
			await page.evaluate(() => document.getElementById('runlots').click());
			await page.waitForFunction(
				(n) => document.querySelectorAll('tbody tr').length === n,
				ROW_COUNT_LARGE,
				{ timeout: 5000 },
			);
		}
	}
	await sleep(20);
}

async function verifySelection(page, selector) {
	await page.evaluate((selector) => {
		const expected = document.querySelector(selector)?.closest('tr');
		const selected = document.querySelectorAll('tbody tr.danger');
		if (expected && selected.length === 1 && selected[0] === expected) return;

		const rowId = (row) => row.querySelector('td')?.textContent || '(missing id)';
		throw new Error(
			'selection gate failed: expected only ' +
				(expected ? rowId(expected) : '(missing row)') +
				', found ' +
				(Array.from(selected, rowId).join(', ') || '(none)'),
		);
	}, selector);
}

// Mount optimizations must retain ordinary live-parent insertion semantics.
// Keep browser-visible instrumentation entirely outside every timed sample.
async function verifyDirectListMount(page, operation) {
	await ensureState(page, operation.initialRows === 0 ? 'empty' : 'rows');
	return await page.evaluate(async (operation) => {
		const tbody = document.querySelector('tbody');
		if (!tbody?.isConnected) throw new Error('mount gate: missing connected table body');
		const before = Array.from(tbody.querySelectorAll('tr'));
		if (before.length !== operation.initialRows) {
			throw new Error(`mount gate: expected ${operation.initialRows} initial rows`);
		}
		const rowId = (row) => Number(row.firstElementChild?.textContent);
		const survivors = new Map(before.map((row) => [rowId(row), row]));

		const work = { liveParentInsertions: 0, fragmentCommits: 0, fragmentRows: 0 };
		const originals = [];
		const instrument = (prototype, name) => {
			const original = prototype[name];
			if (typeof original !== 'function') return;
			originals.push([prototype, name, original]);
			prototype[name] = function (...args) {
				if (this === tbody) {
					work.liveParentInsertions++;
					for (const node of args) {
						if (node?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
							work.fragmentCommits++;
							work.fragmentRows += node.querySelectorAll('tr').length;
						}
					}
				}
				return Reflect.apply(original, this, args);
			};
		};
		for (const name of ['insertBefore', 'appendChild', 'replaceChild']) {
			instrument(Node.prototype, name);
		}
		for (const name of ['append', 'prepend', 'replaceChildren']) {
			instrument(Element.prototype, name);
		}

		try {
			const button = document.getElementById(operation.button);
			if (!button) throw new Error(`mount gate: missing #${operation.button}`);
			button.click();
			if (window.__benchFlush) await window.__benchFlush();
		} finally {
			for (const [prototype, name, original] of originals.reverse()) {
				prototype[name] = original;
			}
		}

		const rows = Array.from(tbody.querySelectorAll('tr'));
		const expectedRows = operation.initialRows + operation.addedRows;
		if (rows.length !== expectedRows) {
			throw new Error(`mount gate: expected ${expectedRows} rows, found ${rows.length}`);
		}
		const insertionIndex =
			operation.insertion === 'prepend'
				? 0
				: operation.insertion === 'middle'
					? operation.initialRows >> 1
					: operation.initialRows;
		const inserted = rows.slice(insertionIndex, insertionIndex + operation.addedRows);
		const firstInsertedId = rowId(inserted[0]);
		if (!Number.isSafeInteger(firstInsertedId)) throw new Error('mount gate: invalid row id');
		let survivorIndex = 0;
		for (let index = 0; index < rows.length; index++) {
			const row = rows[index];
			const id = rowId(row);
			const isInserted = index >= insertionIndex && index < insertionIndex + operation.addedRows;
			if (!row.isConnected || !Number.isSafeInteger(id)) {
				throw new Error(`mount gate: incorrect row identity or connectivity at ${index}`);
			}
			if (isInserted) {
				if (survivors.has(id) || id !== firstInsertedId + index - insertionIndex) {
					throw new Error(`mount gate: incorrect inserted-row order at ${index}`);
				}
			} else if (row !== before[survivorIndex++] || survivors.get(id) !== row) {
				throw new Error(`mount gate: survivor order or DOM identity changed at ${index}`);
			}
		}
		if (survivorIndex !== before.length) throw new Error('mount gate: missing surviving rows');

		const selectedRow = inserted[Math.min(4, inserted.length - 1)];
		const action = selectedRow.querySelector('td:nth-child(2) a');
		if (!action) throw new Error('mount gate: missing row action');
		action.click();
		if (window.__benchFlush) await window.__benchFlush();
		const selected = tbody.querySelectorAll('tr.danger');
		if (selected.length !== 1 || selected[0] !== selectedRow) {
			throw new Error('mount gate: inserted-row identity, delegated event, or selection failed');
		}

		return work;
	}, operation);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--js-flags=--expose-gc'],
	});
	const context = await browser.newContext();
	const page = await context.newPage();
	if (CPU_THROTTLE > 1) {
		const cdp = await context.newCDPSession(page);
		await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });
	}
	await page.goto(t.url, { waitUntil: 'load' });
	await page.waitForSelector(t.ready, { timeout: 10000 });
	await seedRandom(page);

	// Warmup — let JIT settle.
	for (let i = 0; i < WARMUP; i++) {
		await page.evaluate(() => document.getElementById('run').click());
		await sleep(120);
		await page.evaluate(() => document.getElementById('clear').click());
		await sleep(80);
	}

	const results = {};
	for (const op of OPS) {
		const samples = [];
		for (let i = 0; i < ITER; i++) {
			await ensureState(page, op.pre);
			const selector = i % 2 === 1 && op.alternateClick ? op.alternateClick : op.click;
			const dt = await timeClick(page, op, selector);
			if (op.alternateClick) await verifySelection(page, selector);
			samples.push(dt);
			await sleep(60);
		}
		results[op.name] = summarizeSamples(samples);
	}

	// Run insertion, survivor identity, and delegated-selection gates for every canonical target.
	if (!CLEAR_1K) {
		for (const operation of [
			{ name: '1k', button: 'run', initialRows: 0, addedRows: ROW_COUNT },
			{ name: '10k', button: 'runlots', initialRows: 0, addedRows: ROW_COUNT_LARGE },
			{ name: 'append_1k', button: 'add', initialRows: ROW_COUNT, addedRows: ROW_COUNT },
			{
				name: 'prepend_100',
				button: 'prepend100',
				initialRows: ROW_COUNT,
				addedRows: 100,
				insertion: 'prepend',
			},
			{ name: 'append_100', button: 'append100', initialRows: ROW_COUNT, addedRows: 100 },
			{
				name: 'middle_100',
				button: 'insertmid100',
				initialRows: ROW_COUNT,
				addedRows: 100,
				insertion: 'middle',
			},
		]) {
			const work = await verifyDirectListMount(page, operation);
			results[`live_inserts_${operation.name}`] = deterministicCount(work.liveParentInsertions);
			results[`fragment_commits_${operation.name}`] = deterministicCount(work.fragmentCommits);
		}
	}

	await browser.close();
	return results;
}

(async () => {
	const all = {};
	for (const t of TARGETS) {
		console.error(`Running ${t.name} (${t.url}) × ${ITER}…`);
		all[t.name] = await runTarget(t);
	}

	const cols = TARGETS.map((t) => t.name);
	const W = 26;
	console.log();
	console.log('Op       | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('---------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.name.padEnd(8)];
		for (const c of cols) {
			const r = all[c][op.name];
			row.push(`${r.median.toFixed(2)} (min ${r.min.toFixed(2)})`.padEnd(W));
		}
		console.log(row.join('| '));
	}
	for (const [label, op] of [
		['#ins1k', 'live_inserts_1k'],
		['#frag1k', 'fragment_commits_1k'],
		['#ins10k', 'live_inserts_10k'],
		['#frag10k', 'fragment_commits_10k'],
		['#calls1k', 'production_calls_1k'],
		['#insadd', 'live_inserts_append_1k'],
		['#inspre', 'live_inserts_prepend_100'],
		['#insapp', 'live_inserts_append_100'],
		['#insmid', 'live_inserts_middle_100'],
	]) {
		if (!cols.some((name) => all[name][op])) continue;
		const row = [label.padEnd(8)];
		for (const name of cols) row.push(String(all[name][op]?.median ?? '-').padEnd(W));
		console.log(row.join('| '));
	}

	// Pairwise ratio: when more than one target was driven, treat the FIRST
	// target as the baseline and report every other target as a ratio of it.
	// Single-target runs skip this block (nothing to compare against).
	if (TARGETS.length > 1) {
		const baselineName = TARGETS[0].name;
		const baseline = all[baselineName];
		console.log();
		for (const t of TARGETS.slice(1)) {
			const r = all[t.name];
			console.log(`${t.name} / ${baselineName} ratio (score; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const ratio = scoreOf(r[op.name]) / scoreOf(baseline[op.name]);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.name.padEnd(8)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}
	}

	// Machine-readable results for the CI runner (see the BENCH_JSON contract
	// in the benchmarks README): milliseconds, one ops map per target.
	if (process.env.BENCH_JSON) {
		const payload = {
			suite: CLEAR_1K ? 'js-framework-clear-1k' : 'js-framework',
			meta: { cpuThrottle: CPU_THROTTLE, warmup: WARMUP },
			iterations: ITER,
			targets: TARGETS.map((t) => ({
				name: t.name,
				ops: Object.fromEntries(
					Object.entries(all[t.name]).map(([name, r]) => [
						name,
						r.score == null
							? { median: r.median, min: r.min, samples: r.samples.length }
							: timingStatForJson(r),
					]),
				),
			})),
		};
		fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
		console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
