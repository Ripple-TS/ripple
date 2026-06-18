import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { TextAfterComp, TextBetweenComps, TextAfterIf } from './_fixtures/text-sibling.tsrx';

// Regression for the website-tsrx-new migration: a `{x as string}` text hole
// among sibling holes (component / control flow) must ADOPT the server text node
// on hydration. The old raw `childNodes[childIndex]` swap landed inside an
// earlier sibling's `<!--[-->…<!--]-->` range, clobbering it (or threw
// removeChild). Now the position is resolved with the hole-aware child/sibling
// walk + htextSwap adopts.

const FIXTURE = join(
	process.cwd(),
	'packages/ripple-new/tests/hydration/_fixtures/text-sibling.tsrx',
);
function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'text-sibling.tsrx', { mode: 'server' });
	code = code.replace(
		/import\s*\{([^}]*)\}\s*from\s*['"]ripple-new\/server['"];?/g,
		'const {$1} = __rt;',
	);
	code = code.replace(/export const (\w+) =/g, 'const $1 = __exports.$1 =');
	return new Function('__rt', '__exports', code + '\nreturn __exports;')(ServerRT, {});
}
const server = serverModule();

let container: HTMLElement;
beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});
afterEach(() => container.remove());

describe('hydrate — text hole among sibling holes', () => {
	it('text after a component: adopts the server text, keeps the component', async () => {
		const { body } = await ServerRT.render(server.TextAfterComp, { label: 'LBL' });
		container.innerHTML = body;
		const inner = container.querySelector('#inner') as HTMLElement;
		const root = hydrate(TextAfterComp, container, { label: 'LBL' });
		flushSync(() => {});
		// The component's content survived (NOT clobbered) and the text is present.
		expect(container.querySelector('#inner')).toBe(inner);
		expect(container.querySelector('#inner')!.textContent).toBe('I');
		expect(container.querySelector('#host')!.textContent).toContain('LBL');
		root.unmount();
	});

	it('text between two components: both components intact + text present', async () => {
		const { body } = await ServerRT.render(server.TextBetweenComps, { label: 'MID' });
		container.innerHTML = body;
		const root = hydrate(TextBetweenComps, container, { label: 'MID' });
		flushSync(() => {});
		expect(container.querySelectorAll('#host2 #inner').length).toBe(2);
		expect(container.querySelector('#host2')!.textContent).toContain('MID');
		root.unmount();
	});

	it('text after a taken @if branch: adopts the branch + the text', async () => {
		const { body } = await ServerRT.render(server.TextAfterIf, { on: true, label: 'AFTER' });
		container.innerHTML = body;
		const onSpan = container.querySelector('.on') as HTMLElement;
		const root = hydrate(TextAfterIf, container, { on: true, label: 'AFTER' });
		flushSync(() => {});
		expect(container.querySelector('.on')).toBe(onSpan); // branch adopted
		expect(container.querySelector('.on')!.textContent).toBe('on');
		expect(container.querySelector('#host3')!.textContent).toContain('AFTER');
		root.unmount();
	});
});
