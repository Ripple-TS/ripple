import { flushSync, track } from 'ripple';

describe('composite > dynamic components', () => {
	it('supports rendering composite components using <@component> syntax', () => {
		component App() {
			component basic() {
				<div>{'Basic Component'}</div>
			}

			const tracked_basic = track(() => basic);

			<@tracked_basic />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('Basic Component');
	});

	it('supports rendering composite components from object properties', () => {
		component App() {
			component basic() {
				<div>{'Basic Component'}</div>
			}

			const tracked_basic = track(() => basic);

			const obj = {
				tracked_basic,
			};

			const comp = obj.tracked_basic;
			<@comp />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('Basic Component');
	});

	it('supports rendering composite components from tracked object properties', () => {
		component App() {
			component basic() {
				<div>{'Basic Component'}</div>
			}

			const tracked_basic = track(() => basic);

			const obj = {
				tracked_basic,
			};

			let &[inner] = track(obj);

			const comp = inner.tracked_basic;
			<@comp />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('Basic Component');
	});

	it('handles dynamic component switching', () => {
		component Child1() {
			<div>{'I am child 1'}</div>
		}

		component Child2() {
			<div>{'I am child 2'}</div>
		}

		component App() {
			let &[thing] = track(() => Child1);

			<div id="container">
				<@thing />
			</div>

			<button onClick={() => (thing = thing === Child1 ? Child2 : Child1)}>{'Change Child'}</button>
		}

		render(App);
		flushSync();

		expect(container.querySelector('#container').textContent).toBe('I am child 1');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container.querySelector('#container').textContent).toBe('I am child 2');

		button.click();
		flushSync();

		expect(container.querySelector('#container').textContent).toBe('I am child 1');
	});
});
