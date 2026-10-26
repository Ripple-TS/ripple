import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/content-editable.js';
import * as client from './compiled/client/content-editable.js';

// jsdom does not implement innerText. The browser smoke test covers native
// line-break/layout behavior; this shim exercises the binding lifecycle here.
const inner_text = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
beforeAll(() => {
	if (!inner_text) {
		Object.defineProperty(HTMLElement.prototype, 'innerText', {
			configurable: true,
			get() {
				return this.textContent;
			},
			set(value) {
				this.textContent = value;
			},
		});
	}
});
afterAll(() => {
	if (!inner_text) delete HTMLElement.prototype.innerText;
});

async function prepare(props) {
	const { body, topLevelError } = await render(() => server.Editor(props));
	expect(topLevelError).toBeNull();
	container.innerHTML = body;
	return container.querySelector('[data-editor]');
}

function model() {
	return JSON.parse(container.querySelector('output').textContent);
}

function exec_stream_scripts(html) {
	for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) (0, eval)(code);
}

describe('contenteditable binding hydration', () => {
	it.each(
		['innerHTML', 'innerText', 'textContent'].flatMap((property) =>
			['none', 'outside', 'inside'].map((edit) => [property, edit]),
		),
	)('%s handles a nested streamed fallback (edit: %s)', async (property, edit) => {
		delete window.__RIPPLE_B__;
		delete window.__RIPPLE_S__;
		let resolve;
		const promise = new Promise((done) => {
			resolve = done;
		});
		const props = { promise, property };
		const chunks = [];
		const done = render(() => server.NestedStreamEditor(props), {
			stream: {
				push: (chunk) => chunks.push(chunk),
				close() {},
				error(error) {
					throw error;
				},
			},
		});
		container.innerHTML = chunks[0];
		exec_stream_scripts(chunks[0]);
		const editor = container.querySelector('[data-editor]');
		expect(editor.textContent).toBe('beforeloading');
		const edited =
			edit === 'none' ? null : editor.querySelector(edit === 'outside' ? 'b' : 'i').firstChild;
		if (edited) {
			edited.nodeValue = 'early';
			document.getSelection().setBaseAndExtent(edited, 4, edited, 1);
		}
		resolve('resolved');
		await done;
		for (const chunk of chunks.slice(1)) {
			container.insertAdjacentHTML('beforeend', chunk);
			exec_stream_scripts(chunk);
		}
		expect(editor.textContent).toBe(
			edit === 'inside' ? 'beforeearly' : edit === 'outside' ? 'earlyloading' : 'beforeresolved',
		);
		if (edit === 'none') {
			for (const host of container.querySelectorAll('[data-ripple-content]')) {
				expect(host.innerHTML).toBe(host.getAttribute('data-ripple-content'));
			}
		}
		const expected = edit === 'none' ? 'model' : editor[property];
		const unmount = hydrate(client.NestedStreamEditor, { target: container, props });
		try {
			flushSync();
			expect(editor[property]).toBe(expected);
			expect(model()).toBe(expected);
			if (edited) {
				expect(document.getSelection().anchorNode).toBe(edited);
				expect(document.getSelection().anchorOffset).toBe(4);
			}
		} finally {
			unmount();
			delete window.__RIPPLE_B__;
			delete window.__RIPPLE_S__;
		}
	});

	for (const property of ['innerHTML', 'innerText', 'textContent']) {
		it.each([false, true])(
			`${property} preserves early text and backward selection (accessors: %s)`,
			async (accessors) => {
				const props = { property, accessors };
				const editor = await prepare(props);
				editor.focus();
				editor.textContent = 'typed early';
				const text = editor.firstChild;
				const selection = document.getSelection();
				selection.setBaseAndExtent(text, 5, text, 1);
				const unmount = hydrate(client.Editor, { target: container, props });
				try {
					flushSync();
					expect(container.querySelector('div')).toBe(editor);
					expect(document.activeElement).toBe(editor);
					expect(editor.firstChild).toBe(text);
					expect(model()).toBe('typed early');
					expect([
						selection.anchorNode,
						selection.anchorOffset,
						selection.focusNode,
						selection.focusOffset,
					]).toEqual([text, 5, text, 1]);
					editor.textContent = 'later';
					editor.dispatchEvent(new Event('input', { bubbles: true }));
					flushSync();
					expect(model()).toBe('later');
					container.querySelector('button').click();
					flushSync();
					expect(editor[property]).toBe('updated');
				} finally {
					unmount();
				}
			},
		);

		it.each(['static', 'rich', 'html', 'text', 'nested', 'spread', 'inherited', 'dynamic'])(
			`${property} preserves edits and deletions of %s server content`,
			async (kind) => {
				for (const edited of ['early', '']) {
					const props = { property, kind, seed: 'server', initial: 'server' };
					const editor = await prepare(props);
					editor.textContent = edited;
					const unmount = hydrate(client.Editor, { target: container, props });
					try {
						flushSync();
						expect(editor[property]).toBe(edited);
						expect(model()).toBe(edited);
						container.querySelector('button').click();
						flushSync();
						expect(editor[property]).toBe('updated');
					} finally {
						unmount();
					}
				}
			},
		);

		it.each(['empty', 'static', 'html', 'text', 'spread'])(
			`${property} initializes an untouched %s editor from its model`,
			async (kind) => {
				const props = { property, kind, seed: 'server', initial: 'model' };
				const editor = await prepare(props);
				const unmount = hydrate(client.Editor, { target: container, props });
				try {
					flushSync();
					expect(editor[property]).toBe('model');
					expect(model()).toBe('model');
				} finally {
					unmount();
				}
			},
		);

		it(`${property} continues to initialize client-only mounts`, () => {
			const props = { property, initial: 'model' };
			const unmount = mount(client.Editor, { target: container, props });
			try {
				flushSync();
				expect(container.querySelector('div')[property]).toBe('model');
			} finally {
				unmount();
			}
		});
	}

	it('preserves rich markup and the selected text nodes', async () => {
		const props = { property: 'innerHTML', kind: 'rich' };
		const editor = await prepare(props);
		editor.innerHTML = '<strong>early</strong> <em>edit</em>';
		const text = editor.firstChild.firstChild;
		document.getSelection().setBaseAndExtent(text, 1, text, 4);
		const unmount = hydrate(client.Editor, { target: container, props });
		try {
			flushSync();
			expect(model()).toBe('<strong>early</strong> <em>edit</em>');
			expect(editor.firstChild.firstChild).toBe(text);
			expect(document.getSelection().anchorNode).toBe(text);
		} finally {
			unmount();
		}
	});

	it('lets a custom setter normalize an adopted edit', async () => {
		const props = { accessors: true, transform: (value) => value.toUpperCase() };
		const editor = await prepare(props);
		editor.textContent = 'early';
		const unmount = hydrate(client.Editor, { target: container, props });
		try {
			flushSync();
			expect(editor.textContent).toBe('EARLY');
			expect(model()).toBe('EARLY');
		} finally {
			unmount();
		}
	});

	it.each(['innerHTML', 'innerText', 'textContent'])(
		'%s preserves selection when adopting an edit updates its reactive SSR content',
		async (property) => {
			const props = { property };
			const { body } = await render(() => server.ReactiveEditor(props));
			container.innerHTML = body;
			const editor = container.querySelector('[data-editor]');
			editor.innerHTML = '<b>early</b> edit';
			const text = editor.firstChild.firstChild;
			const expected = editor[property];
			document.getSelection().setBaseAndExtent(text, 4, text, 1);
			const unmount = hydrate(client.ReactiveEditor, { target: container, props });
			try {
				flushSync();
				expect(container.querySelector('output').textContent).toBe(expected);
				expect(editor.firstChild.firstChild).toBe(text);
				expect(document.getSelection().anchorNode).toBe(text);
				expect(document.getSelection().anchorOffset).toBe(4);
				container.querySelector('button').click();
				flushSync();
				expect(editor[property]).toBe('updated');
			} finally {
				unmount();
			}
		},
	);

	it('does not upgrade custom elements again while normalizing a snapshot', async () => {
		let constructions = 0;
		customElements.define(
			'editable-snapshot-test',
			class extends HTMLElement {
				constructor() {
					super();
					constructions++;
				}
			},
		);
		const props = { kind: 'html', seed: '<editable-snapshot-test>server</editable-snapshot-test>' };
		const editor = await prepare(props);
		const before = constructions;
		editor.textContent = 'early';
		const unmount = hydrate(client.Editor, { target: container, props });
		try {
			flushSync();
			expect(constructions).toBe(before);
			expect(model()).toBe('early');
		} finally {
			unmount();
		}
	});

	it('normalizes HTML snapshots before comparing with the browser DOM', async () => {
		const props = {
			property: 'innerHTML',
			kind: 'html',
			seed: "<B title='a &amp; b'>server</B>",
			initial: 'model',
		};
		const editor = await prepare(props);
		const unmount = hydrate(client.Editor, { target: container, props });
		try {
			flushSync();
			expect(editor.innerHTML).toBe('model');
			expect(model()).toBe('model');
		} finally {
			unmount();
		}
	});

	it('escapes snapshots without introducing elements or attributes', async () => {
		const props = { kind: 'text', seed: '\" ><script>bad()</script> & <tag>' };
		const editor = await prepare(props);
		expect(editor.textContent).toBe(props.seed);
		expect(container.querySelector('script')).toBeNull();
		expect(editor.getAttributeNames().sort()).toEqual([
			'contenteditable',
			'data-editor',
			'data-ripple-content',
		]);
	});

	it('does not add snapshots to ordinary spreads or explicitly disabled editors', async () => {
		const plain = await render(server.PlainSpread);
		expect(plain.body).not.toContain('data-ripple-content');
		const editor = await prepare({ kind: 'spread', editable: false, seed: 'server' });
		expect(editor.hasAttribute('data-ripple-content')).toBe(false);
	});

	it.each(['TRUE', 'plaintext-only', ''])('recognizes contentEditable=%j', async (editable) => {
		const props = { kind: 'html', seed: 'server', initial: 'server', editable };
		const editor = await prepare(props);
		editor.textContent = 'early';
		const unmount = hydrate(client.Editor, { target: container, props });
		try {
			flushSync();
			expect(model()).toBe('early');
		} finally {
			unmount();
		}
	});

	it.each([false, true])(
		'snapshots async children when their output is serialized (stream: %s)',
		async (stream) => {
			let resolve;
			const promise = new Promise((done) => {
				resolve = done;
			});
			const chunks = [];
			const done = render(
				() => server.AsyncEditor({ promise }),
				stream
					? {
							stream: {
								push: (chunk) => chunks.push(chunk),
								close() {},
								error(error) {
									throw error;
								},
							},
						}
					: {},
			);
			resolve('async & <text>');
			const result = await done;
			expect(result.topLevelError).toBeNull();
			container.innerHTML = stream ? chunks.join('') : result.body;
			const editor = stream
				? [...container.querySelectorAll('template')]
						.map((template) => template.content.querySelector('[data-editor]'))
						.find(Boolean)
				: container.querySelector('[data-editor]');
			expect(editor.textContent).toBe('async & <text>');
			const baseline = document.createElement('div');
			baseline.innerHTML = editor.getAttribute('data-ripple-content');
			expect(baseline.innerHTML).toBe(editor.innerHTML);
		},
	);
});
