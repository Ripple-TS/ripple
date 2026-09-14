import { RippleArray, effect, flushSync, track, untrack } from 'ripple';

describe('RippleArray > iteration', () => {
	it('handles entries method with reactivity', () => {
		function ArrayTest() @{
			let items = new RippleArray('a', 'b', 'c');
			const entries = track(() => Array.from(items.entries()));
			<>
				<button onClick={() => items.push('d')}>{'add item'}</button>
				<pre>{JSON.stringify(items)}</pre>
				<pre>{JSON.stringify(entries.value)}</pre>
			</>
		}

		render(ArrayTest);

		const addButton = container.querySelector('button');

		// Initial state
		expect(container.querySelectorAll('pre')[0].textContent).toBe('["a","b","c"]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('[[0,"a"],[1,"b"],[2,"c"]]');

		// Test adding an item
		addButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('["a","b","c","d"]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe(
			'[[0,"a"],[1,"b"],[2,"c"],[3,"d"]]',
		);
	});

	it('handles keys method with reactivity', () => {
		function ArrayTest() @{
			let items = new RippleArray('a', 'b', 'c');
			const keys = track(() => Array.from(items.keys()));
			<>
				<button onClick={() => items.push('d')}>{'add item'}</button>
				<pre>{JSON.stringify(items)}</pre>
				<pre>{JSON.stringify(keys.value)}</pre>
			</>
		}

		render(ArrayTest);

		const addButton = container.querySelector('button');

		// Initial state
		expect(container.querySelectorAll('pre')[0].textContent).toBe('["a","b","c"]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('[0,1,2]');

		// Test adding an item
		addButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('["a","b","c","d"]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('[0,1,2,3]');
	});

	it('handles values method with reactivity', () => {
		function ArrayTest() @{
			let items = new RippleArray('a', 'b', 'c');
			const values = track(() => Array.from(items.values()));
			<>
				<button onClick={() => items.push('d')}>{'add item'}</button>
				<pre>{JSON.stringify(items)}</pre>
				<pre>{JSON.stringify(values.value)}</pre>
			</>
		}

		render(ArrayTest);

		const addButton = container.querySelector('button');

		// Initial state
		expect(container.querySelectorAll('pre')[0].textContent).toBe('["a","b","c"]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('["a","b","c"]');

		// Test adding an item
		addButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('["a","b","c","d"]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('["a","b","c","d"]');
	});

	it('handles Symbol.iterator with reactivity', () => {
		function ArrayTest() @{
			let items = new RippleArray(1, 2, 3);
			const sum = track(0);
			effect(() => {
				sum.value = 0;
				for (const item of items) {
					untrack(() => {
						sum.value += item;
					});
				}
			});
			<>
				<button onClick={() => items.push(4)}>{'add item'}</button>
				<pre>{JSON.stringify(items)}</pre>
				<pre>{sum.value}</pre>
			</>
		}

		render(ArrayTest);
		flushSync();

		const addButton = container.querySelectorAll('button')[0];

		expect(container.querySelectorAll('pre')[0].textContent).toBe('[1,2,3]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('6');

		addButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('[1,2,3,4]');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('10');
	});
});
