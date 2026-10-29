// pnpm --filter ripple exec node tests/browser/view-transition.js
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium, firefox, webkit } from 'playwright';
import { build } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';
import { render } from 'ripple/server';
import buildFixtures from '../hydration/build-components.js';

buildFixtures();
const { App, ManyPlain, ManyWrapped, Gallery, Detail, ActivityApp, InnerActivityApp } =
	await import('../hydration/compiled/server/view-transition-browser.js');
const { body, head } = await render(
	/** @type {import('ripple').Component} */ (/** @type {unknown} */ (App)),
);
const plainHTML = (await render(/** @type {any} */ (ManyPlain))).body;
const wrappedHTML = (await render(/** @type {any} */ (ManyWrapped))).body;
assert.equal(wrappedHTML, plainHTML, '500 boundaries add zero SSR bytes/markers');
const galleryHTML = (await render(/** @type {any} */ (Gallery))).body;
const detailHTML = (await render(/** @type {any} */ (Detail))).body;
const activityHTML = (await render(/** @type {any} */ (ActivityApp))).body;
const innerActivityHTML = (await render(/** @type {any} */ (InnerActivityApp))).body;
const directory = await mkdtemp(join(tmpdir(), 'ripple-view-transition-'));
const entry = join(directory, 'entry.js');
const runtime = fileURLToPath(new URL('../../src/runtime/index-client.js', import.meta.url));
const fixture = fileURLToPath(
	new URL('../hydration/components/view-transition-browser.tsrx', import.meta.url),
);
await writeFile(
	entry,
	`
import { hydrate, mount } from ${JSON.stringify(runtime)};
import * as fixture from ${JSON.stringify(fixture)};
const initial = [...document.querySelectorAll('#app *')];
let starts = 0;
let lastTransition;
const native = document.startViewTransition?.bind(document);
if (location.search === '?unsupported') document.startViewTransition = undefined;
else if (native) document.startViewTransition = (...args) => { starts++; return lastTransition = native(...args); };
const begin = performance.now();
const component = location.pathname === '/document-a' ? fixture.Gallery : location.pathname === '/document-b' ? fixture.Detail : location.search === '?activity-inner' ? fixture.InnerActivityApp : location.search === '?activity' ? fixture.ActivityApp : location.search === '?bench=plain' ? fixture.ManyPlain : location.search === '?bench=wrapped' ? fixture.ManyWrapped : fixture.App;
const dispose = location.search === '?async' ? mount(fixture.AsyncApp, { target: document.getElementById('app') }) : hydrate(component, { target: document.getElementById('app') });
window.vtTest = { fixture, dispose, initial, hydration: performance.now() - begin, starts: () => starts, finished: () => lastTransition?.finished ?? Promise.resolve() };
`,
);
const result = await build({
	configFile: false,
	logLevel: 'warn',
	plugins: [ripple({ excludeRippleExternalModules: true })],
	build: {
		outDir: join(directory, 'dist'),
		lib: { entry, formats: ['es'], fileName: () => 'client.js' },
	},
});
const script = await readFile(join(directory, 'dist/client.js'));
const assets = new Map(
	(Array.isArray(result) ? result : [result]).flatMap((item) => {
		assert('output' in item);
		return item.output
			.filter((chunk) => chunk.type === 'chunk')
			.map((chunk) => ['/' + chunk.fileName, chunk.code]);
	}),
);
const styles = (Array.isArray(result) ? result : [result])
	.flatMap((item) => {
		assert('output' in item);
		return item.output
			.filter((chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'))
			.map((chunk) => String(chunk.source));
	})
	.join('\n');
assert(styles.includes('view-transition-new'));

// Measure the incremental production cost and verify unused exports tree shake.
await writeFile(entry, `export { mount } from ${JSON.stringify(runtime)};`);
const baseline = await build({
	configFile: false,
	logLevel: 'warn',
	plugins: [ripple({ excludeRippleExternalModules: true, ssr: false })],
	build: { write: false, lib: { entry, formats: ['es'] } },
});
await writeFile(
	entry,
	`export { mount, ViewTransition, createViewTransition } from ${JSON.stringify(runtime)};`,
);
const enabled = await build({
	configFile: false,
	logLevel: 'warn',
	plugins: [ripple({ excludeRippleExternalModules: true, ssr: false })],
	build: { write: false, lib: { entry, formats: ['es'] } },
});
/** @param {Awaited<ReturnType<typeof build>>} output */
function bundle(output) {
	const results = Array.isArray(output) ? output : [output];
	return results.flatMap((item) => {
		assert('output' in item);
		return item.output.filter((chunk) => chunk.type === 'chunk');
	});
}
const plain = bundle(baseline);
assert(
	!plain.some((chunk) =>
		Object.entries(chunk.modules).some(
			([id, module]) => id.endsWith('/view-transition.js') && module.renderedLength > 0,
		),
	),
);
const plainCode = plain.map((chunk) => chunk.code).join('');
const enabledCode = bundle(enabled)
	.map((chunk) => chunk.code)
	.join('');
const sizes = {
	baseline: plainCode.length,
	enabled: enabledCode.length,
	added: enabledCode.length - plainCode.length,
	addedGzip: gzipSync(enabledCode).length - gzipSync(plainCode).length,
	fixtureGzip: gzipSync(script).length,
};
const css = bundle(result).length; // Ensure a JS artifact was emitted as well as SSR CSS.
assert(css > 0);

const referenceBuild = await build({
	define: { 'process.env.NODE_ENV': '"production"' },
	configFile: false,
	logLevel: 'warn',
	build: {
		write: false,
		lib: {
			entry: fileURLToPath(new URL('../view-transition/reference/react.js', import.meta.url)),
			formats: ['es'],
		},
	},
});
const referenceScript = bundle(referenceBuild)
	.map((chunk) => chunk.code)
	.join('');

const server = createServer((request, response) => {
	if (request.url === '/client.js?delayed') {
		// Prove that incoming names work before hydration/module execution.
		setTimeout(() => response.setHeader('Content-Type', 'text/javascript').end(script), 700);
	} else if (request.url === '/document-a' || request.url === '/document-b') {
		const detail = request.url === '/document-b';
		response.setHeader('Content-Type', 'text/html')
			.end(`<!doctype html><html><head><link rel="stylesheet" href="/client.css"><style>
@view-transition { navigation: auto; }
#photo { width: ${detail ? 400 : 100}px; height: ${detail ? 300 : 80}px; background: teal; color:white; }
</style><script>
window.crossDocument = { supported:false, ready:false, finished:false, hydrated:false, pseudos:[] };
addEventListener('pagereveal', event => {
  if (!event.viewTransition) return;
  const state = window.crossDocument = { supported:true, ready:false, finished:false, hydrated:false, pseudos:[] };
  event.viewTransition.ready.then(() => {
    state.ready = true; state.hydrated = !!window.vtTest;
    state.pseudos = document.documentElement.getAnimations({subtree:true}).map(animation => animation.effect?.pseudoElement ?? null);
  }, error => { state.error = String(error); });
  event.viewTransition.finished.then(() => { state.finished = true; });
});
</script></head><body><div id="app">${detail ? detailHTML : galleryHTML}</div><script type="module" src="/client.js${detail ? '?delayed' : ''}"></script></body></html>`);
	} else if (request.url === '/reference.js')
		response.setHeader('Content-Type', 'text/javascript').end(referenceScript);
	else if (request.url === '/reference' || request.url === '/reference-async')
		response.setHeader('Content-Type', 'text/html').end(`<!doctype html><div id="app"></div><script>
window.reactTransitions = [];
const start = document.startViewTransition?.bind(document);
if (start) document.startViewTransition = (...args) => { const transition = start(...args); reactTransitions.push(transition); return transition; };
</script><script type="module" src="/reference.js"></script>`);
	else if (request.url === '/client.css')
		response.setHeader('Content-Type', 'text/css').end(styles);
	else if (assets.has(request.url ?? ''))
		response.setHeader('Content-Type', 'text/javascript').end(assets.get(request.url ?? ''));
	else
		response
			.setHeader('Content-Type', 'text/html')
			.end(
				`<!doctype html><html><head>${head}<link rel="stylesheet" href="/client.css"></head><body><div id="app">${request.url?.includes('bench=') ? plainHTML : request.url === '/?activity-inner' ? innerActivityHTML : request.url === '/?activity' ? activityHTML : body}</div><script type="module" src="/client.js"></script></body></html>`,
			);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
const address = server.address();
assert(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
const reports = [];
try {
	for (const engine of [chromium, firefox, webkit]) {
		const browser = await engine.launch();
		try {
			const page = await browser.newPage();
			/** @type {string[]} */ const errors = [];
			page.on('pageerror', (error) => {
				errors.push(error.message);
				console.error(error);
			});
			page.on('console', (message) => {
				if (message.type() === 'error') console.error(message.text());
			});
			await page.goto(origin);
			await page.waitForFunction(() => !!window.vtTest);
			const support = await page.evaluate(() => ({
				native: typeof document.startViewTransition === 'function',
				classes: CSS.supports('view-transition-class', 'test'),
				types: CSS.supports('selector(:active-view-transition-type(test))'),
			}));
			assert.equal(await page.evaluate(() => window.vtTest.starts()), 0);
			assert(
				await page.evaluate(() => window.vtTest.initial.every((element) => element.isConnected)),
			);
			await page.locator('#focus').fill('edited');
			await page.locator('#focus').focus();
			const timing = [];
			for (const action of ['update', 'share', 'exit', 'enter', 'reorder']) {
				const observation = await page.evaluate(async (action) => {
					const start = performance.now();
					const handle = window.vtTest.fixture.run(action);
					const rendered = await handle.rendered;
					const renderTime = performance.now() - start;
					const ready = await handle.ready;
					const readyTime = performance.now() - start;
					const events = [...window.vtTest.fixture.events];
					const animations = document.documentElement
						.getAnimations({ subtree: true })
						.map((animation) => ({
							pseudo: /** @type {KeyframeEffect} */ (animation.effect)?.pseudoElement,
							duration: animation.effect?.getTiming().duration,
						}));
					await handle.finished;
					return {
						rendered,
						ready,
						renderTime,
						readyTime,
						finishTime: performance.now() - start,
						events,
						animations,
					};
				}, action);
				assert(observation.rendered);
				if (support.native) {
					assert(observation.ready, `${engine.name()} ${action} snapshots`);
					assert(observation.events.some((event) => event.kind === action));
					assert(
						observation.animations.some((animation) =>
							animation.pseudo?.startsWith('::view-transition-'),
						),
						`${engine.name()} native pseudo-element animations`,
					);
					if (support.classes && ['enter', 'exit', 'share'].includes(action)) {
						const event = observation.events.filter((event) => event.kind === action).at(-1);
						assert.equal(
							event?.duration,
							action === 'share' ? '0.14s' : '0.12s',
							`${engine.name()} class-based scoped CSS`,
						);
					}
				}
				timing.push({ action, ...observation });
				assert.equal(
					await page.locator('[style*="view-transition"][style*="!important"]').count(),
					0,
				);
			}
			assert.equal(await page.locator('#focus').inputValue(), 'edited');
			assert.equal(await page.evaluate(() => document.activeElement?.id), 'focus');
			await page.locator('#increment').focus();
			await page.keyboard.press('Enter');
			assert.equal(await page.locator('output').textContent(), '2');
			assert.equal(await page.evaluate(() => window.vtTest.starts()), support.native ? 5 : 0);
			// Skip, interruption and repeated animation: all callbacks release and
			// the live tree/listeners remain stable. Durations are descriptive only.
			const cdp = engine === chromium ? await page.context().newCDPSession(page) : null;
			await cdp?.send('HeapProfiler.collectGarbage');
			const heapBefore = await cdp?.send('Runtime.getHeapUsage');
			const domBefore = await cdp?.send('Memory.getDOMCounters');
			const lifetime = await page.evaluate(async () => {
				const nodeCount = document.querySelectorAll('*').length;
				const begin = performance.now();
				for (let i = 0; i < 20; i++) {
					const handle = window.vtTest.fixture.run('update');
					await handle.ready;
					if (i % 2 === 0) handle.skipTransition();
					else if (i % 3 === 0)
						document.documentElement
							.getAnimations({ subtree: true })
							.forEach((animation) => animation.cancel());
					await handle.finished;
				}
				const first = window.vtTest.fixture.run('update');
				await first.ready;
				const second = window.vtTest.fixture.run('update');
				await Promise.all([first.finished, second.finished]);
				return {
					elapsed: performance.now() - begin,
					before: nodeCount,
					after: document.querySelectorAll('*').length,
					callbacks: window.vtTest.fixture.events.length,
					cleanups: window.vtTest.fixture.cleanups.length,
				};
			});
			assert.equal(lifetime.before, lifetime.after);
			assert.equal(lifetime.callbacks, lifetime.cleanups);
			await cdp?.send('HeapProfiler.collectGarbage');
			const heapAfter = await cdp?.send('Runtime.getHeapUsage');
			const domAfter = await cdp?.send('Memory.getDOMCounters');
			const memory = { heapBefore, heapAfter, domBefore, domAfter };
			await cdp?.detach();
			await page.emulateMedia({ reducedMotion: 'reduce' });
			assert.equal(
				await page.evaluate(async () => {
					const handle = window.vtTest.fixture.run('update');
					await handle.finished;
					return handle.ready;
				}),
				false,
			);
			await page.goto(origin + '?unsupported');
			await page.waitForFunction(() => !!window.vtTest);
			assert.equal(
				await page.evaluate(async () => {
					const handle = window.vtTest.fixture.run('share');
					await handle.finished;
					return handle.ready;
				}),
				false,
			);
			assert.equal(await page.locator('#photo').textContent(), 'detail');
			// Run the same basic scenarios against an isolated, pinned React build.
			// Compare observable events/state/identity, never compiler markup.
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.goto(origin + '/reference');
			await page.waitForFunction(() => !!window.reactReference);
			assert.equal(await page.evaluate(() => window.reactTransitions.length), 0);
			const input = await page.locator('#focus').elementHandle();
			await page.locator('#focus').fill('edited');
			const reference = [];
			if (support.native) {
				for (const [index, action] of ['update', 'share', 'exit', 'enter'].entries()) {
					await page.evaluate((action) => window.reactReference.run(action), action);
					await page.waitForFunction(
						(count) => window.reactTransitions.length === count,
						index + 1,
					);
					await page.evaluate(() => window.reactTransitions.at(-1)?.finished);
					const events = await page.evaluate(() => window.reactReference.events);
					const expected = timing[index].events
						.filter((event) => event.kind !== 'reorder')
						.map(({ kind, name }) => ({ kind, name }));
					assert.deepEqual(events, expected, `${engine.name()} React/Ripple ${action} event order`);
					reference.push({ action, events });
				}
				assert.equal(await page.locator('output').textContent(), '1');
				assert.equal(await page.locator('#photo').textContent(), 'detail');
				assert.equal(await page.locator('#notice').textContent(), 'Saved');
				assert(await input?.evaluate((element) => element === document.querySelector('#focus')));
				assert.equal(await page.locator('#focus').inputValue(), 'edited');
			}
			await page.goto(origin + '?async');
			await page.waitForFunction(() => !!window.vtTest && !!document.getElementById('skeleton'));
			assert.equal(await page.evaluate(() => window.vtTest.starts()), 0);
			await page.evaluate(() => window.vtTest.fixture.resolveAsync());
			await page.locator('#async-result').waitFor({ state: 'visible' });
			await page.evaluate(() => window.vtTest.finished());
			assert.equal(await page.locator('#async-result').textContent(), 'loaded content');
			assert.equal(await page.locator('#skeleton').count(), 0);
			const reveal = await page.evaluate(() => window.vtTest.fixture.events);
			if (support.native) {
				assert.equal(await page.evaluate(() => window.vtTest.starts()), 1);
				assert.deepEqual(
					reveal.map(({ kind, name, types }) => ({ kind, name, types })),
					[{ kind: 'reveal', name: 'async-content', types: [] }],
				);
				if (support.classes) assert.equal(reveal[0].duration, '0.1s');
				await page.goto(origin + '/reference-async');
				await page.waitForFunction(
					() => !!window.reactReference && !!document.getElementById('skeleton'),
				);
				await page.evaluate(() => window.reactReference.resolveAsync());
				await page.waitForFunction(() => window.reactTransitions.length > 0);
				await page.evaluate(() => window.reactTransitions.at(-1)?.finished);
				assert.equal(await page.locator('#async-result').textContent(), 'loaded content');
				assert.deepEqual(await page.evaluate(() => window.reactReference.events), [
					{ kind: 'reveal', name: 'async-content' },
				]);
			}
			const activity = [];
			for (const query of ['?activity', '?activity-inner']) {
				await page.goto(origin + query);
				await page.waitForFunction(() => !!window.vtTest);
				const activityInput = await page.locator('#activity-input').elementHandle();
				await page.locator('#activity-input').fill('retained draft');
				await page.locator('#activity-count').click();
				for (const mode of /** @type {const} */ (['hidden', 'visible'])) {
					const ready = await page.evaluate(async (mode) => {
						const handle = window.vtTest.fixture.runActivity(mode);
						const ready = await handle.ready;
						await handle.finished;
						return ready;
					}, mode);
					assert.equal(ready, support.native);
					assert.equal(await page.locator('#activity-count').isVisible(), mode === 'visible');
				}
				assert(
					await activityInput?.evaluate(
						(element) => element === document.querySelector('#activity-input'),
					),
				);
				assert.equal(await page.locator('#activity-input').inputValue(), 'retained draft');
				assert.equal(await page.locator('#activity-count').textContent(), '1');
				const events = await page.evaluate(() =>
					window.vtTest.fixture.events.map((event) => event.kind),
				);
				assert.deepEqual(events, support.native ? ['exit', 'enter'] : []);

				activity.push({ query, events });
			}

			await page.goto(origin + '/document-a');
			await page.waitForFunction(() => !!window.vtTest);
			await page.locator('#next').click();
			await page.waitForURL(origin + '/document-b');
			await page.waitForFunction(() => !!window.vtTest);
			assert.equal(await page.locator('#photo').textContent(), 'large photo');
			const crossDocument = await page.evaluate(() => window.crossDocument);
			if (engine === chromium || engine === webkit)
				assert(crossDocument.supported, `${engine.name()} cross-document API`);
			if (crossDocument.supported) {
				assert.equal(crossDocument.error, undefined);
				assert(crossDocument.ready);
				assert.equal(
					crossDocument.hydrated,
					false,
					'incoming snapshot uses SSR names before hydration',
				);
				assert(crossDocument.pseudos.includes('::view-transition-old(photo)'));
				assert(crossDocument.pseudos.includes('::view-transition-new(photo)'));
			}
			assert.equal(
				await page.evaluate(() => window.vtTest.starts()),
				0,
				'navigation does not call the same-document API',
			);
			await page.goBack();
			await page.waitForURL(origin + '/document-a');
			assert.equal(await page.locator('#photo').textContent(), 'thumbnail');
			if (crossDocument.supported) {
				await page.waitForFunction(() => window.crossDocument.finished);
				assert.equal(await page.evaluate(() => window.crossDocument.error), undefined);
			}

			const hydration = [];
			for (let sample = 0; sample < 5; sample++) {
				for (const variant of ['plain', 'wrapped']) {
					await page.goto(origin + '?bench=' + variant);
					await page.waitForFunction(() => !!window.vtTest);
					const observation = await page.evaluate(() => {
						const walker = document.createTreeWalker(
							/** @type {HTMLElement} */ (document.getElementById('app')),
							NodeFilter.SHOW_ALL,
						);
						let nodes = 0;
						while (walker.nextNode()) nodes++;
						return {
							time: window.vtTest.hydration,
							nodes,
							preserved: window.vtTest.initial.every((element) => element.isConnected),
						};
					});
					assert(observation.preserved);
					hydration.push({ variant, ...observation });
				}
			}
			assert.equal(new Set(hydration.map((entry) => entry.nodes)).size, 1);
			assert.deepEqual(errors, []);
			reports.push({
				engine: engine.name(),
				version: browser.version(),
				support,
				timing,
				lifetime,
				reference,
				reveal,
				activity,
				crossDocument,
				memory,
				hydration,
			});
			await page.close();
		} finally {
			await browser.close();
		}
	}
	const report =
		process.env.VIEW_TRANSITION_TRACE ?? join(tmpdir(), 'ripple-view-transition-trace.json');
	await writeFile(report, JSON.stringify({ sizes, reports }, null, 2));
	console.log(`ViewTransition browser tests passed: ${report}`);
} finally {
	await new Promise((resolve) => server.close(resolve));
	await rm(directory, { recursive: true, force: true });
}
