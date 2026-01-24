import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/basic.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/basic.js';

describe('hydration > basic', () => {
	it('hydrates static text content', async () => {
		await hydrateComponent(ServerComponents.StaticText, ClientComponents.StaticText);
		expect(container.innerHTML).toBeHtml('<div>Hello World</div>');
	});

	it('hydrates multiple static elements', async () => {
		await hydrateComponent(ServerComponents.MultipleElements, ClientComponents.MultipleElements);
		expect(container.innerHTML).toBeHtml(
			'<h1>Title</h1><p>Paragraph text</p><span>Span text</span>',
		);
	});

	it('hydrates nested elements', async () => {
		await hydrateComponent(ServerComponents.NestedElements, ClientComponents.NestedElements);
		expect(container.innerHTML).toBeHtml(
			'<div class="outer"><div class="inner"><span>Nested content</span></div></div>',
		);
	});

	it('hydrates with attributes', async () => {
		await hydrateComponent(ServerComponents.WithAttributes, ClientComponents.WithAttributes);
		expect(container.querySelector('input')?.getAttribute('type')).toBe('text');
		expect(container.querySelector('input')?.getAttribute('placeholder')).toBe('Enter text');
		expect(container.querySelector('input')?.hasAttribute('disabled')).toBe(true);
		expect(container.querySelector('a')?.getAttribute('href')).toBe('/link');
		expect(container.querySelector('a')?.getAttribute('target')).toBe('_blank');
	});

	it('hydrates child component', async () => {
		await hydrateComponent(ServerComponents.ParentWithChild, ClientComponents.ParentWithChild);
		expect(container.innerHTML).toBeHtml(
			'<div class="parent"><span class="child">Child content</span></div>',
		);
	});

	it('hydrates sibling components', async () => {
		await hydrateComponent(ServerComponents.SiblingComponents, ClientComponents.SiblingComponents);
		expect(container.innerHTML).toBeHtml(
			'<div class="first">First</div><div class="second">Second</div>',
		);
	});

	it('hydrates with dynamic text from props', async () => {
		await hydrateComponent(ServerComponents.WithGreeting, ClientComponents.WithGreeting);
		expect(container.innerHTML).toBeHtml('<div>Hello World</div>');
	});

	it('hydrates expression content', async () => {
		await hydrateComponent(ServerComponents.ExpressionContent, ClientComponents.ExpressionContent);
		expect(container.innerHTML).toBeHtml('<div>42</div><span>COMPUTED</span>');
	});
});
