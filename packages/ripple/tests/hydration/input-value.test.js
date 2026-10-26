import { describe, expect, it } from 'vitest';
import { bindValue, flushSync, hydrate, mount } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/input-value.js';
import * as client from './compiled/client/input-value.js';

describe('bindValue hydration', () => {
	for (const name of ['Input', 'Textarea']) {
		it.each([false, true])(`${name} preserves early edits (accessors: %s)`, async (accessors) => {
			const props = { transform: accessors ? (value) => value : undefined };
			const { body } = await render(() => server[name](props));
			container.innerHTML = body;
			const input = container.querySelector('input, textarea');
			input.focus();
			input.value = 'typed early';
			input.setSelectionRange(1, 5, 'backward');

			const unmount = hydrate(client[name], { target: container, props });
			try {
				flushSync();
				expect(container.querySelector('input, textarea')).toBe(input);
				expect(document.activeElement).toBe(input);
				expect(input.value).toBe('typed early');
				expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).toEqual([
					1,
					5,
					'backward',
				]);
				expect(container.querySelector('output').textContent).toBe('"typed early"');

				input.value = 'later';
				input.dispatchEvent(new Event('input', { bubbles: true }));
				flushSync();
				expect(container.querySelector('output').textContent).toBe('"later"');
				container.querySelector('button').click();
				flushSync();
				expect(input.value).toBe('');
				expect(container.querySelector('output').textContent).toBe('""');
			} finally {
				unmount();
			}
		});

		it(`${name} initializes an untouched field from the model`, async () => {
			const props = { initial: 'initial' };
			const { body } = await render(() => server[name](props));
			container.innerHTML = body;
			const input = container.querySelector('input, textarea');
			expect(input.value).toBe('');
			const unmount = hydrate(client[name], { target: container, props });
			try {
				flushSync();
				expect(input.value).toBe('initial');
			} finally {
				unmount();
			}
		});
	}

	it('adopts an early edit that clears a server-rendered value', async () => {
		const { body } = await render(server.SeededInput);
		container.innerHTML = body;
		const input = container.querySelector('input');
		expect(input.value).toBe('server');
		input.value = '';
		const unmount = hydrate(client.SeededInput, { target: container });
		try {
			flushSync();
			expect(input.value).toBe('');
			expect(container.querySelector('output').textContent).toBe('""');
		} finally {
			unmount();
		}
	});

	it.each([
		['number', '12.5', 12.5],
		['range', '75', 75],
		['date', '2026-10-25', '2026-10-25'],
	])('adopts early %s edits with the usual value conversion', async (type, edited, expected) => {
		const props = { type, initial: type === 'date' ? '' : 0 };
		const { body } = await render(() => server.Input(props));
		container.innerHTML = body;
		const input = container.querySelector('input');
		input.value = edited;
		const unmount = hydrate(client.Input, { target: container, props });
		try {
			flushSync();
			expect(input.value).toBe(edited);
			expect(container.querySelector('output').textContent).toBe(JSON.stringify(expected));
		} finally {
			unmount();
		}
	});

	it('initializes an untouched range input from the model', async () => {
		const props = { type: 'range', initial: 25 };
		const { body } = await render(() => server.Input(props));
		container.innerHTML = body;
		const input = container.querySelector('input');
		expect(input.value).toBe('50');
		const unmount = hydrate(client.Input, { target: container, props });
		try {
			flushSync();
			expect(input.value).toBe('25');
			expect(container.querySelector('output').textContent).toBe('25');
		} finally {
			unmount();
		}
	});

	it('respects a custom setter when adopting an early edit', async () => {
		const props = { transform: (value) => value.toUpperCase() };
		const { body } = await render(() => server.Input(props));
		container.innerHTML = body;
		const input = container.querySelector('input');
		input.value = 'early';
		const unmount = hydrate(client.Input, { target: container, props });
		try {
			flushSync();
			expect(input.value).toBe('EARLY');
			expect(container.querySelector('output').textContent).toBe('"EARLY"');
		} finally {
			unmount();
		}
	});

	it('uses the ref attachment context for a binding created before hydration and reused on mount', async () => {
		let value = 'model';
		const binding = bindValue(
			() => value,
			(next) => (value = next),
		);
		const props = { binding };
		const { body } = await render(() => server.ExternalBinding(props));
		container.innerHTML = body;
		container.querySelector('input').value = 'early';
		const unmount = hydrate(client.ExternalBinding, { target: container, props });
		try {
			flushSync();
			expect(value).toBe('early');
			expect(container.querySelector('input').value).toBe('early');
		} finally {
			unmount();
		}

		value = 'client';
		const unmount_client = mount(client.ExternalBinding, { target: container, props });
		try {
			flushSync();
			expect(value).toBe('client');
			expect(container.querySelector('input').value).toBe('client');
		} finally {
			unmount_client();
		}
	});
});
