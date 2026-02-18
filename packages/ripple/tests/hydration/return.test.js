import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/return.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/return.js';

describe('hydration > early returns', () => {
	it('hydrates early return when guard returns before trailing content', async () => {
		await hydrateComponent(
			ServerComponents.EarlyReturnStaticTrue,
			ClientComponents.EarlyReturnStaticTrue,
		);

		expect(container.querySelector('.before')?.textContent).toBe('Before');
		expect(container.querySelector('.after')).toBeNull();
	});

	it('hydrates early return when guard does not return and trailing content renders', async () => {
		await hydrateComponent(
			ServerComponents.EarlyReturnStaticFalse,
			ClientComponents.EarlyReturnStaticFalse,
		);

		expect(container.querySelector('.before')).toBeNull();
		expect(container.querySelector('.after')?.textContent).toBe('After');
	});

	it('hydrates reactive early return and toggles between branches', async () => {
		await hydrateComponent(
			ServerComponents.ReactiveEarlyReturn,
			ClientComponents.ReactiveEarlyReturn,
		);

		const button = container.querySelector('.toggle');
		expect(container.querySelector('.stop')?.textContent).toBe('Stopped');
		expect(container.querySelector('.after')).toBeNull();

		button?.click();
		flushSync();
		expect(container.querySelector('.stop')).toBeNull();
		expect(container.querySelector('.after')?.textContent).toBe('After');

		button?.click();
		flushSync();
		expect(container.querySelector('.stop')?.textContent).toBe('Stopped');
		expect(container.querySelector('.after')).toBeNull();
	});

	it('hydrates lone return guard and toggles trailing content', async () => {
		await hydrateComponent(
			ServerComponents.ReactiveLoneReturn,
			ClientComponents.ReactiveLoneReturn,
		);

		const button = container.querySelector('.toggle-lone');
		expect(container.querySelector('.after-lone')).toBeNull();

		button?.click();
		flushSync();
		expect(container.querySelector('.after-lone')?.textContent).toBe('After lone');

		button?.click();
		flushSync();
		expect(container.querySelector('.after-lone')).toBeNull();
	});
});
