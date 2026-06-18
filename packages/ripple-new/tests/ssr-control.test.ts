import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../tsrx-ripple-new/src/index.js';
import { injectStyle } from '../src/index.js';
import * as RT from 'ripple-new/server';

// SSR Phase 3 — control flow (@if/@for/@switch/@try) + component children +
// portals emitted to HTML strings with block markers, plus scoped-CSS de-dup.

const FIXTURES = join(process.cwd(), 'packages/ripple-new/tests/_fixtures');

function evalServer(source: string, file: string): Record<string, any> {
	let { code } = compile(source, file, { mode: 'server' });
	code = code.replace(
		/import\s*\{([^}]*)\}\s*from\s*['"]ripple-new\/server['"];?/g,
		'const {$1} = __rt;',
	);
	code = code.replace(/export const (\w+) =/g, 'const $1 = __exports.$1 =');
	const fn = new Function('__rt', '__exports', code + '\nreturn __exports;');
	return fn(RT, {});
}
const m = evalServer(readFileSync(join(FIXTURES, 'ssr-control.tsrx'), 'utf8'), 'ssr-control.tsrx');

const OPEN = '<!--[-->';
const CLOSE = '<!--]-->';

describe('SSR Phase 3 — control flow with block markers', () => {
	it('@if / @else renders the chosen branch wrapped in markers', async () => {
		// Nested ranges: outer = if-slot, inner = the taken branch (so the client
		// adopts both on hydration with no inserted markers — byte-for-byte).
		expect((await RT.render(m.IfElse, { on: true })).body).toBe(
			`<div>${OPEN}${OPEN}<span class="yes">on</span>${CLOSE}${CLOSE}</div>`,
		);
		expect((await RT.render(m.IfElse, { on: false })).body).toBe(
			`<div>${OPEN}${OPEN}<span class="no">off</span>${CLOSE}${CLOSE}</div>`,
		);
	});

	it('@for renders each item in its own marker; @empty when the list is empty', async () => {
		expect((await RT.render(m.List, { items: ['a', 'b'] })).body).toBe(
			`<ul>${OPEN}${OPEN}<li>a</li>${CLOSE}${OPEN}<li>b</li>${CLOSE}${CLOSE}</ul>`,
		);
		expect((await RT.render(m.List, { items: [] })).body).toBe(
			`<ul>${OPEN}<li class="empty">none</li>${CLOSE}</ul>`,
		);
	});

	it('@switch picks the matching case (or default)', async () => {
		// Nested ranges: outer = switch-slot, inner = the matched case.
		expect((await RT.render(m.Switch, { k: 'a' })).body).toBe(
			`<div>${OPEN}${OPEN}<span>A</span>${CLOSE}${CLOSE}</div>`,
		);
		expect((await RT.render(m.Switch, { k: 'b' })).body).toBe(
			`<div>${OPEN}${OPEN}<span>B</span>${CLOSE}${CLOSE}</div>`,
		);
		expect((await RT.render(m.Switch, { k: 'z' })).body).toBe(
			`<div>${OPEN}${OPEN}<span>?</span>${CLOSE}${CLOSE}</div>`,
		);
	});

	it('@try renders the resolved success arm (awaiting use), @catch on error', async () => {
		// Nested ranges: outer = try-slot, inner = the resolved arm. Sync body →
		// success arm, no suspension, no seed script.
		expect((await RT.render(m.Boundary, { read: () => 'hi' })).body).toBe(
			`<div>${OPEN}${OPEN}<span class="ok">hi</span>${CLOSE}${CLOSE}</div>`,
		);
		// use(thenable): render() awaits it and re-renders the SUCCESS arm (Phase 4,
		// not the @pending fallback), appending the resolved value as an inline seed
		// <script> for the client to adopt on hydration.
		const resolved = await RT.render(m.Boundary, { read: () => RT.use(Promise.resolve('x')) });
		expect(resolved.body).toBe(
			`<div>${OPEN}${OPEN}<span class="ok">x</span>${CLOSE}${CLOSE}</div>` +
				`<script type="application/json" data-ripple-new-suspense>["x"]</script>`,
		);
		// A thrown error renders the @catch arm with the error.
		const caught = (
			await RT.render(m.Boundary, {
				read: () => {
					throw new Error('boom');
				},
			})
		).body;
		expect(caught).toBe(`<div>${OPEN}${OPEN}<span class="error">boom</span>${CLOSE}${CLOSE}</div>`);
	});
});

describe('SSR Phase 3 — component children (context Provider)', () => {
	it('a Provider renders its children, which read the provided context value', async () => {
		expect((await RT.render(m.Provided, { theme: 'dark' })).body).toContain(
			'<span class="theme">dark</span>',
		);
		expect((await RT.render(m.Provided, { theme: 'light' })).body).toContain(
			'<span class="theme">light</span>',
		);
	});
});

describe('SSR Phase 3 — portals', () => {
	it('emits a site marker for a portal and renders sibling content inline', async () => {
		const body = (await RT.render(m.WithPortal)).body;
		expect(body).toBe('<div id="host"><!----><span>inline</span></div>');
	});
});

describe('SSR Phase 3 — scoped CSS across the boundary', () => {
	it('server css output is tagged <style data-ripple-new="hash"> tags', async () => {
		const ssr = evalServer(readFileSync(join(FIXTURES, 'ssr.tsrx'), 'utf8'), 'ssr.tsrx');
		const { css, body } = await RT.render(ssr.Scoped);
		expect(css).toMatch(/^<style data-ripple-new="tsrx-[0-9a-f]+">.*<\/style>$/s);
		// The hash on the body class matches the css tag's hash.
		const hash = css.match(/data-ripple-new="(tsrx-[0-9a-f]+)"/)![1];
		expect(body).toContain(`class="box ${hash}"`);
	});

	it('client injectStyle skips re-injection when the hash is already in the DOM', () => {
		// Simulate the server-emitted <style> already present on the page.
		const head = document.head;
		const existing = document.createElement('style');
		existing.setAttribute('data-ripple-new', 'tsrx-dedup');
		existing.textContent = '.x.tsrx-dedup{color:red}';
		head.appendChild(existing);

		injectStyle('tsrx-dedup', '.x.tsrx-dedup{color:red}');

		expect(head.querySelectorAll('style[data-ripple-new="tsrx-dedup"]').length).toBe(1);
		existing.remove();
	});
});
