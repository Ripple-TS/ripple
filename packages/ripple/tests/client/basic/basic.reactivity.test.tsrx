import type { PropsWithChildren, Tracked } from 'ripple';
import { effect, flushSync, track, untrack } from 'ripple';

describe('basic client > reactivity', () => {
	it('renders multiple reactive lexical blocks', () => {
		component Basic() {
			<div>
				let obj = {
					count: track(0),
				};

				<span>{obj.count.value}</span>
			</div>
			<div>
				let b = {
					count: track(0),
				};

				<button
					onClick={() => {
						b.count.value--;
					}}
				>
					{'-'}
				</button>
				<span class="count">{b.count.value}</span>
				<button
					onClick={() => {
						b.count.value++;
					}}
				>
					{'+'}
				</button>
			</div>
		}
		render(Basic);

		const buttons = container.querySelectorAll('button');

		buttons[0].click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('-1');

		buttons[1].click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('0');
	});

	it('renders multiple reactive lexical blocks with complexity', () => {
		component Basic() {
			const count = 'count';

			<div>
				let obj = {
					count: track(0),
				};

				<span>{obj[count].value}</span>
			</div>
			<div>
				let b = {
					count: track(0),
				};

				<button
					onClick={() => {
						b[count].value--;
					}}
				>
					{'-'}
				</button>
				<span class="count">{b[count].value}</span>
				<button
					onClick={() => {
						b[count].value++;
					}}
				>
					{'+'}
				</button>
			</div>
		}
		render(Basic);

		const buttons = container.querySelectorAll('button');

		buttons[0].click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('-1');

		buttons[1].click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('0');
	});

	it('renders with computed reactive state', () => {
		component Basic() {
			let &[count] = track(5);

			<div class="count">{count}</div>
			<div class="doubled">{count * 2}</div>
			<div class="is-even">{count % 2 === 0 ? 'Even' : 'Odd'}</div>
			<button
				onClick={() => {
					count++;
				}}
			>
				{'Increment'}
			</button>
		}

		render(Basic);

		const countDiv = container.querySelector('.count');
		const doubledDiv = container.querySelector('.doubled');
		const evenDiv = container.querySelector('.is-even');
		const button = container.querySelector('button');

		expect(countDiv.textContent).toBe('5');
		expect(doubledDiv.textContent).toBe('10');
		expect(evenDiv.textContent).toBe('Odd');

		button.click();
		flushSync();

		expect(countDiv.textContent).toBe('6');
		expect(doubledDiv.textContent).toBe('12');
		expect(evenDiv.textContent).toBe('Even');
	});

	it('basic reactivity with standard arrays should work', () => {
		let logs: string[] = [];

		component App() {
			let first = track(0);
			let second = track(0);
			const arr = [first, second];

			const total = track(() => arr.reduce((a, b) => a + b.value, 0));

			<button
				onClick={() => {
					first.value++;
				}}
			>
				{'first:' + first.value}
			</button>
			<button
				onClick={() => {
					second.value++;
				}}
			>
				{'second: ' + second.value}
			</button>

			effect(() => {
				let _arr: number[] = [];

				arr.forEach((item) => {
					_arr.push(item.value);
				});

				logs.push(_arr.join(', '));
			});

			effect(() => {
				if (arr.map((a) => a.value).includes(1)) {
					logs.push('arr includes 1');
				}
			});

			<div>{'Sum: ' + total.value}</div>
			<div>{'Comma Separated: ' + arr.map((a) => a.value).join(', ')}</div>
			<div>{'Number to string: ' + arr.map((a) => String(a.value))}</div>
			<div>{'Even numbers: ' + arr.map((a) => a.value).filter((a) => a % 2 === 0)}</div>
		}

		render(App);
		flushSync();

		const buttons = container.querySelectorAll('button');
		const divs = container.querySelectorAll('div');

		expect(divs[0].textContent).toBe('Sum: 0');
		expect(divs[1].textContent).toBe('Comma Separated: 0, 0');
		expect(divs[2].textContent).toBe('Number to string: 0,0');
		expect(divs[3].textContent).toBe('Even numbers: 0,0');
		expect(logs).toEqual(['0, 0']);

		buttons[0].click();
		flushSync();

		expect(divs[0].textContent).toBe('Sum: 1');
		expect(divs[1].textContent).toBe('Comma Separated: 1, 0');
		expect(divs[2].textContent).toBe('Number to string: 1,0');
		expect(divs[3].textContent).toBe('Even numbers: 0');
		expect(logs).toEqual(['0, 0', '1, 0', 'arr includes 1']);

		buttons[1].click();
		flushSync();

		expect(divs[0].textContent).toBe('Sum: 2');
		expect(divs[1].textContent).toBe('Comma Separated: 1, 1');
		expect(divs[2].textContent).toBe('Number to string: 1,1');
		expect(divs[3].textContent).toBe('Even numbers: ');
		expect(logs).toEqual(['0, 0', '1, 0', 'arr includes 1', '1, 1', 'arr includes 1']);
	});

	it('uses track get and set where both mutate value', () => {
		component App() {
			let &[count] = track(0, (v) => v + 1, (v) => v * 2);

			<div class="count">{count}</div>
			<button
				onClick={() => {
					count++;
				}}
			>
				{'Increment'}
			</button>
		}

		render(App);

		const countDiv = container.querySelector('.count');
		const button = container.querySelector('button');

		expect(countDiv.textContent).toBe('1');

		button.click();
		flushSync();
		expect(countDiv.textContent).toBe('5');
	});

	it('uses track get and set where set only mutates value', () => {
		component App() {
			let &[count] = track(1, (v) => v, (v) => v * 2);

			<div class="count">{count}</div>
			<button
				onClick={() => {
					count++;
				}}
			>
				{'Increment'}
			</button>
		}

		render(App);

		const countDiv = container.querySelector('.count');
		const button = container.querySelector('button');

		expect(countDiv.textContent).toBe('1');

		button.click();
		flushSync();
		expect(countDiv.textContent).toBe('4');
	});

	it('uses track get and set where get only mutates value', () => {
		component App() {
			let &[count] = track(0, (v) => v + 1, (v) => v);

			<div class="count">{count}</div>
			<button
				onClick={() => {
					count++;
				}}
			>
				{'Increment'}
			</button>
		}

		render(App);

		const countDiv = container.querySelector('.count');
		const button = container.querySelector('button');

		expect(countDiv.textContent).toBe('1');

		button.click();
		flushSync();
		expect(countDiv.textContent).toBe('3');
	});

	it('passes in next and prev to track set function', () => {
		let logs: number[] = [];

		component App() {
			let &[count] = track(0, (v) => v, (next, prev) => {
				logs.push(prev, next);
				return next;
			});

			<button
				onClick={() => {
					count++;
				}}
			>
				{'Increment'}
			</button>
		}

		render(App);

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(logs).toEqual([0, 1]);
	});

	it('doesn\'t error on mutating a tracked variable in track() setter', () => {
		component Basic() {
			let &[count] = track(0);

			const &[doubled] = track(0, undefined, (value) => {
				count += value;
				return value;
			});

			<p>{doubled}</p>
		}

		render(Basic);

		expect(error).toBe(undefined);
	});

	it('unwraps tracked values inside effect', () => {
		let state: { count?: number } = {};

		component Basic() {
			let &[count] = track(0);

			effect(() => {
				state.count = count;
			});
		}

		render(Basic);
		flushSync();

		expect(state.count).toBe(0);
	});

	it('does not unwrap values with update expressions inside effect', () => {
		let state: {
			initialValue?: number;
			preIncrement?: number;
			postIncrement?: number;
			preDecrement?: number;
			postDecrement?: number;
			finalValue?: number;
		} = {};

		component Basic() {
			let &[count] = track(5);

			effect(() => {
				untrack(() => {
					state.initialValue = count;
					state.preIncrement = ++count;
					state.postIncrement = count++;
					state.preDecrement = --count;
					state.postDecrement = count--;
					state.finalValue = count;
				});
			});
		}

		render(Basic);
		flushSync();

		expect(state.initialValue).toBe(5);
		expect(state.preIncrement).toBe(6);
		expect(state.postIncrement).toBe(6);
		expect(state.preDecrement).toBe(6);
		expect(state.postDecrement).toBe(6);
		expect(state.finalValue).toBe(5);
	});

	it('returns the same tracked object if plain track is called with a tracked object', () => {
		component App() {
			const t = track({ a: 1, b: 2, c: 3 });
			const doublet = track(t);

			<pre>{t === doublet}</pre>
		}

		render(App);

		const pre = container.querySelectorAll('pre')[0];
		expect(pre.textContent).toBe('true');
	});
});
