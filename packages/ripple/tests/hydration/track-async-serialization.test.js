import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/track-async-serialization.js';
import * as ClientComponents from './compiled/client/track-async-serialization.js';

const TRACK_ASYNC_PUBLIC_ERROR_MESSAGE = 'An error occurred during async rendering';

describe('hydration > trackAsync serialization', () => {
	it('hydrates simple string value from serialized trackAsync', async () => {
		await hydrateComponent(ServerComponents.AsyncSimpleValue, ClientComponents.AsyncSimpleValue);

		expect(container.querySelector('.result')?.textContent).toBe('hydrated value');
		expect(container.querySelector('.loading')).toBeNull();

		// Serialization script tags should be removed after hydration
		expect(container.querySelector('script[id^="__tsrx_ta_"]')).toBeNull();
	});

	it('hydrates numeric value from serialized trackAsync', async () => {
		await hydrateComponent(ServerComponents.AsyncNumericValue, ClientComponents.AsyncNumericValue);

		expect(container.querySelector('.count')?.textContent).toBe('42');
		expect(container.querySelector('.pending')).toBeNull();
	});

	it('hydrates object value from serialized trackAsync', async () => {
		await hydrateComponent(ServerComponents.AsyncObjectValue, ClientComponents.AsyncObjectValue);

		expect(container.querySelector('.name')?.textContent).toBe('Alice');
		expect(container.querySelector('.age')?.textContent).toBe('30');
		expect(container.querySelector('.loading')).toBeNull();
	});

	it('hydrates rejected trackAsync and shows catch content', async () => {
		await hydrateComponent(ServerComponents.AsyncWithCatch, ClientComponents.AsyncWithCatch);

		expect(container.querySelector('.error')?.textContent).toBe(TRACK_ASYNC_PUBLIC_ERROR_MESSAGE);
		expect(container.querySelector('.result')).toBeNull();
		expect(container.querySelector('.loading')).toBeNull();
		expect(container.querySelector('script[id^="__tsrx_ta_"]')).toBeNull();
	});

	it('hydrates child trackAsync error bubbled to parent catch', async () => {
		await hydrateComponent(ServerComponents.ParentWithCatch, ClientComponents.ParentWithCatch);

		expect(container.querySelector('.parent-error')?.textContent).toBe(
			TRACK_ASYNC_PUBLIC_ERROR_MESSAGE,
		);
		expect(container.querySelector('.result')).toBeNull();
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('script[id^="__tsrx_ta_"]')).toBeNull();
	});

	it('reruns trackAsync when a dependency changes after hydration', async () => {
		await hydrateComponent(
			ServerComponents.AsyncWithReactiveDependency,
			ClientComponents.AsyncWithReactiveDependency,
		);

		// Hydrated value from SSR should match `count-0`
		expect(container.querySelector('.result')?.textContent).toBe('count-0');
		expect(container.querySelector('.loading')).toBeNull();

		/** @type {any} */ (container.querySelector('.increment'))?.click();
		flushSync();
		// Wait for the trackAsync promise to resolve
		await Promise.resolve();
		await Promise.resolve();
		flushSync();

		expect(container.querySelector('.result')?.textContent).toBe('count-1');
	});

	it('hydrates multiple trackAsync values independently', async () => {
		await hydrateComponent(
			ServerComponents.AsyncMultipleValues,
			ClientComponents.AsyncMultipleValues,
		);

		expect(container.querySelector('.first')?.textContent).toBe('alpha');
		expect(container.querySelector('.second')?.textContent).toBe('beta');
		expect(container.querySelector('.loading')).toBeNull();
	});
});
