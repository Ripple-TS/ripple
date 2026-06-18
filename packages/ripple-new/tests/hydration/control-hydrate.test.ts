import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { Toggle, Pick } from './_fixtures/control.tsrx';

// SSR Phase 6 (M3) — @if / @switch hydration: the client adopts the server's
// taken-branch range (the branch element instance is reused, not rebuilt) and
// the branch is interactive afterward.

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/control.tsrx');

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'control.tsrx', { mode: 'server' });
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

describe('hydrate — @if (SSR Phase 6 / M3)', () => {
	it('adopts the taken branch (same element) and it stays interactive', async () => {
		const { body } = await ServerRT.render(server.Toggle, { on: true });
		expect(body).toContain('<button id="hit" class="on">on:0</button>');

		container.innerHTML = body;
		const btn = container.querySelector('#hit') as HTMLButtonElement;
		const root = hydrate(Toggle, container, { on: true });
		flushSync(() => {});

		// The server branch element was ADOPTED (same instance), not rebuilt.
		expect(container.querySelector('#hit')).toBe(btn);
		// And its handler is live.
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('on:1');
		root.unmount();
	});

	it('adopts the @else branch when the condition is false', async () => {
		const { body } = await ServerRT.render(server.Toggle, { on: false });
		expect(body).toContain('<span class="off">off</span>');
		container.innerHTML = body;
		const off = container.querySelector('.off') as HTMLElement;
		const root = hydrate(Toggle, container, { on: false });
		flushSync(() => {});
		expect(container.querySelector('.off')).toBe(off); // adopted
		root.unmount();
	});
});

describe('hydrate — @switch (SSR Phase 6 / M3)', () => {
	it('adopts the matched case branch', async () => {
		const { body } = await ServerRT.render(server.Pick, { k: 'b' });
		expect(body).toContain('<span class="b">BBB</span>');
		container.innerHTML = body;
		const span = container.querySelector('.b') as HTMLElement;
		const root = hydrate(Pick, container, { k: 'b' });
		flushSync(() => {});
		expect(container.querySelector('.b')).toBe(span); // adopted, not rebuilt
		expect((container.querySelector('.b') as HTMLElement).textContent).toBe('BBB');
		root.unmount();
	});
});
