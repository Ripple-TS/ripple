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

	it('hydrates component with simple portal gracefully', async () => {
		try {
			await hydrateComponent(ServerComponents.SimplePortal, ClientComponents.SimplePortal);
		} catch (error) {
			console.error('Hydration error:', error);
			console.error('Stack:', error.stack);
			throw error;
		}
		
		// Flush any pending updates
		flushSync();
		
		// Main content should be in the container
		expect(container.querySelector('.container')).toBeTruthy();
		expect(container.querySelector('h1')?.textContent).toBe('Main Content');
		
		// Portal content should NOT be in the container (it's in document.body)
		expect(container.querySelector('.portal-content')).toBeNull();
		
		// Portal content should now be in document.body (after hydration)
		expect(document.body.querySelector('.portal-content')).toBeTruthy();
		expect(document.body.querySelector('.portal-content')?.textContent).toBe('Portal content');
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

		// Debug: log what we're seeing
		console.log('Container HTML:', container.innerHTML);
		console.log('Body HTML:', document.body.innerHTML);
		console.log('Portal query result:', document.body.querySelector('.portal-content'));

		// Portal content should be in document.body
		expect(document.body.querySelector('.portal-content')).toBeTruthy();
		expect(document.body.querySelector('.portal-content')?.textContent).toBe('Modal content');
	});

	it('hydrates nested content with portal', async () => {
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

		// Portal content should be in document.body
		expect(document.body.querySelector('.portal-content')).toBeTruthy();
	});

	it('hydrates portal with conditional rendering', async () => {
		await hydrateComponent(
			ServerComponents.ConditionalPortal,
			ClientComponents.ConditionalPortal,
		);

		// Flush any pending updates
		flushSync();

		// Container should have toggle button
		const button = container.querySelector('.toggle');
		expect(button).toBeTruthy();

		// Initially portal should be visible in document.body
		expect(document.body.querySelector('.portal-content')).toBeTruthy();

		// Toggle off - portal should be removed
		button?.click();
		flushSync();
		expect(document.body.querySelector('.portal-content')).toBeNull();

		// Toggle back on - portal should appear again
		button?.click();
		flushSync();
		expect(document.body.querySelector('.portal-content')).toBeTruthy();
		expect(document.body.querySelector('.portal-content')?.textContent).toBe('Portal is visible');
	});
});
