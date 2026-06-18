import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { Boundary } from './_fixtures/tryboundary.tsrx';

// SSR Phase 6 (M4) — @try hydration. The server resolves use(promise) and renders
// the success arm; the client adopts it and use() returns the seeded value, so the
// boundary hydrates to its resolved arm (not @pending) and is interactive.

const FIXTURE = join(
	process.cwd(),
	'packages/ripple-new/tests/hydration/_fixtures/tryboundary.tsrx',
);

function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'tryboundary.tsrx', { mode: 'server' });
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

describe('hydrate — @try success arm (SSR Phase 6 / M4)', () => {
	it('adopts the resolved success arm (use seeded) and it is interactive', async () => {
		const { body } = await ServerRT.render(server.Boundary, { promise: Promise.resolve('hi') });
		// Server resolved use() → success arm in a block range + a seed <script>.
		expect(body).toContain('<button id="ok" class="ok">hi:0</button>');
		expect(body).toContain('data-ripple-new-suspense>["hi"]</script>');

		container.innerHTML = body;
		const btn = container.querySelector('#ok') as HTMLButtonElement;

		const root = hydrate(Boundary, container, { promise: Promise.resolve('hi') });
		flushSync(() => {});

		// The success-arm button was ADOPTED (no re-suspend, no rebuild).
		expect(container.querySelector('#ok')).toBe(btn);
		expect(container.querySelector('.loading')).toBeNull(); // not the @pending arm
		expect(btn.textContent).toBe('hi:0');

		// …and it's interactive (useState in the try body works).
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('hi:1');
		root.unmount();
	});
});
