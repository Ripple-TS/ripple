import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/if.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/if.js';

describe('hydration > if blocks', () => {
	it('hydrates if block showing truthy branch', async () => {
		await hydrateComponent(ServerComponents.IfTruthy, ClientComponents.IfTruthy);
		expect(container.querySelector('.shown')?.textContent).toBe('Visible');
	});

	it('hydrates if block showing falsy branch', async () => {
		await hydrateComponent(ServerComponents.IfFalsy, ClientComponents.IfFalsy);
		expect(container.querySelector('.shown')).toBeNull();
	});

	it('hydrates if-else block', async () => {
		await hydrateComponent(ServerComponents.IfElse, ClientComponents.IfElse);
		expect(container.querySelector('.logged-in')?.textContent).toBe('Welcome back!');
		expect(container.querySelector('.logged-out')).toBeNull();
	});

	it('hydrates reactive if block and toggles content', async () => {
		await hydrateComponent(ServerComponents.ReactiveIf, ClientComponents.ReactiveIf);
		const button = container.querySelector('.toggle');

		expect(container.querySelector('.content')?.textContent).toBe('Content visible');

		button?.click();
		flushSync();
		expect(container.querySelector('.content')).toBeNull();

		button?.click();
		flushSync();
		expect(container.querySelector('.content')?.textContent).toBe('Content visible');
	});

	it('hydrates reactive if-else block', async () => {
		await hydrateComponent(ServerComponents.ReactiveIfElse, ClientComponents.ReactiveIfElse);
		const button = container.querySelector('.toggle');

		expect(container.querySelector('.off')?.textContent).toBe('OFF');
		expect(container.querySelector('.on')).toBeNull();

		button?.click();
		flushSync();
		expect(container.querySelector('.on')?.textContent).toBe('ON');
		expect(container.querySelector('.off')).toBeNull();
	});

	it('hydrates nested if blocks', async () => {
		await hydrateComponent(ServerComponents.NestedIf, ClientComponents.NestedIf);

		expect(container.querySelector('.outer-content')).not.toBeNull();
		expect(container.querySelector('.inner-content')?.textContent).toBe('Inner');

		// Toggle inner off
		container.querySelector('.inner-toggle')?.click();
		flushSync();
		expect(container.querySelector('.outer-content')).not.toBeNull();
		expect(container.querySelector('.inner-content')).toBeNull();

		// Toggle outer off
		container.querySelector('.outer-toggle')?.click();
		flushSync();
		expect(container.querySelector('.outer-content')).toBeNull();
		expect(container.querySelector('.inner-content')).toBeNull();
	});

	it('hydrates if-else-if chain', async () => {
		await hydrateComponent(ServerComponents.IfElseIfChain, ClientComponents.IfElseIfChain);
		expect(container.querySelector('.state')?.textContent).toBe('Loading...');

		container.querySelector('.success')?.click();
		flushSync();
		expect(container.querySelector('.state')?.textContent).toBe('Success!');

		container.querySelector('.error')?.click();
		flushSync();
		expect(container.querySelector('.state')?.textContent).toBe('Error occurred');
	});

	it('hydrates a branch that declares a style block and shadows an outer local', async () => {
		await hydrateComponent(
			ServerComponents.IfBranchDeclarations,
			ClientComponents.IfBranchDeclarations,
		);
		const server_class = container.querySelector('.styled')?.className;
		expect(server_class).toMatch(/^tsrx-\S+ styled$/);
		expect(container.querySelector('.styled')?.textContent).toBe('inner');

		container.querySelector('.branch-toggle')?.click();
		flushSync();
		expect(container.querySelector('.styled')).toBeNull();
		expect(container.querySelector('.plain')?.textContent).toBe('outer');

		// The client renders the branch with the class the server rendered.
		container.querySelector('.branch-toggle')?.click();
		flushSync();
		expect(container.querySelector('.styled')?.className).toBe(server_class);
		expect(container.querySelector('.styled')?.textContent).toBe('inner');
	});
});
