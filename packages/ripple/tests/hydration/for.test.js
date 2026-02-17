import { describe, it, expect } from 'vitest';
import { flushSync } from 'ripple';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/for.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/for.js';

describe('hydration > for blocks', () => {
	it('hydrates static for loop', async () => {
		await hydrateComponent(ServerComponents.StaticForLoop, ClientComponents.StaticForLoop);
		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[0]?.textContent).toBe('Apple');
		expect(listItems[1]?.textContent).toBe('Banana');
		expect(listItems[2]?.textContent).toBe('Cherry');
	});

	it('hydrates for loop with index', async () => {
		await hydrateComponent(ServerComponents.ForLoopWithIndex, ClientComponents.ForLoopWithIndex);
		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[0]?.textContent).toBe('0: A');
		expect(listItems[1]?.textContent).toBe('1: B');
		expect(listItems[2]?.textContent).toBe('2: C');
	});

	it('hydrates keyed for loop', async () => {
		await hydrateComponent(ServerComponents.KeyedForLoop, ClientComponents.KeyedForLoop);
		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[0]?.textContent).toBe('First');
		expect(listItems[1]?.textContent).toBe('Second');
		expect(listItems[2]?.textContent).toBe('Third');
	});

	it('hydrates reactive for loop and adds item', async () => {
		await hydrateComponent(
			ServerComponents.ReactiveForLoopAdd,
			ClientComponents.ReactiveForLoopAdd,
		);

		expect(container.querySelectorAll('li').length).toBe(2);

		container.querySelector('.add')?.click();
		flushSync();

		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[2]?.textContent).toBe('C');
	});

	it('hydrates reactive for loop and removes item', async () => {
		await hydrateComponent(
			ServerComponents.ReactiveForLoopRemove,
			ClientComponents.ReactiveForLoopRemove,
		);

		expect(container.querySelectorAll('li').length).toBe(3);

		container.querySelector('.remove')?.click();
		flushSync();

		expect(container.querySelectorAll('li').length).toBe(2);
	});

	it('hydrates for loop with interactive items', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopInteractive,
			ClientComponents.ForLoopInteractive,
		);

		let items = container.querySelectorAll('[class^="item-"]');
		expect(items.length).toBe(3);

		// Click the second item's button
		/** @type {HTMLButtonElement | null} */ (items[1]?.querySelector('.increment'))?.click();
		flushSync();

		// Re-query after state update since DOM may have been re-rendered
		items = container.querySelectorAll('[class^="item-"]');

		expect(items[0]?.querySelector('.value')?.textContent).toBe('0');
		expect(items[1]?.querySelector('.value')?.textContent).toBe('1');
		expect(items[2]?.querySelector('.value')?.textContent).toBe('0');
	});

	it('hydrates nested for loops', async () => {
		await hydrateComponent(ServerComponents.NestedForLoop, ClientComponents.NestedForLoop);

		expect(container.querySelector('.cell-0-0')?.textContent).toBe('1');
		expect(container.querySelector('.cell-0-1')?.textContent).toBe('2');
		expect(container.querySelector('.cell-1-0')?.textContent).toBe('3');
		expect(container.querySelector('.cell-1-1')?.textContent).toBe('4');
	});

	it('hydrates empty for loop', async () => {
		await hydrateComponent(ServerComponents.EmptyForLoop, ClientComponents.EmptyForLoop);
		expect(container.querySelector('.container')?.querySelectorAll('span').length).toBe(0);
	});

	it('hydrates for loop with complex objects', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopComplexObjects,
			ClientComponents.ForLoopComplexObjects,
		);

		const user1 = container.querySelector('.user-1');
		const user2 = container.querySelector('.user-2');

		expect(user1?.querySelector('.name')?.textContent).toBe('Alice');
		expect(user1?.querySelector('.role')?.textContent).toBe('Admin');
		expect(user2?.querySelector('.name')?.textContent).toBe('Bob');
		expect(user2?.querySelector('.role')?.textContent).toBe('User');
	});

	it('hydrates keyed for loop and reorders items', async () => {
		await hydrateComponent(
			ServerComponents.KeyedForLoopReorder,
			ClientComponents.KeyedForLoopReorder,
		);

		// Initial order: First, Second, Third
		let listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('First');
		expect(listItems[1]?.textContent).toBe('Second');
		expect(listItems[2]?.textContent).toBe('Third');

		// Reorder to: Third, First, Second
		container.querySelector('.reorder')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('Third');
		expect(listItems[1]?.textContent).toBe('First');
		expect(listItems[2]?.textContent).toBe('Second');
	});

	it('hydrates keyed for loop and updates item properties', async () => {
		await hydrateComponent(
			ServerComponents.KeyedForLoopUpdate,
			ClientComponents.KeyedForLoopUpdate,
		);

		expect(container.querySelector('.item-1')?.textContent).toBe('Item 1');
		expect(container.querySelector('.item-2')?.textContent).toBe('Item 2');

		container.querySelector('.update')?.click();
		flushSync();

		expect(container.querySelector('.item-1')?.textContent).toBe('Updated');
		expect(container.querySelector('.item-2')?.textContent).toBe('Item 2');
	});

	it('hydrates for loop with mixed add/remove/reorder operations', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopMixedOperations,
			ClientComponents.ForLoopMixedOperations,
		);

		// Initial: A, B, C, D
		let listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(4);
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[3]?.textContent).toBe('D');

		// After shuffle: D, C, A, E
		container.querySelector('.shuffle')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(4);
		expect(listItems[0]?.textContent).toBe('D');
		expect(listItems[1]?.textContent).toBe('C');
		expect(listItems[2]?.textContent).toBe('A');
		expect(listItems[3]?.textContent).toBe('E');
	});

	it('hydrates for loop inside if block', async () => {
		await hydrateComponent(ServerComponents.ForLoopInsideIf, ClientComponents.ForLoopInsideIf);

		// Initially visible with X, Y, Z
		expect(container.querySelector('.list')).not.toBeNull();
		expect(container.querySelectorAll('li').length).toBe(3);

		// Add item while visible
		container.querySelector('.add')?.click();
		flushSync();
		expect(container.querySelectorAll('li').length).toBe(4);

		// Hide list
		container.querySelector('.toggle')?.click();
		flushSync();
		expect(container.querySelector('.list')).toBeNull();

		// Show list again
		container.querySelector('.toggle')?.click();
		flushSync();
		expect(container.querySelector('.list')).not.toBeNull();
		expect(container.querySelectorAll('li').length).toBe(4);
	});

	it('hydrates for loop transitioning from empty to populated', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopEmptyToPopulated,
			ClientComponents.ForLoopEmptyToPopulated,
		);

		expect(container.querySelector('.list')?.querySelectorAll('li').length).toBe(0);

		container.querySelector('.populate')?.click();
		flushSync();

		const listItems = container.querySelector('.list')?.querySelectorAll('li');
		expect(listItems?.length).toBe(3);
		expect(listItems?.[0]?.textContent).toBe('One');
		expect(listItems?.[1]?.textContent).toBe('Two');
		expect(listItems?.[2]?.textContent).toBe('Three');
	});

	it('hydrates for loop transitioning from populated to empty', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopPopulatedToEmpty,
			ClientComponents.ForLoopPopulatedToEmpty,
		);

		expect(container.querySelector('.list')?.querySelectorAll('li').length).toBe(3);

		container.querySelector('.clear')?.click();
		flushSync();

		expect(container.querySelector('.list')?.querySelectorAll('li').length).toBe(0);
	});

	it('hydrates nested for loops with reactivity', async () => {
		await hydrateComponent(
			ServerComponents.NestedForLoopReactive,
			ClientComponents.NestedForLoopReactive,
		);

		// Initial: 2x2 grid
		expect(container.querySelectorAll('[class^="row-"]').length).toBe(2);
		expect(container.querySelector('.cell-0-0')?.textContent).toBe('1');

		// Add row
		container.querySelector('.add-row')?.click();
		flushSync();
		expect(container.querySelectorAll('[class^="row-"]').length).toBe(3);
		expect(container.querySelector('.cell-2-0')?.textContent).toBe('5');
		expect(container.querySelector('.cell-2-1')?.textContent).toBe('6');

		// Update cell
		container.querySelector('.update-cell')?.click();
		flushSync();
		expect(container.querySelector('.cell-0-0')?.textContent).toBe('99');
	});

	it('hydrates for loop with deeply nested data', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopDeeplyNested,
			ClientComponents.ForLoopDeeplyNested,
		);

		// Check department structure
		expect(container.querySelector('.dept-d1 .dept-name')?.textContent).toBe('Engineering');
		expect(container.querySelector('.dept-d2 .dept-name')?.textContent).toBe('Design');

		// Check team structure
		expect(container.querySelector('.team-t1 .team-name')?.textContent).toBe('Frontend');
		expect(container.querySelector('.team-t2 .team-name')?.textContent).toBe('Backend');
		expect(container.querySelector('.team-t3 .team-name')?.textContent).toBe('UX');

		// Check members
		const frontendMembers = container.querySelectorAll('.team-t1 .member');
		expect(frontendMembers.length).toBe(2);
		expect(frontendMembers[0]?.textContent).toBe('Alice');
		expect(frontendMembers[1]?.textContent).toBe('Bob');

		const uxMembers = container.querySelectorAll('.team-t3 .member');
		expect(uxMembers.length).toBe(3);
	});

	it('hydrates for loop with index that updates on prepend', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopIndexUpdate,
			ClientComponents.ForLoopIndexUpdate,
		);

		// Initial: [0] First, [1] Second, [2] Third
		let listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('[0] First');
		expect(listItems[1]?.textContent).toBe('[1] Second');
		expect(listItems[2]?.textContent).toBe('[2] Third');

		// Prepend: [0] Zeroth, [1] First, [2] Second, [3] Third
		container.querySelector('.prepend')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(4);
		expect(listItems[0]?.textContent).toBe('[0] Zeroth');
		expect(listItems[1]?.textContent).toBe('[1] First');
		expect(listItems[2]?.textContent).toBe('[2] Second');
		expect(listItems[3]?.textContent).toBe('[3] Third');
	});

	it('hydrates keyed for loop with index', async () => {
		await hydrateComponent(
			ServerComponents.KeyedForLoopWithIndex,
			ClientComponents.KeyedForLoopWithIndex,
		);

		// Initial order
		let listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('[0] a: Alpha');
		expect(listItems[1]?.textContent).toBe('[1] b: Beta');
		expect(listItems[2]?.textContent).toBe('[2] c: Gamma');
		expect(listItems[0]?.getAttribute('data-index')).toBe('0');

		// Rotate: Beta, Gamma, Alpha
		container.querySelector('.reorder')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('[0] b: Beta');
		expect(listItems[1]?.textContent).toBe('[1] c: Gamma');
		expect(listItems[2]?.textContent).toBe('[2] a: Alpha');
		expect(listItems[0]?.getAttribute('data-index')).toBe('0');
		expect(listItems[2]?.getAttribute('data-index')).toBe('2');
	});

	it('hydrates for loop with sibling elements', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopWithSiblings,
			ClientComponents.ForLoopWithSiblings,
		);

		expect(container.querySelector('.before')?.textContent).toBe('Before');
		expect(container.querySelector('.after')?.textContent).toBe('After');
		expect(container.querySelectorAll('[class^="item-"]').length).toBe(2);

		container.querySelector('.add')?.click();
		flushSync();

		expect(container.querySelector('.before')?.textContent).toBe('Before');
		expect(container.querySelector('.after')?.textContent).toBe('After');
		expect(container.querySelectorAll('[class^="item-"]').length).toBe(3);
		expect(container.querySelector('.item-C')).not.toBeNull();
	});

	it('hydrates for loop items with their own reactive state', async () => {
		await hydrateComponent(ServerComponents.ForLoopItemState, ClientComponents.ForLoopItemState);

		// Initial state: all unchecked
		const checkboxes = container.querySelectorAll('.checkbox');
		expect(checkboxes.length).toBe(3);

		expect(container.querySelector('.todo-1 span')?.className).toBe('pending');
		expect(container.querySelector('.todo-2 span')?.className).toBe('pending');

		// Check the first todo
		/** @type {HTMLInputElement} */ (checkboxes[0])?.click();
		flushSync();

		expect(container.querySelector('.todo-1 span')?.className).toBe('completed');
		expect(container.querySelector('.todo-2 span')?.className).toBe('pending');
	});

	it('hydrates for loop with single item', async () => {
		await hydrateComponent(ServerComponents.ForLoopSingleItem, ClientComponents.ForLoopSingleItem);

		const listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(1);
		expect(listItems[0]?.textContent).toBe('Only');
	});

	it('hydrates for loop adding at beginning', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopAddAtBeginning,
			ClientComponents.ForLoopAddAtBeginning,
		);

		let listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(2);
		expect(listItems[0]?.textContent).toBe('B');

		container.querySelector('.prepend')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[1]?.textContent).toBe('B');
		expect(listItems[2]?.textContent).toBe('C');
	});

	it('hydrates for loop adding in middle', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopAddInMiddle,
			ClientComponents.ForLoopAddInMiddle,
		);

		let listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(2);
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[1]?.textContent).toBe('C');

		container.querySelector('.insert')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[1]?.textContent).toBe('B');
		expect(listItems[2]?.textContent).toBe('C');
	});

	it('hydrates for loop removing from middle', async () => {
		await hydrateComponent(
			ServerComponents.ForLoopRemoveFromMiddle,
			ClientComponents.ForLoopRemoveFromMiddle,
		);

		let listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(3);
		expect(listItems[1]?.textContent).toBe('B');

		container.querySelector('.remove-middle')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems.length).toBe(2);
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[1]?.textContent).toBe('C');
	});

	it('hydrates for loop with large list', async () => {
		await hydrateComponent(ServerComponents.ForLoopLargeList, ClientComponents.ForLoopLargeList);

		const listItems = container.querySelectorAll('.large-list li');
		expect(listItems.length).toBe(50);
		expect(listItems[0]?.textContent).toBe('Item 1');
		expect(listItems[49]?.textContent).toBe('Item 50');
	});

	it('hydrates for loop with swap operation', async () => {
		await hydrateComponent(ServerComponents.ForLoopSwap, ClientComponents.ForLoopSwap);

		let listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[3]?.textContent).toBe('D');

		container.querySelector('.swap')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('D');
		expect(listItems[1]?.textContent).toBe('B');
		expect(listItems[2]?.textContent).toBe('C');
		expect(listItems[3]?.textContent).toBe('A');
	});

	it('hydrates for loop with reverse operation', async () => {
		await hydrateComponent(ServerComponents.ForLoopReverse, ClientComponents.ForLoopReverse);

		let listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('A');
		expect(listItems[3]?.textContent).toBe('D');

		container.querySelector('.reverse')?.click();
		flushSync();

		listItems = container.querySelectorAll('li');
		expect(listItems[0]?.textContent).toBe('D');
		expect(listItems[1]?.textContent).toBe('C');
		expect(listItems[2]?.textContent).toBe('B');
		expect(listItems[3]?.textContent).toBe('A');
	});
});
