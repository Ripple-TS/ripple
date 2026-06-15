import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
// CLIENT-compiled components (normal .tsrx import path). Importing AsyncCounter
// (which has an onClick) makes this module register click delegation at load.
import { AsyncLeaf, AsyncCounter, AsyncUndef } from '../_fixtures/ssr-suspense.tsrx';

// SSR Phase 4 — client hydration seeds the server-resolved use(thenable) values
// from the inline data <script>, so a hydrating use() returns synchronously
// instead of re-suspending (and the adopted DOM is not rebuilt).

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/_fixtures/ssr-suspense.tsrx');

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'ssr-suspense.tsrx', { mode: 'server' });
	code = code.replace(
		/import\s*\{([^}]*)\}\s*from\s*['"]ripple-new\/server['"];?/g,
		'const {$1} = __rt;',
	);
	code = code.replace(/export const (\w+) =/g, 'const $1 = __exports.$1 =');
	const fn = new Function('__rt', '__exports', code + '\nreturn __exports;');
	return fn(ServerRT, {});
}
const server = serverModule();

let container: HTMLElement;
beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});
afterEach(() => container.remove());

describe('hydrate — Suspense data seeding (SSR Phase 4)', () => {
	it('seeds the server value so use(promise) returns synchronously (no re-suspend, no rebuild)', async () => {
		const { body } = await ServerRT.render(server.AsyncLeaf, { promise: Promise.resolve('hello') });
		expect(body).toBe(
			'<div id="leaf">hello</div>' +
				'<script type="application/json" data-ripple-new-suspense>["hello"]</script>',
		);

		container.innerHTML = body;
		const div = container.querySelector('#leaf') as HTMLElement;
		const textNode = div.firstChild; // the server text node — must be adopted

		const root = hydrate(AsyncLeaf, container, { promise: Promise.resolve('hello') });
		flushSync(() => {}); // drain (there should be no re-suspend / scheduled work)

		// Boundary did not re-suspend or rebuild: same element + text node adopted.
		expect(container.querySelector('#leaf')).toBe(div);
		expect(div.firstChild).toBe(textNode);
		expect(div.textContent).toBe('hello');
		// The seed <script> was consumed and removed from the live DOM.
		expect(container.querySelector('script[data-ripple-new-suspense]')).toBeNull();
		root.unmount();
	});

	it('round-trips an undefined-resolving use() as undefined, not null', async () => {
		const { body } = await ServerRT.render(server.AsyncUndef, {
			promise: Promise.resolve(undefined),
		});
		// Server saw `undefined` and the seed encodes it via the sentinel — NOT
		// `[null]` (which a naive JSON.stringify of `[undefined]` would produce).
		expect(body).toContain('<div id="undef">is-undefined</div>');
		expect(body).toContain('__ripple_new_undefined__');
		expect(body).not.toContain('>[null]<');

		container.innerHTML = body;
		const div = container.querySelector('#undef') as HTMLElement;
		const root = hydrate(AsyncUndef, container, { promise: Promise.resolve(undefined) });
		flushSync(() => {});

		// The seeded value hydrated as `undefined` (not `null`): same discriminant,
		// adopted (not rebuilt), seed script consumed.
		expect(container.querySelector('#undef')).toBe(div);
		expect(div.textContent).toBe('is-undefined');
		expect(container.querySelector('script[data-ripple-new-suspense]')).toBeNull();
		root.unmount();
	});

	it('reads the seed value, not the client promise (server is the source of truth)', async () => {
		// Server resolved to 'server-value'; hand the client a DIFFERENT promise.
		// The seeded value must win — the client must not re-fetch / re-suspend.
		const { body } = await ServerRT.render(server.AsyncLeaf, {
			promise: Promise.resolve('server-value'),
		});
		container.innerHTML = body;
		const div = container.querySelector('#leaf') as HTMLElement;

		const root = hydrate(AsyncLeaf, container, { promise: Promise.resolve('client-value') });
		flushSync(() => {});

		expect(div.textContent).toBe('server-value');
		root.unmount();
	});

	it('composes seeded use() with a stateful, interactive counter (the example app shape)', async () => {
		const { body } = await ServerRT.render(server.AsyncCounter, {
			promise: Promise.resolve('Hi'),
		});
		expect(body).toBe(
			'<main id="ac"><h1>Hi</h1><button id="ac-btn">count:0</button></main>' +
				'<script type="application/json" data-ripple-new-suspense>["Hi"]</script>',
		);

		container.innerHTML = body;
		const before = container.querySelector('#ac')!.outerHTML;
		const root = hydrate(AsyncCounter, container, { promise: Promise.resolve('Hi') });
		flushSync(() => {});
		// No mismatch: the #ac subtree is unchanged after hydrate.
		expect(container.querySelector('#ac')!.outerHTML).toBe(before);

		// Click → re-render. The counter updates AND the seeded use() does not
		// re-suspend (the greeting stays put, no fallback / blank).
		const btn = container.querySelector('#ac-btn') as HTMLButtonElement;
		flushSync(() => btn.click());
		expect(container.querySelector('#ac-btn')!.textContent).toBe('count:1');
		expect(container.querySelector('#ac h1')!.textContent).toBe('Hi');
		root.unmount();
	});
});
