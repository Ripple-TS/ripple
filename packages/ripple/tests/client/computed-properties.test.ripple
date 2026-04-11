import { flushSync, track } from 'ripple';

describe('computed tracked properties', () => {
	it('should update a property using assignment', () => {
		component App() {
			let obj = {
				[0]: track(0),
			};

			<div>{obj[0].value}</div>

			<button
				onClick={() => {
					obj[0].value += 1;
				}}
			>
				{'Increment'}
			</button>
		}

		render(App);
		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('should update a property using update expressions', () => {
		component App() {
			let obj = {
				[0]: track(0),
			};

			<div>{obj[0].value}</div>

			<button
				onClick={() => {
					obj[0].value++;
				}}
			>
				{'Increment'}
			</button>
		}

		render(App);
		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});
});
