import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/head-scripts.js';
import * as client from './compiled/client/head-scripts.js';

// Inline scripts execute in jsdom's window, separate from Vitest's globals.
const script_window = globalThis.jsdom.window;

afterEach(() => {
	for (const key of Object.keys(script_window)) {
		if (key.startsWith('__ripple_')) delete script_window[key];
	}
});

describe.each(['mount', 'hydrate'])('head scripts (%s)', (mode) => {
	async function setup(name, props = {}) {
		let scripts = [];
		if (mode === 'hydrate') {
			const { body, head } = await render(() => server[name](props));
			container.innerHTML = body;
			document.head.insertAdjacentHTML('beforeend', head);
			// innerHTML leaves scripts inert. Insert fresh nodes to simulate the
			// browser executing SSR scripts before hydration, with currentScript set.
			for (const node of document.head.querySelectorAll('script')) {
				const script = document.createElement('script');
				for (const { name, value } of node.attributes) script.setAttribute(name, value);
				script.textContent = node.textContent;
				node.replaceWith(script);
				scripts.push(script);
			}
		}
		const unmount = (mode === 'hydrate' ? hydrate : mount)(client[name], {
			target: container,
			props,
		});
		flushSync();
		return { scripts, unmount };
	}

	it('keeps attributes, executes once, and owns the first and last scripts', async () => {
		const { scripts, unmount } = await setup('Scripts', { nonce: 'dynamic-nonce' });
		try {
			const first = document.getElementById('first-script');
			const module = document.getElementById('module-script');
			const last = document.getElementById('last-script');
			expect(script_window.__ripple_script_runs).toBe(1);
			expect(script_window.__ripple_last_script_runs).toBe(1);
			expect(script_window.__ripple_script_nonce).toBe('dynamic-nonce');
			expect(script_window.__ripple_script_version).toBe('0');
			expect(module.type).toBe('module');
			expect(module.nonce).toBe('dynamic-nonce');
			expect(module.textContent).toContain('typeof import.meta');
			expect(last.nonce).toBe('static-nonce');
			expect(document.head.querySelector('meta[name="between-scripts"]').content).toBe('preserved');
			expect(document.head.querySelectorAll('script')).toHaveLength(3);
			if (mode === 'hydrate') {
				expect(first).toBe(scripts[0]);
				expect(module).toBe(scripts[1]);
				expect(last).toBe(scripts[2]);
			}
			container.querySelector('button').click();
			flushSync();
			expect(first.getAttribute('data-version')).toBe('1');
			expect(script_window.__ripple_script_runs).toBe(1);
		} finally {
			unmount();
		}
		expect(document.head.querySelectorAll('script')).toHaveLength(0);
		expect(document.head.querySelector('meta[name="between-scripts"]')).toBeNull();
	});

	for (const name of ['DynamicType', 'SpreadAttributes']) {
		it.each(['text/javascript', 'module', 'application/json'])(
			`${name} applies type %s before insertion`,
			async (type) => {
				const attrs = { type, id: 'dynamic-script', nonce: 'dynamic-nonce' };
				let referenced;
				const { scripts, unmount } = await setup(name, {
					...attrs,
					attrs,
					onRef: (node) => (referenced = node),
				});
				try {
					const script = document.getElementById(attrs.id);
					expect(script.type).toBe(type);
					expect(script.nonce).toBe(attrs.nonce);
					if (name === 'DynamicType') expect(referenced).toBe(script);
					expect(script_window.__ripple_dynamic_script_runs).toBe(
						type === 'text/javascript' ? 1 : undefined,
					);
					expect(document.head.querySelectorAll('script')).toHaveLength(1);
					if (mode === 'hydrate') expect(script).toBe(scripts[0]);
				} finally {
					unmount();
				}
				expect(document.getElementById(attrs.id)).toBeNull();
			},
		);
	}

	it('keeps attributes and node identity for scripts without inline content', async () => {
		const { scripts, unmount } = await setup('EmptyScripts');
		try {
			const data = document.getElementById('empty-head-data');
			const external = document.getElementById('external-script');
			expect(data.textContent).toBe('');
			expect(data.type).toBe('application/json');
			expect(external.type).toBe('module');
			expect(external.getAttribute('src')).toBe('/example.js');
			expect(external.hasAttribute('async')).toBe(true);
			expect(external.nonce).toBe('static-nonce');
			if (mode === 'hydrate') {
				expect(data).toBe(scripts[0]);
				expect(external).toBe(scripts[1]);
			}
		} finally {
			unmount();
		}
		expect(document.head.querySelectorAll('script')).toHaveLength(0);
	});
});

it('mounts head scripts once when hydrating a body without SSR head content', async () => {
	const props = { nonce: 'dynamic-nonce' };
	const { body } = await render(() => server.Scripts(props));
	container.innerHTML = body;
	const unmount = hydrate(client.Scripts, { target: container, props });
	try {
		flushSync();
		expect(script_window.__ripple_script_runs).toBe(1);
		expect(script_window.__ripple_last_script_runs).toBe(1);
		expect(document.head.querySelectorAll('script')).toHaveLength(3);
	} finally {
		unmount();
	}
	expect(document.head.querySelectorAll('script')).toHaveLength(0);
});
