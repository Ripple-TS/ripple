import { RippleArray, flushSync, track, type Component } from 'ripple';

describe('composite > render', () => {
	it('renders composite components', () => {
		function Button(&{ count }: { count: number }) {
			return <><div>{count}</div></>;
		}

		function App() {
			return <>
				let &[count] = track(0);
				<button onClick={() => count++}>{'Increment'}</button>
				<Button {count} />
			</>;
		}

		render(App);

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('1');

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toBe('2');
	});

	it('correct handles passing through component props and children', () => {
		function Button({ A, B, children }: { A: () => void; B: () => void; children: () => void }) {
			return <>
				<div>
					<A />
					{children}
					<B />
				</div>
			</>;
		}

		function App() {
			return <>
				function A() {
					return <><div>{'I am A'}</div></>;
				}
				function B() {
					return <><div>{'I am B'}</div></>;
				}
				<Button {A} {B}>
					<div>{'other text'}</div>
				</Button>
			</>;
		}

		render(App);

		expect(container).toMatchSnapshot();
	});

	it('render simple text as children', () => {
		function App() {
			return <>
				let name = 'Click Me';
				<Child class="my-button">{name}</Child>
			</>;
		}

		function Child({ children, ...rest }: { children: string; class: string }) {
			return <><button {...rest}>{children}</button></>;
		}

		render(App);
		expect(container).toMatchSnapshot();
	});

	it('renders explicit text around children', () => {
		function Frame({ children }) {
			return <>
				<div class="frame">
					{'before'}
					{children}
					{'after'}
				</div>
			</>;
		}

		function App() {
			return <>
				<Frame>
					<span class="middle">{'middle'}</span>
				</Frame>
			</>;
		}

		render(App);

		const frame = /** @type {HTMLDivElement} */ (container.querySelector('.frame'));
		const nodes = Array.from(frame.childNodes).filter(
			(node) => node.nodeType !== Node.COMMENT_NODE,
		);

		expect(nodes).toHaveLength(3);
		expect(nodes[0].nodeType).toBe(Node.TEXT_NODE);
		expect(nodes[0].textContent).toBe('before');
		expect((/** @type {HTMLElement} */ (nodes[1])).outerHTML).toBe(
			'<span class="middle">middle</span>',
		);
		expect(nodes[2].nodeType).toBe(Node.TEXT_NODE);
		expect(nodes[2].textContent).toBe('after');
	});

	it('preserves distinct scoped ripple hashes for wrapper and child content', () => {
		function App() {
			return <>
				function Wrapper({ children }) {
					return <>
						<div class="green">
							{'Wrapper'}
							{children}
						</div>
						<style>
							.green {
								color: green;
							}
						</style>
					</>;
				}
				function Child() {
					return <>
						<div class="red">{'Child'}</div>
						<style>
							.red {
								color: red;
							}
						</style>
					</>;
				}
				<Wrapper>
					<Child />
				</Wrapper>
			</>;
		}

		render(App);

		const wrapper = container.querySelector('.green');
		const child = container.querySelector('.red');
		const wrapper_scopes = Array.from(wrapper.classList).filter((name) => name.startsWith('tsrx-'));
		const child_scopes = Array.from(child.classList).filter((name) => name.startsWith('tsrx-'));

		expect(wrapper_scopes).toHaveLength(1);
		expect(child_scopes).toHaveLength(1);

		const wrapper_scope = wrapper_scopes[0];
		const child_scope = child_scopes.find((name) => name !== wrapper_scope) || child_scopes[0];

		expect(wrapper_scope).not.toBe(child_scope);
	});

	it('handles generics', () => {
		function ArrayTest() {
			return <>
				let items = new RippleArray<number>();
				items.push.apply(items, [1, 2, 3, 4, 5]);
				<pre>{items ? JSON.stringify(items) : 'Loading...'}</pre>
			</>;
		}

		render(ArrayTest);
	});

	it('should not render <undefined> tag when a passed in component is undefined', () => {
		function Child(&{
			children,
			NonExistent,
			...props
		}: {
			children?: Component;
			NonExistent?: Component;
			[key: string]: any;
		}) {
			return <>
				<div {...props}>
					{children}
					// @ts-expect-error - intentionally testing behavior when a component is undefined
					<NonExistent />
				</div>
			</>;
		}

		function App() {
			return <><Child /></>;
		}

		render(App);

		const div = container.querySelector('div');
		const undefinedTag = container.querySelector('undefined');

		expect(undefinedTag).toBeNull();
		expect(div.innerHTML).not.toContain('<undefined');
	});
});

describe('scoped styles with children', () => {
	it('generates correct CSS hashes for wrapper and child with empty style in App', () => {
		function Wrapper(&{ children }: { children?: Component }) {
			return <>
				<div class="green">
					{'Wrapper'}
					{children}
				</div>
				<style>
					.green {
						color: green;
					}
				</style>
			</>;
		}

		function Child() {
			return <>
				<div class="red">{'Child'}</div>
				<style>
					.red {
						color: red;
					}
				</style>
			</>;
		}

		function App() {
			return <>
				<Wrapper>
					<Child />
				</Wrapper>
				<style></style>
			</>;
		}

		render(App);

		const wrapper = container.querySelector('.green');
		const child = container.querySelector('.red');

		const wrapper_classes = Array.from(wrapper.classList).filter((c) => c.startsWith('tsrx-'));
		const child_classes = Array.from(child.classList).filter((c) => c.startsWith('tsrx-'));

		expect(wrapper_classes).toHaveLength(1);
		expect(child_classes).toHaveLength(1);
		expect(wrapper_classes[0]).not.toBe(child_classes[0]);
	});
});
