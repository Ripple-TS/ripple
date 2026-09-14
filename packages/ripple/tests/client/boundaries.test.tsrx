import { effect, flushSync, track, type Tracked } from 'ripple';

describe('passing reactivity between boundaries tests', () => {
	it('can pass a tracked object to a plain function and read the derived it returns', () => {
		let log: string[] = [];

		function createDouble(count: Tracked<number>) {
			const double = track(() => count.value * 2);

			effect(() => {
				log.push('Count:' + count.value);
			});

			return double;
		}

		function App() @{
			const count = track(0);
			const double = createDouble(count);
			<>
				<div>{'Double: ' + double.value}</div>
				<button
					onClick={() => {
						count.value++;
					}}
				>{'Increment'}</button>
			</>
		}

		render(App);
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Double: 0');
		expect(log).toEqual(['Count:0']);

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Double: 2');
		expect(log).toEqual(['Count:0', 'Count:1']);

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Double: 4');
		expect(log).toEqual(['Count:0', 'Count:1', 'Count:2']);
	});

	it('can pass reactivity between functions with simple objects and destructuring', () => {
		let log: string[] = [];

		function createDouble({ count }: { count: Tracked<number> }) {
			const double = track(() => count.value * 2);

			effect(() => {
				log.push('Count:' + count.value);
			});

			return { double };
		}

		function App() @{
			let count = track(0);
			const { double } = createDouble({ count });
			<>
				<div>{'Double: ' + double.value}</div>
				<button
					onClick={() => {
						count.value++;
					}}
				>{'Increment'}</button>
			</>
		}

		render(App);
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Double: 0');
		expect(log).toEqual(['Count:0']);

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Double: 2');
		expect(log).toEqual(['Count:0', 'Count:1']);

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('Double: 4');
		expect(log).toEqual(['Count:0', 'Count:1', 'Count:2']);
	});
});
