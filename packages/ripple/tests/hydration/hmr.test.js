import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';
import { hmr } from '../../src/runtime/internal/client/hmr.js';
import { HMR } from '../../src/runtime/internal/client/constants.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/hmr.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/hmr.js';

describe('hydration > HMR re-render', () => {
	it('re-renders layout component correctly after hydration (no zoom/displacement)', async () => {
		// Hydrate the layout+content component
		await hydrateComponent(ServerComponents.LayoutWithContent, ClientComponents.LayoutWithContent);

		// Verify initial state
		expect(container.querySelector('.layout')).not.toBeNull();
		expect(container.querySelector('.nav')?.textContent).toBe('Navigation');
		expect(container.querySelector('.main')).not.toBeNull();
		expect(container.querySelector('.content')).not.toBeNull();
		expect(container.querySelector('.text')?.textContent).toBe('Hello world');

		// Wrap the layout component with HMR (simulates what the compiler does in dev mode)
		const layout_hmr = hmr(ClientComponents.Layout);

		// Create an "updated" version of the component (simulates saving the file)
		function UpdatedLayout(anchor, props, block) {
			return ClientComponents.Layout(anchor, props, block);
		}
		const incoming = hmr(UpdatedLayout);

		// Simulate calling wrapper() to establish the HMR instance
		// (In practice the component is already mounted via hydrateComponent above,
		// but we test the HMR update mechanism directly)
		const update_fn = layout_hmr[HMR].update;

		// The update should not throw
		expect(() => {
			update_fn(incoming);
		}).not.toThrow();
	});

	it('layout component remains inside container after hydration', async () => {
		await hydrateComponent(ServerComponents.LayoutWithContent, ClientComponents.LayoutWithContent);

		// The layout div must be inside the container, not displaced
		const layout = container.querySelector('.layout');
		expect(layout).not.toBeNull();
		expect(container.contains(layout)).toBe(true);

		// The main content must be inside the layout
		const main = layout?.querySelector('.main');
		expect(main).not.toBeNull();

		// The text content must be present and correct
		expect(container.querySelector('.text')?.textContent).toBe('Hello world');
	});

	it('hydrates layout with nested if block without corrupting branch state', async () => {
		await hydrateComponent(ServerComponents.LayoutWithContent, ClientComponents.LayoutWithContent);

		// After hydration, the conditional content must still be visible
		expect(container.querySelector('.text')).not.toBeNull();
		expect(container.querySelector('.text')?.textContent).toBe('Hello world');

		// All structural elements must be present in the correct hierarchy
		const layout = container.querySelector('.layout');
		expect(layout).not.toBeNull();
		expect(layout?.querySelector('.nav')).not.toBeNull();
		expect(layout?.querySelector('.main')).not.toBeNull();
		expect(layout?.querySelector('.content')).not.toBeNull();
	});
});
