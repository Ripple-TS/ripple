import { describe, expect, it } from 'vitest';
import { flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/data-script.js';
import * as client from './compiled/client/data-script.js';

const script_window = globalThis.jsdom.window;

describe.each(['mount', 'hydrate'])('data scripts (%s)', (mode) => {
	async function setup(name, props = {}) {
		let scripts = [];
		if (mode === 'hydrate') {
			const { body, head } = await render(() => server[name](props));
			container.innerHTML = body;
			document.head.insertAdjacentHTML('beforeend', head);
			scripts = Array.from(document.querySelectorAll('script'));
		}
		const unmount = (mode === 'hydrate' ? hydrate : mount)(client[name], {
			target: container,
			props,
		});
		flushSync();
		return { scripts, unmount };
	}

	it('preserves raw JSON, attributes, and the existing node beside an interactive sibling', async () => {
		const props = { id: 'card-data', nonce: 'test-nonce' };
		const { scripts, unmount } = await setup('Card', props);
		try {
			const script = document.getElementById(props.id);
			expect(script.parentElement.tagName).toBe('ARTICLE');
			expect(script.getAttribute('type')).toBe('application/json');
			expect(script.nonce).toBe(props.nonce);
			expect(script.getAttribute('data-count')).toBe('0');
			expect(script.textContent).toBe(
				'\n  {"count":1,"text":"<tag> &amp; > ` ${value} café","escaped":"\\u003c/script>"}\n\t\t',
			);
			expect(JSON.parse(script.textContent)).toEqual({
				count: 1,
				text: '<tag> &amp; > ` ${value} café',
				escaped: '</script>',
			});
			expect(container.querySelectorAll('script')).toHaveLength(1);
			if (mode === 'hydrate') expect(script).toBe(scripts[0]);

			const button = container.querySelector('button');
			button.click();
			flushSync();
			expect(button.textContent).toBe('1');
			expect(script.getAttribute('data-count')).toBe('1');
			expect(document.getElementById(props.id)).toBe(script);
		} finally {
			unmount();
		}
		expect(document.getElementById(props.id)).toBeNull();
	});

	it('handles a script as the component root', async () => {
		const { scripts, unmount } = await setup('RootData');
		try {
			const script = document.getElementById('root-data');
			expect(script.type).toBe('application/ld+json');
			expect(JSON.parse(script.textContent)).toEqual({ count: 1 });
			if (mode === 'hydrate') expect(script).toBe(scripts[0]);
		} finally {
			unmount();
		}
		expect(document.getElementById('root-data')).toBeNull();
	});

	it('preserves empty and whitespace-only bodies', async () => {
		const { scripts, unmount } = await setup('EmptyData');
		try {
			const empty = document.getElementById('empty-data');
			const whitespace = document.getElementById('whitespace-data');
			expect(empty.textContent).toBe('');
			expect(whitespace.textContent).toBe(' \t ');
			expect(container.querySelector('p').textContent).toBe('after');
			if (mode === 'hydrate') {
				expect(empty).toBe(scripts[0]);
				expect(whitespace).toBe(scripts[1]);
			}
		} finally {
			unmount();
		}
	});

	it('leaves JavaScript-looking data inert', async () => {
		delete script_window.__ripple_data_script_runs;
		const { scripts, unmount } = await setup('InertData');
		try {
			const script = document.getElementById('inert-data');
			expect(script.type).toBe('text/plain');
			expect(script_window.__ripple_data_script_runs).toBeUndefined();
			expect(container.querySelectorAll('script')).toHaveLength(1);
			if (mode === 'hydrate') expect(script).toBe(scripts[0]);
		} finally {
			unmount();
			delete script_window.__ripple_data_script_runs;
		}
	});

	it('removes and recreates data scripts in conditional content', async () => {
		const { scripts, unmount } = await setup('ConditionalData');
		try {
			const script = document.getElementById('conditional-data');
			if (mode === 'hydrate') expect(script).toBe(scripts[0]);
			const button = container.querySelector('button');
			button.click();
			flushSync();
			expect(script.isConnected).toBe(false);
			expect(document.getElementById('conditional-data')).toBeNull();
			button.click();
			flushSync();
			const replacement = document.getElementById('conditional-data');
			expect(replacement).not.toBe(script);
			expect(JSON.parse(replacement.textContent)).toEqual({ visible: true });
		} finally {
			unmount();
		}
		expect(document.getElementById('conditional-data')).toBeNull();
	});

	it('also preserves data scripts in the head without duplicating them', async () => {
		const { scripts, unmount } = await setup('HeadData');
		try {
			const script = document.getElementById('head-data');
			expect(script.parentElement).toBe(document.head);
			expect(script.type).toBe('application/json');
			expect(JSON.parse(script.textContent)).toEqual({ text: '<tag> &amp;' });
			expect(document.head.querySelectorAll('#head-data')).toHaveLength(1);
			if (mode === 'hydrate') expect(script).toBe(scripts[0]);
		} finally {
			unmount();
		}
		expect(document.getElementById('head-data')).toBeNull();
	});
});
