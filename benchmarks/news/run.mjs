// News-site SSR + hydration benchmark harness — PRODUCTION builds only.
//
// Benches must reflect production, never dev: dev mode ships unminified code and
// the frameworks' development runtimes (React/Solid dev builds carry warning +
// validation overhead, octane dev transforms aren't optimized). So this
// harness `vite build`s each target (client minified + an SSR bundle, with
// NODE_ENV=production) and measures the BUILT artifacts:
//
//   - SSR render time: times the built renderApp() (server → HTML string), warm.
//   - Hydration time:  times window.__hydrate() in a real (headless) browser on
//                      a fresh page whose #app already holds the server DOM, with
//                      the production client bundle loaded.
//
// Run:  node benchmarks/news/run.mjs [target] [iterations] [--no-build]
//         target ∈ TARGET_PORTS below  (default octane-tsrx)
//         --no-build  reuse the existing dist/ (skip the rebuild for fast re-runs)
//       node run.mjs 20    (back-compat: a bare number = iterations → octane)

// Set BEFORE importing anything that resolves a framework runtime: externalized
// react-dom / @solidjs/web pick their PRODUCTION build off process.env.NODE_ENV.
process.env.NODE_ENV = 'production';

import { build } from 'vite';
import { chromium } from 'playwright';
import { createServer as createHttp } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { censusDomNodes } from '../lib/dom-nodes.mjs';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_PORTS = {
	'octane-tsrx': 5191,
	'octane-jsx': 5195,
	solid: 5192,
	react: 5193,
	preact: 5270,
	ripple: 5194,
	svelte: 5281,
	'vue-vapor': 5222,
	inferno: 5336,
};
const args = process.argv.slice(2);
const noBuild = args.includes('--no-build');
const positional = args.filter((a) => !a.startsWith('--'));
let target = 'octane-tsrx';
let iterArg = positional[0];
if (positional[0] && Object.prototype.hasOwnProperty.call(TARGET_PORTS, positional[0])) {
	target = positional[0];
	iterArg = positional[1];
}
const APP = path.join(__dirname, target);
const ITER = parseInt(iterArg || '20', 10);
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : 5;
const PORT = TARGET_PORTS[target];
const CLIENT_DIR = path.join(APP, 'dist/client');
const SSR_ENTRY = path.join(APP, 'dist/server/entry-server.js');

// ── 0. Production builds (client minified + SSR bundle) ───────────────────────
if (!noBuild) {
	console.log(`building ${target} (production)…`);
	// Client: index.html is the entry; minify like a real deploy.
	await build({
		root: APP,
		logLevel: 'warn',
		build: { outDir: 'dist/client', emptyOutDir: true, minify: 'esbuild' },
	});
	// SSR: the server entry as a Node-loadable bundle.
	await build({
		root: APP,
		logLevel: 'warn',
		build: { ssr: 'src/entry-server.ts', outDir: 'dist/server', emptyOutDir: true },
	});
}
if (!fs.existsSync(SSR_ENTRY) || !fs.existsSync(path.join(CLIENT_DIR, 'index.html'))) {
	console.error(`✗ missing build output for ${target} (run without --no-build first)`);
	process.exit(1);
}

const summarize = (samples) => {
	return summarizeSamples(samples);
};

// ── 1. SSR render time (built bundle, Node, warm) ─────────────────────────────
const { renderApp } = await import(pathToFileURL(SSR_ENTRY).href);
let htmlBytes = 0;
const ssrSamples = [];
for (let i = 0; i < WARMUP + ITER; i++) {
	const t0 = performance.now();
	const { body } = await renderApp();
	const dt = performance.now() - t0;
	if (i === WARMUP) htmlBytes = Buffer.byteLength(body);
	if (i >= WARMUP) ssrSamples.push(dt);
}

// ── 2. Static server: built client assets + `/` with the SSR body spliced in ──
const template = fs.readFileSync(path.join(CLIENT_DIR, 'index.html'), 'utf8');
const MIME = {
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.html': 'text/html',
	'.svg': 'image/svg+xml',
	'.json': 'application/json',
	'.ico': 'image/x-icon',
};
const httpServer = createHttp(async (req, res) => {
	const url = (req.url || '/').split('?')[0];
	if (url === '/') {
		const { head, body, css } = await renderApp();
		res.setHeader('Content-Type', 'text/html');
		res.end(template.replace('<!--ssr-head-->', head + css).replace('<!--ssr-body-->', body));
		return;
	}
	const file = path.join(CLIENT_DIR, path.normalize(url));
	if (file.startsWith(CLIENT_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
		res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
		res.end(fs.readFileSync(file));
		return;
	}
	res.statusCode = 404;
	res.end('not found');
}).listen(PORT);

// ── 3. Hydration time (headless browser, fresh page per sample) ───────────────
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const hydrateSamples = [];
for (let i = 0; i < WARMUP + ITER; i++) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 });
	// Measure the SYNCHRONOUS hydration work only. Every target's adapter commits
	// hydration inside __hydrate() (using a public flush where its scheduler needs
	// one), so this is the actual hydration
	// cost. (An earlier version awaited rAF + setTimeout inside the timer, but
	// that ~6–7 ms of frame-scheduling latency dominated and masked the signal.)
	const dt = await page.evaluate(() => {
		const t0 = performance.now();
		window.__hydrate();
		return performance.now() - t0;
	});
	if (i >= WARMUP) hydrateSamples.push(dt);
	await ctx.close();
}

// ── 4. Correctness: no mismatch + interactive after hydration ─────────────────
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
const domBeforeHydration = await page.evaluate(censusDomNodes, '#app');
const check = await page.evaluate(async () => {
	const root = document.getElementById('app');
	// Hydration consumes its suspense seed and Octane may coalesce redundant
	// protocol comments after every host/text node has been adopted. Compare the
	// semantic tree without either bookkeeping form, and separately pin a host
	// node's identity so a byte-identical rebuild cannot pass this gate.
	const stripBookkeeping = (html) =>
		html
			.replace(/<script[^>]*\bdata-octane-suspense\b[^>]*>[\s\S]*?<\/script>/g, '')
			.replace(/<!--(?:\[|\]|\[(?:[2-9]\d*|1\d+)|\](?:[2-9]\d*|1\d+))-->/g, '');
	const before = stripBookkeeping(root.innerHTML);
	const firstCard = root.querySelector('article.card');
	window.__hydrate();
	await new Promise((r) => requestAnimationFrame(r));
	const cards = root.querySelectorAll('article.card').length;
	const noRebuild =
		stripBookkeeping(root.innerHTML) === before && root.querySelector('article.card') === firstCard;
	const cls0 = root.querySelector('header.masthead').className;
	root.querySelector('#theme').click();
	// Let the framework's reactive update flush before reading the result:
	// octane commits synchronously on the discrete click, but Solid/React
	// defer the DOM update to a microtask, so a synchronous read would miss it.
	await new Promise((r) => setTimeout(r, 0));
	const cls1 = root.querySelector('header.masthead').className;
	return { cards, noRebuild, toggled: cls0 !== cls1 };
});
const domAfterHydration = await page.evaluate(censusDomNodes, '#app');
await ctx.close();
await browser.close();
await new Promise((r) => httpServer.close(r));

const ssr = summarize(ssrSamples);
const hyd = summarize(hydrateSamples);
const f = (n) => n.toFixed(2).padStart(7);
console.log(`\nThe Octane Times — SSR + hydration bench  (${target}, production)`);
console.log(`document: ${check.cards} article cards, ${(htmlBytes / 1024).toFixed(1)} KB HTML\n`);
console.log(`Metric          |  score | median |    min |    p95`);
console.log(`----------------+--------+--------+--------+--------`);
console.log(`SSR render (ms) |${f(ssr.score)} |${f(ssr.median)} |${f(ssr.min)} |${f(ssr.p95)}`);
console.log(`hydrate    (ms) |${f(hyd.score)} |${f(hyd.median)} |${f(hyd.min)} |${f(hyd.p95)}`);
console.log(
	`\ncorrectness: cards=${check.cards}  no-rebuild=${check.noRebuild}  interactive=${check.toggled}`,
);

// Machine-readable results for the unified bench runner (see the BENCH_JSON
// contract in benchmarks/README.md). This harness is per-target, so it writes a
// single-target payload; the runner loops the targets and merges them into one
// `news` suite result. On a failed correctness gate it still writes the JSON with
// a top-level `failed` field (then exits non-zero below).
if (process.env.BENCH_JSON) {
	const ok = check.noRebuild && check.toggled && check.cards > 0;
	const payload = {
		suite: 'news',
		iterations: ITER,
		targets: [
			{
				name: target,
				ops: {
					ssr_render: timingStatForJson(ssr),
					hydrate: timingStatForJson(hyd),
				},
				meta: {
					htmlBytes,
					cards: check.cards,
					domBeforeHydration,
					domAfterHydration,
				},
			},
		],
	};
	if (!ok) {
		payload.failed = `news/${target} correctness: noRebuild=${check.noRebuild} interactive=${check.toggled} cards=${check.cards}`;
	}
	fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
	console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
}

if (!check.noRebuild || !check.toggled || check.cards === 0) {
	console.error('\n✗ hydration correctness check FAILED');
	process.exit(1);
}
