// Run with the workspace's existing browser-test dependencies:
// pnpm --filter ripple exec node tests/browser/activity.js
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import buildFixtures from '../hydration/build-components.js';
import { render } from 'ripple/server';
import { ripple } from '@ripple-ts/vite-plugin';
import { chromium } from 'playwright';
import { build } from 'vite';

buildFixtures();
const { App } = await import('../hydration/compiled/server/activity-browser.js');
// Generated fixtures use the runtime symbol; the public API declares its type-only brand.
const { body } = await render(
	/** @type {import('ripple').Component} */ (/** @type {unknown} */ (App)),
);
const directory = await mkdtemp(join(tmpdir(), 'ripple-activity-'));
const entry = join(directory, 'entry.js');
await writeFile(
	entry,
	`
import { hydrate } from ${JSON.stringify(fileURLToPath(new URL('../../src/runtime/index-client.js', import.meta.url)))};
import { App } from ${JSON.stringify(fileURLToPath(new URL('../hydration/compiled/client/activity-browser.js', import.meta.url)))};
window.activityTrace = [];
let task = 0;
window.recordActivity = (kind, index) => window.activityTrace.push({ kind, index, task, time: performance.now() });
const nativeTimer = window.setTimeout.bind(window);
if (location.search === '?fallback') Object.defineProperty(window, 'scheduler', { value: undefined });
if (window.scheduler?.postTask) {
  const postTask = scheduler.postTask.bind(scheduler);
  scheduler.postTask = (fn, options) => postTask(() => { task++; recordActivity('task'); return fn(); }, options);
} else {
  window.setTimeout = (fn, delay, ...args) => nativeTimer(() => { task++; recordActivity('task'); fn(...args); }, delay);
}
requestAnimationFrame(function frame() {
  recordActivity('frame');
  if (activityTrace.filter(x => x.kind === 'initialize').length < 12) requestAnimationFrame(frame);
});
hydrate(App, { target: document.getElementById('app') });
recordActivity('root-complete');
`,
);
await build({
	configFile: false,
	plugins: [ripple({ excludeRippleExternalModules: true })],
	build: {
		outDir: join(directory, 'dist'),
		lib: { entry, formats: ['es'], fileName: () => 'client.js' },
	},
});
const script = await readFile(join(directory, 'dist/client.js'));
// Hydration support must be removed from client-only builds of Activity.
await writeFile(entry, (await readFile(entry, 'utf8')).replaceAll('hydrate', 'mount'));
const clientOnly = await build({
	configFile: false,
	plugins: [ripple({ excludeRippleExternalModules: true, ssr: false })],
	build: { write: false, lib: { entry, formats: ['es'], fileName: () => 'client.js' } },
});
const modules = (Array.isArray(clientOnly) ? clientOnly : [clientOnly]).flatMap((result) => {
	assert('output' in result);
	return result.output.flatMap((chunk) =>
		chunk.type === 'chunk'
			? Object.entries(chunk.modules)
					.filter(([, info]) => info.renderedLength > 0)
					.map(([id]) => id)
			: [],
	);
});
assert(
	!modules.some((id) => /\/(deferred|hydrate)\.js$/.test(id)),
	'client-only builds exclude deferred hydration',
);

const server = createServer((request, response) => {
	if (request.url === '/client.js')
		response.setHeader('Content-Type', 'text/javascript').end(script);
	else
		response
			.setHeader('Content-Type', 'text/html')
			.end(
				`<!doctype html><div id="app">${body}</div><script type="module" src="/client.js"></script>`,
			);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
const address = server.address();
assert(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
const results = [];
try {
	for (const mode of ['native', 'fallback']) {
		const page = await browser.newPage();
		/** @type {string[]} */
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.goto(`${origin}/${mode === 'fallback' ? '?fallback' : ''}`);
		await page.waitForFunction(
			() => window.activityTrace?.filter((x) => x.kind === 'initialize').length === 12,
		);
		const trace = await page.evaluate(() => window.activityTrace);
		const boundaries = trace.filter((x) => x.kind === 'initialize');
		const last = boundaries.at(-1);
		assert(last);
		assert.equal(new Set(boundaries.map((x) => x.task)).size, 12);
		assert(
			trace.findIndex((x) => x.kind === 'root-complete') <
				trace.findIndex((x) => x.kind === 'initialize'),
		);
		assert(
			trace.some((x) => x.kind === 'input' && x.time > boundaries[0].time && x.time < last.time),
		);
		assert(!trace.some((x) => x.kind === 'effect'));
		assert.deepEqual(errors, []);
		results.push({ mode, browser: browser.version(), trace });
		await page.close();
	}
	const report = process.env.ACTIVITY_TRACE ?? join(tmpdir(), 'ripple-activity-trace.json');
	await writeFile(report, JSON.stringify(results, null, 2));
	console.log(`Activity task traces passed: ${report}`);
} finally {
	await browser.close();
	await new Promise((resolve) => server.close(resolve));
	await rm(directory, { recursive: true, force: true });
}
