import { track } from 'ripple';
import type {
	Tracked,
	PropsWithChildren,
	PropsWithExtras,
	Component,
	PropsWithChildrenOptional,
} from 'ripple';

describe('basic server > components & composition', () => {
	async function render_expected_invalid_component(App: Component) {
		const console_error_spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			return await render(App);
		} finally {
			console_error_spy.mockRestore();
		}
	}

	it('renders with component composition and children', async () => {
		function Card(props: PropsWithChildren<{}>) {
			return <><div class="card">{props.children}</div></>;
		}

		function Basic() {
			return <>
				function children() {
					return <><p>{'Card content here'}</p></>;
				}
				<Card {children} />
			</>;
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const card = document.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph.textContent).toBe('Card content here');
	});

	it('does not render a falsy component call', async () => {
		function Card(props: PropsWithChildrenOptional<{ test: Component }>) {
			return <>
				<div class="card">
					{props.children}
				</div>
			</>;
		}

		function Basic() {
			return <>
				function test() {
					return <><p>{'Card content here'}</p></>;
				}
				<Card {test} />
			</>;
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const card = document.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph).toBeFalsy();
		expect(body).toBeHtml('<div class="card"></div>');
	});

	it('renders a component when children is set a component prop', async () => {
		function Card(props: PropsWithChildren<{}>) {
			return <><div class="card">{props.children}</div></>;
		}

		function Basic() {
			return <>
				function children() {
					return <><p>{'Card content here'}</p></>;
				}
				<Card {children} />
			</>;
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const card = document.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph.textContent).toBe('Card content here');
	});

	it('renders direct component function calls as values', async () => {
		function Test({ label }: { label: string }) {
			return <><span>{label}</span></>;
		}

		function App() {
			return <>{Test({ label: 'direct call' })}</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelector('span')?.textContent).toBe('direct call');
	});

	it('renders arrays and primitives returned from component calls', async () => {
		function Test() {
			const item = <span>{'A'}</span>;
			return [item, 'B', null, undefined];
		}

		function App() {
			return <><Test /></>;
		}

		const { body } = await render(App);

		expect(body).toContain('<span>A</span>');
		expect(body).toContain('B');
	});

	it('throws when a TSRXElement value is used as a component type', async () => {
		function Test() {
			return <><span>{'value'}</span></>;
		}

		function App() {
			const El = Test({});
			return <><El /></>;
		}

		const result = await render_expected_invalid_component(App);

		expect(result.topLevelError?.message).toContain('Invalid component type');
	});

	it('allows a plain function as a component type', async () => {
		function Func() {
			return 'plain';
		}

		function App() {
			return <><Func /></>;
		}

		const { body } = await render(App);

		expect(body).toBeHtml('plain');
	});

	it('allows a compat-only function as a component type', async () => {
		function CompatOnly() {
			return <tsx>
				<div>
					{'compat'}
				</div>
			</tsx>;
		}

		function App() {
			return <><CompatOnly /></>;
		}

		const { body } = await render(App);

		expect(body).toBeHtml('<div>compat</div>');
	});

	it('renders with nested components and prop passing', async () => {
		function Button(props: PropsWithExtras<{
			variant: string;
			label: string;
			onClick: EventListener;
		}>) {
			return <><button class={props.variant} onClick={props.onClick}>{props.label}</button></>;
		}

		function Card(props: PropsWithExtras<{
			title: string;
			content: string;
			buttonText: string;
			onAction: EventListener;
		}>) {
			return <>
				<div class="card">
					<h3>{props.title}</h3>
					<p>{props.content}</p>
					<Button variant="primary" label={props.buttonText} onClick={props.onAction} />
				</div>
			</>;
		}

		function Basic() {
			return <>
				let &[clicked] = track(false);
				<Card
					title="Test Card"
					content="This is a test card"
					buttonText="Click me"
					onAction={() => (clicked = true)}
				/>
				<div class="status">{clicked ? 'Clicked' : 'Not clicked'}</div>
			</>;
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const card = document.querySelector('.card');
		const title = card.querySelector('h3');
		const content = card.querySelector('p');
		const button = card.querySelector('button');
		const status = document.querySelector('.status');

		expect(title.textContent).toBe('Test Card');
		expect(content.textContent).toBe('This is a test card');
		expect(button.textContent).toBe('Click me');
		expect(button.className).toBe('primary');
		expect(status.textContent).toBe('Not clicked');
	});

	it('renders with reactive component props', async () => {
		function ChildComponent(props: PropsWithExtras<{
			text: Tracked<string>;
			count: Tracked<number>;
		}>) {
			return <>
				<div class="child-content">{props.text.value}</div>
				<div class="child-count">{props.count.value}</div>
			</>;
		}

		function Basic() {
			return <>
				let &[message, messageTracked] = track('Hello');
				let &[number, numberTracked] = track(1);
				<ChildComponent text={messageTracked} count={numberTracked} />
				<button
					onClick={() => {
						message = message === 'Hello' ? 'Goodbye' : 'Hello';
						number++;
					}}
				>
					{'Update Props'}
				</button>
			</>;
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const contentDiv = document.querySelector('.child-content');
		const countDiv = document.querySelector('.child-count');

		expect(contentDiv.textContent).toBe('Hello');
		expect(countDiv.textContent).toBe('1');
	});

	it('renders components as named and anonymous properties', async () => {
		function Span() {
			return <><span>{'Hello from Span'}</span></>;
		}

		function Button({ children }: PropsWithChildren<{}>) {
			return <><button>{children}</button></>;
		}

		function ArrowButton({ children }: PropsWithChildren<{}>) {
			return <><button class="arrow-button">{children}</button></>;
		}

		const UI = {
			span: Span,
			button: Button,
			arrowButton: ArrowButton,
		};

		function App() {
			return <>
				function children() {
					return <><span>{'Click me!'}</span></>;
				}
				<div>
					<h1>{'Component as Property Test'}</h1>
					<UI.span />
					<UI.button {children} />
					<UI.arrowButton {children} />
				</div>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);

		const heading = document.querySelector('h1');
		const span = document.querySelector('span');
		const button = document.querySelector('button');
		const buttonSpan = button.querySelector('span');
		const arrowButton = document.querySelector('.arrow-button');
		const arrowButtonSpan = arrowButton.querySelector('span');

		expect(heading.textContent).toBe('Component as Property Test');
		expect(span.textContent).toBe('Hello from Span');
		expect(buttonSpan.textContent).toBe('Click me!');
		expect(arrowButtonSpan.textContent).toBe('Click me!');
	});

	it('handles empty string children', async () => {
		function Button({ children }: PropsWithChildren<{}>) {
			return <>{children}</>;
		}

		function App() {
			return <>
				let content = '';
				<Button>{''}</Button>
				<Button>{content}</Button>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.documentElement).toBeNull();
	});

	it('handles component without any output', async () => {
		function Noop() {
			return <></>;
		}

		function Op() {
			return <><div>{'Some HTML content'}</div></>;
		}

		function App() {
			return <>
				let Content = track(() => Noop);
				<@Content />
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelector('div')).toBeNull();
	});

	it('renders explicit children prop without spread', async () => {
		function Card(props: PropsWithChildren<{}>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <><Card children="fallback text" /></>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('fallback text');
	});

	it('renders explicit children before spread', async () => {
		function Card(props: PropsWithChildren<{ id: string }>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <>
				const extra = { id: '1' };
				<Card children="fallback text" {...extra} />
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('fallback text');
	});

	it('renders spread before explicit children', async () => {
		function Card(props: PropsWithChildren<{ id: string }>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <>
				const extra = { id: '1' };
				<Card {...extra} children="fallback text" />
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('fallback text');
	});

	it('template children override explicit children before spread', async () => {
		function Card(props: PropsWithChildren<{ id: string }>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <>
				const extra = { id: '1' };
				<Card children="fallback text" {...extra}>
					<span>{'template content'}</span>
				</Card>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card span').textContent).toBe('template content');
		expect(document.querySelector('.card').textContent).toBe('template content');
	});

	it('template children override explicit children after spread', async () => {
		function Card(props: PropsWithChildren<{ id: string }>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <>
				const extra = { id: '1' };
				<Card {...extra} children="fallback text">
					<span>{'template content'}</span>
				</Card>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card span').textContent).toBe('template content');
		expect(document.querySelector('.card').textContent).toBe('template content');
	});

	it('spread can override explicit children when no template children', async () => {
		function Card(props: PropsWithChildren<{ id: string }>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <>
				const extra = { id: '1', children: 'from spread' };
				<Card
					// @ts-ignore
					children="explicit"
					{...extra}
				/>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('from spread');
	});

	it('explicit children overrides spread children when it comes after', async () => {
		function Card(props: PropsWithChildren<{ id: string }>) {
			return <><div class="card">{props.children}</div></>;
		}

		function App() {
			return <>
				const extra = { id: '1', children: 'from spread' };
				<Card {...extra} children="explicit" />
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('explicit');
	});

	it('renders components declared inside composite element children', async () => {
		function Wrapper(props: PropsWithChildren<{}>) {
			return <><div class="wrapper">{props.children}</div></>;
		}

		function App() {
			return <>
				<Wrapper>
					function Inner() {
						return <><span class="inner">{'inner content'}</span></>;
					}

					<Inner />
				</Wrapper>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.wrapper .inner').textContent).toBe('inner content');
	});

	it('renders nested components declared inside composite children with prop passing', async () => {
		function Wrapper(props: PropsWithChildren<{}>) {
			return <><div class="wrapper">{props.children}</div></>;
		}

		function App() {
			return <>
				<Wrapper>
					function Z() {
						return <><div class="z">{'I am Z'}</div></>;
					}

					function Child(&{ Z }: { Z: Component }) {
						return <>
							<div class="child">
								{'Child Component: '}
								<Z />
							</div>
						</>;
					}

					<Child {Z} />
				</Wrapper>
			</>;
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.wrapper .child').textContent).toBe('Child Component: I am Z');
		expect(document.querySelector('.wrapper .z').textContent).toBe('I am Z');
	});
});
