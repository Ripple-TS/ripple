import { describe, expect, it, vi } from 'vitest';
import { effect, flushSync, track } from 'ripple';
import { Probe } from '../fixtures/consumer/client.js';
import { renderProbe } from '../fixtures/consumer/dist/server/index.js';
import { advanceTimers, cleanup, createControlledPromise, fireEvent, render } from '../harness.js';

describe('router package foundation', () => {
	it('compiles a dependency component, updates its DOM, and disposes its effects', () => {
		const onMount = vi.fn();
		const onDispose = vi.fn();
		const view = render(Probe, { props: { onMount, onDispose } });
		const button = view.getByRole('button', { name: 'Clicks: 0' });
		expect(button.dataset.path).toBe('/foundation');
		expect(onMount).toHaveBeenCalledTimes(1);
		fireEvent.click(button);
		flushSync();
		expect(view.getByRole('button', { name: 'Clicks: 1' })).toBe(button);
		view.unmount();
		view.unmount();
		expect(onDispose).toHaveBeenCalledTimes(1);
		expect(view.container.isConnected).toBe(false);
		fireEvent.click(button);
		flushSync();
		expect(button.textContent).toContain('Clicks: 1');
	});

	it('hydrates the server build and disposes the hydrated root', async () => {
		const { body, topLevelError } = await renderProbe();
		expect(topLevelError).toBeFalsy();
		const onDispose = vi.fn();
		let serverButton: HTMLButtonElement | null = null;
		const view = render(Probe, {
			html: body,
			props: { onDispose },
			beforeHydrate: (container) => {
				serverButton = container.querySelector('button');
			},
		});
		expect(view.container.querySelectorAll('button')).toHaveLength(1);
		expect(view.getByRole('button', { name: 'Clicks: 0' })).toBe(serverButton);
		fireEvent.click(view.getByRole('button', { name: 'Clicks: 0' }));
		flushSync();
		expect(view.getByRole('button', { name: 'Clicks: 1' })).toBeTruthy();
		cleanup();
		expect(onDispose).toHaveBeenCalledTimes(1);
		expect(view.container.isConnected).toBe(false);
	});

	it('runs the production client bundle through its own runtime graph', async () => {
		const bundled = await import('../fixtures/consumer/dist/client/index.js');
		const target = document.createElement('div');
		document.body.append(target);
		const onDispose = vi.fn();
		const unmount = bundled.mount(bundled.Probe, { target, props: { onDispose } });
		try {
			const button = target.querySelector('button')!;
			expect(button.dataset.path).toBe('/foundation');
			button.click();
			await Promise.resolve();
			expect(button.textContent).toContain('Clicks: 1');
		} finally {
			unmount();
			target.remove();
		}
		expect(onDispose).toHaveBeenCalledTimes(1);
	});

	it('owns multiple roots and leaves no mounted effects after cleanup', () => {
		const onDispose = vi.fn();
		render(Probe, { props: { onDispose } });
		render(Probe, { props: { onDispose } });
		cleanup();
		expect(onDispose).toHaveBeenCalledTimes(2);
		expect(document.body.childElementCount).toBe(0);
	});

	it('controls promise settlement and timer deadlines without arbitrary sleeps', async () => {
		vi.useFakeTimers();
		const gate = createControlledPromise<string>();
		const settle = vi.fn(() => gate.resolve('ready'));
		function Pending() @{
			const text = track('waiting');
			effect(() => {
				const timer = setTimeout(settle, 25);
				let active = true;
				void gate.then((value) => {
					if (active) text.value = value;
				});
				return () => {
					active = false;
					clearTimeout(timer);
				};
			});
			<p>{text.value}</p>
		}
		const view = render(Pending);
		await advanceTimers(24);
		expect(view.getByText('waiting')).toBeTruthy();
		await advanceTimers(1);
		expect(view.getByText('ready')).toBeTruthy();
		view.unmount();
		// A second root is removed before its deadline; its timeout must not fire.
		const cancelled = render(Pending);
		cancelled.unmount();
		await advanceTimers(25);
		expect(settle).toHaveBeenCalledTimes(1);
	});
});
