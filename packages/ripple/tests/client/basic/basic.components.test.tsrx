import type {
	Tracked,
	PropsWithChildren,
	PropsWithExtras,
	Component,
	PropsWithChildrenOptional,
} from 'ripple';
import { flushSync, track } from 'ripple';
import { did_error } from '../capture-error.js';

describe('basic client > components & composition', () => {
	it('renders with component composition and children', () => {
		function Card(props: PropsWithChildren<{}>) @{
			<div class="card">{props.children}</div>
		}

		function children() @{
			<p>{'Card content here'}</p>
		}

		function Basic() @{
			<Card {children} />
		}

		render(Basic);

		const card = container.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph.textContent).toBe('Card content here');
	});

	it('does not render a falsy component call', () => {
		function Card(props: PropsWithChildrenOptional<{ test?: Component }>) @{
			<div class="card">
				@if (props.children) {
					<>
						{props.children}
					</>
				}
			</div>
		}

		function Basic() @{
			function test() @{
				<p>{'Card content here'}</p>
			}
			<Card {test} />
		}

		render(Basic);

		const card = container.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph).toBeFalsy();
	});

	it('allows tracked variables alongside explicit component props', () => {
		function Card(props: PropsWithChildrenOptional<{ test?: Component }>) @{
			<div class="card">
				@if (props.children) {
					<>
						{props.children}
					</>
				}
			</div>
		}

		function TestSlot() @{
			<p>{'Card content here'}</p>
		}

		function Basic() @{
			let &[test] = track(false);
			<>
				<Card test={TestSlot} />
				<div>
					{test ? 'yes' : 'no'}
				</div>
			</>
		}

		render(Basic);

		const card = container.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph).toBeFalsy();
		expect(container.textContent).toContain('no');
	});

	it('renders a component when children is set a component prop', () => {
		function Card(props: PropsWithChildren<{}>) @{
			<div class="card">{props.children}</div>
		}

		function children() @{
			<p>{'Card content here'}</p>
		}

		function Basic() @{
			<Card {children} />
		}

		render(Basic);

		const card = container.querySelector('.card');
		const paragraph = card.querySelector('p');

		expect(card).toBeTruthy();
		expect(paragraph.textContent).toBe('Card content here');
	});

	it('renders direct component function calls as values', () => {
		function Test({ label }: { label: string }) @{
			<span>{label}</span>
		}

		function App() @{
			<>
				{Test({ label: 'direct call' })}
			</>
		}

		render(App);

		expect(container.querySelector('span')?.textContent).toBe('direct call');
	});

	it('renders arrays and primitives returned from component calls', () => {
		function Test() {
			const item = <span>{'A'}</span>;
			return [item, 'B', null, undefined];
		}

		function App() @{
			<Test />
		}

		render(App);

		expect(container.textContent).toBe('AB');
	});

	it('throws when a TSRXElement value is used as a component type', () => {
		function Test() @{
			<span>{'value'}</span>
		}

		function App() @{
			const El = Test({});
			<El />
		}

		expect(() => render(App)).toThrow('Invalid component type');
	});

	it('allows a plain function as a component type', () => {
		function Func() {
			return 'plain';
		}

		function App() @{
			<Func />
		}

		render(App);

		expect(container.textContent).toBe('plain');
	});

	it('allows a compat-only function as a component type', () => {
		function CompatOnly() @{
			<div>{'compat'}</div>
		}

		function App() @{
			<CompatOnly />
		}

		render(App);

		expect(container.textContent).toBe('compat');
	});

	it('renders with nested components and prop passing', () => {
		function Button(props: PropsWithExtras<{
			variant: string;
			label: string;
			onClick: EventListener;
		}>) @{
			<button class={props.variant} onClick={props.onClick}>{props.label}</button>
		}

		function Card(props: PropsWithExtras<{
			title: string;
			content: string;
			buttonText: string;
			onAction: EventListener;
		}>) @{
			<div class="card">
				<h3>{props.title}</h3>
				<p>{props.content}</p>
				<Button variant="primary" label={props.buttonText} onClick={props.onAction} />
			</div>
		}

		function Basic() @{
			let &[clicked] = track(false);
			<>
				<Card
					title="Test Card"
					content="This is a test card"
					buttonText="Click me"
					onAction={() => (clicked = true)}
				/>
				<div class="status">
					{clicked ? 'Clicked' : 'Not clicked'}
				</div>
			</>
		}

		render(Basic);

		const card = container.querySelector('.card');
		const title = card.querySelector('h3');
		const content = card.querySelector('p');
		const button = card.querySelector('button');
		const status = container.querySelector('.status');

		expect(title.textContent).toBe('Test Card');
		expect(content.textContent).toBe('This is a test card');
		expect(button.textContent).toBe('Click me');
		expect(button.className).toBe('primary');
		expect(status.textContent).toBe('Not clicked');

		button.click();
		flushSync();

		expect(status.textContent).toBe('Clicked');
	});

	it('renders with reactive component props', () => {
		function ChildComponent(props: PropsWithExtras<{
			text: Tracked<string>;
			count: Tracked<number>;
		}>) @{
			<>
				<div class="child-content">{props.text.value}</div>
				<div class="child-count">{props.count.value}</div>
			</>
		}

		function Basic() @{
			let &[message, messageTracked] = track('Hello');
			let &[number, numberTracked] = track(1);
			<>
				<ChildComponent text={messageTracked} count={numberTracked} />
				<button
					onClick={() => {
						message = message === 'Hello' ? 'Goodbye' : 'Hello';
						number++;
					}}
				>{'Update Props'}</button>
			</>
		}

		render(Basic);

		const contentDiv = container.querySelector('.child-content');
		const countDiv = container.querySelector('.child-count');
		const button = container.querySelector('button');

		expect(contentDiv.textContent).toBe('Hello');
		expect(countDiv.textContent).toBe('1');

		button.click();
		flushSync();

		expect(contentDiv.textContent).toBe('Goodbye');
		expect(countDiv.textContent).toBe('2');

		button.click();
		flushSync();

		expect(contentDiv.textContent).toBe('Hello');
		expect(countDiv.textContent).toBe('3');
	});

	it('updates explicit text children props reactively', () => {
		function TextProp(&{ children }: PropsWithChildren<{}>) @{
			<div class="text-prop">{children}</div>
		}

		function Basic() @{
			let &[show] = track(false);
			<>
				<TextProp children={show ? 'hello' : ''} />
				<button class="show-text" onClick={() => (show = true)}>{'Show'}</button>
			</>
		}

		render(Basic);

		expect(container.querySelector('.text-prop')?.textContent).toBe('');

		container.querySelector('.show-text')?.click();
		flushSync();

		expect(container.querySelector('.text-prop')?.textContent).toBe('hello');
	});

	it('it retains this context with bracketed prop functions and keeps original chaining', () => {
		function App() @{
			const SYMBOL_PROP = Symbol();
			let &[hasError] = track(false);
			const obj: {
				count: Tracked<number>;
				increment: () => void;
				[key: symbol]: () => void;
				arr: Array<() => void>;
			} = {
				count: track(0),
				increment() {
					this.count.value++;
				},
				[SYMBOL_PROP]() {
					this.count.value++;
				},
				arr: [() => obj.count.value++, () => obj.count.value--],
			};

			const obj2 = null;

			function trigger_nonexistent() {
				hasError = did_error(() => {
					// @ts-ignore
					obj['nonexistent']();
				});
			}

			function trigger_nonexistent_chaining() {
				hasError = did_error(() => {
					// @ts-ignore
					obj['nonexistent']?.();
				});
			}

			function trigger_object_null() {
				hasError = did_error(() => {
					// @ts-ignore
					obj2['nonexistent']();
				});
			}

			function trigger_object_null_chained() {
				hasError = did_error(() => {
					// @ts-ignore
					obj2?.['nonexistent']?.();
				});
			}

			<>
				<button onClick={() => obj['increment']()}>{'Increment'}</button>
				<button onClick={() => obj[SYMBOL_PROP]()}>{'Increment'}</button>
				<button onClick={trigger_nonexistent}>{'Nonexistent'}</button>
				<button onClick={trigger_nonexistent_chaining}>{'Nonexistent chaining'}</button>
				<button onClick={trigger_object_null}>{'Object null'}</button>
				<button onClick={trigger_object_null_chained}>{'Object null chained'}</button>
				<button onClick={() => obj.arr[obj.arr.length - 1]()}>{'BinaryExpression prop'}</button>
				<span>{obj.count.value}</span>
				<span>{hasError}</span>
			</>
		}

		render(App);

		const button1 = container.querySelectorAll('button')[0];
		const button2 = container.querySelectorAll('button')[1];
		const button3 = container.querySelectorAll('button')[2];
		const button4 = container.querySelectorAll('button')[3];
		const button5 = container.querySelectorAll('button')[4];
		const button6 = container.querySelectorAll('button')[5];
		const button7 = container.querySelectorAll('button')[6];

		const countSpan = container.querySelectorAll('span')[0];
		const errorSpan = container.querySelectorAll('span')[1];

		expect(countSpan.textContent).toBe('0');
		expect(errorSpan.textContent).toBe('false');

		button1.click();
		flushSync();

		expect(countSpan.textContent).toBe('1');

		button2.click();
		flushSync();

		expect(countSpan.textContent).toBe('2');

		button3.click();
		flushSync();
		expect(errorSpan.textContent).toBe('true');

		button4.click();
		flushSync();
		expect(errorSpan.textContent).toBe('false');

		button5.click();
		flushSync();
		expect(errorSpan.textContent).toBe('true');

		button6.click();
		flushSync();
		expect(errorSpan.textContent).toBe('false');

		button7.click();
		flushSync();
		expect(countSpan.textContent).toBe('1');
	});

	it('renders components as named and anonymous properties', () => {
		function Span() @{
			<span>{'Hello from Span'}</span>
		}

		function Button({ children }: PropsWithChildren<{}>) @{
			<button>{children}</button>
		}

		function ArrowButton({ children }: PropsWithChildren<{}>) @{
			<button class="arrow-button">{children}</button>
		}

		const UI = {
			span: Span,
			button: Button,
			arrowButton: ArrowButton,
		};

		function children() @{
			<span>{'Click me!'}</span>
		}

		function App() @{
			<div>
				<h1>{'Component as Property Test'}</h1>
				<UI.span />
				<UI.button {children} />
				<UI.arrowButton {children} />
			</div>
		}

		render(App);

		const heading = container.querySelector('h1');
		const span = container.querySelector('span');
		const button = container.querySelector('button');
		const buttonSpan = button.querySelector('span');
		const arrowButton = container.querySelector('.arrow-button');
		const arrowButtonSpan = arrowButton.querySelector('span');

		expect(heading.textContent).toBe('Component as Property Test');
		expect(span.textContent).toBe('Hello from Span');
		expect(buttonSpan.textContent).toBe('Click me!');
		expect(arrowButtonSpan.textContent).toBe('Click me!');
	});

	it('handles empty string children', () => {
		function Button({ children }: PropsWithChildren<{}>) @{
			<>
				{children}
			</>
		}

		function App() @{
			let content = '';
			<>
				<Button>{''}</Button>
				<Button>{content}</Button>
			</>
		}

		expect(() => {
			render(App);
		}).not.toThrow();
	});

	it('handles component without any output', () => {
		function Noop() @{
			<></>
		}

		function Op() @{
			<div>{'Some HTML content'}</div>
		}

		function App() @{
			let &[Content] = track(() => Noop);
			<>
				<{Content} />
				<button onClick={() => (Content = Op)}>{'Show Op'}</button>
			</>
		}

		render(App);

		const button = container.querySelector('button');

		expect(() => {
			button.click();
		}).not.toThrow();
	});

	it('renders explicit children prop without spread', () => {
		function Card(props: PropsWithChildren<{}>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			<Card children="fallback text" />
		}

		render(App);
		expect(container.querySelector('.card').textContent).toBe('fallback text');
	});

	it('renders explicit children before spread', () => {
		function Card(props: PropsWithChildren<{ id: string }>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			const extra = { id: '1' };
			<Card children="fallback text" {...extra} />
		}

		render(App);
		expect(container.querySelector('.card').textContent).toBe('fallback text');
	});

	it('renders spread before explicit children', () => {
		function Card(props: PropsWithChildren<{ id: string }>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			const extra = { id: '1' };
			<Card {...extra} children="fallback text" />
		}

		render(App);
		expect(container.querySelector('.card').textContent).toBe('fallback text');
	});

	it('template children override explicit children before spread', () => {
		function Card(props: PropsWithChildren<{ id: string }>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			const extra = { id: '1' };
			<Card children="fallback text" {...extra}>
				<span>{'template content'}</span>
			</Card>
		}

		render(App);
		expect(container.querySelector('.card span').textContent).toBe('template content');
		expect(container.querySelector('.card').textContent).toBe('template content');
	});

	it('template children override explicit children after spread', () => {
		function Card(props: PropsWithChildren<{ id: string }>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			const extra = { id: '1' };
			<Card {...extra} children="fallback text">
				<span>{'template content'}</span>
			</Card>
		}

		render(App);
		expect(container.querySelector('.card span').textContent).toBe('template content');
		expect(container.querySelector('.card').textContent).toBe('template content');
	});

	it('spread can override explicit children when no template children', () => {
		function Card(props: PropsWithChildren<{ id: string }>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			const extra = { id: '1', children: 'from spread' };
			<Card children="explicit" {...extra} />
		}

		render(App);
		expect(container.querySelector('.card').textContent).toBe('from spread');
	});

	it('explicit children overrides spread children when it comes after', () => {
		function Card(props: PropsWithChildren<{ id: string }>) @{
			<div class="card">{props.children}</div>
		}

		function App() @{
			const extra = { id: '1', children: 'from spread' };
			<Card {...extra} children="explicit" />
		}

		render(App);
		expect(container.querySelector('.card').textContent).toBe('explicit');
	});

	it('renders components declared inside composite element children', () => {
		function Wrapper(props: PropsWithChildren<{}>) @{
			<div class="wrapper">{props.children}</div>
		}

		function Inner() @{
			<span class="inner">{'inner content'}</span>
		}

		function App() @{
			<Wrapper>
				<Inner />
			</Wrapper>
		}

		render(App);
		expect(container.querySelector('.wrapper .inner').textContent).toBe('inner content');
	});

	it('renders nested components declared inside composite children with prop passing', () => {
		function Wrapper(props: PropsWithChildren<{}>) @{
			<div class="wrapper">{props.children}</div>
		}

		function Z() @{
			<div class="z">{'I am Z'}</div>
		}

		function Child(&{ Z }: { Z: Component }) @{
			<div class="child">
				{'Child Component: '}
				<Z />
			</div>
		}

		function App() @{
			<Wrapper>
				<Child {Z} />
			</Wrapper>
		}

		render(App);
		expect(container.querySelector('.wrapper .child').textContent).toBe('Child Component: I am Z');
		expect(container.querySelector('.wrapper .z').textContent).toBe('I am Z');
	});
});
