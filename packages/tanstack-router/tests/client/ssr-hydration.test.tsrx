import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'ripple';
import { createControlledPromise } from '@ripple-ts/tanstack-router';
import { hydrateRouter, hydrate } from '@ripple-ts/tanstack-router/ssr/client';
import { makeSsrRouter } from '../fixtures/consumer/router.tsrx';
import * as server from '../fixtures/consumer/dist/server/index.js';
import { waitFor } from '../harness.js';

const disposers: (() => void)[] = [];
afterEach(() => {
	while (disposers.length) disposers.pop()!();
	delete window.$_TSR;
	delete (window as any).$R;
	delete (window as any).__RIPPLE_B__;
	delete (window as any).__RIPPLE_S__;
	document.head.innerHTML = '';
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

function executeScripts(root: ParentNode) {
	for (const script of [...root.querySelectorAll('script')]) {
		if (script.src || script.type && !['text/javascript', 'module'].includes(script.type)) continue;
		Object.defineProperty(document, 'currentScript', { configurable: true, value: script });
		try {
			window.eval(script.textContent!);
		} finally {
			delete (document as any).currentScript;
		}
	}
}
function loadDocument(html: string) {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	document.head.innerHTML = doc.head.innerHTML;
	document.body.innerHTML = doc.body.innerHTML;
	executeScripts(document);
	return document.getElementById('app')!;
}
function receiveChunk(html: string) {
	const container = document.createElement('div');
	container.innerHTML = html;
	const scripts = [...container.querySelectorAll('script')];
	document.body.append(...container.childNodes);
	for (const script of scripts) {
		if (script.type && script.type !== 'text/javascript') continue;
		Object.defineProperty(document, 'currentScript', { configurable: true, value: script });
		try {
			window.eval(script.textContent!);
		} finally {
			delete (document as any).currentScript;
		}
	}
}
async function response(options: any = {}, stream = false, signal?: AbortSignal) {
	return server.createRequestHandler({
		request: new Request(`http://localhost${options.path ?? '/'}`, { signal }),
		createRouter: () => server.makeSsrRouter(options),
	})(stream ? server.renderRouterToStream : server.renderRouterToString);
}

for (const stream of [false, true]) {
	describe(stream ? 'streamed hydration' : 'buffered hydration', () => {
		it(
			'preserves server nodes and data, installs one listener, updates assets, and navigates',
			async () => {
				const target = loadDocument(await (await response({}, stream)).text());
				const heading = target.querySelector('h1');
				const title = document.querySelector('title');
				const onLoad = vi.fn();
				const router = makeSsrRouter({ value: 'client must not load', onLoad });
				disposers.push(await hydrateRouter({ router, target }));
				flushSync();
				expect(target.querySelector('h1')).toBe(heading);
				expect(heading?.textContent).toBe('server');
				expect(document.querySelector('title')).toBe(title);
				expect(document.querySelectorAll('title')).toHaveLength(1);
				expect(onLoad).not.toHaveBeenCalled();
				expect(router.history.subscribers.size).toBe(1);
				expect(target.textContent).toContain('Client ready');
				expect(target.textContent).not.toContain('Server fallback');
				target.querySelector('button')!.click();
				flushSync();
				expect(target.textContent).toContain('Count: 1');
				await router.navigate({ to: '/next' });
				expect(target.textContent).toContain('Next page');
				expect(target.textContent).toContain('Count: 1');
				expect(document.title).toBe('Next title');
				expect(document.querySelectorAll('#route-data')).toHaveLength(1);
				expect(document.getElementById('route-data')!.textContent).toBe('{"page":"next"}');
				disposers.pop()!();
				expect(router.history.subscribers.size).toBe(0);
				expect(document.querySelectorAll('[data-ripple-router-asset]')).toHaveLength(0);
			},
		);

		it.each(['/error', '/not-found', '/missing'])(
			'hydrates terminal %s without loading it again',
			async (path) => {
				const target = loadDocument(await (await response({ path }, stream)).text());
				const router = makeSsrRouter({ path });
				const load = vi.spyOn(router, 'load');
				const text = target.textContent;
				disposers.push(await hydrateRouter({ router, target }));
				flushSync();
				expect(target.textContent).toBe(text);
				expect(load).not.toHaveBeenCalled();
				await router.navigate({ to: '/next' });
				expect(target.textContent).toContain('Next page');
			},
		);

		it('hydrates a data-only handoff without refetching its transported data', async () => {
			const target = loadDocument(await (await response({ ssr: 'data-only' }, stream)).text());
			expect(target.textContent).toContain('Pending home');
			const onLoad = vi.fn();
			const router = makeSsrRouter({ ssr: 'data-only', onLoad, value: 'client' });
			disposers.push(await hydrateRouter({ router, target }));
			await waitFor(() => expect(target.querySelector('h1')?.textContent).toBe('server'));
			expect(onLoad).not.toHaveBeenCalled();
		});
	});
}

it.each(['before', 'after', 'navigate'])(
	'handles late chunks %s hydration, including superseded UI',
	async (arrival) => {
		const deferred = createControlledPromise<string>();
		const res = await response({ deferred }, true);
		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		const target = loadDocument(decoder.decode((await reader.read()).value));
		expect(target.textContent).toContain('Waiting for data');
		const router = makeSsrRouter({
			onLoad: () => {
				throw new Error('duplicate loader');
			},
		});
		if (arrival !== 'before') disposers.push(await hydrateRouter({ router, target }));
		if (arrival === 'navigate') await router.navigate({ to: '/next' });
		deferred.resolve('Deferred ready');
		for (;;) {
			const chunk = await reader.read();
			if (chunk.done) break;
			receiveChunk(decoder.decode(chunk.value));
		}
		if (arrival === 'before') disposers.push(await hydrateRouter({ router, target }));
		await waitFor(
			() => expect(target.textContent).toContain(
				arrival === 'navigate' ? 'Next page' : 'Deferred ready',
			),
		);
		if (arrival === 'navigate') expect(target.textContent).not.toContain('Deferred ready');
		expect(window.$_TSR).toBeUndefined();
	},
);

it(
	'signals transport cleanup without hiding a hydration failure and scopes the promise per router',
	async () => {
		loadDocument(await (await response()).text());
		const cleanup = vi.spyOn(window.$_TSR!, 'h');
		const failure = new Error('restore failed');
		const router = makeSsrRouter({
			hydrate: () => {
				throw failure;
			},
		});
		await expect(hydrate(router)).rejects.toBe(failure);
		expect(cleanup).toHaveBeenCalledTimes(1);
		loadDocument(await (await response({ value: 'second request' })).text());
		const second = makeSsrRouter();
		await hydrate(second);
		expect(second.state.matches[1].loaderData.value).toBe('second request');
	},
);

it('navigation during asynchronous state restoration supersedes hydration', async () => {
	loadDocument(await (await response()).text());
	const gate = createControlledPromise<void>();
	const router = makeSsrRouter({ hydrate: () => gate });
	const pending = hydrate(router);
	await router.navigate({ to: '/next' });
	gate.resolve();
	await pending;
	expect(router.state.location.pathname).toBe('/next');
	expect(router.state.matches.at(-1)!.routeId).toBe('/next');
});

it.each(['error', 'notFound'])(
	'hydrates capped %s boundaries without rendering their descendants',
	async (outcome) => {
		for (const boundary of ['root', 'parent']) {
			const path = '/parent/child';
			const target = loadDocument(await (await response({ path, boundary, outcome })).text());
			const element = target.querySelector('[data-boundary]');
			const onLoad = vi.fn();
			const router = makeSsrRouter({ path, boundary, outcome, onLoad });
			const dispose = await hydrateRouter({ router, target });
			flushSync();
			expect(target.querySelector('[data-boundary]')).toBe(element);
			expect(target.textContent).not.toContain('Boundary pending');
			expect(onLoad).not.toHaveBeenCalled();
			dispose();
		}
	},
);

it('recovers an explicit /404 payload at a missing browser URL', async () => {
	const target = loadDocument(await (await response({ path: '/404' })).text());
	const router = makeSsrRouter({ path: '/missing' });
	disposers.push(await hydrateRouter({ router, target }));
	await waitFor(() => expect(router.state.resolvedLocation?.pathname).toBe('/missing'));
	expect(target.textContent).toContain('Missing page');
	expect(router.state.matches).toHaveLength(1);
	expect(router.state.matches[0]._notFound).toBe(true);
});

it('preloads a lazy component before hydration without refetching the loader', async () => {
	const serverImport = vi.fn();
	const target = loadDocument(
		await (await response({ lazy: true, onImport: serverImport })).text(),
	);
	const onImport = vi.fn();
	const onLoad = vi.fn();
	const heading = target.querySelector('h1');
	const router = makeSsrRouter({ lazy: true, onImport, onLoad });
	disposers.push(await hydrateRouter({ router, target }));
	flushSync();
	expect(target.querySelector('h1')).toBe(heading);
	expect(serverImport).toHaveBeenCalledTimes(1);
	expect(onImport).toHaveBeenCalledTimes(1);
	expect(onLoad).not.toHaveBeenCalled();
});

it('retains anchors while applying the browser hash, including a delayed boundary', async () => {
	const deferred = createControlledPromise<string>();
	const res = await response({ deferred }, true);
	const reader = res.body!.getReader();
	const decoder = new TextDecoder();
	const target = loadDocument(decoder.decode((await reader.read()).value));
	const anchor = target.querySelector('[data-hash]');
	expect(anchor).not.toHaveAttribute('aria-current');
	const router = makeSsrRouter({ path: '/#section' });
	disposers.push(await hydrateRouter({ router, target }));
	flushSync();
	expect(target.querySelector('[data-hash]')).toBe(anchor);
	expect(anchor).toHaveAttribute('aria-current', 'page');
	deferred.resolve('ready');
	for (;;) {
		const chunk = await reader.read();
		if (chunk.done) break;
		receiveChunk(decoder.decode(chunk.value));
	}
	flushSync();
	await waitFor(
		() => expect(target.querySelector('[data-late-hash]')).toHaveAttribute('aria-current', 'page'),
	);
});

it.each(['before', 'after'])(
	'hydrates a late async error %s the error chunk arrives and can navigate away',
	async (arrival) => {
		const deferred = createControlledPromise<string>();
		const res = await response({ deferred }, true);
		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		const target = loadDocument(decoder.decode((await reader.read()).value));
		const router = makeSsrRouter();
		if (arrival === 'before') disposers.push(await hydrateRouter({ router, target }));
		deferred.reject(new Error('deferred boom'));
		for (;;) {
			const chunk = await reader.read();
			if (chunk.done) break;
			receiveChunk(decoder.decode(chunk.value));
		}
		if (arrival === 'after') disposers.push(await hydrateRouter({ router, target }));
		await waitFor(() => expect(target.querySelector('[role="alert"]')).not.toBeNull());
		expect(target.textContent).toMatch(/deferred boom|An error occurred during async rendering/);
		expect(target.textContent).not.toContain('Waiting for data');
		await router.navigate({ to: '/next' });
		expect(target.textContent).toContain('Next page');
	},
);
