import { describe, expect, it } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container, hydrateComponent } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/empty-fragment.js';
import * as ClientComponents from './compiled/client/empty-fragment.js';

describe('hydration > empty fragments', () => {
	it.each([
		'TrailingInElement',
		'TrailingInFragment',
		'LeadingInElement',
		'LeadingInFragment',
		'ConsecutiveInElement',
		'ConsecutiveInFragment',
		'BetweenStaticSiblings',
	])('hydrates %s without replacing its server-rendered sibling', async (name) => {
		const { body, topLevelError } = await render(ServerComponents[name]);
		expect(topLevelError).toBeNull();
		container.innerHTML = body;
		const row = container.querySelector('[data-row]');
		expect(row).not.toBeNull();
		const last = container.querySelector('b');
		const html = container.innerHTML;

		const unmount = hydrate(ClientComponents[name], { target: container });
		try {
			expect(container.querySelector('[data-row]')).toBe(row);
			expect(container.querySelector('b')).toBe(last);
			expect(container.innerHTML).toBe(html);
		} finally {
			unmount();
		}
		expect(container.innerHTML).toBeHtml('');
	});

	it.each(['Empty', 'NestedEmpty'])('hydrates %s as the root component', async (name) => {
		const { unmount } = await hydrateComponent(ServerComponents[name], ClientComponents[name]);
		try {
			expect(container.innerHTML).toBeHtml('');
		} finally {
			unmount();
		}
	});

	it('can replace a hydrated empty fragment and render it again', async () => {
		const { body } = await render(ServerComponents.ToggleEmpty);
		container.innerHTML = body;
		const row = container.querySelector('[data-row]');
		const button = container.querySelector('button');
		const unmount = hydrate(ClientComponents.ToggleEmpty, { target: container });
		try {
			expect(container.querySelector('b')).toBeNull();
			button.click();
			flushSync();
			expect(container.querySelector('b')?.textContent).toBe('child');
			expect(container.querySelector('[data-row]')).toBe(row);

			button.click();
			flushSync();
			expect(container.querySelector('b')).toBeNull();
			expect(container.querySelector('[data-row]')).toBe(row);
			expect(container.querySelector('button')).toBe(button);
		} finally {
			unmount();
		}
		expect(container.innerHTML).toBeHtml('');
	});
});
