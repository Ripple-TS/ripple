import { describe, it, expect, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/fragment-component.js';
import * as ClientComponents from './compiled/client/fragment-component.js';

describe('hydration > fragment around a component', () => {
	it('preserves a conditional child button, its focus, and its click handler', async () => {
		const onClick = vi.fn();
		const props = { label: 'Click', onClick };
		const { body, topLevelError } = await render(() => ServerComponents.App(props));
		expect(topLevelError).toBeNull();
		container.innerHTML = body;
		// The only boundary belongs to Row's @if; the outer fragment adds none.
		expect(container.querySelector('main').innerHTML).toBe(
			'<!--[--><button aria-label="Click">Press</button><!--]-->',
		);
		const button = container.querySelector('button');
		expect(button).not.toBeNull();
		button.focus();

		const unmount = hydrate(ClientComponents.App, { target: container, props });
		try {
			expect(container.querySelector('button')).toBe(button);
			expect(document.activeElement).toBe(button);
			button.click();
			expect(onClick).toHaveBeenCalledTimes(1);
		} finally {
			unmount();
		}
		expect(container.innerHTML).toBeHtml('');
	});

	for (const wrapper of ['FragmentRoot', 'FragmentWithSiblings']) {
		it.each([
			['Row', 'Click', 1],
			['Row', '', 0],
			['LoopChild', 'Click', 2],
			['LoopChild', '', 0],
			['SwitchChild', 'Click', 1],
			['SwitchChild', '', 0],
			['TryChild', 'Click', 1],
			['PlainChild', 'Click', 1],
			['EmptyChild', '', 0],
			['NestedChild', 'Click', 1],
			['BranchLocalChild', 'Click', 1],
		])(`hydrates ${wrapper} around %s with label %j`, async (child, label, count) => {
			const onClick = vi.fn();
			const props = { label, onClick };
			const { body, topLevelError } = await render(() =>
				ServerComponents[wrapper]({ ...props, Child: ServerComponents[child] }),
			);
			expect(topLevelError).toBeNull();
			container.innerHTML = body;
			const elements = Array.from(container.querySelectorAll('*'));
			const buttons = Array.from(container.querySelectorAll('button'));
			expect(buttons).toHaveLength(count + (wrapper === 'FragmentWithSiblings' ? 1 : 0));

			const unmount = hydrate(ClientComponents[wrapper], {
				target: container,
				props: { ...props, Child: ClientComponents[child] },
			});
			try {
				expect(container.innerHTML).toBe(body);
				Array.from(container.querySelectorAll('*')).forEach((element, index) => {
					expect(element).toBe(elements[index]);
				});
				buttons.forEach((button) => button.click());
				expect(onClick).toHaveBeenCalledTimes(buttons.length);
			} finally {
				unmount();
			}
			expect(container.innerHTML).toBeHtml('');
		});
	}

	it('updates the conditional child without removing its trailing sibling', async () => {
		const { body } = await render(ServerComponents.ToggleChild);
		container.innerHTML = body;
		const button = container.querySelector('[aria-label]');
		const restore = container.querySelector('[data-after]');
		const unmount = hydrate(ClientComponents.ToggleChild, { target: container });
		try {
			expect(container.querySelector('[aria-label]')).toBe(button);
			button.click();
			flushSync();
			expect(container.querySelector('[aria-label]')).toBeNull();
			expect(container.querySelector('[data-after]')).toBe(restore);

			restore.click();
			flushSync();
			expect(container.querySelector('[aria-label]')?.textContent).toBe('Press');
			expect(container.querySelector('[data-after]')).toBe(restore);
		} finally {
			unmount();
		}
		expect(container.innerHTML).toBeHtml('');
	});
});
