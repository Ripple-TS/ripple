import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { hydrate, flushSync, delegateEvents } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { Page } from './_fixtures/head.tsrx';

// Hoisted document metadata (React-19 model): inline `<title>`/`<meta>` are
// routed out of the body, so the remaining single body root takes the
// single-root path (no <ripple-frag>) and the metadata goes to render().head
// (server, via ssrHeadEl) / document.head (client, via headBlock). On hydrate,
// headBlock ADOPTS the server-rendered element (matched by its `<!--key-->`
// marker) rather than appending a duplicate, and removes it on unmount.

delegateEvents(['click']);

const FIXTURE = join(process.cwd(), 'packages/ripple-new/tests/hydration/_fixtures/head.tsrx');
function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'head.tsrx', { mode: 'server' });
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
afterEach(() => {
	container.remove();
	// Reset the document head between tests (title + any adopted/mounted nodes).
	document.head.innerHTML = '';
	document.title = '';
});

describe('hoisted document metadata — compile', () => {
	it('client: single-root body template (no <ripple-frag>) + headBlock', () => {
		const { code } = compile(readFileSync(FIXTURE, 'utf8'), 'head.tsrx', { mode: 'client' });
		expect(code).not.toContain('ripple-frag');
		expect(code).toContain('headBlock(__s,');
		expect(code).toMatch(/import \{[^}]*\bheadBlock\b/);
	});

	it('server: ssrHeadEl with a key byte-identical to the client headBlock', () => {
		const { code: clientCode } = compile(readFileSync(FIXTURE, 'utf8'), 'head.tsrx', {
			mode: 'client',
		});
		const { code: serverCode } = compile(readFileSync(FIXTURE, 'utf8'), 'head.tsrx', {
			mode: 'server',
		});
		// The first head element is the <title>; its key must match across modes.
		const key = clientCode.match(/headBlock\(__s, "(rnh-[a-z0-9]+)"/)?.[1];
		expect(key).toBeTruthy();
		expect(serverCode).toContain(`ssrHeadEl("${key}"`);
	});
});

describe('hoisted document metadata — SSR', () => {
	it('render().head carries the title + meta (each marker-prefixed); body is single-root', async () => {
		const { head, body, css } = await ServerRT.render(server.Page, { params: {} });
		expect(head).toContain('<title>TSRX Page</title>');
		expect(head).toContain('name="description"');
		expect(head).toContain('content="A test page"');
		expect(head).toMatch(/^<!--rnh-/); // leading adoption marker
		// Body is the single <section> (wrapped in the component block markers),
		// NOT a <ripple-frag> multi-root.
		expect(body).toContain('<section id="body"');
		expect(body).not.toContain('ripple-frag');
		// The <style> still routes to CSS.
		expect(css).toContain('rebeccapurple');
	});
});

describe('hoisted document metadata — hydration', () => {
	it('adopts the server head (one <title>/<meta>, markers removed) + single-root body, removed on unmount', async () => {
		const { head, body } = await ServerRT.render(server.Page, { params: {} });
		// Simulate the metaframework injecting render().head into the document head.
		document.head.innerHTML = head;
		expect(document.head.querySelectorAll('title').length).toBe(1);
		expect(document.title).toBe('TSRX Page');

		container.innerHTML = body;
		const section = container.querySelector('#body') as HTMLElement;
		const btn = container.querySelector('#bump') as HTMLButtonElement;

		const root = hydrate(Page, container, { params: {} });
		flushSync(() => {});

		// Head: title + meta ADOPTED (no duplication), adoption markers removed.
		expect(document.title).toBe('TSRX Page');
		expect(document.head.querySelectorAll('title').length).toBe(1);
		expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
		const markerComments = Array.from(document.head.childNodes).filter(
			(n) => n.nodeType === 8 && (n as Comment).data.startsWith('rnh-'),
		);
		expect(markerComments.length).toBe(0);

		// Body: single-root <section> ADOPTED (same node), no <ripple-frag>, interactive.
		expect(container.querySelector('#body')).toBe(section);
		expect(container.querySelector('ripple-frag')).toBeNull();
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('n:1');

		// Lifecycle: unmounting the page removes its hoisted head elements.
		root.unmount();
		expect(document.head.querySelectorAll('title').length).toBe(0);
		expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(0);
	});
});
