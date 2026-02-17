import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/switch.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/switch.js';

describe('hydration > switch blocks', () => {
	it('hydrates static switch block', async () => {
		await hydrateComponent(ServerComponents.SwitchStatic, ClientComponents.SwitchStatic);
		expect(container.querySelector('.status-success')?.textContent).toBe('Success');
	});

	it('hydrates reactive switch block and updates', async () => {
		await hydrateComponent(ServerComponents.SwitchReactive, ClientComponents.SwitchReactive);
		const button = container.querySelector('.toggle');

		expect(container.querySelector('.case-a')?.textContent).toBe('Case A');

		button?.click();
		flushSync();
		expect(container.querySelector('.case-a')).toBeNull();
		expect(container.querySelector('.case-b')?.textContent).toBe('Case B');

		button?.click();
		flushSync();
		expect(container.querySelector('.case-b')).toBeNull();
		expect(container.querySelector('.case-c')?.textContent).toBe('Case C');

		button?.click();
		flushSync();
		expect(container.querySelector('.case-c')).toBeNull();
		expect(container.querySelector('.case-a')?.textContent).toBe('Case A');
	});

	it('hydrates switch block with fallthrough', async () => {
		await hydrateComponent(ServerComponents.SwitchFallthrough, ClientComponents.SwitchFallthrough);
		expect(container.querySelector('.case-1-2')?.textContent).toBe('1 or 2');
	});
});
