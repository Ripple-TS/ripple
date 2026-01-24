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
});
