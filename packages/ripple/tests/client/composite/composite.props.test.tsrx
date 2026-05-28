import type { Tracked, Props } from 'ripple';
import { effect, flushSync, track } from 'ripple';

describe('composite > props', () => {
	it('correctly handles default prop values', () => {
		function Child({ foo = 456 }) {
			return <><div>{foo}</div></>;
		}

		function App() {
			return <>
				let &[foo] = track(123);
				<Child />
				<Child {foo} />
			</>;
		}

		render(App);

		expect(container.querySelectorAll('div')[0].textContent).toBe('456');
		expect(container.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly handles default prop values #2', () => {
		function Child({ foo = 456 }) {
			return <><div>{foo}</div></>;
		}

		function App() {
			return <>
				let foo = 123;
				<Child />
				<Child {foo} />
			</>;
		}

		render(App);

		expect(container.querySelectorAll('div')[0].textContent).toBe('456');
		expect(container.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly handles no props', () => {
		function Child(props: { foo?: Tracked<number> }) {
			return <><div>{props.foo?.value}</div></>;
		}

		function App() {
			return <>
				let foo = track(123);
				<Child />
				<Child {foo} />
			</>;
		}

		render(App);

		expect(container.querySelectorAll('div')[0].textContent).toBe('');
		expect(container.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly handles no props #2', () => {
		function Child({ foo }: { foo?: number }) {
			return <><div>{foo}</div></>;
		}

		function App() {
			return <>
				let &[foo] = track(123);
				<Child />
				<Child {foo} />
			</>;
		}

		render(App);

		expect(container.querySelectorAll('div')[0].textContent).toBe('');
		expect(container.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('mutating a tracked value prop should work as intended', () => {
		const logs: number[] = [];

		function Counter({ count }: { count: Tracked<number> }) {
			return <>
				effect(() => {
					logs.push(count.value);
				});
				<button onClick={() => (count.value = count.value + 1)}>{'+'}</button>
			</>;
		}

		function App() {
			return <>
				const count = track(0);
				<div>
					<Counter {count} />
				</div>
			</>;
		}

		render(App);
		flushSync();

		expect(logs).toEqual([0]);

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(logs).toEqual([0, 1]);
	});

	it('correctly retains prop accessors and reactivity when using rest props', () => {
		function Button(&{ children, ...rest }: Props) {
			return <>
				<button {...rest}>{children}</button>
				<style>
					.on {
						color: blue;
					}
					.off {
						color: red;
					}
				</style>
			</>;
		}

		function Toggle(&{ pressed, ...rest }: { pressed: Tracked<boolean> }) {
			return <>
				const onClick = () => (pressed.value = !pressed.value);
				<Button {...rest} class={pressed.value ? 'on' : 'off'} {onClick}>{'button 1'}</Button>
				<Button class={pressed.value ? 'on' : 'off'} {onClick}>{'button 2'}</Button>
			</>;
		}

		function App() {
			return <>
				const pressed = track(true);
				<Toggle {pressed} />
			</>;
		}

		render(App);
		const button1 = container.querySelectorAll('button')[0];

		const button2 = container.querySelectorAll('button')[1];

		expect(button1.className).toContain('on');
		expect(button2.className).toContain('on');

		button1.click();
		flushSync();

		expect(button1.className).toContain('off');
		expect(button2.className).toContain('off');
	});

	it('correctly renders destructured props', () => {
		interface ProductInfo {
			id: string;
			name: string;
			organizationName: string;
			description: string;
			imageUrl: string;
			price: number;
		}

		function Product({ id, name, organizationName, description, imageUrl, price }: ProductInfo) {
			return <>
				<article class="no-padding">
					<img class="responsive small" src={imageUrl} alt={name} />
					<span>{id}</span>
					<h5>{name}</h5>
					<h3>{organizationName}</h3>
					<p>{description}</p>
					<price class="price">{price}</price>
				</article>
			</>;
		}

		function App() {
			return <>
				<Product
					id="1"
					name="Product 1"
					organizationName="Org 1"
					description="Description 1"
					imageUrl="https://picsum.photos/300/200"
					price={15}
				/>
			</>;
		}

		render(App);

		expect(container.querySelector('img').getAttribute('src')).toBe(
			'https://picsum.photos/300/200',
		);
		expect(container.querySelector('span').textContent).toBe('1');
		expect(container.querySelector('h5').textContent).toBe('Product 1');
		expect(container.querySelector('h3').textContent).toBe('Org 1');
		expect(container.querySelector('p').textContent).toBe('Description 1');
		expect(container.querySelector('price').textContent).toBe('15');
	});
});
