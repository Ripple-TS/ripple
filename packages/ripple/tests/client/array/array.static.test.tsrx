import { flushSync, RippleArray, trackAsync } from 'ripple';
import { MAX_ARRAY_LENGTH } from '../../../src/runtime/internal/client/constants.js';

describe('RippleArray > static', () => {
	it('handles static methods - from and of', () => {
		component ArrayTest() {
			let itemsFrom = RippleArray.from([1, 2, 3], (x: number) => x * 2);
			let itemsOf = RippleArray.of(4, 5, 6);

			<button onClick={() => itemsFrom.push(8)}>{'add to from'}</button>
			<button onClick={() => itemsOf.push(7)}>{'add to of'}</button>
			<pre>{JSON.stringify(itemsFrom)}</pre>
			<pre>{JSON.stringify(itemsOf)}</pre>
		}

		render(ArrayTest);

		const addFromButton = container.querySelectorAll('button')[0];
		const addOfButton = container.querySelectorAll('button')[1];

		// Initial state
		expect(container.querySelectorAll('pre')[0].textContent).toBe('[2,4,6]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('[4,5,6]');

		// Test adding to from-created array
		addFromButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('[2,4,6,8]');

		// Test adding to of-created array
		addOfButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[1].textContent).toBe('[4,5,6,7]');
	});

	('fromAsync' in Array.prototype ? describe : describe.skip)('RippleArray fromAsync', async () => {
		it('handles static fromAsync method with reactivity', async () => {
			component Parent() {
				try {
					<ArrayTest />
				} pending {
					<div>{'Loading placeholder...'}</div>
				}
			}

			component ArrayTest() {
				let &[items] = trackAsync(() => RippleArray.fromAsync([1, 2, 3]));

				<button
					onClick={() => {
						items.push(4);
					}}
				>
					{'add item'}
				</button>

				<pre>{JSON.stringify(items)}</pre>
			}

			render(Parent);

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			const addButton = container.querySelector('button');

			expect(container.querySelectorAll('pre')[0].textContent).toBe('[1,2,3]');

			// Test adding an item to the async-created array
			addButton.click();
			flushSync();

			expect(container.querySelectorAll('pre')[1].textContent).toBe('[1,2,3,4]');
		});

		it('handles static fromAsync method with mapping function', async () => {
			component Parent() {
				try {
					<ArrayTest />
				} pending {
					<div>{'Loading placeholder...'}</div>
				}
			}

			component ArrayTest() {
				let &[items] = trackAsync(() => RippleArray.fromAsync([1, 2, 3], (x: number) => x * 2));

				<button
					onClick={() => {
						items.push(8);
					}}
				>
					{'add item'}
				</button>
				<pre>{JSON.stringify(items)}</pre>
			}

			render(Parent);

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			const addButton = container.querySelector('button');

			expect(container.querySelector('pre').textContent).toBe('[2,4,6]');

			addButton.click();
			flushSync();

			expect(container.querySelector('pre').textContent).toBe('[2,4,6,8]');
		});

		// TODO: Fix this test case, needs some async love around try statements being using in a not template way
		('fromAsync' in Array.prototype ? it : it.skip)(
			'handles error in fromAsync method',
			async () => {
				component Parent() {
					try {
						<ArrayTest />
					} pending {
						<div>{'Loading placeholder...'}</div>
					}
				}

				component ArrayTest() {
					async function* throwingIterable() {
						throw new Error('Async error');
					}

					try {
						let &[items] = trackAsync(() => RippleArray.fromAsync(throwingIterable()));

						<ul>
							for (const item of items) {
								<li>{item}</li>
							}
						</ul>
					} pending {
						<div>{'Loading...'}</div>
					} catch (e) {
						<pre>{'Error: ' + (e as Error).message}</pre>
						<pre>{'No items'}</pre>
					}
				}

				render(Parent);

				await new Promise((resolve) => setTimeout(resolve, 0));
				flushSync();

				expect(container.querySelectorAll('pre')[0].textContent).toBe('Error: Async error');
				expect(container.querySelectorAll('pre')[1].textContent).toBe('No items');
			},
		);
	});

	describe('Creates RippleArray with a single element', () => {
		it('specifies int', () => {
			component ArrayTest() {
				let items = new RippleArray(3);
				<pre>{JSON.stringify(items)}</pre>
				<pre>{items.length}</pre>
			}

			render(ArrayTest);

			expect(container.querySelectorAll('pre')[0].textContent).toBe('[null,null,null]');
			expect(container.querySelectorAll('pre')[1].textContent).toBe('3');
		});

		it('errors on exceeding max array size', () => {
			component ArrayTest() {
				let error = null;

				try {
					new RippleArray(MAX_ARRAY_LENGTH + 1);
				} catch (e) {
					error = (e as Error).message;
				}

				<pre>{error}</pre>
			}

			render(ArrayTest);

			expect(container.querySelector('pre').textContent).toBe('Invalid array length');
		});

		it('specifies int using static from method', () => {
			component ArrayTest() {
				let items = RippleArray.from([4]);
				<pre>{JSON.stringify(items)}</pre>
				<pre>{items.length}</pre>
			}

			render(ArrayTest);

			expect(container.querySelectorAll('pre')[0].textContent).toBe('[4]');
			// expect(container.querySelectorAll('pre')[1].textContent).toBe('1');
		});

		it('specifies int using static of method', () => {
			component ArrayTest() {
				let items = RippleArray.of(5);
				<pre>{JSON.stringify(items)}</pre>
				<pre>{items.length}</pre>
			}

			render(ArrayTest);

			expect(container.querySelectorAll('pre')[0].textContent).toBe('[5]');
			expect(container.querySelectorAll('pre')[1].textContent).toBe('1');
		});

		('fromAsync' in Array.prototype ? it : it.skip)(
			'specifies int using static fromAsync method',
			async () => {
				component Parent() {
					try {
						<ArrayTest />
					} pending {
						<div>{'Loading placeholder...'}</div>
					}
				}

				component ArrayTest() {
					let &[items] = trackAsync(() => RippleArray.fromAsync([6]));

					<pre>{JSON.stringify(items)}</pre>
					<pre>{items.length}</pre>
				}

				render(Parent);

				await new Promise((resolve) => setTimeout(resolve, 0));
				flushSync();

				expect(container.querySelectorAll('pre')[0].textContent).toBe('[6]');
				expect(container.querySelectorAll('pre')[1].textContent).toBe('1');
			},
		);
	});
});
