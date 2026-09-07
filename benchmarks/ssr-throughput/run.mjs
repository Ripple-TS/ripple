// ssr-throughput bench harness — Node-only SSR throughput (NO browser, NO
// ports, NO Playwright). Hand-rolled process.hrtime.bigint timing.
//
// Part 1 — news-page throughput: reuses benchmarks/news's production-build
// methodology (vite build the SSR bundle, import the built entry-server, time
// renderApp()) for seven targets — Octane, React, Preact, Solid, Svelte,
// Ripple 'ripple/server' render (bundled in by its app's ssr.noExternal, so
// the built entry is self-contained), and Vue 3.6 vue/server-renderer
// renderToString (a vapor SFC compiles to the regular ssrRender codegen on
// the server — vapor has no server codegen in 3.6; the vapor part is
// client-side adoption, which this Node-only suite never runs) — at 50 and
// 500 article cards. benchmarks/news is NEVER modified beyond its own
// gen.mjs re-writing src/data.js (invoked as a child process, deterministic,
// restored to the tracked count-50 dataset afterwards); every build lands in
// THIS suite's dist/ via an outDir override, so news's own dist is untouched.
//
// Every timed render materializes its returned body with Buffer.byteLength.
// This makes every framework pay the string flatten/UTF-8 sizing work a real
// response writer incurs; without it, a renderer returning a lazy rope can move
// substantial work outside the timer while a renderer returning a flat string
// cannot. Every config reports ops/sec, p50/p95/p99/min latency (ms), RSS +
// heapUsed growth over up to 5k renders (process.memoryUsage deltas, NO forced
// gc), body bytes, and hydration-marker-pair count ('<!--[' occurrences).
//
// Usage:  node run.mjs [seconds] [--no-build] [--quick]
//   seconds   — timed-loop budget PER CONFIG (default 10, or 2 under --quick);
//               also scales the memory-phase render count (seconds*500, capped
//               at 5000).
//   --no-build  reuse existing dist/ bundles (fast re-runs).
//   --quick     reduced smoke pass: 2s loops, news at count-50 ONLY (skips the
//               count-500 gen+build), waterfall depths {1,2} ONLY, and drops the
//               32-in-flight concurrency config. Exercises every distinct code
//               path + correctness gate cheaply; not a representative benchmark.
//   CONFIGS=waterfall,escape   env: run only configs whose name contains one
//               of the comma-separated substrings.
//   BENCH_JSON=/path/out.json  env: also write machine-readable results.

// Set BEFORE importing anything that resolves a framework runtime: externalized
// react-dom / @solidjs/web pick their PRODUCTION build off process.env.NODE_ENV.
process.env.NODE_ENV = 'production';

import { build } from 'vite';
import { selectTargets } from '../lib/targets.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS = path.join(__dirname, '..', 'news');
const DIST = path.join(__dirname, 'dist');

const args = process.argv.slice(2);
const noBuild = args.includes('--no-build');
const quick = args.includes('--quick');
const positional = args.filter((a) => !a.startsWith('--'));
const SECONDS = Math.max(0.1, parseFloat(positional[0] || (quick ? '2' : '10')));
// Memory-growth phase: up to 5k renders (spec), scaled down for smoke runs and
// additionally time-capped per config (~60s worst case) so a slow config can't
// wedge the run; the actual render count lands in meta.memRenders.
const MEM_RENDERS = Math.max(50, Math.min(5000, Math.round(SECONDS * 500)));
const MEM_TIME_CAP_MS = 60_000;
const CONFIG_FILTER = process.env.CONFIGS
	? process.env.CONFIGS.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	: null;

const NEWS_TARGETS = selectTargets([
	'octane-tsrx',
	'react',
	'preact',
	'solid',
	'svelte',
	'ripple',
	'vue-vapor',
	'inferno',
]);
const CARD_COUNTS = quick ? [50] : [50, 500];
// ── build phase ───────────────────────────────────────────────────────────────

function gen(count) {
	// news's own generator, run as a child process (we never edit news files
	// ourselves). Deterministic (seeded mulberry32), so re-running at 50 restores
	// the tracked src/data.js byte-for-byte.
	execFileSync(process.execPath, [path.join(NEWS, 'gen.mjs'), String(count)], {
		stdio: 'ignore',
	});
}

async function buildSsr(root, outDir) {
	await build({
		root,
		logLevel: 'warn',
		// outDir lives under THIS suite's dist/ (outside the app root), so the
		// target app's own dist/ is untouched; emptyOutDir must be explicit for an
		// out-of-root outDir.
		build: { ssr: 'src/entry-server.ts', outDir, emptyOutDir: true },
		// The React target compiles `.tsrx` via @tsrx/react, whose output imports
		// the @tsrx/react runtime helpers (e.g. `@tsrx/react/runtime/iterable`).
		// By default vite externalizes node_modules in an SSR build, but @tsrx/react
		// is only installed under the news/react app — NOT resolvable from this
		// suite's dist/ at runtime — so bundle its runtime IN. (react / react-dom /
		// solid-js / @solidjs/web / octane stay external or are handled by each
		// app's own config; those ARE resolvable from this package's deps.) Merges
		// (concatenates) with each app's own ssr.noExternal; harmless where unused.
		ssr: { noExternal: ['@tsrx/react'] },
	});
}

if (!noBuild) {
	console.error('building SSR bundles (production)…');
	try {
		for (const size of CARD_COUNTS) {
			gen(size);
			for (const target of NEWS_TARGETS) {
				console.error(`  → news-${size}/${target}`);
				await buildSsr(path.join(NEWS, target), path.join(DIST, `news-${size}`, target));
			}
		}
	} finally {
		gen(50); // restore the tracked count-50 dataset whatever happened above
	}
}

// ── timing / stats helpers ────────────────────────────────────────────────────

const hr = () => process.hrtime.bigint();

function summarize(samples) {
	const stat = summarizeSamples(samples);
	return {
		...stat,
		opsPerSec: 1000 / stat.score,
	};
}

// Force every renderer's returned body into the same observable state. Node's
// HTTP writers must determine the byte length/encoding before sending a string,
// so this includes real response work while avoiding framework-specific rope
// laziness in the comparison. Batch configs return arrays of render results.
function materializeRenderOutput(result) {
	if (Array.isArray(result)) {
		for (let i = 0; i < result.length; i++) materializeRenderOutput(result[i]);
		return;
	}
	if (result != null && typeof result.body === 'string') Buffer.byteLength(result.body);
}

// Warm up (≥3 runs, ~10% of the budget), then sample fn() latencies until the
// budget elapses. All numbers are milliseconds.
async function timeLoop(fn) {
	const wEnd = hr() + BigInt(Math.round(Math.max(0.2, SECONDS * 0.1) * 1e9));
	let w = 0;
	while (w < 3 || hr() < wEnd) {
		materializeRenderOutput(await fn());
		w++;
	}
	const samples = [];
	const end = hr() + BigInt(Math.round(SECONDS * 1e9));
	do {
		const t0 = hr();
		materializeRenderOutput(await fn());
		samples.push(Number(hr() - t0) / 1e6);
	} while (hr() < end && samples.length < 200_000);
	return summarize(samples);
}

// RSS/heapUsed growth over a fixed render count (NO forced gc — this measures
// how the allocator behaves under sustained SSR load, not a leak proof).
async function memGrowth(fn, renders) {
	const before = process.memoryUsage();
	const end = hr() + BigInt(MEM_TIME_CAP_MS) * 1_000_000n;
	let done = 0;
	while (done < renders && hr() < end) {
		materializeRenderOutput(await fn());
		done++;
	}
	const after = process.memoryUsage();
	return {
		memRenders: done,
		rssGrowthBytes: after.rss - before.rss,
		heapUsedGrowthBytes: after.heapUsed - before.heapUsed,
	};
}

const countMatches = (s, re) => (s.match(re) || []).length;
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
const escapeHtml = (v) =>
	String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bodyMeta(body) {
	return {
		bodyBytes: Buffer.byteLength(body),
		hydrationMarkerPairs: countMatches(body, /<!--\[/g),
	};
}

const modCache = new Map();
async function loadEntry(entryPath) {
	if (!modCache.has(entryPath)) {
		if (!fs.existsSync(entryPath)) {
			throw new Error(`missing build output ${entryPath} (run without --no-build first)`);
		}
		modCache.set(entryPath, await import(pathToFileURL(entryPath).href));
	}
	return modCache.get(entryPath);
}

// ── config table ──────────────────────────────────────────────────────────────
// Each config: { name, group, entry, fn(mod) → per-render async fn,
//                verify(mod) → meta (throws on gate failure), batch? }.

const configs = [];

for (const size of CARD_COUNTS) {
	for (const target of NEWS_TARGETS) {
		configs.push({
			name: `news-${size}/${target}`,
			group: `news-${size}`,
			entry: path.join(DIST, `news-${size}`, target, 'entry-server.js'),
			fn: (mod) => () => mod.renderApp(),
			verify: async (mod) => {
				const { body } = await mod.renderApp();
				const cards = countMatches(body, /<article[\s>]/g);
				if (cards !== size) throw new Error(`expected ${size} article cards, got ${cards}`);
				return bodyMeta(body);
			},
		});
	}
}

// ── run ───────────────────────────────────────────────────────────────────────

const selected = CONFIG_FILTER
	? configs.filter((c) => CONFIG_FILTER.some((f) => c.name.includes(f)))
	: configs;
if (selected.length === 0) {
	console.error(`✗ CONFIGS="${process.env.CONFIGS}" matched nothing`);
	process.exit(1);
}

const results = [];
const failures = [];
for (const cfg of selected) {
	console.error(`running ${cfg.name} (${SECONDS}s timed + ≤${MEM_RENDERS} memory renders)…`);
	try {
		const mod = await loadEntry(cfg.entry);
		const meta = await cfg.verify(mod);
		const fn = cfg.fn(mod);
		const stats = await timeLoop(fn);
		const mem = await memGrowth(fn, cfg.batch ? Math.ceil(MEM_RENDERS / cfg.batch) : MEM_RENDERS);
		if (cfg.batch) {
			mem.memRenders *= cfg.batch;
			// stats time whole batches; surface the effective per-render throughput.
			meta.rendersPerSec = stats.opsPerSec * cfg.batch;
		}
		results.push({ name: cfg.name, group: cfg.group, stats, meta: { ...meta, ...mem } });
	} catch (err) {
		failures.push(`${cfg.name}: ${err.message}`);
		console.error(`  ✗ ${err.message}`);
	}
}

// ── report ────────────────────────────────────────────────────────────────────

const f2 = (n) => n.toFixed(2).padStart(9);
const f3 = (n) => n.toFixed(3).padStart(9);
const kb = (n) => (n / 1024).toFixed(0).padStart(8);
console.log(
	`\nssr-throughput — Node SSR ops/sec + latency (${SECONDS}s/config, production builds)`,
);
console.log(
	'\nconfig                     |   ops/sec |  score ms |    p95 ms |    p99 ms |    min ms | samples',
);
console.log(
	'---------------------------+-----------+-----------+-----------+-----------+-----------+--------',
);
for (const r of results) {
	const s = r.stats;
	console.log(
		`${r.name.padEnd(26)} |${f2(s.opsPerSec)} |${f3(s.score)} |${f3(s.p95)} |${f3(s.p99)} |${f3(s.min)} | ${String(s.samples).padStart(6)}`,
	);
}

console.log(
	'\nconfig                     |  body KB | markers | mem renders |  rss Δ KB | heap Δ KB',
);
console.log(
	'---------------------------+----------+---------+-------------+-----------+----------',
);
for (const r of results) {
	const m = r.meta;
	console.log(
		`${r.name.padEnd(26)} |${kb(m.bodyBytes)} | ${String(m.hydrationMarkerPairs).padStart(7)} | ${String(m.memRenders).padStart(11)} |${kb(m.rssGrowthBytes).padStart(10)} |${kb(m.heapUsedGrowthBytes).padStart(9)}`,
	);
}

for (const r of results) {
	if (r.meta.htmlFactoryCalls === undefined) continue;
	console.log(
		`${r.name}: ${r.meta.htmlFactoryCalls} server HTML factory calls ` +
			`(budget ${r.meta.htmlFactoryCallBudget}; untimed, complete response unchanged)`,
	);
}

const byName = new Map(results.map((r) => [r.name, r]));
const ratio = (a, b) => scoreOf(byName.get(a).stats) / scoreOf(byName.get(b).stats);
const have = (...names) => names.every((n) => byName.has(n));

for (const size of CARD_COUNTS) {
	const base = `news-${size}/octane-tsrx`;
	if (!byName.has(base)) continue;
	console.log(`\nnews-${size} ratios vs ${base} (score; >1 means slower than octane):`);
	for (const target of NEWS_TARGETS.slice(1)) {
		const other = `news-${size}/${target}`;
		if (!byName.has(other)) continue;
		const x = ratio(other, base);
		console.log(`  ${target.padEnd(12)} ${x.toFixed(2)}x octane's render time`);
	}
}
if (failures.length > 0) {
	console.error(`\n✗ benchmark gate failures:\n  - ${failures.join('\n  - ')}`);
}

// ── BENCH_JSON contract ───────────────────────────────────────────────────────
if (process.env.BENCH_JSON) {
	const out = {
		suite: 'ssr-throughput',
		// This suite is time-budgeted, not iteration-counted: `iterations` carries
		// the per-config seconds budget; each op reports its own sample count.
		iterations: SECONDS,
		targets: results.map((r) => ({
			name: r.name,
			ops: { render: timingStatForJson(r.stats, { p99: true }) },
			meta: r.meta,
		})),
	};
	if (failures.length > 0) out.failed = failures.join('; ');
	fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(out, null, '\t') + '\n');
	console.error(`\nBENCH_JSON written → ${process.env.BENCH_JSON}`);
}

process.exit(failures.length > 0 ? 1 : 0);
