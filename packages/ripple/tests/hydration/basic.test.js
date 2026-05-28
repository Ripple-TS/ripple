import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
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

	it('hydrates deeply nested tsx and tsrx expression values', async () => {
		await hydrateComponent(
			ServerComponents.NestedTsxTsrxExpressionValues,
			ClientComponents.NestedTsxTsrxExpressionValues,
		);

		expect(
			Array.from(container.querySelectorAll('.app-item')).map((node) => node.textContent),
		).toEqual(['1', '2', '3']);
		expect(container.querySelector('.label')?.textContent).toBe('from helper');
		expect(
			Array.from(container.querySelectorAll('.helper-item')).map((node) => node.textContent),
		).toEqual(['1', '2', '3', '4']);
	});

	it('hydrates mixed tsrx collection text without duplicating server text', async () => {
		await hydrateComponent(
			ServerComponents.MixedTsrxCollectionText,
			ClientComponents.MixedTsrxCollectionText,
		);

		const collection = container.querySelector('.mixed-collection');
		expect(collection?.textContent).toBe('alpha beta gamma delta epsilon zeta');
		expect(collection?.querySelector('.middle')?.textContent).toBe('beta');
		expect(collection?.querySelector('.tail')?.textContent).toBe('epsilon');
	});

	it('hydrates split mixed collection text when the client updates a coalesced server text segment', async () => {
		await hydrateComponent(
			ServerComponents.MixedTsrxCollectionSplitServerText,
			ClientComponents.MixedTsrxCollectionSplitClientText,
		);

		const collection = container.querySelector('.mixed-collection-split');
		expect(collection?.textContent).toBe('alpha beta gamma changed epsilon zeta');
		expect(collection?.querySelector('.middle')?.textContent).toBe('beta');
		expect(collection?.querySelector('.tail')?.textContent).toBe('epsilon');
	});

	it('hydrates primitive mixed collection text with client/server text differences', async () => {
		await hydrateComponent(
			ServerComponents.MixedTsrxCollectionPrimitiveServerText,
			ClientComponents.MixedTsrxCollectionPrimitiveClientText,
		);

		const collection = container.querySelector('.mixed-collection-primitive');
		expect(collection?.textContent).toBe('count: 2 / false ok');
		expect(collection?.querySelector('.primitive-tail')?.textContent).toBe(' ok');
	});

	it('hydrates dynamic array values returned from calls without comma stringification', async () => {
		await hydrateComponent(
			ServerComponents.DynamicArrayFromCall,
			ClientComponents.DynamicArrayFromCall,
		);

		expect(container.querySelector('.dynamic-array-call')?.textContent).toBe(
			'start:one2truefalse:end',
		);
	});

	it('hydrates dynamic array values from tracked state without comma stringification', async () => {
		await hydrateComponent(
			ServerComponents.DynamicArrayFromTrack,
			ClientComponents.DynamicArrayFromTrack,
		);

		expect(container.querySelector('.dynamic-array-track')?.textContent).toBe(
			'start:one2truefalse:end',
		);
	});

	it('hydrates dynamic array values from conditionals without comma stringification', async () => {
		await hydrateComponent(
			ServerComponents.DynamicArrayFromConditional,
			ClientComponents.DynamicArrayFromConditional,
		);

		expect(container.querySelector('.dynamic-array-conditional')?.textContent).toBe(
			'start:one2truefalse:end',
		);
	});

	it('hydrates dynamic array values from logical expressions without comma stringification', async () => {
		await hydrateComponent(
			ServerComponents.DynamicArrayFromLogical,
			ClientComponents.DynamicArrayFromLogical,
		);

		expect(container.querySelector('.dynamic-array-logical')?.textContent).toBe(
			'start:one2truefalse:end',
		);
	});

	it('hydrates tsrx nested directly inside a top-level tsx expression value', async () => {
		await hydrateComponent(
			ServerComponents.NestedTsrxInsideTopLevelTsxExpression,
			ClientComponents.NestedTsrxInsideTopLevelTsxExpression,
		);

		const outer = container.querySelector('.outer');
		expect(outer).toBeTruthy();
		expect(outer?.querySelector('.inner')?.textContent).toBe('from tsrx');
	});

	it('hydrates nested elements from tsrx inside a top-level tsx value', async () => {
		await hydrateComponent(
			ServerComponents.NestedTsrxElementsInsideTopLevelTsxValue,
			ClientComponents.NestedTsrxElementsInsideTopLevelTsxValue,
		);

		const native = container.querySelector('.native');
		expect(native).toBeTruthy();
		expect(native?.querySelector('.nested-tsrx')?.textContent).toBe('inside nested tsrx');
	});

	it('hydrates tsx declared before a top-level tsx value', async () => {
		await hydrateComponent(
			ServerComponents.TsxDeclaredBeforeTopLevelTsx,
			ClientComponents.TsxDeclaredBeforeTopLevelTsx,
		);

		const native = container.querySelector('.native');
		expect(native).toBeTruthy();
		expect(native?.querySelector('.nested-tsx')?.textContent).toBe('inside nested tsx');
	});

	it('restores text children after hydrating away initial server text', async () => {
		await hydrateComponent(
			ServerComponents.TextPropWithToggle,
			ClientComponents.TextPropWithToggle,
		);

		expect(container.querySelector('.text-prop')?.textContent).toBe('');

		/** @type {any} */ (container.querySelector('.show-text'))?.click();
		flushSync();

		expect(container.querySelector('.text-prop')?.textContent).toBe('hello');

		// Verify text is placed between hydration markers, not before anchor
		const innerHTML = container.querySelector('.text-prop')?.innerHTML ?? '';
		const textIndex = innerHTML.indexOf('hello');
		const startMarker = innerHTML.indexOf('<!--[-->');
		const endMarker = innerHTML.indexOf('<!--]-->');
		expect(textIndex).toBeGreaterThan(startMarker);
		expect(textIndex).toBeLessThan(endMarker);
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
