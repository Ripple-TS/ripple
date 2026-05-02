import { RippleArray, flushSync, track } from 'ripple';
import { compile } from '@tsrx/ripple';

describe('for statements', () => {
	it('renders a simple static array', () => {
		component App() {
			const items = ['Item 1', 'Item 2', 'Item 3'];

			for (const item of items) {
				<div class={item}>{item}</div>
			}
		}

		render(App);

		expect(container).toMatchSnapshot();
	});

	it('allows continue to skip an iteration', () => {
		component App() {
			const items = ['Item 1', '', 'Item 3'];

			for (const item of items) {
				if (!item) continue;
				<div class="item">{item}</div>
			}
		}

		render(App);

		expect(Array.from(container.querySelectorAll('.item')).map((el) => el.textContent)).toEqual([
			'Item 1',
			'Item 3',
		]);
	});

	it('allows continue after setup statements to skip an iteration', () => {
		const skipped = [];

		component App() {
			const items = ['Item 1', '', 'Item 3'];

			for (const item of items) {
				if (!item) {
					skipped.push('skip');
					continue;
				}
				<div class="item">{item}</div>
			}
		}

		render(App);

		expect(skipped).toEqual(['skip']);
		expect(Array.from(container.querySelectorAll('.item')).map((el) => el.textContent)).toEqual([
			'Item 1',
			'Item 3',
		]);
	});

	it('does not emit JavaScript continue in for...of skip callbacks', () => {
		const { js } = compile(
			`component App() {
				const items = ['Item 1', '', 'Item 3'];
				const skipped = [];

				for (const item of items) {
					if (!item) {
						skipped.push('skip');
						continue;
					}
					<div class="item">{item}</div>
				}
			}`,
			'App.tsrx',
			{ mode: 'client' },
		);

		expect(js.code).toContain('skipped.push(\'skip\')');
		expect(js.code).not.toContain('continue;');
		expect(js.code).not.toMatch(/continue;\s*return/);
	});

	it('renders a simple dynamic array', () => {
		component App() {
			const items = new RippleArray('Item 1', 'Item 2', 'Item 3');

			for (const item of items) {
				<div class={item}>{item}</div>
			}

			<button onClick={() => items.push(`Item ${items.length + 1}`)}>{'Add Item'}</button>
		}

		render(App);
		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('correctly handles intermediate statements in for block', () => {
		component App() {
			const items = new RippleArray(1, 2, 3);

			<div>
				for (const item of items) {
					<div>
						<div>{item}</div>
						const some_text = item;
						<div>{some_text}</div>
					</div>
				}
			</div>

			<button onClick={() => items.push(items.length + 1)}>{'Add Item'}</button>
		}

		render(App);

		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('correctly handles the index in a for...of loop', () => {
		component App() {
			const items = new RippleArray('a', 'b', 'c');

			<div>
				for (let item of items; index i) {
					<div>{i + ' : ' + item}</div>
				}
			</div>

			<button onClick={() => items.push(String.fromCharCode(97 + items.length))}>
				{'Add Item'}
			</button>
			<button onClick={() => items.reverse()}>{'Reverse'}</button>
		}

		render(App);

		expect(container).toMatchSnapshot();

		const [button, button2] = container.querySelectorAll('button');

		button.click();
		flushSync();

		expect(container).toMatchSnapshot();

		button2.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('correctly handles keyed for...of loops', () => {
		component App() {
			let &[items] = track([
				{ id: 1, text: 'Item 1' },
				{ id: 2, text: 'Item 2' },
				{ id: 3, text: 'Item 3' },
			]);

			for (let item of items; index i; key item.id) {
				<div>{i + ':' + item.text}</div>
			}

			<button
				onClick={() => {
					items = items.toReversed();
				}}
			>
				{'Reverse'}
			</button>
		}

		render(App);

		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('keyed for over derived updates sibling text nodes', () => {
		component App() {
			let &[count] = track(0);

			let &[items] = track(
				() => Array.from({ length: count }).map((_, id) => ({ id, label: `Item ${id}` })),
			);

			<button
				onClick={() => {
					count++;
				}}
			>
				{'Add'}
			</button>
			for (const item of items; key item.id) {
				<div class="item">{item.label}</div>
			}
			<p class="count">{count}</p>
		}

		render(App);

		const button = container.querySelector('button');

		expect(container.querySelector('.count').textContent).toBe('0');
		expect(container.querySelectorAll('.item').length).toBe(0);

		button.click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('1');
		expect(container.querySelectorAll('.item').length).toBe(1);

		button.click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('2');
		expect(container.querySelectorAll('.item').length).toBe(2);
	});

	it('keyed for with 32+ items: full reversal updates values via Map path', () => {
		component App() {
			let &[items] = track(Array.from({ length: 40 }, (_, i) => ({ id: i, text: `Item ${i}` })));

			<div>
				for (let item of items; index idx; key item.id) {
					<span class="item">{idx + ':' + item.text}</span>
				}
			</div>

			<button
				onClick={() => {
					items = items.toReversed();
				}}
			>
				{'Reverse'}
			</button>
		}

		render(App);

		const getTexts = () => Array.from(container.querySelectorAll('.item')).map(
			(el) => el.textContent,
		);

		expect(getTexts()).toEqual(Array.from({ length: 40 }, (_, i) => `${i}:Item ${i}`));

		container.querySelector('button').click();
		flushSync();

		expect(getTexts()).toEqual(Array.from({ length: 40 }, (_, i) => `${i}:Item ${39 - i}`));
	});

	it('handles updating with new objects with same key', () => {
		component App() {
			let &[items] = track([
				{ id: 1, text: 'Item 1' },
				{ id: 2, text: 'Item 2' },
				{ id: 3, text: 'Item 3' },
			]);

			for (let item of items; index i; key item.id) {
				<div>{i + ':' + item.text}</div>
			}

			<button
				onClick={() => {
					items[0].id = 3;
					items[1].id = 2;
					items[2].id = 1;

					items = [
						{ ...items[0], text: 'Item 1!' },
						{ ...items[1], text: 'Item 2!' },
						{ ...items[2], text: 'Item 3!' },
					];
				}}
			>
				{'Reverse'}
			</button>
		}

		render(App);
		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('ref-based for with 32+ items: remove from start with shared refs via Map path', () => {
		const objects = Array.from({ length: 50 }, (_, i) => ({ id: i, text: `Obj ${i}` }));

		component App() {
			let &[items] = track(objects.slice());

			<div>
				for (const item of items) {
					<span class="item">{item.text}</span>
				}
			</div>

			<button
				onClick={() => {
					items = objects.slice(15).reverse();
				}}
			>
				{'Trim and reverse'}
			</button>
		}

		render(App);

		const getTexts = () => Array.from(container.querySelectorAll('.item')).map(
			(el) => el.textContent,
		);

		expect(getTexts()).toEqual(objects.map((o) => o.text));

		container.querySelector('button').click();
		flushSync();

		expect(getTexts()).toEqual(objects.slice(15).reverse().map((o) => o.text));
	});
});
