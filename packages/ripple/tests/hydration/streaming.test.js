import { describe, it, expect } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/streaming.js';
import * as ClientComponents from './compiled/client/streaming.js';

/**
 * Executes bare inline `<script>` tags from streamed HTML the way a browser
 * would while parsing (the swap runtime in the shell, `__RIPPLE_S__(n)` calls
 * in chunks). Envelope scripts carry attributes and stay inert, like in a
 * real document.
 * @param {string} html
 */
function execInlineScripts(html) {
	for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
		try {
			(0, eval)(code);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('inline script failed:', /** @type {Error} */ (error).stack);
			throw error;
		}
	}
}

function tick() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * @param {() => void} serverComponent
 * @param {{ catch?: () => void, pending?: () => void }} [serverRootBoundary]
 */
function startStream(serverComponent, serverRootBoundary) {
	ServerComponents.resetControls();
	ClientComponents.resetControls();
	delete window.__RIPPLE_B__;
	delete window.__RIPPLE_S__;

	// drop leftovers a previous test streamed into document.body
	for (const child of [...document.body.children]) {
		if (child !== container) {
			child.remove();
		}
	}

	/** @type {string[]} */
	const chunks = [];
	const sink = {
		push: (/** @type {string} */ chunk) => chunks.push(chunk),
		close() {},
		error() {},
	};
	const done = render(serverComponent, {
		stream: sink,
		...(serverRootBoundary ? { rootBoundary: serverRootBoundary } : {}),
	});
	return { chunks, done };
}

/** @param {string} shell */
function mountShell(shell) {
	container.innerHTML = shell;
	execInlineScripts(shell);
}

/** @param {string} chunk */
function receiveChunk(chunk) {
	document.body.insertAdjacentHTML('beforeend', chunk);
	execInlineScripts(chunk);
}

describe('hydration > streamed boundaries (chunk before hydration)', () => {
	it('hydrates swapped content through the normal resolved path and stays interactive', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamPending);
		ServerComponents.controls.basic.resolve('data');
		await done;

		expect(chunks).toHaveLength(2);
		mountShell(chunks[0]);
		receiveChunk(chunks[1]);

		// the swap runtime normalized the slot: no streaming markers remain
		expect(container.innerHTML).not.toContain('<!--[?');
		expect(container.querySelector('.loading')).toBeNull();
		const ssr_value = container.querySelector('.value');
		expect(ssr_value?.textContent).toBe('data:0');
		expect(container.querySelector('.after-async')?.textContent).toBe('after-async');

		hydrate(ClientComponents.StreamPending, { target: container });

		// claimed, not recreated
		expect(container.querySelector('.value')).toBe(ssr_value);

		/** @type {HTMLButtonElement} */ (container.querySelector('.inc')).click();
		flushSync();
		expect(container.querySelector('.value')?.textContent).toBe('data:1');
	});

	it('hydrates a swapped server-rendered catch branch', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamRejects);
		ServerComponents.controls.rejects.reject(new Error('boom'));
		await done;

		mountShell(chunks[0]);
		for (const chunk of chunks.slice(1)) {
			receiveChunk(chunk);
		}

		expect(container.querySelector('.loading')).toBeNull();
		const ssr_caught = container.querySelector('.caught');
		expect(ssr_caught?.textContent).toBe('boom');

		hydrate(ClientComponents.StreamRejects, { target: container });
		flushSync();

		expect(container.querySelector('.caught')).toBe(ssr_caught);
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it('routes an errored slot to the client root catch boundary', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamNoCatch);
		mountShell(chunks[0]);
		ServerComponents.controls.noCatch.reject(new Error('late failure'));
		await done;
		for (const chunk of chunks.slice(1)) {
			receiveChunk(chunk);
		}

		// the swap runtime emptied the slot and marked it errored
		expect(container.innerHTML).toContain('<!--[!');
		expect(container.querySelector('.loading')).toBeNull();

		hydrate(ClientComponents.StreamNoCatch, {
			target: container,
			rootBoundary: { catch: ClientComponents.RootCatch },
		});
		await tick();
		flushSync();

		expect(container.querySelector('.root-catch')?.textContent).toBe('late failure');
		// routing the error neutralized the errored slot markers
		expect(container.innerHTML).not.toContain('<!--[!');
	});
});

describe('hydration > streamed boundaries (chunk after hydration)', () => {
	it('hydrates the fallback, then activates the streamed chunk in place', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamPending);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamPending, { target: container });

		expect(container.querySelector('.loading')).not.toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();
		expect(container.querySelector('.before')?.textContent).toBe('before');
		expect(container.querySelector('.sibling-after')?.textContent).toBe('sibling-after');
		expect(Object.keys(window.__RIPPLE_B__ ?? {})).toHaveLength(1);

		ServerComponents.controls.basic.resolve('data');
		await done;
		receiveChunk(chunks[1]);
		flushSync();

		expect(container.querySelector('.loading')).toBeNull();
		expect(container.querySelector('.value')?.textContent).toBe('data:0');
		expect(container.querySelector('.after-async')?.textContent).toBe('after-async');
		// the trackAsync envelope from the chunk was consumed during activation
		expect(document.querySelector('script[id^="__ripple_ta_"]')).toBeNull();
		// activation retires the slot wrapper markers, matching buffered SSR
		expect(container.innerHTML).not.toContain('<!--[?');

		/** @type {HTMLButtonElement} */ (container.querySelector('.inc')).click();
		flushSync();
		expect(container.querySelector('.value')?.textContent).toBe('data:1');
	});

	it('activates a catch-only slot that streamed no fallback', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamCatchOnly);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamCatchOnly, { target: container });

		expect(container.querySelector('.before')?.textContent).toBe('before');
		expect(container.querySelector('.resolved')).toBeNull();
		expect(container.querySelector('.caught')).toBeNull();

		ServerComponents.controls.catchOnly.resolve('late body');
		await done;
		receiveChunk(chunks[1]);
		flushSync();

		expect(container.querySelector('.resolved')?.textContent).toBe('late body');
		expect(container.querySelector('.caught')).toBeNull();
		expect(container.innerHTML).not.toContain('<!--[?');
	});

	it('activates a streamed server-rendered catch branch', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamRejects);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamRejects, { target: container });
		expect(container.querySelector('.loading')).not.toBeNull();

		ServerComponents.controls.rejects.reject(new Error('boom'));
		await done;
		for (const chunk of chunks.slice(1)) {
			receiveChunk(chunk);
		}
		flushSync();

		expect(container.querySelector('.loading')).toBeNull();
		expect(container.querySelector('.caught')?.textContent).toBe('boom');
		expect(container.querySelector('.resolved')).toBeNull();
		expect(container.innerHTML).not.toContain('<!--[?');
	});

	it('routes an errored slot arriving after hydration to the client root catch', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamNoCatch);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamNoCatch, {
			target: container,
			rootBoundary: { catch: ClientComponents.RootCatch },
		});
		expect(container.querySelector('.loading')).not.toBeNull();

		ServerComponents.controls.noCatch.reject(new Error('late failure'));
		await done;
		for (const chunk of chunks.slice(1)) {
			receiveChunk(chunk);
		}
		await tick();
		flushSync();

		expect(container.querySelector('.root-catch')?.textContent).toBe('late failure');
		expect(container.querySelector('.loading')).toBeNull();
		// the errored slot markers were neutralized when the error was routed
		expect(container.innerHTML).not.toContain('<!--[?');
		expect(container.innerHTML).not.toContain('<!--[!');
	});

	it('hydrates a suspended root boundary and activates it on chunk arrival', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamRootDirect, {
			pending: ServerComponents.RootPending,
		});

		// the root slot IS the body: the shell starts with the slot marker
		expect(chunks[0]).toMatch(/^(<style[\s\S]*?<\/style>)?<!--\[\?\d+-->/);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamRootDirect, {
			target: container,
			rootBoundary: { pending: ClientComponents.RootPending },
		});

		expect(container.querySelector('.root-pending')).not.toBeNull();
		expect(container.querySelector('.root-async')).toBeNull();

		ServerComponents.controls.rootDirect.resolve('root data');
		await done;
		receiveChunk(chunks[1]);
		flushSync();

		expect(container.querySelector('.root-pending')).toBeNull();
		expect(container.querySelector('.root-async')?.textContent).toBe('root data');
		expect(container.innerHTML).not.toContain('<!--[?');
	});

	it('hydrates a root chunk that arrived before hydration through the normal path', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamRootDirect, {
			pending: ServerComponents.RootPending,
		});
		ServerComponents.controls.rootDirect.resolve('root data');
		await done;

		mountShell(chunks[0]);
		receiveChunk(chunks[1]);

		expect(container.innerHTML).not.toContain('<!--[?');
		const ssr_value = container.querySelector('.root-async');
		expect(ssr_value?.textContent).toBe('root data');

		hydrate(ClientComponents.StreamRootDirect, {
			target: container,
			rootBoundary: { pending: ClientComponents.RootPending },
		});

		expect(container.querySelector('.root-async')).toBe(ssr_value);
		expect(container.querySelector('.root-pending')).toBeNull();
	});

	it('moves streamed head content into document.head on chunk arrival', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamHead);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamHead, { target: container });
		expect(container.querySelector('.loading')).not.toBeNull();

		ServerComponents.controls.head.resolve('late');
		await done;
		receiveChunk(chunks[1]);
		flushSync();

		expect(document.title).toBe('title:late');
		expect(container.querySelector('.head-content')?.textContent).toBe('late');
		expect(document.querySelector('template[data-ripple-head]')).toBeNull();
	});

	it('activates nested boundaries chunk by chunk, parent first', async () => {
		const { chunks, done } = startStream(ServerComponents.StreamNested);
		mountShell(chunks[0]);

		hydrate(ClientComponents.StreamNested, { target: container });
		expect(container.querySelector('.outer-loading')).not.toBeNull();

		ServerComponents.controls.outer.resolve('O');
		await tick();
		expect(chunks).toHaveLength(2);
		receiveChunk(chunks[1]);
		flushSync();

		expect(container.querySelector('.outer-loading')).toBeNull();
		expect(container.querySelector('.outer')?.textContent).toBe('O');
		// the nested boundary streamed its fallback inside the parent chunk and
		// registered itself during the parent's activation
		expect(container.querySelector('.inner-loading')).not.toBeNull();

		ServerComponents.controls.inner.resolve('I');
		await done;
		expect(chunks).toHaveLength(3);
		receiveChunk(chunks[2]);
		flushSync();

		expect(container.querySelector('.inner-loading')).toBeNull();
		expect(container.querySelector('.inner')?.textContent).toBe('I');
		// both nested activations retired their slot markers
		expect(container.innerHTML).not.toContain('<!--[?');
	});
});
