import { describe, expect, it } from 'vitest';
import { flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/textarea.js';
import * as client from './compiled/client/textarea.js';

describe('textarea rendering', () => {
	it.each(['StaticValue', 'StaticChild'])(
		'%s is populated before and after hydration',
		async (name) => {
			const { body } = await render(server[name]);
			container.innerHTML = body;
			const textarea = container.querySelector('textarea');
			expect(textarea.value).toBe('hello & <world>');
			expect(textarea.defaultValue).toBe('hello & <world>');
			expect(textarea.hasAttribute('value')).toBe(false);
			const unmount = hydrate(client[name], { target: container });
			try {
				flushSync();
				expect(container.querySelector('textarea')).toBe(textarea);
				expect(textarea.value).toBe('hello & <world>');
				expect(textarea.defaultValue).toBe('hello & <world>');
			} finally {
				unmount();
			}
		},
	);

	for (const name of ['Value', 'Child', 'MixedChildren', 'SpreadValue']) {
		const content = (value) =>
			name === 'MixedChildren' ? `before:${value ?? ''}${value ?? ''}:after` : String(value ?? '');

		it.each([
			'server',
			'',
			null,
			undefined,
			0,
			'\nfirst\nsecond',
			'&</textarea><script>bad()</script>',
		])(`${name} renders %j as text and updates after hydration`, async (initial) => {
			const props = { initial, next: '\nupdated & <text>' };
			const { body } = await render(() => server[name](props));
			container.innerHTML = body;
			const textarea = container.querySelector('textarea');
			const text = textarea.firstChild;
			expect(textarea.value).toBe(content(initial));
			expect(textarea.defaultValue).toBe(content(initial));
			expect(textarea.hasAttribute('value')).toBe(false);
			expect(container.querySelector('script')).toBeNull();
			const button = container.querySelector('button');
			const unmount = hydrate(client[name], { target: container, props });
			try {
				flushSync();
				expect(container.querySelector('textarea')).toBe(textarea);
				expect(container.querySelector('button')).toBe(button);
				expect(textarea.firstChild).toBe(text);
				expect(textarea.value).toBe(content(initial));
				expect(textarea.defaultValue).toBe(content(initial));
				button.click();
				flushSync();
				expect(textarea.value).toBe(content(props.next));
			} finally {
				unmount();
			}
		});
	}

	it.each(['StaticValue', 'Value', 'Child', 'SpreadValue'])(
		'%s also renders on the client',
		(name) => {
			const unmount = mount(client[name], {
				target: container,
				props: { initial: 'hello & <world>', next: 'next' },
			});
			try {
				flushSync();
				expect(container.querySelector('textarea').value).toBe('hello & <world>');
				container.querySelector('button')?.click();
				flushSync();
				if (name !== 'StaticValue') {
					expect(container.querySelector('textarea').value).toBe('next');
				}
			} finally {
				unmount();
			}
		},
	);
});
