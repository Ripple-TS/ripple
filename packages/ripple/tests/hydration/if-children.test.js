import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/if-children.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/if-children.js';

describe('hydration > if blocks with children', () => {
	it('hydrates if block containing component children', async () => {
		await hydrateComponent(
			ServerComponents.TestIfWithChildren,
			ClientComponents.TestIfWithChildren,
		);

		// Should render the children initially (expanded = true)
		const items = container.querySelectorAll('.item');
		expect(items.length).toBe(2);
		expect(items[0]?.textContent).toBe('Item 1');
		expect(items[1]?.textContent).toBe('Item 2');
	});

	it('hydrates if block with static children', async () => {
		await hydrateComponent(
			ServerComponents.IfWithStaticChildren,
			ClientComponents.IfWithStaticChildren,
		);

		const content = container.querySelector('.content');
		expect(content).not.toBeNull();
		expect(content?.querySelectorAll('span').length).toBe(2);
	});

	it('toggles if block with component children after hydration', async () => {
		await hydrateComponent(
			ServerComponents.TestIfWithChildren,
			ClientComponents.TestIfWithChildren,
		);

		// Initially expanded
		expect(container.querySelectorAll('.item').length).toBe(2);

		// Click to collapse
		container.querySelector('.header')?.click();
		flushSync();

		// Children should be hidden
		expect(container.querySelectorAll('.item').length).toBe(0);

		// Click to expand
		container.querySelector('.header')?.click();
		flushSync();

		// Children should be visible again
		expect(container.querySelectorAll('.item').length).toBe(2);
	});

	it('hydrates if block with siblings and children (SidebarGroup pattern)', async () => {
		await hydrateComponent(
			ServerComponents.TestIfWithSiblingsAndChildren,
			ClientComponents.TestIfWithSiblingsAndChildren,
		);

		// Should have the section structure
		expect(container.querySelector('section.group')).not.toBeNull();
		expect(container.querySelector('.item')).not.toBeNull();
		expect(container.querySelector('.caret')).not.toBeNull();

		// Children should be rendered inside .items
		const items = container.querySelectorAll('.items .item');
		expect(items.length).toBe(2);
		expect(items[0]?.textContent).toBe('Item A');
		expect(items[1]?.textContent).toBe('Item B');
	});

	it('toggles if block with siblings and children (SidebarGroup pattern)', async () => {
		await hydrateComponent(
			ServerComponents.TestIfWithSiblingsAndChildren,
			ClientComponents.TestIfWithSiblingsAndChildren,
		);

		// Initially expanded
		expect(container.querySelectorAll('.items .item').length).toBe(2);

		// Click the .item div (not .item inside .items!) to toggle
		container.querySelector('section.group > .item')?.click();
		flushSync();

		// Children should be hidden
		expect(container.querySelector('.items')).toBeNull();

		// Click to expand
		container.querySelector('section.group > .item')?.click();
		flushSync();

		// Children should be visible again
		expect(container.querySelectorAll('.items .item').length).toBe(2);
	});

	// Tests for hydration pop bug: element with nested children followed by dynamic if sibling
	// This ensures hydrate_node is properly restored after processing an element's children
	// before navigating to a dynamic sibling

	it('hydrates element with nested children followed by if sibling', async () => {
		await hydrateComponent(
			ServerComponents.ElementWithChildrenThenIf,
			ClientComponents.ElementWithChildrenThenIf,
		);

		// Verify structure hydrated correctly
		expect(container.querySelector('.nested-parent')).not.toBeNull();
		expect(container.querySelector('.nested-child')).not.toBeNull();
		expect(container.querySelector('.deep')?.textContent).toBe('Deep content');
		expect(container.querySelector('.conditional')?.textContent).toBe('Conditional content');
	});

	it('toggles if sibling after element with nested children', async () => {
		await hydrateComponent(
			ServerComponents.ElementWithChildrenThenIf,
			ClientComponents.ElementWithChildrenThenIf,
		);

		// Initially visible
		expect(container.querySelector('.conditional')).not.toBeNull();

		// Toggle off
		container.querySelector('.toggle')?.click();
		flushSync();

		// If content should be hidden, nested content should remain
		expect(container.querySelector('.conditional')).toBeNull();
		expect(container.querySelector('.deep')?.textContent).toBe('Deep content');

		// Toggle back on
		container.querySelector('.toggle')?.click();
		flushSync();

		expect(container.querySelector('.conditional')?.textContent).toBe('Conditional content');
	});

	it('hydrates deeply nested element followed by if sibling', async () => {
		await hydrateComponent(ServerComponents.DeepNestingThenIf, ClientComponents.DeepNestingThenIf);

		// Verify deep nesting structure
		expect(container.querySelector('.outer')).not.toBeNull();
		expect(container.querySelector('.middle')).not.toBeNull();
		expect(container.querySelector('.inner')).not.toBeNull();
		expect(container.querySelector('.leaf strong')?.textContent).toBe('Bold');
		expect(container.querySelector('.leaf em')?.textContent).toBe('Italic');
		expect(container.querySelector('.footer')?.textContent).toBe('Footer');
	});

	it('toggles if sibling after deeply nested element', async () => {
		await hydrateComponent(ServerComponents.DeepNestingThenIf, ClientComponents.DeepNestingThenIf);

		// Initially visible
		expect(container.querySelector('.footer')).not.toBeNull();

		// Toggle off
		container.querySelector('.btn')?.click();
		flushSync();

		// Footer should be hidden, nested content should remain
		expect(container.querySelector('.footer')).toBeNull();
		expect(container.querySelector('.leaf strong')?.textContent).toBe('Bold');

		// Toggle back on
		container.querySelector('.btn')?.click();
		flushSync();

		expect(container.querySelector('.footer')?.textContent).toBe('Footer');
	});

	// Test for CodeBlock pattern: element with only DOM element children (buttons)
	// followed by another sibling element

	it('hydrates element with DOM element children followed by sibling (CodeBlock pattern)', async () => {
		await hydrateComponent(
			ServerComponents.DomElementChildrenThenSibling,
			ClientComponents.DomElementChildrenThenSibling,
		);

		// Verify structure hydrated correctly
		expect(container.querySelector('.tabs')).not.toBeNull();
		expect(container.querySelector('.tab-list')).not.toBeNull();
		expect(container.querySelectorAll('.tab').length).toBe(2);
		expect(container.querySelector('.panel')).not.toBeNull();
		expect(container.querySelector('.code')?.textContent).toBe('const x = 1;');
	});

	it('switches tabs in CodeBlock pattern after hydration', async () => {
		await hydrateComponent(
			ServerComponents.DomElementChildrenThenSibling,
			ClientComponents.DomElementChildrenThenSibling,
		);

		// Initially on 'code' tab
		expect(container.querySelector('.code')).not.toBeNull();
		expect(container.querySelector('.preview')).toBeNull();

		// Click preview tab
		const tabs = container.querySelectorAll('.tab');
		tabs[1]?.click();
		flushSync();

		// Should show preview, hide code
		expect(container.querySelector('.code')).toBeNull();
		expect(container.querySelector('.preview')?.textContent).toBe('Preview content');

		// Click code tab
		tabs[0]?.click();
		flushSync();

		// Should show code again
		expect(container.querySelector('.code')?.textContent).toBe('const x = 1;');
	});

	// Test for element with DOM children followed by static siblings that don't
	// generate sibling() calls. This was causing incorrect pop() generation before next().
	it('hydrates element with DOM children followed by static siblings', async () => {
		await hydrateComponent(
			ServerComponents.DomChildrenThenStaticSiblings,
			ClientComponents.DomChildrenThenStaticSiblings,
		);

		// Verify structure hydrated correctly
		expect(container.querySelector('.container')).not.toBeNull();
		expect(container.querySelector('.list')).not.toBeNull();
		expect(container.querySelectorAll('.item').length).toBe(2);
		expect(container.querySelector('.heading')?.textContent).toBe('Static Heading');
		expect(container.querySelector('.para')?.textContent).toBe('Static paragraph');
	});

	it('updates reactive content in element with DOM children followed by static siblings', async () => {
		await hydrateComponent(
			ServerComponents.DomChildrenThenStaticSiblings,
			ClientComponents.DomChildrenThenStaticSiblings,
		);

		// Initially count is 0
		const items = container.querySelectorAll('.item');
		expect(items[0]?.textContent).toBe('Item count: 0');

		// Increment count
		container.querySelector('.inc')?.click();
		flushSync();

		// Count should update, static siblings should remain unchanged
		expect(items[0]?.textContent).toBe('Item count: 1');
		expect(container.querySelector('.heading')?.textContent).toBe('Static Heading');
		expect(container.querySelector('.para')?.textContent).toBe('Static paragraph');
	});

	// Test for completely static content - introduction page pattern
	// No pop() should be generated for static elements
	it('hydrates static list followed by static siblings (intro page pattern)', async () => {
		await hydrateComponent(
			ServerComponents.StaticListThenStaticSiblings,
			ClientComponents.StaticListThenStaticSiblings,
		);

		// Verify static structure hydrated correctly
		expect(container.querySelector('.wrapper')).not.toBeNull();
		expect(container.querySelector('.features')).not.toBeNull();
		expect(container.querySelectorAll('li').length).toBe(3);
		expect(container.querySelector('li strong')?.textContent).toBe('Feature One');
		expect(container.querySelector('li code')?.textContent).toBe('code');
		expect(container.querySelector('.section-heading')?.textContent).toBe('Section Heading');
		expect(container.querySelector('.section-content a')?.textContent).toBe('a link');
	});
});
