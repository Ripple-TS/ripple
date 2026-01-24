import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/reactivity.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/reactivity.js';

describe('hydration > reactivity', () => {
	it('hydrates tracked state', async () => {
		await hydrateComponent(ServerComponents.TrackedState, ClientComponents.TrackedState);
		const countDiv = container.querySelector('.count');
		expect(countDiv?.textContent).toBe('0');
	});

	it('hydrates counter with initial value', async () => {
		await hydrateComponent(ServerComponents.CounterWrapper, ClientComponents.CounterWrapper);
		expect(container.querySelector('.count')?.textContent).toBe('5');
	});

	it('hydrates computed values', async () => {
		await hydrateComponent(ServerComponents.ComputedValues, ClientComponents.ComputedValues);
		expect(container.querySelector('.sum')?.textContent).toBe('5');
	});

	it('hydrates multiple tracked values', async () => {
		await hydrateComponent(ServerComponents.MultipleTracked, ClientComponents.MultipleTracked);
		expect(container.querySelector('.x')?.textContent).toBe('10');
		expect(container.querySelector('.y')?.textContent).toBe('20');
		expect(container.querySelector('.z')?.textContent).toBe('30');
	});

	it('hydrates derived state', async () => {
		await hydrateComponent(ServerComponents.DerivedState, ClientComponents.DerivedState);
		expect(container.querySelector('.name')?.textContent).toBe('John Doe');
	});
});
