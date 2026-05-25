import { effect, flushSync, track, untrack } from 'ripple';

describe('basic client > tracked value access', () => {
	it('gets tracked value', () => {
		component Test() {
			let count = track(0);

			<div>{count.value}</div>
		}

		render(Test);

		const div = container.querySelector('div');
		expect(div.textContent).toBe('0');
	});

	it('gets tracked value after mutation', () => {
		component Test() {
			let &[count] = track(0);

			<p>{count}</p>
			<button onClick={() => count++}>{'increment'}</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(p.textContent).toBe('1');
	});

	it('gets tracked value after multiple mutations', () => {
		component Test() {
			let &[count] = track(0);

			<p>{count}</p>
			<button
				onClick={() => {
					count++;
					count++;
					count++;
				}}
			>
				{'increment'}
			</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(p.textContent).toBe('3');
	});

	it('sets tracked value', () => {
		component Test() {
			let count = track(0);

			<p>{count.value}</p>
			<button onClick={() => (count.value = 10)}>{'set to 10'}</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(p.textContent).toBe('10');
	});

	it('sets tracked value multiple times', () => {
		component Test() {
			let count = track(0);

			<p>{count.value}</p>
			<button
				onClick={() => {
					count.value = 5;
					count.value = 15;
					count.value = 25;
				}}
			>
				{'set multiple times'}
			</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(p.textContent).toBe('25');
	});

	it('sets tracked value based on previous value', () => {
		component Test() {
			let count = track(0);

			<p>{count.value}</p>
			<button onClick={() => (count.value = count.value + 10)}>{'add 10'}</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(p.textContent).toBe('10');

		button.click();
		flushSync();

		expect(p.textContent).toBe('20');
	});

	it('sets tracked value multiple times based on previous value', () => {
		component Test() {
			let count = track(0);

			<p>{count.value}</p>
			<button
				onClick={() => {
					count.value = count.value + 5;
					count.value = count.value + 15;
					count.value = count.value + 25;
				}}
			>
				{'add multiple times'}
			</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(p.textContent).toBe('45');

		button.click();
		flushSync();

		expect(p.textContent).toBe('90');
	});

	it('gets value declared outside Ripple component', () => {
		function store() {
			return track(0);
		}

		component Test() {
			let count = store();
			<p>{count.value}</p>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');
	});

	it('sets value declared outside Ripple component', () => {
		function store() {
			return track(0);
		}

		component Test() {
			let count = store();

			<p>{count.value}</p>
			<button onClick={() => (count.value = 50)}>{'set to 50'}</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(p.textContent).toBe('50');
	});

	it('works with effects', () => {
		component Test() {
			let count = track(0);
			let double = track(0);

			effect(() => {
				double.value = count.value * 2;
			});

			<p>{double.value}</p>
			<button onClick={() => (count.value = count.value + 1)}>{'increment'}</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(p.textContent).toBe('2');

		button.click();
		flushSync();

		expect(p.textContent).toBe('4');
	});

	it('works with effects and untrack', () => {
		component Test() {
			let count = track(0);
			let double = track(0);

			effect(() => {
				untrack(() => {
					double.value = count.value * 2;
				});
			});

			<p>{double.value}</p>
			<button onClick={() => (count.value = count.value + 1)}>{'increment'}</button>
		}

		render(Test);

		const p = container.querySelector('p');
		expect(p.textContent).toBe('0');

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(p.textContent).toBe('2');

		button.click();
		flushSync();

		expect(p.textContent).toBe('2');
	});

	it('throws on trying to create tracked Ripple component', () => {
		expect(() => track(0)).toThrow();
	});
});
