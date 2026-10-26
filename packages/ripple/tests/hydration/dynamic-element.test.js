import { describe, expect, it } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/dynamic-element.js';
import * as client from './compiled/client/dynamic-element.js';

async function prepare(name, props = {}) {
	const { body, topLevelError } = await render(() => server[name](props));
	expect(topLevelError).toBeNull();
	container.innerHTML = body;
	return Array.from(container.querySelectorAll('*'));
}

describe('dynamic element hydration', () => {
	it.each([
		['div', { innerHTML: '{"count":1}' }],
		['div', {}],
		['input', { value: 'initial' }],
	])('claims a childless %s inside its parent (%j)', async (tag, attrs) => {
		const props = { tag, ...attrs };
		const [section, record] = await prepare('Nested', props);
		const html = container.innerHTML;
		const unmount = hydrate(client.Nested, { target: container, props });
		try {
			expect(container.innerHTML).toBe(html);
			expect(container.querySelector('section')).toBe(section);
			expect(container.querySelector('#record')).toBe(record);
			expect(record.parentElement).toBe(section);
			expect(record.isConnected).toBe(true);
			expect(section.hasAttribute('id')).toBe(false);
			expect(container.querySelectorAll('#record')).toHaveLength(1);
			if (tag === 'input') expect(record.value).toBe('initial');
		} finally {
			unmount();
		}
		expect(container.innerHTML).toBeHtml('');
	});

	it('claims adjacent tags in order and keeps their updates and replacements in place', async () => {
		await prepare('Siblings');
		const section = container.querySelector('section');
		const record = container.querySelector('#record');
		const input = container.querySelector('#field');
		const before = container.querySelector('b');
		const after = container.querySelector('p');
		const buttons = Array.from(container.querySelectorAll('button'));
		const unmount = hydrate(client.Siblings, { target: container });
		try {
			expect(container.querySelector('#record')).toBe(record);
			expect(container.querySelector('#field')).toBe(input);
			expect(record.previousElementSibling).toBe(before);
			expect(record.nextElementSibling).toBe(input);
			buttons[0].click();
			flushSync();
			expect(record.innerHTML).toBe('<em>1</em>');
			expect(record.getAttribute('data-count')).toBe('1');
			expect(input.value).toBe('value-1');
			expect(container.querySelector('#record')).toBe(record);
			buttons[1].click();
			flushSync();
			const replacement = container.querySelector('#record');
			expect(replacement.tagName).toBe('ARTICLE');
			expect(replacement.innerHTML).toBe('<em>1</em>');
			expect(replacement.previousElementSibling).toBe(before);
			expect(replacement.nextElementSibling).toBe(input);
			expect(record.isConnected).toBe(false);
			expect(container.querySelector('section')).toBe(section);
			expect(container.querySelector('p')).toBe(after);
		} finally {
			unmount();
		}
		expect(container.innerHTML).toBeHtml('');
	});

	it.each(['ComponentTarget', 'Root', 'Svg'])(
		'preserves the server nodes and sibling traversal for %s',
		async (name) => {
			const nodes = await prepare(name);
			const html = container.innerHTML;
			const unmount = hydrate(client[name], { target: container });
			try {
				expect(container.innerHTML).toBe(html);
				const hydrated = Array.from(container.querySelectorAll('*'));
				expect(hydrated).toHaveLength(nodes.length);
				for (let i = 0; i < nodes.length; i++) expect(hydrated[i]).toBe(nodes[i]);
			} finally {
				unmount();
			}
			expect(container.innerHTML).toBeHtml('');
		},
	);
});
