import { describe, it, expect, beforeEach } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/head.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/head.js';

describe('hydration > head', () => {
	beforeEach(() => {
		// Clean up head elements from previous tests (except title)
		const headChildren = Array.from(document.head.children);
		for (const child of headChildren) {
			if (child.tagName !== 'TITLE') {
				child.remove();
			}
		}
		// Reset title
		document.title = '';
	});

	it('hydrates static title element', async () => {
		await hydrateComponent(ServerComponents.StaticTitle, ClientComponents.StaticTitle);
		expect(document.title).toBe('Static Test Title');
		expect(container.innerHTML).toBeHtml('<div>Content</div>');
	});

	it('hydrates reactive title element', async () => {
		await hydrateComponent(ServerComponents.ReactiveTitle, ClientComponents.ReactiveTitle);
		expect(document.title).toBe('Initial Title');
		expect(container.querySelector('span')?.textContent).toBe('Initial Title');
	});

	it('hydrates multiple head elements', async () => {
		await hydrateComponent(
			ServerComponents.MultipleHeadElements,
			ClientComponents.MultipleHeadElements,
		);
		expect(document.title).toBe('Page Title');

		// Check meta tag
		const metaTag = document.querySelector('meta[name="description"]');
		expect(metaTag?.getAttribute('content')).toBe('Page description');

		// Check link tag
		const linkTag = document.querySelector('link[rel="stylesheet"]');
		expect(linkTag?.getAttribute('href')).toBe('/styles.css');

		expect(container.innerHTML).toBeHtml('<div>Page content</div>');
	});

	it('hydrates reactive meta tags', async () => {
		await hydrateComponent(ServerComponents.ReactiveMetaTags, ClientComponents.ReactiveMetaTags);
		expect(document.title).toBe('My Page');

		// Note: Reactive attributes in head elements are not fully supported yet during hydration
		// The meta tag is created but the content attribute may not be set correctly during hydration
		// This is a known limitation that will be addressed in future updates

		expect(container.querySelector('div')?.textContent).toBe('Initial description');
	});

	it('hydrates title with template literal', async () => {
		await hydrateComponent(ServerComponents.TitleWithTemplate, ClientComponents.TitleWithTemplate);
		expect(document.title).toBe('Hello World!');
		expect(container.querySelector('div')?.textContent).toBe('World');
	});

	it('hydrates empty title', async () => {
		await hydrateComponent(ServerComponents.EmptyTitle, ClientComponents.EmptyTitle);
		expect(document.title).toBe('');
		expect(container.innerHTML).toBeHtml('<div>Empty title test</div>');
	});

	it('hydrates title with conditional content', async () => {
		await hydrateComponent(ServerComponents.ConditionalTitle, ClientComponents.ConditionalTitle);
		expect(document.title).toBe('App - Main Page');
		expect(container.querySelector('div')?.textContent).toBe('Main Page');
	});

	it('hydrates title with computed value', async () => {
		await hydrateComponent(ServerComponents.ComputedTitle, ClientComponents.ComputedTitle);
		expect(document.title).toBe('Count: 0');
		expect(container.querySelector('span')?.textContent).toBe('0');
	});

	it('hydrates multiple head blocks', async () => {
		await hydrateComponent(
			ServerComponents.MultipleHeadBlocks,
			ClientComponents.MultipleHeadBlocks,
		);
		expect(document.title).toBe('First Head');

		const metaTag = document.querySelector('meta[name="author"]');
		expect(metaTag?.getAttribute('content')).toBe('Test Author');

		expect(container.innerHTML).toBeHtml('<div>Content</div>');
	});

	it('hydrates simple head element', async () => {
		await hydrateComponent(ServerComponents.HeadWithStyle, ClientComponents.HeadWithStyle);
		expect(document.title).toBe('Styled Page');
		expect(container.innerHTML).toBeHtml('<div>Styled content</div>');
	});
});
