import { track } from 'ripple';
import type {
	Tracked,
	PropsWithChildren,
	PropsWithExtras,
	Component,
	PropsWithChildrenOptional,
} from 'ripple';

describe('basic server > components & composition', () => {
	it('renders with component composition and children', async () => {
		component Card(props: PropsWithChildren<{}>) {
			<div class="card">{props.children}</div>
		}

		component Basic() {
			component children() {
				<p>{'Card content here'}</p>
			}

			<Card {children} />
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const card = document.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph.textContent).toBe('Card content here');
	});

	it('does not render a falsy component call', async () => {
		component Card(props: PropsWithChildrenOptional<{ test: Component }>) {
			<div class="card">
				// @ts-expect-error - ripple automatically handles falsy children
				{props.children}
			</div>
		}

		component Basic() {
			component test() {
				<p>{'Card content here'}</p>
			}

			<Card {test} />
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
		component Card(props: PropsWithChildren<{}>) {
			<div class="card">{props.children}</div>
		}

		component Basic() {
			component children() {
				<p>{'Card content here'}</p>
			}
			<Card {children} />
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const card = document.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph.textContent).toBe('Card content here');
	});

	it('renders with nested components and prop passing', async () => {
		component Button(props: PropsWithExtras<{
			variant: string;
			label: string;
			onClick: EventListener;
		}>) {
			<button class={props.variant} onClick={props.onClick}>{props.label}</button>
		}

		component Card(props: PropsWithExtras<{
			title: string;
			content: string;
			buttonText: string;
			onAction: EventListener;
		}>) {
			<div class="card">
				<h3>{props.title}</h3>
				<p>{props.content}</p>
				<Button variant="primary" label={props.buttonText} onClick={props.onAction} />
			</div>
		}

		component Basic() {
			let &[clicked] = track(false);

			<Card
				title="Test Card"
				content="This is a test card"
				buttonText="Click me"
				onAction={() => (clicked = true)}
			/>
			<div class="status">{clicked ? 'Clicked' : 'Not clicked'}</div>
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
		component ChildComponent(props: PropsWithExtras<{
			text: Tracked<string>;
			count: Tracked<number>;
		}>) {
			<div class="child-content">{props.text.value}</div>
			<div class="child-count">{props.count.value}</div>
		}

		component Basic() {
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
		}

		const { body } = await render(Basic);
		const { document } = parseHtml(body);

		const contentDiv = document.querySelector('.child-content');
		const countDiv = document.querySelector('.child-count');

		expect(contentDiv.textContent).toBe('Hello');
		expect(countDiv.textContent).toBe('1');
	});

	it('renders components as named and anonymous properties', async () => {
		const UI = {
			span: component Span() {
				<span>{'Hello from Span'}</span>
			},
			button: component({ children }: PropsWithChildren<{}>) {
				<button>{children}</button>
			},
			arrowButton: component({ children }: PropsWithChildren<{}>) => {
				<button class="arrow-button">{children}</button>
			},
		};

		component App() {
			component children() {
				<span>{'Click me!'}</span>
			}

			<div>
				<h1>{'Component as Property Test'}</h1>
				<UI.span />
				<UI.button {children} />
				<UI.arrowButton {children} />
			</div>
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
		component Button({ children }: PropsWithChildren<{}>) {
			{children}
		}

		component App() {
			let content = '';
			<Button>{''}</Button>
			<Button>{content}</Button>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.documentElement).toBeNull();
	});

	it('handles component without any output', async () => {
		component Noop() {
			// No output
		}

		component Op() {
			<div>{'Some HTML content'}</div>
		}

		component App() {
			let Content = track(() => Noop);
			<@Content />
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);

		expect(document.querySelector('div')).toBeNull();
	});

	it('renders explicit children prop without spread', async () => {
		component Card(props: PropsWithChildren<{}>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			<Card children="fallback text" />
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('fallback text');
	});

	it('renders explicit children before spread', async () => {
		component Card(props: PropsWithChildren<{ id: string }>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			const extra = { id: '1' };
			<Card children="fallback text" {...extra} />
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('fallback text');
	});

	it('renders spread before explicit children', async () => {
		component Card(props: PropsWithChildren<{ id: string }>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			const extra = { id: '1' };
			<Card {...extra} children="fallback text" />
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('fallback text');
	});

	it('template children override explicit children before spread', async () => {
		component Card(props: PropsWithChildren<{ id: string }>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			const extra = { id: '1' };
			<Card children="fallback text" {...extra}>
				<span>{'template content'}</span>
			</Card>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card span').textContent).toBe('template content');
		expect(document.querySelector('.card').textContent).toBe('template content');
	});

	it('template children override explicit children after spread', async () => {
		component Card(props: PropsWithChildren<{ id: string }>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			const extra = { id: '1' };
			<Card {...extra} children="fallback text">
				<span>{'template content'}</span>
			</Card>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card span').textContent).toBe('template content');
		expect(document.querySelector('.card').textContent).toBe('template content');
	});

	it('spread can override explicit children when no template children', async () => {
		component Card(props: PropsWithChildren<{ id: string }>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			const extra = { id: '1', children: 'from spread' };
			<Card
				// @ts-ignore
				children="explicit"
				{...extra}
			/>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('from spread');
	});

	it('explicit children overrides spread children when it comes after', async () => {
		component Card(props: PropsWithChildren<{ id: string }>) {
			<div class="card">{props.children}</div>
		}

		component App() {
			const extra = { id: '1', children: 'from spread' };
			<Card {...extra} children="explicit" />
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.card').textContent).toBe('explicit');
	});

	it('renders components declared inside composite element children', async () => {
		component Wrapper(props: PropsWithChildren<{}>) {
			<div class="wrapper">{props.children}</div>
		}

		component App() {
			<Wrapper>
				component Inner() {
					<span class="inner">{'inner content'}</span>
				}

				<Inner />
			</Wrapper>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.wrapper .inner').textContent).toBe('inner content');
	});

	it('renders nested components declared inside composite children with prop passing', async () => {
		component Wrapper(props: PropsWithChildren<{}>) {
			<div class="wrapper">{props.children}</div>
		}

		component App() {
			<Wrapper>
				component Z() {
					<div class="z">{'I am Z'}</div>
				}

				component Child(&{ Z }: { Z: Component }) {
					<div class="child">
						{'Child Component: '}
						<Z />
					</div>
				}

				<Child {Z} />
			</Wrapper>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('.wrapper .child').textContent).toBe('Child Component: I am Z');
		expect(document.querySelector('.wrapper .z').textContent).toBe('I am Z');
	});
});
