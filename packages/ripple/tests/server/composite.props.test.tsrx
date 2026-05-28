import { track } from 'ripple';
import type { Tracked, Props } from 'ripple';

describe('composite > props', () => {
	it('correctly handles default prop values', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelectorAll('div')[0].textContent).toBe('456');
		expect(document.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly handles default prop values #2', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelectorAll('div')[0].textContent).toBe('456');
		expect(document.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly handles no props', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelectorAll('div')[0].textContent).toBe('');
		expect(document.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly handles no props #2', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelectorAll('div')[0].textContent).toBe('');
		expect(document.querySelectorAll('div')[1].textContent).toBe('123');
	});

	it('correctly retains prop accessors and reactivity when using rest props', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);
		const button1 = document.querySelectorAll('button')[0];

		const button2 = document.querySelectorAll('button')[1];

		expect(button1.className).toContain('on');
		expect(button2.className).toContain('on');
	});

	it('correctly renders destructured props', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelector('img').getAttribute('src')).toBe('https://picsum.photos/300/200');
		expect(document.querySelector('span').textContent).toBe('1');
		expect(document.querySelector('h5').textContent).toBe('Product 1');
		expect(document.querySelector('h3').textContent).toBe('Org 1');
		expect(document.querySelector('p').textContent).toBe('Description 1');
		expect(document.querySelector('price').textContent).toBe('15');
	});
});
