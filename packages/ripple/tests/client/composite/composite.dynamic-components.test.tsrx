import { type Component, flushSync, track } from 'ripple';

describe('composite > dynamic components', () => {
	it('supports rendering composite components using dynamic tag syntax', () => {
		function basic() @{
			<div>{'Basic Component'}</div>
		}

		function App() @{
			const tracked_basic = track(() => basic);
			<{tracked_basic} />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('Basic Component');
	});

	it('supports rendering composite components from object properties', () => {
		function basic() @{
			<div>{'Basic Component'}</div>
		}

		function App() @{
			const tracked_basic = track(() => basic);
			const obj = {
				tracked_basic,
			};
			const comp = obj.tracked_basic;
			<{comp} />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('Basic Component');
	});

	it('supports rendering composite components from tracked object properties', () => {
		function basic() @{
			<div>{'Basic Component'}</div>
		}

		function App() @{
			const tracked_basic = track(() => basic);
			const obj = {
				tracked_basic,
			};
			const inner = track(obj);
			const comp = inner.value.tracked_basic;
			<{comp} />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('Basic Component');
	});

	it('does not pass is to dynamic component props', () => {
		function Child(props) @{
			<div>
				{props.is === undefined && !('is' in props) ? 'hidden' : 'leaked'}
			</div>
		}

		function App() @{
			const component = track(() => Child);
			<{component} label="child" />
		}

		render(App);
		flushSync();

		expect(container.textContent).toBe('hidden');
	});

	it('handles dynamic component switching', () => {
		function Child1() @{
			<div>{'I am child 1'}</div>
		}

		function Child2() @{
			<div>{'I am child 2'}</div>
		}

		function App() @{
			const thing = track(() => Child1, undefined, true);
			<>
				<div id="container">
					<{thing.value} />
				</div>
				<button
					onClick={() => (thing.value = thing.value === Child1 ? Child2 : Child1)}
				>{'Change Child'}</button>
			</>
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

	it('switches components held in a plain tracked assigned after creation', () => {
		function Child1() @{
			<div>{'I am child 1'}</div>
		}

		function Child2() @{
			<div>{'I am child 2'}</div>
		}

		function App() @{
			// track(Child1) would make a derived that calls the component, so an
			// empty tracked receives the component through `.value` instead.
			const thing = track<Component>();
			thing.value = Child1;
			<>
				<div id="container">
					<{thing.value} />
				</div>
				<button
					onClick={() => (thing.value = thing.value === Child1 ? Child2 : Child1)}
				>{'Change Child'}</button>
			</>
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

	it('switches plain functions held in a tracked assigned after creation', () => {
		const first = () => 'first';
		const second = () => 'second';

		function App() @{
			const fn = track<() => string>();
			fn.value = first;
			<>
				<p>{fn.value()}</p>
				<button onClick={() => (fn.value = fn.value === first ? second : first)}>{'Swap'}</button>
			</>
		}

		render(App);
		flushSync();

		expect(container.querySelector('p').textContent).toBe('first');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container.querySelector('p').textContent).toBe('second');

		button.click();
		flushSync();

		expect(container.querySelector('p').textContent).toBe('first');
	});
});
