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

	it('hydrates static child component followed by sibling content', async () => {
		await hydrateComponent(
			ServerComponents.StaticChildWithSiblings,
			ClientComponents.StaticChildWithSiblings,
		);
		expect(container.querySelector('.sr-only')?.textContent).toBe('heading');
		expect(container.querySelectorAll('.subtitle').length).toBe(2);
		expect(container.querySelector('.sibling1')?.textContent).toBe('bar');
		expect(container.querySelector('.sibling2')?.textContent).toBe('bar');
	});

	it('hydrates website-like component structure', async () => {
		await hydrateComponent(ServerComponents.WebsiteIndex, ClientComponents.WebsiteIndex);
		expect(container.querySelector('.sr-only')?.textContent).toBe('Ripple');
		expect(container.querySelector('.logo')).toBeTruthy();
		expect(container.querySelector('.subtitle')?.textContent).toBe(
			'the elegant TypeScript UI framework',
		);
		expect(container.querySelectorAll('.social-links').length).toBe(2);
		expect(container.querySelector('.playground-link')?.textContent).toBe('Playground');
		expect(container.querySelector('.content')).toBeTruthy();
	});

	// Test for hydrate_advance() in append() - component as last sibling with no following siblings
	it('hydrates component as last sibling (no following siblings)', async () => {
		await hydrateComponent(
			ServerComponents.ComponentAsLastSibling,
			ClientComponents.ComponentAsLastSibling,
		);
		expect(container.querySelector('.wrapper')).toBeTruthy();
		expect(container.querySelector('h1')?.textContent).toBe('Header');
		expect(container.querySelector('p')?.textContent).toBe('Some content');
		expect(container.querySelector('.last-child')?.textContent).toBe('I am the last child');
	});

	it('hydrates nested component with inner component as last sibling', async () => {
		await hydrateComponent(
			ServerComponents.NestedComponentAsLastSibling,
			ClientComponents.NestedComponentAsLastSibling,
		);
		expect(container.querySelector('.outer')).toBeTruthy();
		expect(container.querySelector('h2')?.textContent).toBe('Section title');
		expect(container.querySelector('.inner span')?.textContent).toBe('Inner text');
		expect(container.querySelector('.inner .last-child')?.textContent).toBe('I am the last child');
	});
});
