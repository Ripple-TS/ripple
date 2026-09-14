import type { Derived, Props, Tracked } from 'ripple';
import { RippleObject, effect, flushSync, track } from 'ripple';

describe('composite > reactivity', () => {
	it('renders composite components with object state', () => {
		function Button({ obj }: { obj: { count: Tracked<number> } }) @{
			<button
				class="count2"
				onClick={() => {
					obj.count.value++;
				}}
			>{obj.count.value}</button>
		}

		function App() @{
			let obj = {
				count: track(0),
			};
			<div>
				<span class="count">{obj.count.value}</span>
				<Button {obj} />
			</div>
		}

		render(App);

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('1');
		expect(container.querySelector('.count2').textContent).toBe('1');
	});

	it('renders composite components with object state wrapped in an if statement', () => {
		function Button({ obj }: { obj: { count: Tracked<number> } }) @{
			<button
				class="count2"
				onClick={() => {
					obj.count.value++;
				}}
			>{obj.count.value}</button>
		}

		function OtherComponent({ obj }: { obj: { count: Tracked<number> } }) @{
			<div class="count3">{obj.count.value}</div>
		}

		function App() @{
			let obj = {
				count: track(0),
			};
			<div>
				<span class="count">{obj.count.value}</span>
				<span>{' '}</span>
				@if (obj) {
					<Button {obj} />
				}

				@if (obj) {
					<OtherComponent {obj} />
				}
			</div>
		}

		render(App);

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container.querySelector('.count').textContent).toBe('1');
		expect(container.querySelector('.count2').textContent).toBe('1');
		expect(container.querySelector('.count3').textContent).toBe('1');
	});

	it('parents and children have isolated state', () => {
		function Button(props: { count: Tracked<number> }) @{
			const count = track(() => props.count.value, undefined, true);
			<button
				onClick={() => {
					count.value++;
				}}
			>
				{'child: ' + count.value}
			</button>
		}

		function App() @{
			const count = track(0);
			<div>
				<button
					onClick={() => {
						count.value++;
					}}
				>
					{'parent: ' + count.value}
				</button>
				<Button count={count} />
			</div>
		}

		render(App);

		const buttons = container.querySelectorAll('button');

		expect(buttons[0].textContent).toBe('parent: 0');
		expect(buttons[1].textContent).toBe('child: 0');

		buttons[0].click();
		flushSync();

		expect(buttons[0].textContent).toBe('parent: 1');
		expect(buttons[1].textContent).toBe('child: 1');

		buttons[1].click();
		flushSync();

		expect(buttons[0].textContent).toBe('parent: 1');
		expect(buttons[1].textContent).toBe('child: 2');
	});

	it('parents and children have isolated connected state (destructured props)', () => {
		function Button({ count }: { count: Tracked<number> }) @{
			const local_count = track(() => count.value, undefined, true);
			<button
				onClick={() => {
					local_count.value++;
				}}
			>
				{'child: ' + local_count.value}
			</button>
		}

		function App() @{
			const count = track(0);
			<div>
				<button
					onClick={() => {
						count.value++;
					}}
				>
					{'parent: ' + count.value}
				</button>
				<Button count={count} />
			</div>
		}

		render(App);

		const buttons = container.querySelectorAll('button');

		expect(buttons[0].textContent).toBe('parent: 0');
		expect(buttons[1].textContent).toBe('child: 0');

		buttons[0].click();
		flushSync();

		expect(buttons[0].textContent).toBe('parent: 1');
		expect(buttons[1].textContent).toBe('child: 1');

		buttons[1].click();
		flushSync();

		expect(buttons[0].textContent).toBe('parent: 1');
		expect(buttons[1].textContent).toBe('child: 2');
	});

	it('handles spreading of props', () => {
		let logs: string[] = [];

		function App() @{
			const a = track(1);
			const b = track(2);
			const c = track(3);
			const obj = { a, b, c };
			<>
				<Child {...obj} />
				<button
					onClick={() => {
						a.value++;
						b.value++;
						c.value++;
					}}
				>{'Increment all'}</button>
			</>
		}

		function Child({ a, b, c }: { a: Tracked<number>; b: Tracked<number>; c: Tracked<number> }) @{
			effect(() => {
				logs.push(`Child effect: ${a.value}, ${b.value}, ${c.value}`);
			});
			<div>{a.value + ' ' + b.value + ' ' + c.value}</div>
		}

		render(App);
		flushSync();

		expect(container.querySelector('div').textContent).toBe('1 2 3');
		expect(logs).toEqual(['Child effect: 1, 2, 3']);

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('2 3 4');
		expect(logs).toEqual(['Child effect: 1, 2, 3', 'Child effect: 2, 3, 4']);
	});

	it('keeps reactivity for spread props via intermediate components and destructured props', () => {
		function App() @{
			const count = track(0);
			<CounterWrapper count={count} up={() => count.value++} down={() => count.value--} />
		}

		function CounterWrapper(props: Props) @{
			<div>
				<Counter {...props} />
			</div>
		}

		function Counter({ count, up, down, ...rest }: Props) @{
			<>
				<button onClick={() => up()}>{'UP'}</button>
				<button onClick={() => down()}>{'DOWN'}</button>
				<span {...rest}>{`Counter: ${count.value}`}</span>
			</>
		}

		render(App);

		const buttonIncrement = container.querySelectorAll('button')[0];
		const buttonDecrement = container.querySelectorAll('button')[1];
		const span = container.querySelector('span');

		expect(span.textContent).toBe('Counter: 0');

		buttonIncrement.click();
		flushSync();

		expect(span.textContent).toBe('Counter: 1');

		buttonDecrement.click();
		flushSync();

		expect(span.textContent).toBe('Counter: 0');
	});

	it('keeps reactivity on elements for element spreads and adds / removes dynamic props', () => {
		function App() @{
			const count = track(0);
			<CounterWrapper count={count} up={() => count.value++} />
		}

		function CounterWrapper(props: { count: Tracked<number>; up: () => void }) @{
			const more: {
				double: Derived<number>;
				another?: number;
				extra: number;
			} = new RippleObject({
				double: track(() => props.count.value * 2),
				another: 0,
				extra: 100,
			});
			effect(() => {
				const count = props.count.value;
				if (count === 1) {
					delete more.another;
				} else if (count === 2) {
					more.another = 0;
				}
			});
			<div>
				<Counter
					{...props}
					double={more.double}
					another={track(() => more.another)}
					extra={more.extra}
				/>
			</div>
		}

		function Counter({
			count,
			up,
			...rest
		}: {
			count: Tracked<number>;
			up: () => void;
			double: Derived<number>;
			another: Derived<number | undefined>;
			extra: number;
		}) @{
			<>
				<div {...rest}>{`Counter: ${count.value} Double: ${rest.double.value}`}</div>
				<button onClick={() => up()}>{'UP'}</button>
			</>
		}

		render(App);

		const buttonIncrement = container.querySelectorAll('button')[0];
		const div = container.querySelectorAll('div')[1];

		expect(div.getAttribute('double')).toBe('0');
		expect(div.getAttribute('another')).toBe('0');
		expect(div.getAttribute('extra')).toBe('100');
		expect(div.textContent).toBe('Counter: 0 Double: 0');

		buttonIncrement.click();
		flushSync();

		expect(div.getAttribute('double')).toBe('2');
		expect(div.hasAttribute('another')).toBe(false);
		expect(div.getAttribute('extra')).toBe('100');
		expect(div.textContent).toBe('Counter: 1 Double: 2');

		buttonIncrement.click();
		flushSync();

		expect(div.getAttribute('double')).toBe('4');
		expect(div.getAttribute('another')).toBe('0');
		expect(div.getAttribute('extra')).toBe('100');
		expect(div.textContent).toBe('Counter: 2 Double: 4');
	});
});
