// Streaming-chat benchmark runner — the modern workload: a ChatGPT/Claude-style
// interface streaming PREDEFINED token sequences into a conversation UI. Every
// column implements the same DOM contract and two bench hooks (documented app
// API, ../README.md):
//
//   window.__pump(k)  — token arrival is a NETWORK event, not user input: append
//                       k tokens to the streaming assistant reply, commit, and
//                       return the remaining token count (0 = settled).
//   window.__reset()  — restore the pristine corpus between samples.
//
// Everything else is real dispatched DOM interaction (controlled composer
// typing, send clicks, conversation-tab clicks). DETERMINISM: the corpus
// derives from one fixed PRNG seed at module load (identical token streams in
// every framework and run), and the measured path contains NO timers — the
// harness drains the stream in fixed-size batches and measures wall time to
// fully rendered. A paced "realism" mode would be flaky; this is pure render
// cost.
//
// Timing protocol matches ../todomvc/run.mjs: sync-commit frameworks flush
// inside the call (octane/react/ripple flushSync, solid flush()); Preact and
// vue-vapor expose `__benchFlush` and the loop awaits it per interaction.
//
// Usage:
//   node benchmarks/chat-stream/run.mjs [iterations]      # default 8
//   BENCH_JSON=results/chat-stream.json node run.mjs
//   TARGETS='[{"name":"octane-tsrx","url":"http://localhost:5250/"}]' node run.mjs

import fs from 'node:fs';
import { chromium } from 'playwright';
import { censusDomNodes, deterministicCount } from '../lib/dom-nodes.mjs';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '8', 10);

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5250/' },
			{ name: 'react', url: 'http://localhost:5251/' },
			{ name: 'solid', url: 'http://localhost:5252/' },
			{ name: 'ripple', url: 'http://localhost:5253/' },
			{ name: 'vue-vapor', url: 'http://localhost:5254/' },
			{ name: 'preact', url: 'http://localhost:5262/' },
			{ name: 'svelte', url: 'http://localhost:5273/' },
			{ name: 'inferno', url: 'http://localhost:5323/' },
		];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HELPERS = `
	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => Array.from(document.querySelectorAll(sel));
	const count = (sel) => document.querySelectorAll(sel).length;
	const expect = (cond, msg) => {
		if (!cond) throw new Error('chat-stream verify failed: ' + msg);
	};
	const flush = window.__benchFlush;
	// Controlled-input keystroke: the native value setter keeps React's value
	// tracker honest; harmless for the native-event frameworks.
	const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
	const typeInto = (el, text) => {
		nativeValue.call(el, text);
		el.dispatchEvent(new Event('input', { bubbles: true }));
	};
	const sendPrompt = async (text) => {
		typeInto($('.prompt'), text);
		if (flush) await flush();
		$('.send').click();
		if (flush) await flush();
	};
	const drain = async (batch) => {
		let guard = 0;
		while (window.__pump(batch) > 0) {
			if (flush) await flush();
			if (++guard > 10000) throw new Error('drain never settled');
		}
		if (flush) await flush();
	};
`;

// Op bodies run inside one evaluated async IIFE; verification after the timer.
const OPS = [
	// Op sizing: each body does enough work that every framework's median clears
	// ~1ms — below that, Chromium's 0.1ms timer granularity dominates and the
	// compare gate false-positives on an unchanged tree. Back-to-back sends are
	// natural chat semantics (the reply cursor is reset per sample), so scaling
	// is more conversation, not artificial repetition.
	{
		// Four scripted replies drained in FINE batches (8 tokens ≈ streaming
		// chunk cadence) — the sustained text-append + re-render hot path.
		name: 'streamFine',
		pre: 'reset',
		body: `
			for (let i = 0; i < 4; i++) {
				await sendPrompt('Benchmark: stream reply ' + i);
				await drain(8);
			}
		`,
		verify: `
			expect(count('.messages .message') === 18, 'message count ' + count('.messages .message'));
			expect(count('.streaming') === 0, 'streaming flag stuck');
			const last = $$('.messages .message').pop();
			expect(last.classList.contains('assistant'), 'last message role');
			expect(last.textContent.length > 200, 'reply text missing');
		`,
	},
	{
		// The same four replies in COARSE batches (64 tokens) — bigger commits,
		// fewer renders: the scheduler/derivation-cost profile at another grain.
		name: 'streamCoarse',
		pre: 'reset',
		body: `
			for (let i = 0; i < 4; i++) {
				await sendPrompt('Benchmark: stream reply ' + i);
				await drain(64);
			}
		`,
		verify: `
			expect(count('.messages .message') === 18, 'message count ' + count('.messages .message'));
			expect(count('.streaming') === 0, 'streaming flag stuck');
		`,
	},
	{
		// Stream two replies into a 200-message history: measures whether
		// untouched keyed siblings stay untouched while the tail re-renders.
		name: 'appendHistory',
		pre: 'conv1',
		body: `
			for (let i = 0; i < 2; i++) {
				await sendPrompt('Benchmark: append to long history ' + i);
				await drain(16);
			}
		`,
		verify: `
			expect(count('.messages .message') === 204, 'message count ' + count('.messages .message'));
			expect(count('.streaming') === 0, 'streaming flag stuck');
		`,
	},
	{
		// Conversation switching: five keyed-list teardown/rebuild round trips
		// (10-message chat ↔ 200-message history).
		name: 'switchConv',
		pre: 'reset',
		body: `
			for (let i = 0; i < 5; i++) {
				$('.conv-tab[data-conv="1"]').click();
				if (flush) await flush();
				$('.conv-tab[data-conv="0"]').click();
				if (flush) await flush();
			}
		`,
		verify: `
			expect(count('.messages .message') === 10, 'back on conv0: ' + count('.messages .message'));
			expect($('.conv-tab[data-conv="0"]').classList.contains('active'), 'tab state');
		`,
	},
	{
		// 160 keystrokes through the CONTROLLED composer (4 passes over a
		// 40-char growing prefix) — per-keystroke state-round-trip cost (the
		// value prop reasserts from state).
		name: 'type160',
		pre: 'reset',
		body: `
			const promptEl = $('.prompt');
			const text = 'the quick brown fox jumps over the lazy dog';
			for (let pass = 0; pass < 4; pass++) {
				for (let i = 1; i <= 40; i++) {
					typeInto(promptEl, text.slice(0, i));
					if (flush) await flush();
				}
			}
		`,
		verify: `
			const expected = 'the quick brown fox jumps over the lazy dog'.slice(0, 40);
			expect($('.prompt').value === expected, 'composer value: ' + $('.prompt').value);
		`,
	},
];

async function ensureState(page, pre) {
	const steps =
		pre === 'conv1'
			? `window.__reset(); if (flush) await flush();
			   $('.conv-tab[data-conv="1"]').click(); if (flush) await flush();
			   expect(count('.messages .message') === 200, 'conv1 history');`
			: `window.__reset(); if (flush) await flush();
			   expect(count('.messages .message') === 10, 'reset state');`;
	await page.evaluate(`(async () => { ${HELPERS} ${steps} })()`);
	await sleep(15);
}

async function timeOp(page, op) {
	return await page.evaluate(`(async () => {
		${HELPERS}
		(window.gc || (() => {}))();
		const t0 = performance.now();
		${op.body}
		const dt = performance.now() - t0;
		${op.verify}
		return dt;
	})()`);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--js-flags=--expose-gc'],
	});
	const page = await (await browser.newContext()).newPage();
	await page.goto(t.url, { waitUntil: 'load' });
	await page.waitForSelector('.prompt', { timeout: 10000 });

	// Warmup pass — JIT + corpus segment-text caches settle.
	for (const op of OPS) {
		await ensureState(page, op.pre);
		await timeOp(page, op);
	}

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

	// Full steady-state DOM shape (conv0's 10 mixed messages).
	await ensureState(page, 'reset');
	const dom = await page.evaluate(censusDomNodes, '#main');
	results.nodes_conv = deterministicCount(dom.total);
	results.elements_conv = deterministicCount(dom.elements);
	results.text_conv = deterministicCount(dom.text);
	results.comments_conv = deterministicCount(dom.comments);
	results.empty_text_conv = deterministicCount(dom.emptyText);
	results.whitespace_text_conv = deterministicCount(dom.whitespaceText);
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
		['#nodes', 'nodes_conv'],
		['#elems', 'elements_conv'],
		['#text', 'text_conv'],
		['#cmnts', 'comments_conv'],
		['#empty', 'empty_text_conv'],
		['#ws', 'whitespace_text_conv'],
	]) {
		const row = [label.padEnd(13)];
		for (const c of cols) row.push(String(all[c][op].median).padEnd(W));
		console.log(row.join('| '));
	}

	// Machine-readable results for the CI runner (BENCH_JSON contract).
	if (process.env.BENCH_JSON) {
		const payload = {
			suite: 'chat-stream',
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
