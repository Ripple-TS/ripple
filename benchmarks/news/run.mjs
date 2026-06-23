// News-site SSR + hydration benchmark harness — PRODUCTION builds only.
//
// Benches must reflect production, never dev: dev mode ships unminified code and
// the frameworks' development runtimes (React/Solid dev builds carry warning +
// validation overhead). So this
// harness `vite build`s each target (client minified + an SSR bundle, with
// NODE_ENV=production) and measures the BUILT artifacts:
//
//   - SSR render time: times the built renderApp() (server → HTML string), warm.
//   - Hydration time:  times window.__hydrate() in a real (headless) browser on
//                      a fresh page whose #app already holds the server DOM, with
//                      the production client bundle loaded.
//
// Run:  node benchmarks/news/run.mjs [target] [iterations] [--no-build]
//         target ∈ {ripple, solid, react}  (default ripple)
//         --no-build  reuse the existing dist/ (skip the rebuild for fast re-runs)
//       node run.mjs 20    (back-compat: a bare number = iterations → ripple)

// Set BEFORE importing anything that resolves a framework runtime: externalized
// react-dom / @solidjs/web pick their PRODUCTION build off process.env.NODE_ENV.
process.env.NODE_ENV = 'production';

import { build } from 'vite';
import { chromium } from 'playwright';
import { createServer as createHttp } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Force a GC right before each timed sample so a surprise collection can't
// inflate it (SSR allocates an HTML string per render; hydration allocates the
// adopted tree). In Node we expose gc() via the v8 flag; in the browser the
// launch passes --js-flags=--expose-gc and the page reads window.gc.
v8.setFlagsFromString('--expose-gc');
const nodeGc = vm.runInNewContext('gc');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_PORTS = { ripple: 5194, solid: 5192, react: 5193 };
const args = process.argv.slice(2);
const noBuild = args.includes('--no-build');
const positional = args.filter((a) => !a.startsWith('--'));
let target = 'ripple';
let iterArg = positional[0];
if (positional[0] && Object.prototype.hasOwnProperty.call(TARGET_PORTS, positional[0])) {
	target = positional[0];
	iterArg = positional[1];
}
const APP = path.join(__dirname, target);
const ITER = parseInt(iterArg || '20', 10);
const WARMUP = 5;
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
	const s = [...samples].sort((a, b) => a - b);
	return {
		median: s[s.length >> 1],
		min: s[0],
		p95: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))],
	};
};

// ── 1. SSR render time (built bundle, Node, warm) ─────────────────────────────
const { renderApp } = await import(pathToFileURL(SSR_ENTRY).href);
let htmlBytes = 0;
const ssrSamples = [];
for (let i = 0; i < WARMUP + ITER; i++) {
	nodeGc();
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
const browser = await chromium.launch({
	headless: true,
	args: ['--no-sandbox', '--js-flags=--expose-gc'],
});
const hydrateSamples = [];
for (let i = 0; i < WARMUP + ITER; i++) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 });
	// Measure the SYNCHRONOUS hydration work only. All three targets commit
	// hydration synchronously inside __hydrate() (Ripple/React flushSync, Solid
	// synchronous hydrate), so this is the actual hydration
	// cost. (An earlier version awaited rAF + setTimeout inside the timer, but
	// that ~6–7 ms of frame-scheduling latency dominated and masked the signal.)
	const dt = await page.evaluate(() => {
		(window.gc || (() => {}))();
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
const check = await page.evaluate(async () => {
	const root = document.getElementById('app');
	const before = root.innerHTML;
	window.__hydrate();
	await new Promise((r) => requestAnimationFrame(r));
	const cards = root.querySelectorAll('article.card').length;
	const noRebuild = root.innerHTML === before; // hydration adopted, didn't rebuild
	const cls0 = root.querySelector('header.masthead').className;
	root.querySelector('#theme').click();
	// Let the framework's reactive update flush before reading the result:
	// Ripple commits synchronously on the discrete click, but Solid/React
	// defer the DOM update to a microtask, so a synchronous read would miss it.
	await new Promise((r) => setTimeout(r, 0));
	const cls1 = root.querySelector('header.masthead').className;
	return { cards, noRebuild, toggled: cls0 !== cls1 };
});
await ctx.close();
await browser.close();
await new Promise((r) => httpServer.close(r));

const ssr = summarize(ssrSamples);
const hyd = summarize(hydrateSamples);
const f = (n) => n.toFixed(2).padStart(7);
console.log(`\nThe Ripple Times — SSR + hydration bench  (${target}, production)`);
console.log(`document: ${check.cards} article cards, ${(htmlBytes / 1024).toFixed(1)} KB HTML\n`);
console.log(`Metric          | median |    min |    p95`);
console.log(`----------------+--------+--------+--------`);
console.log(`SSR render (ms) |${f(ssr.median)} |${f(ssr.min)} |${f(ssr.p95)}`);
console.log(`hydrate    (ms) |${f(hyd.median)} |${f(hyd.min)} |${f(hyd.p95)}`);
console.log(
	`\ncorrectness: cards=${check.cards}  no-rebuild=${check.noRebuild}  interactive=${check.toggled}`,
);
if (!check.noRebuild || !check.toggled || check.cards === 0) {
	console.error('\n✗ hydration correctness check FAILED');
	process.exit(1);
}
