// TodoMVC benchmark runner — drives all seven framework columns through the
// SAME Speedometer-style scripted interactions via Playwright and times each
// op. Unlike the js-framework suite's single-click ops, every TodoMVC op is a
// BATCH of real DOM interactions (dispatched events on the app's actual
// inputs/buttons/labels — no bench-only hooks in the apps), with the DOM
// verified after every timed sample so a silently-broken column can't post
// numbers.
//
// Timing protocol (shared with ../js-framework/run.mjs): interactions run
// inside one page.evaluate, `performance.now()` around the batch. Frameworks
// that commit synchronously on the dispatched event (octane native flush,
// react/ripple/Svelte flushSync in handlers, solid flush()) are fully measured
// by the synchronous window; Preact and vue-vapor expose
// `window.__benchFlush` and the loop awaits it after EACH interaction — one
// scheduler flush per user action, matching how real input arrives (discrete
// tasks), with each framework's own scheduling cost inside the measurement.
//
// The `.new-todo` / `.edit` inputs are uncontrolled in every app: the driver
// sets `input.value` directly and dispatches `keydown` (Enter/Escape) — the
// handlers read `e.target.value`, identical semantics across all seven.
//
// Usage:
//   node benchmarks/todomvc/run.mjs [iterations]        # default 8
//   BENCH_JSON=results/todomvc.json node run.mjs        # machine-readable copy
//   TARGETS='[{"name":"octane-tsrx","url":"http://localhost:5240/"}]' node run.mjs

import fs from 'node:fs';
import { chromium } from 'playwright';
import { censusDomNodes, deterministicCount } from '../lib/dom-nodes.mjs';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '8', 10);
const N = 100; // todos per populated state

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5240/' },
			{ name: 'react', url: 'http://localhost:5241/' },
			{ name: 'solid', url: 'http://localhost:5242/' },
			{ name: 'ripple', url: 'http://localhost:5243/' },
			{ name: 'vue-vapor', url: 'http://localhost:5244/' },
			{ name: 'preact', url: 'http://localhost:5261/' },
			{ name: 'svelte', url: 'http://localhost:5272/' },
			{ name: 'inferno', url: 'http://localhost:5321/' },
		];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── In-page interaction helpers, serialized into every evaluate ────────────
// (Playwright evaluates receive one function; helpers are defined inline so
// each op body stays a plain self-contained closure.)
const HELPERS = `
	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => Array.from(document.querySelectorAll(sel));
	const key = (el, k) =>
		el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
	const dbl = (el) =>
		el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
	const addTodo = (title) => {
		const input = $('.new-todo');
		input.value = title;
		key(input, 'Enter');
	};
	const count = (sel) => document.querySelectorAll(sel).length;
	const expect = (cond, msg) => {
		if (!cond) throw new Error('todomvc verify failed: ' + msg);
	};
`;

// Each op: { name, pre, body } — `pre` names the required starting state
// (ensured untimed), `body` is the TIMED interaction batch (a string of
// statements; `flush` is available and awaited per interaction where needed).
// Verification runs inside the same evaluate AFTER the timer stops.
const OPS = [
	{
		name: 'add100',
		pre: 'empty',
		body: `
			for (let i = 0; i < ${N}; i++) {
				addTodo('Something to do ' + i);
				if (flush) await flush();
			}
		`,
		verify: `
			expect(count('.todo-list li') === ${N}, 'add100 rendered ' + count('.todo-list li'));
			expect($('.todo-count strong').textContent === '${N}', 'count after add100');
		`,
	},
	{
		name: 'toggleAllOn',
		pre: 'items',
		body: `
			$('.toggle-all').click();
			if (flush) await flush();
		`,
		verify: `
			expect(count('.todo-list li.completed') === ${N}, 'toggleAllOn completed count');
			expect($('.todo-count strong').textContent === '0', 'count after toggleAllOn');
		`,
	},
	{
		name: 'toggleAllOff',
		pre: 'items-completed',
		body: `
			$('.toggle-all').click();
			if (flush) await flush();
		`,
		verify: `
			expect(count('.todo-list li.completed') === 0, 'toggleAllOff completed count');
			expect($('.todo-count strong').textContent === '${N}', 'count after toggleAllOff');
		`,
	},
	{
		name: 'complete25',
		pre: 'items',
		body: `
			const toggles = $$('.todo-list li .toggle');
			for (let i = 0; i < ${N}; i += 4) {
				toggles[i].click();
				if (flush) await flush();
			}
		`,
		verify: `
			expect(count('.todo-list li.completed') === 25, 'complete25 completed count');
			expect($('.todo-count strong').textContent === '75', 'count after complete25');
		`,
	},
	{
		name: 'filterCycle',
		pre: 'items-quarter',
		body: `
			$('.filters a[data-filter="active"]').click();
			if (flush) await flush();
			$('.filters a[data-filter="completed"]').click();
			if (flush) await flush();
			$('.filters a[data-filter="all"]').click();
			if (flush) await flush();
		`,
		verify: `
			expect(count('.todo-list li') === ${N}, 'filterCycle back to all');
			expect($('.filters a[data-filter="all"]').classList.contains('selected'), 'all selected');
		`,
	},
	{
		name: 'edit10',
		pre: 'items',
		body: `
			for (let i = 0; i < 10; i++) {
				const li = $$('.todo-list li')[i];
				dbl(li.querySelector('label'));
				if (flush) await flush();
				const edit = li.querySelector('.edit');
				edit.value = 'edited ' + i;
				key(edit, 'Enter');
				if (flush) await flush();
			}
		`,
		verify: `
			expect(count('.todo-list li .edit') === 0, 'edit10 left an editor open');
			const labels = $$('.todo-list li label').slice(0, 10).map((l) => l.textContent);
			for (let i = 0; i < 10; i++) {
				expect(labels[i] === 'edited ' + i, 'edit10 label ' + i + ' = ' + labels[i]);
			}
		`,
	},
	{
		name: 'clearCompleted',
		pre: 'items-quarter',
		body: `
			$('.clear-completed').click();
			if (flush) await flush();
		`,
		verify: `
			expect(count('.todo-list li') === 75, 'clearCompleted left ' + count('.todo-list li'));
			expect($('.clear-completed') === null, 'clear-completed button still visible');
		`,
	},
	{
		name: 'destroy25',
		pre: 'items',
		body: `
			for (let i = 0; i < 25; i++) {
				$('.todo-list li .destroy').click();
				if (flush) await flush();
			}
		`,
		verify: `
			expect(count('.todo-list li') === ${N - 25}, 'destroy25 left ' + count('.todo-list li'));
		`,
	},
];

// Untimed state preparation, through the same real interactions. The whole
// in-page program is built as ONE source string (helpers + prep + body) and
// evaluated as an async IIFE — strict-mode eval would otherwise scope the
// helper consts to the eval call itself.
const PREP = `
	const flush = window.__benchFlush;
	const reset = async () => {
		if (count('.todo-list li') === 0) return;
		const ta = $('.toggle-all');
		if (!ta.checked) {
			ta.click();
			if (flush) await flush();
		}
		$('.clear-completed').click();
		if (flush) await flush();
		expect(count('.todo-list li') === 0, 'reset left items');
	};
	const fill = async (n) => {
		for (let i = 0; i < n; i++) addTodo('Something to do ' + i);
		if (flush) await flush();
		expect(count('.todo-list li') === n, 'fill failed');
	};
	const allFilter = async () => {
		const all = $('.filters a[data-filter="all"]');
		if (all && !all.classList.contains('selected')) {
			all.click();
			if (flush) await flush();
		}
	};
`;

async function ensureState(page, pre) {
	const steps =
		pre === 'empty'
			? `await allFilter(); await reset();`
			: pre === 'items'
				? `await allFilter(); await reset(); await fill(${N});`
				: pre === 'items-completed'
					? `await allFilter(); await reset(); await fill(${N});
					   $('.toggle-all').click(); if (flush) await flush();
					   expect(count('.todo-list li.completed') === ${N}, 'pre items-completed');`
					: `await allFilter(); await reset(); await fill(${N});
					   { const toggles = $$('.todo-list li .toggle');
					     for (let i = 0; i < ${N}; i += 4) toggles[i].click();
					     if (flush) await flush(); }
					   expect(count('.todo-list li.completed') === 25, 'pre items-quarter');`;
	await page.evaluate(`(async () => { ${HELPERS} ${PREP} ${steps} })()`);
	await sleep(15);
}

async function timeOp(page, op) {
	return await page.evaluate(`(async () => {
		${HELPERS}
		const flush = window.__benchFlush;
		(window.gc || (() => {}))();
		const t0 = performance.now();
		${op.body}
		const dt = performance.now() - t0;
		${op.verify}
		return dt;
	})()`);
}

async function countRowClassWritesDuringComplete25(page) {
	await ensureState(page, 'items');
	return await page.evaluate(`(async () => {
		${HELPERS}
		const flush = window.__benchFlush;
		let writes = 0;
		const countWrites = (records) => {
			for (const record of records) {
				if (record.target.localName === 'li') writes++;
			}
		};
		const observer = new MutationObserver(countWrites);
		observer.observe($('.todo-list'), {
			attributes: true,
			attributeFilter: ['class'],
			subtree: true,
		});
		try {
			const toggles = $$('.todo-list li .toggle');
			for (let i = 0; i < ${N}; i += 4) {
				toggles[i].click();
				if (flush) await flush();
			}
			countWrites(observer.takeRecords());
		} finally {
			observer.disconnect();
		}
		expect(count('.todo-list li.completed') === 25, 'class-write sample completed count');
		expect($('.todo-count strong').textContent === '75', 'class-write sample remaining count');
		return writes;
	})()`);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--js-flags=--expose-gc'],
	});
	const page = await (await browser.newContext()).newPage();
	await page.goto(t.url, { waitUntil: 'load' });
	await page.waitForSelector('.new-todo', { timeout: 10000 });

	// Warmup — one full pass of every op lets the JIT settle.
	for (const op of OPS) {
		await ensureState(page, op.pre);
		await timeOp(page, op);
	}
	await ensureState(page, 'empty');

	const results = {};
	for (const op of OPS) {
		const samples = [];
		for (let i = 0; i < ITER; i++) {
			await ensureState(page, op.pre);
			samples.push(await timeOp(page, op));
			await sleep(40);
		}
		results[op.name] = summarizeSamples(samples);
	}

	// Exact browser-observed work for the 25 immutable single-row updates. A
	// MutationObserver also records writes that repeat the existing class value,
	// so it catches a keyed-survivor bailout disappearing without timer noise.
	results.row_class_writes_complete25 = deterministicCount(
		await countRowClassWritesDuringComplete25(page),
	);

	// Full steady-state DOM shape (100 todos mounted). Element/text counts are
	// semantic controls beside the bookkeeping-node total.
	await ensureState(page, 'items');
	const dom = await page.evaluate(censusDomNodes, '#main');
	results.nodes_100 = deterministicCount(dom.total);
	results.elements_100 = deterministicCount(dom.elements);
	results.text_100 = deterministicCount(dom.text);
	results.comments_100 = deterministicCount(dom.comments);
	results.empty_text_100 = deterministicCount(dom.emptyText);
	results.whitespace_text_100 = deterministicCount(dom.whitespaceText);
	results.__dom = dom;

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
	console.log('Op            | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('--------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.name.padEnd(13)];
		for (const c of cols) {
			const r = all[c][op.name];
			row.push(`${r.median.toFixed(2)} (min ${r.min.toFixed(2)})`.padEnd(W));
		}
		console.log(row.join('| '));
	}
	for (const [label, op] of [
		['#rowCls25', 'row_class_writes_complete25'],
		['#nodes', 'nodes_100'],
		['#elems', 'elements_100'],
		['#text', 'text_100'],
		['#cmnts', 'comments_100'],
		['#empty', 'empty_text_100'],
		['#ws', 'whitespace_text_100'],
	]) {
		const row = [label.padEnd(13)];
		for (const c of cols) row.push(String(all[c][op].median).padEnd(W));
		console.log(row.join('| '));
	}

	// Machine-readable results for the CI runner (see the BENCH_JSON contract
	// in the benchmarks README): milliseconds, one ops map per target.
	if (process.env.BENCH_JSON) {
		const payload = {
			suite: 'todomvc',
			iterations: ITER,
			targets: TARGETS.map((t) => ({
				name: t.name,
				ops: Object.fromEntries(
					Object.entries(all[t.name])
						.filter(([name]) => name !== '__dom')
						.map(([name, r]) => [
							name,
							r.score == null
								? { median: r.median, min: r.min, samples: r.samples.length }
								: timingStatForJson(r),
						]),
				),
				meta: { dom: all[t.name].__dom },
			})),
		};
		fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
		console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
