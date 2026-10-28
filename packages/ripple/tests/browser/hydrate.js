// pnpm --filter ripple exec node tests/browser/hydrate.js
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { compile } from '@tsrx/ripple';
import { render, getCss } from 'ripple/server';
import { ripple } from '@ripple-ts/vite-plugin';
import { chromium } from 'playwright';
import { build } from 'vite';

const directory = await mkdtemp(join(tmpdir(), 'ripple-hydrate-'));
const entry = join(directory, 'entry.js');
const runtime = fileURLToPath(new URL('../../src/runtime/index-client.js', import.meta.url));
const fixture = fileURLToPath(
	new URL('../hydration/components/hydrate-browser.tsrx', import.meta.url),
);
const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url)).replace(/\/$/, '');
// Use the same compiler filename as Vite so CSS and async hashes match.
let serverCode = compile(await readFile(fixture, 'utf8'), fixture.replace(projectRoot, ''), {
	mode: 'server',
}).code;
for (const [specifier, path] of [
	['ripple/internal/server', '../../src/runtime/internal/server/index.js'],
	['ripple/hydration', '../../src/runtime/hydration.js'],
	['ripple', '../../src/runtime/index-server.js'],
]) {
	serverCode = serverCode.replaceAll(
		"'" + specifier + "'",
		JSON.stringify(new URL(path, import.meta.url).href),
	);
}
await writeFile(join(directory, 'server.mjs'), serverCode);
const { App } = await import(pathToFileURL(join(directory, 'server.mjs')).href);
const { body, css } = await render(App);

const source = `
import { hydrate, flushSync } from ${JSON.stringify(runtime)};
import { App } from ${JSON.stringify(fixture)};
window.hydrateTrace = [];
window.flushHydrate = flushSync;
if (location.search.includes('fallback')) Object.defineProperty(window, 'requestIdleCallback', { value: undefined });
window.runHydrate = () => {
  const start = performance.now();
  window.disposeHydrate = hydrate(App, { target: document.getElementById('app') });
  hydrateTrace.push({ kind: 'root', name: '', time: performance.now(), duration: performance.now() - start });
};
`;
await writeFile(entry, source);
const output = await build({
	configFile: false,
	root: projectRoot,
	plugins: [ripple({ excludeRippleExternalModules: true })],
	build: {
		write: false,
		minify: true,
		lib: { entry, formats: ['es'], fileName: () => 'client.js' },
	},
});
const chunks = (Array.isArray(output) ? output : [output]).flatMap((result) => {
	assert('output' in result);
	return result.output;
});
const scriptChunk = chunks.find((chunk) => chunk.type === 'chunk');
assert(scriptChunk);
const script = scriptChunk.code;
const styles = chunks
	.flatMap((chunk) =>
		chunk.type === 'asset' && chunk.fileName.endsWith('.css') ? [chunk.source] : [],
	)
	.join('\n');
assert(styles.length > 0, 'Vite extracts CSS from deferred children');
/**
 * @param {Awaited<ReturnType<typeof build>>} result
 */
const modules = (result) =>
	(Array.isArray(result) ? result : [result]).flatMap((result) => {
		assert('output' in result);
		return result.output.flatMap((chunk) =>
			chunk.type === 'chunk'
				? Object.entries(chunk.modules)
						.filter(([, info]) => info.renderedLength > 0)
						.map(([id]) => id)
				: [],
		);
	});
/**
 * @param {string} id
 */
const hydrationModule = (id) =>
	/\/(?:deferred|hydrate|hydrate-boundary|hydration-intent|hydration-strategies)\.js$/.test(id);
await writeFile(
	entry,
	source
		.replaceAll('hydrate(App', 'mount(App')
		.replace('{ hydrate, flushSync }', '{ mount, flushSync }'),
);
const clientOnly = await build({
	configFile: false,
	root: projectRoot,
	plugins: [ripple({ excludeRippleExternalModules: true, ssr: false })],
	build: { write: false, minify: true, lib: { entry, formats: ['es'] } },
});
assert(
	!modules(clientOnly).some(hydrationModule),
	'client-only builds omit all deferred hydration modules',
);
// An app that never uses Hydrate must not ship its strategies/intent handling.
await writeFile(
	entry,
	`import { hydrate } from ${JSON.stringify(runtime)}; hydrate(() => 'plain', { target: document.body });`,
);
const unused = await build({
	configFile: false,
	root: projectRoot,
	plugins: [ripple({ excludeRippleExternalModules: true })],
	build: { write: false, minify: true, lib: { entry, formats: ['es'] } },
});
assert(
	!modules(unused).some((id) =>
		/\/(?:hydrate-boundary|hydrate-component|hydration-intent|hydration-strategies)\.js$/.test(id),
	),
	'unused Hydrate is tree-shaken',
);

const server = createServer((request, response) => {
	if (request.url === '/client.js')
		response.setHeader('Content-Type', 'text/javascript').end(script);
	else if (request.url === '/styles.css')
		response.setHeader('Content-Type', 'text/css').end(styles);
	else
		response
			.setHeader('Content-Type', 'text/html')
			.end(
				`<!doctype html><head><style data-ripple-ssr>${getCss(css)}</style><link rel="stylesheet" href="/styles.css"></head><body><div id="app">${body}</div><script type="module" src="/client.js"></script></body>`,
			);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
const address = server.address();
assert(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
const results = [];
try {
	for (const mode of ['native', 'fallback', 'eager']) {
		const page = await browser.newPage({ viewport: { width: 800, height: 700 } });
		/** @type {string[]} */
		const errors = [];
		/** @type {string[]} */
		const requests = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('request', (request) => {
			if (request.resourceType() === 'script') requests.push(request.url());
		});
		await page.goto(`${origin}/?${mode}`);
		await page.waitForFunction(() => window.runHydrate !== undefined);
		// Native editing before application hydration must survive activation.
		await page.locator('#draft').fill('edited before hydration');
		assert.equal(
			await page.locator('#static').evaluate((node) => getComputedStyle(node).color),
			'rgb(17, 34, 51)',
		);
		await page.evaluate(() => window.runHydrate());
		await page.waitForFunction(() =>
			hydrateTrace.some((x) => x.kind === 'init' && x.name === 'idle'),
		);
		if (mode === 'eager')
			await page.waitForFunction(
				() => hydrateTrace.filter((x) => x.kind === 'row').length === 2500,
			);
		const initial = await page.evaluate(() => hydrateTrace.filter((x) => x.kind === 'row').length);
		assert.equal(initial, mode === 'eager' ? 2500 : 0);
		assert.equal(
			await page.locator('#large li').count(),
			2500,
			'SSR content is visible before initialization',
		);
		assert.equal(
			await page.evaluate(() =>
				hydrateTrace.some(
					(x) =>
						x.name === 'visible' ||
						x.name === 'media' ||
						x.name === 'actions' ||
						x.name === 'never',
				),
			),
			false,
		);
		await page.locator('#checkbox').click();
		await page.waitForFunction(() => document.querySelector('#checked')?.textContent === 'true');
		assert.equal(await page.locator('#checkbox').isChecked(), true);
		assert.equal(await page.locator('#draft-value').textContent(), 'edited before hydration');
		assert.equal(
			await page.evaluate(() => hydrateTrace.filter((x) => x.name === 'change').length),
			1,
		);
		assert.equal(
			await page.evaluate(() => hydrateTrace.filter((x) => x.name === 'capture').length),
			1,
		);
		await page.locator('#button').click();
		assert.equal(
			await page.evaluate(() => hydrateTrace.filter((x) => x.name === 'click').length),
			1,
		);
		const parents = await page.evaluate(
			() => hydrateTrace.filter((x) => x.name === 'parent').length,
		);
		await page.locator('#stop').click();
		assert.equal(
			await page.evaluate(() => hydrateTrace.filter((x) => x.name === 'parent').length),
			parents,
		);
		await page.locator('#submit').click();
		assert.equal(
			await page.evaluate(() => hydrateTrace.filter((x) => x.name === 'submit').length),
			1,
		);
		await page.locator('#cancel-link').click();
		assert(!page.url().includes('#cancelled'));
		await page.locator('#key').press('K');
		assert.equal(
			await page.evaluate(
				() => hydrateTrace.filter((x) => x.kind === 'key' && x.name === 'K').length,
			),
			1,
		);
		await page.locator('#focus').focus();
		assert.equal(
			await page.evaluate(
				() => hydrateTrace.filter((x) => x.kind === 'event' && x.name === 'focus').length,
			),
			1,
		);
		await page.locator('#enter').hover();
		assert.equal(
			await page.evaluate(
				() => hydrateTrace.filter((x) => x.kind === 'event' && x.name === 'enter').length,
			),
			1,
		);
		await page.setViewportSize({ width: 1300, height: 700 });
		await page.waitForFunction(() =>
			hydrateTrace.some((x) => x.kind === 'init' && x.name === 'media'),
		);
		await page.locator('#visible-tail').scrollIntoViewIfNeeded();
		await page.waitForFunction(() =>
			hydrateTrace.some((x) => x.kind === 'init' && x.name === 'visible'),
		);
		await page.locator('#link').click();
		await page.waitForURL('**#destination');
		assert.equal(
			await page.evaluate(
				() => hydrateTrace.filter((x) => x.kind === 'event' && x.name === 'link').length,
			),
			1,
		);
		assert.equal(
			await page.locator('#static').evaluate((node) => getComputedStyle(node).color),
			'rgb(17, 34, 51)',
		);
		assert.equal(await page.evaluate(() => hydrateTrace.some((x) => x.name === 'never')), false);
		await page.evaluate(() => {
			openLarge();
			flushHydrate();
		});
		await page.waitForFunction(() => hydrateTrace.filter((x) => x.kind === 'row').length === 2500);
		await page.evaluate(() => {
			disposeHydrate();
			flushHydrate();
		});
		assert.equal(await page.locator('#app').textContent(), '');
		assert.deepEqual(errors, []);
		assert.equal(
			requests.length,
			1,
			'deferred hydration does not defer downloading child JavaScript',
		);
		const trace = await page.evaluate(() => hydrateTrace);
		const root = trace.find((x) => x.kind === 'root');
		assert(root);
		results.push({
			mode,
			browser: browser.version(),
			initialRows: initial,
			scriptRequests: requests.length,
			rootDuration: root.duration,
			scriptBytes: Buffer.byteLength(script),
			scriptGzipBytes: gzipSync(script).length,
		});
		await page.close();
	}
	// These controls must also work when they are the very first intent,
	// before checkbox activation has installed any child handlers.
	for (const id of /** @type {const} */ (['button', 'link', 'cancel-link', 'submit', 'stop'])) {
		const page = await browser.newPage({ viewport: { width: 800, height: 700 } });
		/** @type {string[]} */
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.goto(`${origin}/?first-${id}`);
		await page.waitForFunction(() => window.runHydrate !== undefined);
		await page.evaluate(() => window.runHydrate());
		await page.locator('#' + id).click();
		const event = {
			button: 'click',
			link: 'link',
			'cancel-link': 'cancel',
			submit: 'submit',
			stop: 'stop',
		}[id];
		assert.equal(
			await page.evaluate(
				(name) => hydrateTrace.filter((x) => x.kind === 'event' && x.name === name).length,
				event,
			),
			1,
		);
		if (id === 'link') await page.waitForURL('**#destination');
		if (id === 'cancel-link') assert(!page.url().includes('#cancelled'));
		if (id === 'stop')
			assert.equal(
				await page.evaluate(() => hydrateTrace.filter((x) => x.name === 'parent').length),
				0,
			);
		assert.deepEqual(errors, []);
		await page.close();
	}
	const report = process.env.HYDRATE_TRACE ?? join(tmpdir(), 'ripple-hydrate-trace.json');
	await writeFile(report, JSON.stringify(results, null, 2));
	console.log(`Hydrate browser checks passed: ${report}`);
} finally {
	await browser.close();
	await new Promise((resolve) => server.close(resolve));
	await rm(directory, { recursive: true, force: true });
}
