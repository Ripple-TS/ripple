import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { Shell } from './_fixtures/lite.tsrx';

// SSR Phase 6 — hookless "lite" nested components hydrate: componentSlotLite
// adopts the server's `<!--[-->…<!--]-->` range instead of inlining fresh DOM.

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/lite.tsrx');

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'lite.tsrx', { mode: 'server' });
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

describe('hydrate — hookless lite components (SSR Phase 6)', () => {
	it('adopts each lite component (same elements), incl. the block-skipped 2nd one', async () => {
		const { body } = await ServerRT.render(server.Shell, { title: 'T', a: 'Alpha', b: 'Beta' });
		expect(body).toBe(
			'<div id="shell"><h3>T</h3>' +
				'<!--[--><span class="badge">Alpha</span><!--]-->' +
				'<!--[--><span class="badge">Beta</span><!--]-->' +
				'</div>',
		);

		container.innerHTML = body;
		const badges = [...container.querySelectorAll('span.badge')];
		expect(badges.length).toBe(2);

		const root = hydrate(Shell, container, { title: 'T', a: 'Alpha', b: 'Beta' });
		flushSync(() => {});

		// Both lite components were ADOPTED (same element instances, right order).
		expect([...container.querySelectorAll('span.badge')]).toEqual(badges);
		expect(badges.map((b) => b.textContent)).toEqual(['Alpha', 'Beta']);
		root.unmount();
	});
});
