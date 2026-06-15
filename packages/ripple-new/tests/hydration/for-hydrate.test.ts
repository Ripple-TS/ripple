import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { List } from './_fixtures/forlist.tsrx';

// SSR Phase 6 (M2) — a keyed @for list hydrates: the server wraps the @for and
// each item in block ranges; the client adopts them (no rebuild) and per-item
// event handlers attach to the adopted DOM.

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/forlist.tsrx');

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'forlist.tsrx', { mode: 'server' });
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

describe('hydrate — @for list (SSR Phase 6 / M2)', () => {
	it('adopts the server-rendered items (no rebuild) and per-item handlers work', async () => {
		const items = [
			{ id: 1, name: 'Alpha' },
			{ id: 2, name: 'Beta' },
			{ id: 3, name: 'Gamma' },
		];
		const onPick = vi.fn();
		const { body } = await ServerRT.render(server.List, { items, onPick: () => {} });

		container.innerHTML = body;
		const before = container.innerHTML;
		const rows = [...container.querySelectorAll('li.row')];
		expect(rows.length).toBe(3);
		expect(rows.map((r) => (r.querySelector('.name') as HTMLElement).textContent)).toEqual([
			'Alpha',
			'Beta',
			'Gamma',
		]);

		const root = hydrate(List, container, { items, onPick });
		flushSync(() => {});

		// No rebuild: same DOM + same adopted <li> instances.
		expect(container.innerHTML).toBe(before);
		expect([...container.querySelectorAll('li.row')]).toEqual(rows);

		// Per-item handler attached to the adopted button → fires with the row id.
		const betaPick = rows[1].querySelector('button.pick') as HTMLButtonElement;
		flushSync(() => betaPick.click());
		expect(onPick).toHaveBeenCalledTimes(1);
		// ripple-new's per-row event-bundle optimization calls fn(...args, event),
		// so the row id is the first argument.
		expect(onPick.mock.calls[0][0]).toBe(2);
		root.unmount();
	});
});
