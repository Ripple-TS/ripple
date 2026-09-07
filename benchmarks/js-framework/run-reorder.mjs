// Keyed-reorder matrix harness — drives the SECOND jumbotron button row the
// four js-framework fixtures expose (reverse / shuffle / rotatef / rotateb /
// prepend100 / append100 / insertmid100 / removefirst / removeevery10 /
// displace{3,4,5,6,8}) and times each permutation op via Playwright. Same
// methodology as ./run.mjs (synchronous in-page clicks, window.gc() before
// every timed sample, median+min tables, first target = ratio baseline), with
// two additions:
//
//   1. INNER-LOOP TIMING. Most reorder ops are far below performance.now()'s
//      effective resolution (a rotate is ~1 DOM move), so a single click
//      quantizes to the ~0.1ms timer floor. Each timed sample therefore loops
//      REPS clicks inside the timed window and divides (the signal-favoring
//      harness's BUMP_REPS pattern): REPS=100 for the guarded rotate pair,
//      REPS=20 for displace_k / remove*, and REPS=4 for reverse + shuffle (reverse is
//      self-inverse and shuffle reseeds per click, so repeated clicks are
//      valid, comparable work). The 100-row insert ops are big enough to time
//      with a single click (REPS=1).
//
//   2. IDENTITY GATE (uibench-style), run ONCE per op OUTSIDE the timed loop.
//      Before the op every <tr> is stamped with an expando
//      (`tr.__benchId = <row id>`); after one click the harness asserts that
//      (a) every SURVIVING row id is rendered by the SAME <tr> node (the
//      expando still matches — the framework moved the node, it didn't
//      rebuild it), and (b) DOM order equals data order (the harness replays
//      the op on the pre-click id list — including the fixtures' shared
//      seeded shuffle stream — and compares). Any failure exits 1: a fast
//      reorder that recreates rows or misorders them is a broken fixture,
//      not a win.
//
// Ops each start from a fresh 1k `#run` (the reset click sits outside the
// timed window). Note REPS>1 samples measure the MEAN over the click
// sequence: length-preserving ops (rotate/displace/reverse/shuffle) do
// identical work per click, `removefirst` shrinks 1000→980 (~constant), but
// `removeevery10` decays 1000→~122 across its 20 clicks — its number is the
// mean over that decaying sequence, comparable across targets but not to a
// single 1000-row click.
//
// Usage (same servers as run.mjs):
//   pnpm --filter octane-tsrx-jsbench dev   # :5176
//   pnpm --filter octane-jsx-jsbench dev    # :5177
//   pnpm --filter react-jsbench dev         # :5175
//   pnpm --filter ripple-jsbench dev        # :5178
//   pnpm --filter solid-jsbench dev         # :5179
//   pnpm --filter vue-vapor-jsbench dev     # :5180
//   node benchmarks/js-framework/run-reorder.mjs [iterations]   # default 8
//   BENCH_JSON=results/reorder.json node run-reorder.mjs        # machine-readable copy
//
// TARGETS env overrides the target list exactly like run.mjs.

import fs from 'node:fs';
import { chromium } from 'playwright';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '8', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : 2; // untimed per-op samples before the ITER timed ones
const ROW_COUNT = 1000;

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

// ── Fixture-shared shuffle machinery, replayed for the identity gate ───────
// Byte-for-byte the algorithm in each fixture's Main: a module-level
// mulberry32 stream (fixed seed 42) yields one 32-bit seed per #shuffle
// click, and Fisher–Yates runs on a PRNG seeded by it. Each target gets a
// fresh page load (fresh module state), so a fresh stream here stays in
// lockstep as long as the harness counts every #shuffle click it fires.
function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const SHUFFLE_SEED = 42;
function shuffleWithSeed(d, seed) {
	const rand = mulberry32(seed);
	const out = d.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = (rand() * (i + 1)) | 0;
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}

// Sentinel for "a freshly-built row goes here" in expected permutations.
// Row ids are numeric strings, so this can never collide.
const NEW = '<new>';
const fill100 = () => new Array(100).fill(NEW);

// Op table. `name` doubles as the button id (`#<name>`). `expected(pre, ctx)`
// replays the op on the pre-click id list for the identity gate; ctx carries
// the per-target shuffle-seed stream.
const OPS = [
	{ name: 'reverse', reps: 4, expected: (pre) => pre.slice().reverse() },
	{ name: 'shuffle', reps: 4, expected: (pre, ctx) => shuffleWithSeed(pre, ctx.nextSeed()) },
	{ name: 'rotatef', reps: 100, expected: (pre) => [pre[pre.length - 1], ...pre.slice(0, -1)] },
	{ name: 'rotateb', reps: 100, expected: (pre) => [...pre.slice(1), pre[0]] },
	{ name: 'prepend100', reps: 1, expected: (pre) => fill100().concat(pre) },
	{ name: 'append100', reps: 1, expected: (pre) => pre.concat(fill100()) },
	{
		name: 'insertmid100',
		reps: 1,
		expected: (pre) => {
			const mid = pre.length >> 1;
			return pre.slice(0, mid).concat(fill100(), pre.slice(mid));
		},
	},
	{ name: 'removefirst', reps: 20, expected: (pre) => pre.slice(1) },
	{ name: 'removeevery10', reps: 20, expected: (pre) => pre.filter((_, i) => i % 10 !== 0) },
	// displace_k: the fixture moves the FIRST k rows (as a group, order
	// preserved) to the END. The k sweep brackets the runtime's K_DISP=4
	// small-displacement threshold (see README).
	{ name: 'displace3', reps: 20, expected: (pre) => pre.slice(3).concat(pre.slice(0, 3)) },
	{ name: 'displace4', reps: 20, expected: (pre) => pre.slice(4).concat(pre.slice(0, 4)) },
	{ name: 'displace5', reps: 20, expected: (pre) => pre.slice(5).concat(pre.slice(0, 5)) },
	{ name: 'displace6', reps: 20, expected: (pre) => pre.slice(6).concat(pre.slice(0, 6)) },
	{ name: 'displace8', reps: 20, expected: (pre) => pre.slice(8).concat(pre.slice(0, 8)) },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function summarize(samples) {
	return summarizeSamples(samples);
}

// Reset to a fresh 1k table. Octane flushes via its public flushSync, Vue
// awaits nextTick, and the remaining targets commit on click. The count is
// checkable once the evaluate resolves.
async function resetRows(page) {
	const cnt = await page.evaluate(async () => {
		document.getElementById('run').click();
		if (window.__benchFlush) await window.__benchFlush();
		return document.querySelectorAll('tbody tr').length;
	});
	if (cnt !== ROW_COUNT) {
		throw new Error(`reset: expected ${ROW_COUNT} rows after #run, got ${cnt}`);
	}
}

// One click of `#<op.name>` with every <tr> stamped beforehand; asserts node
// identity for survivors and DOM-order === data-order against the replayed
// permutation. Throws (→ exit 1) on any mismatch.
async function identityGate(page, op, ctx, targetName) {
	await resetRows(page);
	const preIds = await page.evaluate(() => {
		const out = [];
		for (const tr of document.querySelectorAll('tbody tr')) {
			const id = tr.firstElementChild.textContent;
			tr.__benchId = id;
			out.push(id);
		}
		return out;
	});
	if (preIds.length !== ROW_COUNT) {
		throw new Error(`[${targetName}/${op.name}] identity gate: bad pre state (${preIds.length})`);
	}
	const expected = op.expected(preIds, ctx);
	const post = await page.evaluate(async (sel) => {
		document.querySelector(sel).click();
		if (window.__benchFlush) await window.__benchFlush();
		return Array.from(document.querySelectorAll('tbody tr'), (tr) => ({
			id: tr.firstElementChild.textContent,
			stamp: typeof tr.__benchId === 'string' ? tr.__benchId : null,
		}));
	}, `#${op.name}`);

	const fail = (msg) => {
		throw new Error(`[${targetName}/${op.name}] identity gate FAILED: ${msg}`);
	};
	if (post.length !== expected.length) {
		fail(`row count ${post.length}, expected ${expected.length}`);
	}
	const preSet = new Set(preIds);
	const seenNew = new Set();
	for (let i = 0; i < expected.length; i++) {
		const want = expected[i];
		const got = post[i];
		if (want === NEW) {
			// Freshly-built row: must be a brand-new id on an unstamped <tr>.
			if (preSet.has(got.id)) fail(`position ${i}: expected a new row, got surviving id ${got.id}`);
			if (seenNew.has(got.id)) fail(`position ${i}: duplicate new id ${got.id}`);
			seenNew.add(got.id);
			if (got.stamp !== null) {
				fail(`position ${i}: new row ${got.id} reused a pre-existing <tr> (stamp ${got.stamp})`);
			}
		} else {
			// Survivor: right id in the right place, on the SAME node as before.
			if (got.id !== want) fail(`position ${i}: id ${got.id}, expected ${want} (order mismatch)`);
			if (got.stamp !== want) {
				fail(
					`position ${i}: id ${want} is on a ${got.stamp === null ? 'REBUILT' : 'foreign'} <tr>` +
						` (stamp ${got.stamp}) — survivor node identity lost`,
				);
			}
		}
	}
}

// Timed sample: REPS clicks inside one performance.now() window, divided.
// gc() immediately before keeps a surprise collection out of the window.
// Async-commit targets (window.__benchFlush — see run.mjs's timeClick note)
// await the scheduler flush BETWEEN clicks: without it the REPS state changes
// would coalesce into one commit and the sample would time a single net
// permutation instead of REPS full commits.
async function timeSample(page, sel, reps) {
	return await page.evaluate(
		async ({ sel, reps }) => {
			const el = document.querySelector(sel);
			if (!el) throw new Error('selector not found: ' + sel);
			const flush = window.__benchFlush;
			(window.gc || (() => {}))();
			const t0 = performance.now();
			if (flush) {
				for (let k = 0; k < reps; k++) {
					el.click();
					await flush();
				}
			} else {
				for (let k = 0; k < reps; k++) el.click();
			}
			return (performance.now() - t0) / reps;
		},
		{ sel, reps },
	);
}

async function runTarget(t) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--js-flags=--expose-gc'],
	});
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto(t.url, { waitUntil: 'load' });
	await page.waitForSelector(t.ready ?? '#run', { timeout: 10000 });
	// The reorder buttons must exist — fail fast on a stale fixture.
	await page.waitForSelector('#reverse', { timeout: 10000 });

	// Fresh page load ⇒ the fixture's module-level shuffle stream is at its
	// start. Mirror it, advancing once per #shuffle click the harness fires.
	const stream = mulberry32(SHUFFLE_SEED);
	const ctx = {
		nextSeed: () => (stream() * 4294967296) >>> 0,
		advance(n) {
			for (let i = 0; i < n; i++) stream();
		},
	};

	// Warmup — let JIT settle (run/clear only; no #shuffle, the stream must
	// stay untouched until the gate's first shuffle click).
	for (let i = 0; i < 3; i++) {
		await page.evaluate(() => document.getElementById('run').click());
		await sleep(80);
		await page.evaluate(() => document.getElementById('clear').click());
		await sleep(50);
	}

	const results = {};
	const gateFails = {};
	for (const op of OPS) {
		// Correctness first, once, outside any timed window. A gate failure is a
		// per-(target,op) fact: record it, skip this op's timing (its DOM is
		// wrong, so any number would be garbage), and keep going so the other
		// targets/ops still produce a full matrix. The run still exits non-zero
		// and BENCH_JSON still carries a top-level `failed` field (see below) —
		// the gate is NOT weakened, only its blast radius is. Skipping a failed
		// op's timed loop keeps the shuffle-seed stream in lockstep: only the
		// shuffle op advances it, and its gate advances harness+fixture by one
		// click each before any skip, so they stay aligned regardless.
		try {
			await identityGate(page, op, ctx, t.name);
		} catch (e) {
			const msg = String(e && e.message ? e.message : e);
			gateFails[op.name] = msg;
			results[op.name] = null;
			console.error(`  ⚠ GATE FAIL ${t.name}/${op.name}: ${msg}`);
			continue;
		}
		const samples = [];
		for (let i = 0; i < WARMUP + ITER; i++) {
			await resetRows(page);
			const dt = await timeSample(page, `#${op.name}`, op.reps);
			if (op.name === 'shuffle') ctx.advance(op.reps);
			if (i >= WARMUP) samples.push(dt);
			await sleep(20);
		}
		results[op.name] = summarize(samples);
	}
	// Octane-specific allocator budgets are maintained in its own repository.
	let scratchWork;

	await browser.close();
	return { results, gateFails, scratchWork };
}

// Per-target identity-gate summary for BENCH_JSON meta: "pass" when every op
// held, else "fail: <op>[, <op>…]" listing exactly which ops broke.
function gateMeta(gateFails, scratchWork) {
	const failed = Object.keys(gateFails).filter((name) => name !== 'scratch-storage');
	return {
		identityGate: failed.length ? `fail: ${failed.join(', ')}` : 'pass',
		...(scratchWork === undefined
			? gateFails['scratch-storage'] === undefined
				? {}
				: { scratchGate: 'fail' }
			: { scratchGate: 'pass', ...scratchWork }),
	};
}

function writeBenchJson(payload) {
	if (!process.env.BENCH_JSON) return;
	fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
	console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
}

(async () => {
	const all = {};
	// A hard crash (server down, selector missing, etc.) still writes a flagged
	// BENCH_JSON from whatever completed, then rethrows → exit 1.
	try {
		for (const t of TARGETS) {
			console.error(`Running ${t.name} (${t.url}) × ${ITER} (+${WARMUP} warmup, per-op gate)…`);
			all[t.name] = await runTarget(t);
		}
	} catch (e) {
		writeBenchJson({
			suite: 'js-framework-reorder',
			iterations: ITER,
			failed: String(e && e.message ? e.message : e),
			targets: Object.entries(all).map(([name, { results, gateFails, scratchWork }]) => ({
				name,
				ops: Object.fromEntries(Object.entries(results).filter(([, v]) => v != null)),
				meta: gateMeta(gateFails, scratchWork),
			})),
		});
		throw e;
	}

	const cols = TARGETS.map((t) => t.name);
	const W = 26;
	const fmt = (x) => (x < 0.1 ? x.toFixed(3) : x.toFixed(2));
	const cell = (r) => (r == null ? 'GATE FAIL' : `${fmt(r.median)} (min ${fmt(r.min)})`);
	console.log();
	console.log('Op            | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('--------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.name.padEnd(13)];
		for (const c of cols) row.push(cell(all[c].results[op.name]).padEnd(W));
		console.log(row.join('| '));
	}

	// Pairwise ratio: FIRST target (octane-tsrx by default) is the baseline.
	// Ops where either side failed its gate are shown as GATE FAIL, not a ratio.
	if (TARGETS.length > 1) {
		const baselineName = TARGETS[0].name;
		const baseline = all[baselineName].results;
		console.log();
		for (const t of TARGETS.slice(1)) {
			const r = all[t.name].results;
			console.log(`${t.name} / ${baselineName} ratio (score; <1 means ${t.name} faster):`);
			for (const op of OPS) {
				const b = baseline[op.name];
				const v = r[op.name];
				if (b == null || v == null) {
					console.log(`  ${op.name.padEnd(13)} GATE FAIL`);
					continue;
				}
				if (scoreOf(b) === 0) {
					console.log(`  ${op.name.padEnd(13)}   —    (baseline ~0, sub-resolution)`);
					continue;
				}
				const ratio = scoreOf(v) / scoreOf(b);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.name.padEnd(13)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}
	}

	// Any per-op gate failure across any target → non-zero exit + top-level
	// `failed` (per the BENCH_JSON contract), while still reporting every
	// target's passing ops.
	const failures = [];
	for (const t of TARGETS) {
		for (const [opName, msg] of Object.entries(all[t.name].gateFails)) {
			failures.push(`${t.name}/${opName}: ${msg}`);
		}
	}
	writeBenchJson({
		suite: 'js-framework-reorder',
		iterations: ITER,
		...(failures.length ? { failed: failures.join(' | ') } : {}),
		targets: TARGETS.map((t) => ({
			name: t.name,
			ops: Object.fromEntries(
				Object.entries(all[t.name].results)
					.filter(([, v]) => v != null)
					.map(([op, r]) => [op, timingStatForJson(r)]),
			),
			meta: gateMeta(all[t.name].gateFails, all[t.name].scratchWork),
		})),
	});
	if (failures.length) {
		console.error(`\n${failures.length} keyed-reorder gate failure(s):`);
		for (const f of failures) console.error(`  ✗ ${f}`);
		process.exit(1);
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
