import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync, drainPassiveEffects } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
// CLIENT-compiled variants (the normal .tsrx import path, client mode). The
// onClick handler in Counter makes this module call delegateEvents(['click']) at
// load, so click delegation is registered for hydrated containers.
import { StaticText, Attrs, Mixed, Counter, StoreView } from './_fixtures/leaf.tsrx';

// SSR Phase 2 — client hydration. Server-render a fixture to HTML, put it in a
// container, hydrate with the CLIENT component, and assert (1) the DOM is NOT
// rebuilt (innerHTML unchanged → no mismatch) and (2) interactivity works.

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/leaf.tsrx');

// Eval the SERVER-compiled fixture module with the server runtime injected
// (same trick as ssr.test.ts) to get the server component functions.
function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'leaf.tsrx', { mode: 'server' });
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

// Server-render `name` with `props`, place it in the container, hydrate with the
// client `clientComp`, and return the before/after innerHTML for mismatch checks.
async function setup(name: string, clientComp: any, props?: any) {
	const { body } = await ServerRT.render(server[name], props);
	container.innerHTML = body;
	const before = container.innerHTML;
	const root = hydrate(clientComp, container, props);
	flushSync(() => {}); // drain any (there should be none) scheduled work
	return { body, before, after: container.innerHTML, root };
}

describe('hydrate — no mismatch (DOM adopted, not rebuilt)', () => {
	it('static text', async () => {
		const { body, before, after } = await setup('StaticText', StaticText);
		expect(body).toBe('<div class="greet">Hello, world</div>');
		expect(after).toBe(before); // hydration did not touch the DOM
	});

	it('dynamic attributes + text', async () => {
		const { body, before, after } = await setup('Attrs', Attrs, { id: 'a', cls: 'c', text: 'hi' });
		expect(body).toBe('<div id="a" class="c" data-kind="leaf">hi</div>');
		expect(after).toBe(before);
	});

	it('nested elements with text children', async () => {
		const { body, before, after } = await setup('Mixed', Mixed);
		expect(body).toBe('<div id="m"><span class="a">A</span><span class="b">B</span></div>');
		expect(after).toBe(before);
	});

	it('adopts the exact server text node (no new node created)', async () => {
		await setup('StaticText', StaticText);
		const div = container.querySelector('.greet') as HTMLElement;
		expect(div.childNodes.length).toBe(1);
		expect(div.firstChild!.nodeType).toBe(3); // a single text node, adopted
	});
});

describe('hydrate — interactivity', () => {
	it('attaches event handlers to adopted nodes and updates on click', async () => {
		const { before, after } = await setup('Counter', Counter, { start: 5 });
		expect(before).toBe('<button id="btn">5</button>'); // server initial
		expect(after).toBe(before); // no mismatch on hydrate

		const btn = container.querySelector('#btn') as HTMLButtonElement;
		const node = btn.firstChild; // adopted text node — must survive the update
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('6');
		expect(btn.firstChild).toBe(node); // updated in place, not recreated
	});

	it('preserves adopted element identity across hydration', async () => {
		const { root } = await setup('Counter', Counter, { start: 0 });
		const btn = container.querySelector('#btn');
		flushSync(() => (btn as HTMLButtonElement).click());
		// Same button element instance — it was adopted, never replaced.
		expect(container.querySelector('#btn')).toBe(btn);
		root.unmount();
	});
});

describe('hydrate — useSyncExternalStore', () => {
	it('reads getServerSnapshot during hydration, then syncs to getSnapshot', async () => {
		const store = {
			subscribe: () => () => {},
			getSnapshot: () => 'client',
			getServerSnapshot: () => 'server',
		};
		// Server rendered the SERVER snapshot.
		const { body } = await ServerRT.render(server.StoreView, { store });
		expect(body).toBe('<span id="sv">server</span>');

		container.innerHTML = body;
		const before = container.innerHTML;
		const root = hydrate(StoreView, container, { store });
		// First hydrated read matches the server snapshot → no mismatch.
		expect(container.innerHTML).toBe(before);
		expect((container.querySelector('#sv') as HTMLElement).textContent).toBe('server');

		// After commit, the store hook syncs to the client snapshot.
		flushSync(() => {});
		drainPassiveEffects();
		flushSync(() => {});
		expect((container.querySelector('#sv') as HTMLElement).textContent).toBe('client');
		root.unmount();
	});
});
