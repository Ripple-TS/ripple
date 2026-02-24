import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/mixed-control-flow.js';
import * as ClientComponents from './compiled/client/mixed-control-flow.js';

describe('hydration > mixed control flow blocks', () => {
	it('hydrates static composition of if + for + switch + try', async () => {
		await hydrateComponent(
			ServerComponents.MixedControlFlowStatic,
			ClientComponents.MixedControlFlowStatic,
		);

		// Allow the try+pending async transitions to settle (pending → resolved).
		await Promise.resolve();

		const rows = Array.from(container.querySelectorAll('.row')).map((node) => node.textContent);
		expect(rows).toEqual(['A-1', 'B-2']);
		expect(container.querySelector('.row-3')).toBeNull();
		expect(container.querySelector('.pending')).toBeNull();
	});

	it('hydrates reactive composition of if + for + switch + try and updates correctly', async () => {
		await hydrateComponent(
			ServerComponents.MixedControlFlowReactive,
			ClientComponents.MixedControlFlowReactive,
		);

		expect(Array.from(container.querySelectorAll('.item')).map((node) => node.textContent)).toEqual(
			['A:One', 'A:Two'],
		);

		container.querySelector('.toggle-mode')?.click();
		flushSync();
		expect(Array.from(container.querySelectorAll('.item')).map((node) => node.textContent)).toEqual(
			['B:One', 'B:Two'],
		);

		container.querySelector('.add-item')?.click();
		flushSync();
		expect(Array.from(container.querySelectorAll('.item')).map((node) => node.textContent)).toEqual(
			['B:One', 'B:Two', 'B:Three'],
		);

		container.querySelector('.toggle-show')?.click();
		flushSync();
		expect(container.querySelectorAll('.item').length).toBe(0);

		container.querySelector('.toggle-show')?.click();
		flushSync();
		expect(Array.from(container.querySelectorAll('.item')).map((node) => node.textContent)).toEqual(
			['B:One', 'B:Two', 'B:Three'],
		);
	});

	it('hydrates async pending path in mixed control flow without losing leading structure', async () => {
		await hydrateComponent(
			ServerComponents.MixedControlFlowAsyncPending,
			ClientComponents.MixedControlFlowAsyncPending,
		);

		await Promise.resolve();
		flushSync();

		expect(container.querySelector('.before')?.textContent).toBe('before');
		expect(container.querySelector('.pending-row-1')?.textContent).toBe('pending 1');
		expect(container.querySelector('.unexpected')).toBeNull();
	});
});
