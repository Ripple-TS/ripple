// News-site SSR + hydration benchmark harness.
//
//   - SSR render time: times renderApp() (server → HTML string) in Node, warm.
//   - Hydration time:  times window.__hydrate() in a real (headless) browser on
//                      a fresh page whose #app already holds the server DOM.
//
// Run:  node benchmarks/news/run.mjs [iterations]   (default 20, +5 warmup)
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createServer as createHttp } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, 'ripple-new');
const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = 5;
const PORT = 5191;

const vite = await createServer({ root: APP, server: { middlewareMode: true }, appType: 'custom' });

// Serve `/` with the server-rendered body spliced in (client hydration is
// deferred behind window.__hydrate, so the page loads un-hydrated).
vite.middlewares.use(async (req, res, next) => {
	if ((req.url || '/').split('?')[0] !== '/') return next();
	try {
		const raw = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
		const template = await vite.transformIndexHtml(req.url, raw);
		const { renderApp } = await vite.ssrLoadModule('/src/entry-server.ts');
		const { head, body, css } = await renderApp();
		res.setHeader('Content-Type', 'text/html');
		res.end(template.replace('<!--ssr-head-->', head + css).replace('<!--ssr-body-->', body));
	} catch (err) {
		vite.ssrFixStacktrace?.(err);
		res.statusCode = 500;
		res.end(err.stack);
	}
});
const httpServer = createHttp(vite.middlewares).listen(PORT);

const summarize = (samples) => {
	const s = [...samples].sort((a, b) => a - b);
	return {
		median: s[s.length >> 1],
		min: s[0],
		p95: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))],
	};
};

// ── 1. SSR render time (Node, warm) ──────────────────────────────────────────
const { renderApp } = await vite.ssrLoadModule('/src/entry-server.ts');
let htmlBytes = 0;
const ssrSamples = [];
for (let i = 0; i < WARMUP + ITER; i++) {
	const t0 = performance.now();
	const { body } = await renderApp();
	const dt = performance.now() - t0;
	if (i === WARMUP) htmlBytes = Buffer.byteLength(body);
	if (i >= WARMUP) ssrSamples.push(dt);
}

// ── 2. Hydration time (headless browser, fresh page per sample) ───────────────
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const hydrateSamples = [];
for (let i = 0; i < WARMUP + ITER; i++) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 });
	const dt = await page.evaluate(async () => {
		const t0 = performance.now();
		window.__hydrate();
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => setTimeout(r, 0));
		return performance.now() - t0;
	});
	if (i >= WARMUP) hydrateSamples.push(dt);
	await ctx.close();
}

// ── 3. Correctness: no mismatch + interactive after hydration ─────────────────
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
const beforeHTML = await page.evaluate(() => document.getElementById('app').innerHTML);
const check = await page.evaluate(async () => {
	const root = document.getElementById('app');
	const before = root.innerHTML;
	window.__hydrate();
	await new Promise((r) => requestAnimationFrame(r));
	const cards = root.querySelectorAll('article.card').length;
	const noRebuild = root.innerHTML === before; // hydration adopted, didn't rebuild
	const cls0 = root.querySelector('header.masthead').className;
	root.querySelector('#theme').click();
	const cls1 = root.querySelector('header.masthead').className;
	return { cards, noRebuild, toggled: cls0 !== cls1 };
});
await ctx.close();
await browser.close();
await new Promise((r) => httpServer.close(r));
await vite.close();

const ssr = summarize(ssrSamples);
const hyd = summarize(hydrateSamples);
const f = (n) => n.toFixed(2).padStart(7);
console.log(`\nThe Ripple Times — SSR + hydration bench  (ripple-new)`);
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
