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
});
