import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
// CLIENT-compiled component (the onClick makes this module register click delegation).
import { Panel } from './_fixtures/nested.tsrx';

// SSR Phase 6 (M1) — a parent component hydrates a NESTED component: the server
// wraps the child in `<!--[-->…<!--]-->`, the client componentSlot adopts that
// range, and the child adopts the server DOM (no rebuild) + becomes interactive.

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/nested.tsrx');

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'nested.tsrx', { mode: 'server' });
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

describe('hydrate — nested component (SSR Phase 6 / M1)', () => {
	it('adopts the server DOM (no rebuild) and the nested component is interactive', async () => {
		const { body } = await ServerRT.render(server.Panel, { title: 'Headlines', label: 'Story' });
		// The nested <Item> output is wrapped in a hydration block range.
		expect(body).toBe(
			'<div id="panel"><h2>Headlines</h2>' +
				'<!--[--><li class="item"><span class="label">Story</span>' +
				'<button class="bump">x0</button></li><!--]-->' +
				'</div>',
		);

		container.innerHTML = body;
		const before = container.innerHTML;
		const panel = container.querySelector('#panel') as HTMLElement;
		const li = container.querySelector('li.item') as HTMLElement;
		const btn = container.querySelector('button.bump') as HTMLButtonElement;

		const root = hydrate(Panel, container, { title: 'Headlines', label: 'Story' });
		flushSync(() => {});

		// No rebuild: same DOM string + same adopted element instances.
		expect(container.innerHTML).toBe(before);
		expect(container.querySelector('#panel')).toBe(panel);
		expect(container.querySelector('li.item')).toBe(li);
		expect(container.querySelector('button.bump')).toBe(btn);

		// The nested component's handler attached to the adopted button.
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('x1');
		// The rest of the adopted DOM is untouched.
		expect((container.querySelector('span.label') as HTMLElement).textContent).toBe('Story');
		expect((container.querySelector('h2') as HTMLElement).textContent).toBe('Headlines');
		root.unmount();
	});
});
