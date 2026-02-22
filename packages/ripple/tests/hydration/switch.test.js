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

	it('hydrates reactive switch block with numeric cases', async () => {
		await hydrateComponent(
			ServerComponents.SwitchNumericLevels,
			ClientComponents.SwitchNumericLevels,
		);
		const button = container.querySelector('.level-toggle');

		expect(container.querySelector('.level-1')?.textContent).toBe('Level 1');

		button?.click();
		flushSync();
		expect(container.querySelector('.level-1')).toBeNull();
		expect(container.querySelector('.level-2')?.textContent).toBe('Level 2');

		button?.click();
		flushSync();
		expect(container.querySelector('.level-2')).toBeNull();
		expect(container.querySelector('.level-3')?.textContent).toBe('Level 3');

		button?.click();
		flushSync();
		expect(container.querySelector('.level-3')).toBeNull();
		expect(container.querySelector('.level-1')?.textContent).toBe('Level 1');
	});

	it('hydrates switch block with block-scoped cases and break', async () => {
		await hydrateComponent(ServerComponents.SwitchBlockScoped, ClientComponents.SwitchBlockScoped);
		const button = container.querySelector('.block-toggle');

		// With break inside block scope, each case should render exclusively
		expect(container.querySelector('.block-1')?.textContent).toBe('Block 1');
		expect(container.querySelector('.block-2')).toBeNull();
		expect(container.querySelector('.block-3')).toBeNull();

		button?.click();
		flushSync();
		expect(container.querySelector('.block-1')).toBeNull();
		expect(container.querySelector('.block-2')?.textContent).toBe('Block 2');
		expect(container.querySelector('.block-3')).toBeNull();

		button?.click();
		flushSync();
		expect(container.querySelector('.block-2')).toBeNull();
		expect(container.querySelector('.block-3')?.textContent).toBe('Block 3');
	});

	it('hydrates switch block without break statements (fallthrough)', async () => {
		await hydrateComponent(ServerComponents.SwitchNoBreak, ClientComponents.SwitchNoBreak);
		const button = container.querySelector('.nobreak-toggle');

		// With level=1, all 3 cases fall through (1, 2, 3)
		expect(container.querySelector('.nobreak-1')?.textContent).toBe('NoBreak 1');
		expect(container.querySelector('.nobreak-2')?.textContent).toBe('NoBreak 2');
		expect(container.querySelector('.nobreak-3')?.textContent).toBe('NoBreak 3');

		button?.click();
		flushSync();
		// With level=2, cases 2 and 3 fall through
		expect(container.querySelector('.nobreak-1')).toBeNull();
		expect(container.querySelector('.nobreak-2')?.textContent).toBe('NoBreak 2');
		expect(container.querySelector('.nobreak-3')?.textContent).toBe('NoBreak 3');

		button?.click();
		flushSync();
		// With level=3, only case 3
		expect(container.querySelector('.nobreak-1')).toBeNull();
		expect(container.querySelector('.nobreak-2')).toBeNull();
		expect(container.querySelector('.nobreak-3')?.textContent).toBe('NoBreak 3');
	});
});
