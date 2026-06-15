import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../../../tsrx-ripple-new/src/index.js';
import { createRoot, hydrate, flushSync, createElement, delegateEvents } from '../../src/index.js';
import * as ServerRT from 'ripple-new/server';
import { Inner, Counter, Hole, Layout, FragLayout } from './_fixtures/renderable.tsrx';

// Renderable `{expr}` holes (no `as string` cast) — Ripple/React semantics:
//   - function (component / children render-fn) → render as a block
//   - ElementDescriptor (`createElement`) → render its type with props
//   - primitive → coerce to a text node (`0` renders "0")
//   - null / undefined / false / true / '' → render NOTHING

delegateEvents(['click']);

const FIXTURE = join(
	process.cwd(),
	'packages/ripple-new/tests/hydration/_fixtures/renderable.tsrx',
);
function serverModule(): Record<string, any> {
	let { code } = compile(readFileSync(FIXTURE, 'utf8'), 'renderable.tsrx', { mode: 'server' });
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

function mount<P>(body: any, props?: P) {
	const root = createRoot(container);
	root.render(body, props as any);
	flushSync(() => {});
	return root;
}

describe('renderable holes — client mount', () => {
	it('coerces a primitive to text', () => {
		const root = mount(Hole, { value: 'hello' });
		expect(container.querySelector('#h')!.textContent).toBe('hello');
		root.unmount();
	});

	it('renders 0 (not nothing)', () => {
		const root = mount(Hole, { value: 0 });
		expect(container.querySelector('#h')!.textContent).toBe('0');
		root.unmount();
	});

	for (const empty of [null, undefined, false, true, '']) {
		it(`renders nothing for ${JSON.stringify(empty)}`, () => {
			const root = mount(Hole, { value: empty });
			expect(container.querySelector('#h')!.textContent).toBe('');
			root.unmount();
		});
	}

	it('renders a component-body value', () => {
		const root = mount(Hole, { value: Inner });
		expect(container.querySelector('#h #inner')!.textContent).toBe('INNER');
		root.unmount();
	});

	it('renders an element descriptor value', () => {
		const root = mount(Hole, { value: createElement(Inner, {}) });
		expect(container.querySelector('#h #inner')!.textContent).toBe('INNER');
		root.unmount();
	});

	it('renders a component child in a mixed-children layout, in source order', () => {
		const root = mount(Layout, { children: Inner });
		const main = container.querySelector('#layout')!;
		// header, then the rendered child, then footer.
		expect(main.querySelector('header')!.textContent).toBe('HEAD');
		expect(main.querySelector('#inner')!.textContent).toBe('INNER');
		expect(main.querySelector('footer')!.textContent).toBe('FOOT');
		// Order: header precedes #inner precedes footer.
		const order = [...main.childNodes]
			.filter((n) => n.nodeType === 1)
			.map((n) => (n as Element).tagName);
		expect(order).toEqual(['HEADER', 'SPAN', 'FOOTER']);
		root.unmount();
	});
});

describe('renderable holes — updates', () => {
	it('updates primitive text in place', () => {
		const root = createRoot(container);
		root.render(Hole, { value: 'a' });
		flushSync(() => {});
		const div = container.querySelector('#h')!;
		root.render(Hole, { value: 'b' });
		flushSync(() => {});
		expect(container.querySelector('#h')).toBe(div); // same host
		expect(div.textContent).toBe('b');
		root.unmount();
	});

	it('primitive → nothing → primitive (drops then re-adds the text node)', () => {
		const root = createRoot(container);
		root.render(Hole, { value: 'x' });
		flushSync(() => {});
		expect(container.querySelector('#h')!.textContent).toBe('x');
		root.render(Hole, { value: null });
		flushSync(() => {});
		expect(container.querySelector('#h')!.textContent).toBe('');
		root.render(Hole, { value: 'y' });
		flushSync(() => {});
		expect(container.querySelector('#h')!.textContent).toBe('y');
		root.unmount();
	});

	it('swaps primitive → component → primitive', () => {
		const root = createRoot(container);
		root.render(Hole, { value: 'p' });
		flushSync(() => {});
		expect(container.querySelector('#h')!.textContent).toBe('p');
		root.render(Hole, { value: Inner });
		flushSync(() => {});
		expect(container.querySelector('#h #inner')).not.toBeNull();
		root.render(Hole, { value: 'q' });
		flushSync(() => {});
		expect(container.querySelector('#h #inner')).toBeNull();
		expect(container.querySelector('#h')!.textContent).toBe('q');
		root.unmount();
	});
});

describe('renderable holes — hydration', () => {
	it('adopts a primitive text hole (no rebuild)', async () => {
		const { body } = await ServerRT.render(server.Hole, { value: 'hello' });
		expect(body).toContain('hello');
		container.innerHTML = body;
		const div = container.querySelector('#h') as HTMLElement;
		const root = hydrate(Hole, container, { value: 'hello' });
		flushSync(() => {});
		expect(container.querySelector('#h')).toBe(div); // adopted host
		expect(div.textContent).toBe('hello');
		root.unmount();
	});

	it('adopts a component child + keeps it interactive', async () => {
		const { body } = await ServerRT.render(server.Layout, { children: server.Counter });
		expect(body).toContain('count:0');
		container.innerHTML = body;
		const main = container.querySelector('#layout') as HTMLElement;
		const btn = container.querySelector('#counter') as HTMLButtonElement;
		const root = hydrate(Layout, container, { children: Counter });
		flushSync(() => {});
		// The server nodes were ADOPTED, not rebuilt.
		expect(container.querySelector('#layout')).toBe(main);
		expect(container.querySelector('#counter')).toBe(btn);
		// And the adopted component is interactive.
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('count:1');
		root.unmount();
	});

	// A component whose only body root is `{children}` (the website Layout shape,
	// `<>{children}<style/></>`) hydrates via childSlot's cursor-adopt branch: the
	// frag template contributes no body DOM, so the sole childSlot adopts the
	// server's range off the hydrate cursor.
	it('adopts a component child through a fragment layout whose only root is {children}', async () => {
		const { body } = await ServerRT.render(server.FragLayout, { children: server.Counter });
		expect(body).toContain('count:0');
		container.innerHTML = body;
		const btn = container.querySelector('#counter') as HTMLButtonElement;
		const root = hydrate(FragLayout, container, { children: Counter });
		flushSync(() => {});
		expect(container.querySelector('#counter')).toBe(btn); // adopted, not rebuilt
		flushSync(() => btn.click());
		expect(btn.textContent).toBe('count:1');
		root.unmount();
	});

	it('adopts an empty hole (renders nothing on both sides)', async () => {
		const { body } = await ServerRT.render(server.Hole, { value: null });
		container.innerHTML = body;
		const div = container.querySelector('#h') as HTMLElement;
		const root = hydrate(Hole, container, { value: null });
		flushSync(() => {});
		expect(container.querySelector('#h')).toBe(div);
		expect(div.textContent).toBe('');
		root.unmount();
	});
});
