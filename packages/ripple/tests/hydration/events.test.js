import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/events.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/events.js';

describe('hydration > events', () => {
	it('hydrates button and handles click event', async () => {
		await hydrateComponent(ServerComponents.ClickCounter, ClientComponents.ClickCounter);
		const button = container.querySelector('.increment');
		const countSpan = container.querySelector('.count');

		expect(countSpan?.textContent).toBe('0');

		button?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('1');

		button?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('2');
	});

	it('hydrates counter with increment and decrement', async () => {
		await hydrateComponent(
			ServerComponents.IncrementDecrement,
			ClientComponents.IncrementDecrement,
		);
		const decrementBtn = container.querySelector('.decrement');
		const incrementBtn = container.querySelector('.increment');
		const countSpan = container.querySelector('.count');

		expect(countSpan?.textContent).toBe('0');

		incrementBtn?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('1');

		incrementBtn?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('2');

		decrementBtn?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('1');
	});

	it('hydrates with multiple event handlers', async () => {
		await hydrateComponent(ServerComponents.MultipleEvents, ClientComponents.MultipleEvents);
		const button = container.querySelector('.target');
		const clicksSpan = container.querySelector('.clicks');
		const hoversSpan = container.querySelector('.hovers');

		expect(clicksSpan?.textContent).toBe('0');
		expect(hoversSpan?.textContent).toBe('0');

		button?.click();
		flushSync();
		expect(clicksSpan?.textContent).toBe('1');

		button?.dispatchEvent(new MouseEvent('mouseenter'));
		flushSync();
		expect(hoversSpan?.textContent).toBe('1');
	});

	it('hydrates event handler that updates multiple states', async () => {
		await hydrateComponent(ServerComponents.MultiStateUpdate, ClientComponents.MultiStateUpdate);
		const button = container.querySelector('.btn');
		const countSpan = container.querySelector('.count');
		const actionSpan = container.querySelector('.action');

		expect(countSpan?.textContent).toBe('0');
		expect(actionSpan?.textContent).toBe('none');

		button?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('1');
		expect(actionSpan?.textContent).toBe('increment');
	});

	it('hydrates toggle button', async () => {
		await hydrateComponent(ServerComponents.ToggleButton, ClientComponents.ToggleButton);
		const button = container.querySelector('.toggle');

		expect(button?.textContent).toBe('OFF');

		button?.click();
		flushSync();
		expect(button?.textContent).toBe('ON');

		button?.click();
		flushSync();
		expect(button?.textContent).toBe('OFF');
	});

	it('hydrates child component with event handler', async () => {
		await hydrateComponent(
			ServerComponents.ParentWithChildButton,
			ClientComponents.ParentWithChildButton,
		);
		const button = container.querySelector('.child-btn');
		const countSpan = container.querySelector('.count');

		expect(countSpan?.textContent).toBe('0');

		button?.click();
		flushSync();
		expect(countSpan?.textContent).toBe('1');
	});
});
