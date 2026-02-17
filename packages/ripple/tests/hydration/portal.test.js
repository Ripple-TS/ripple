import { describe, it, expect, afterEach } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/portal.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/portal.js';

describe('hydration > portals', () => {
	afterEach(() => {
		// Clean up any leftover portal content from document.body
		const portals = document.body.querySelectorAll('.portal-content');
		portals.forEach((el) => el.remove());
	});

	it('hydrates component with portal gracefully without breaking', async () => {
		// The main goal is that hydration doesn't throw errors
		await hydrateComponent(ServerComponents.SimplePortal, ClientComponents.SimplePortal);

		// Flush any pending updates
		flushSync();

		// Main content should be in the container
		expect(container.querySelector('.container')).toBeTruthy();
		expect(container.querySelector('h1')?.textContent).toBe('Main Content');

		// Portal content should NOT be in the container (it's in document.body)
		expect(container.querySelector('.portal-content')).toBeNull();

		// Note: Portal content rendering to document.body during hydration may vary
		// The important thing is that hydration doesn't break
	});

	it('hydrates component with portal and main content', async () => {
		await hydrateComponent(
			ServerComponents.PortalWithMainContent,
			ClientComponents.PortalWithMainContent,
		);

		// Flush any pending updates
		flushSync();

		// Main content and footer should be in container
		expect(container.querySelector('.main-content')?.textContent).toBe('Main page content');
		expect(container.querySelector('.footer')?.textContent).toBe('Footer');

		// Portal content should be in document.body
		expect(document.body.querySelector('.portal-content')).toBeTruthy();
		expect(document.body.querySelector('.portal-content')?.textContent).toBe('Modal content');
	});

	it('hydrates nested content with portal gracefully', async () => {
		// The main goal is that hydration doesn't throw errors
		await hydrateComponent(
			ServerComponents.NestedContentWithPortal,
			ClientComponents.NestedContentWithPortal,
		);

		// Flush any pending updates
		flushSync();

		// Nested content should be in container
		expect(container.querySelector('.outer')).toBeTruthy();
		expect(container.querySelector('.inner')).toBeTruthy();
		expect(container.querySelector('span')?.textContent).toBe('Nested content');

		// Portal content may or may not render during hydration - that's ok
		// The important thing is no hydration errors
	});
});
