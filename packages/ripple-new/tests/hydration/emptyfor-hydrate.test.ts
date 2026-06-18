import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { FeedOrEmpty, WithEmpty } from './_fixtures/emptyfor.tsrx';

// SSR Phase 6 — empty @for hydration edge cases (Bugbot):
//  - zero items + NO @empty: the cursor must advance past the empty range so a
//    trailing component still adopts correctly.
//  - zero items + @empty: the @empty content must be adopted in place.

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/emptyfor.tsrx');

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'emptyfor.tsrx', { mode: 'server' });
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

describe('hydrate — empty @for (SSR Phase 6, Bugbot fixes)', () => {
	it('zero items + no @empty: trailing component after the empty @for still adopts', async () => {
		const { body } = await ServerRT.render(server.FeedOrEmpty, { items: [] });
		container.innerHTML = body;
		expect(container.querySelectorAll('p.row').length).toBe(0);
		const tail = container.querySelector('#tail') as HTMLButtonElement;
		expect(tail).not.toBeNull();

		const root = hydrate(FeedOrEmpty, container, { items: [] });
		flushSync(() => {});

		// The trailing component adopted (same button) despite the empty @for before it.
		expect(container.querySelector('#tail')).toBe(tail);
		flushSync(() => tail.click());
		expect(tail.textContent).toBe('tail:1');
		root.unmount();
	});

	it('zero items + @empty: the @empty content is adopted (same element, single instance)', async () => {
		const { body } = await ServerRT.render(server.WithEmpty, { items: [] });
		container.innerHTML = body;
		const empty = container.querySelector('li.empty') as HTMLElement;
		expect(empty.textContent).toBe('No items yet');

		const root = hydrate(WithEmpty, container, { items: [] });
		flushSync(() => {});

		expect(container.querySelectorAll('li.empty').length).toBe(1); // not duplicated
		expect(container.querySelector('li.empty')).toBe(empty); // adopted, not rebuilt
		expect((container.querySelector('li.empty') as HTMLElement).textContent).toBe('No items yet');
		root.unmount();
	});

	it('non-empty: items + trailing component both adopt (sanity)', async () => {
		const items = [
			{ id: 1, name: 'A' },
			{ id: 2, name: 'B' },
		];
		const { body } = await ServerRT.render(server.FeedOrEmpty, { items });
		container.innerHTML = body;
		const rows = [...container.querySelectorAll('p.row')];
		const tail = container.querySelector('#tail') as HTMLButtonElement;

		const root = hydrate(FeedOrEmpty, container, { items });
		flushSync(() => {});

		expect([...container.querySelectorAll('p.row')]).toEqual(rows);
		expect(container.querySelector('#tail')).toBe(tail);
		flushSync(() => tail.click());
		expect(tail.textContent).toBe('tail:1');
		root.unmount();
	});
});
