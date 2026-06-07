import { describe, it, expect } from 'vitest';
import { flushSync, track } from 'ripple';

describe('basic client > rendering & text', () => {
	it('renders static text', () => {
		function Basic() @{
			<div>{'Hello World'}</div>
		}

		expect(container).toBeDefined();

		render(Basic);
		expect(container).toMatchSnapshot();
	});

	it('renders semi-dynamic text', () => {
		function Basic() @{
			let message = 'Hello World';
			<div>{message}</div>
		}

		render(Basic);

		expect(container).toMatchSnapshot();
	});

	it('renders string interpolation without creating HTML', () => {
		function Basic() @{
			let markup = '<span>Not HTML</span>';
			<div>{markup}</div>
		}

		render(Basic);

		const div = container.querySelector('div');

		expect(div.textContent).toBe('<span>Not HTML</span>');
		expect(div.querySelector('span')).toBeNull();
	});

	it('renders direct JSX text children as text', () => {
		function Basic() @{
			<>
				<div class="entities">Rock &amp; &quot;Roll&quot;</div>
				<div class="backslash">line break</div>
				<pre class="multiline">
					first
second
				</pre>
			</>
		}

		render(Basic);

		expect(container.querySelector('.entities').textContent).toBe('Rock & "Roll"');
		expect(container.querySelector('.backslash').textContent).toBe('line break');
		expect(container.querySelector('.multiline').textContent).toBe('first\nsecond');
	});

	it('does not render JavaScript statements outside returned component templates', () => {
		function Basic() {
			const ready = true;

			if (ready) {
				const leaked = 'should not render';
				void leaked;
			}

			return <>Hello world</>;
		}

		render(Basic);

		expect(container.textContent).toBe('Hello world');
		expect(container.querySelector('.leaked')).toBeNull();
	});

	it('renders primitive component return branches', () => {
		function Basic() @{
			const ready = false;
			if (!ready) {
				return 'Waiting';
			}
			<>Ready</>
		}

		render(Basic);

		expect(container.textContent).toBe('Waiting');
	});

	it('renders a root plain function that returns only a string', () => {
		function Basic() {
			return 'Only text';
		}

		render(Basic);

		expect(container.textContent).toBe('Only text');
	});

	it('renders a root plain function that returns only null', () => {
		function Basic() {
			return null;
		}

		render(Basic);

		expect(container.textContent).toBe('');
	});

	it('renders a root plain function that returns only undefined', () => {
		function Basic() {
			return undefined;
		}

		render(Basic);

		expect(container.textContent).toBe('');
	});

	it('does not stringify adjacent call-containing expression children', () => {
		function child(label: string) @{
			<span>{label}</span>
		}

		function empty() {
			return null;
		}

		const Constructed = function Constructed(label: string) {
			return child(label);
		} as unknown as {
			new (label: string): ReturnType<typeof child>;
		};

		const factory = child;

		function tag(_strings: TemplateStringsArray) {
			return child('tagged');
		}

		const lookup = {
			member: child('member'),
		};

		function getKey(): keyof typeof lookup {
			return 'member';
		}

		function touch() {
			return null;
		}

		let assigned;

		function Basic() @{
			<>
				<div>
					{'call:'}
					{child('call')}
				</div>
				<div>
					{'new:'}
					{new Constructed('new')}
				</div>
				<div>
					{'chain:'}
					{factory?.('chain')}
				</div>
				<div>
					{'ts-wrapper:'}
					{child('ts-wrapper')!}
				</div>
				<div>
					{'array:'}
					{[child('array')]}
				</div>
				<div>
					{'assignment:'}
					{assigned = child('assignment')}
				</div>
				<div>
					{'logical:'}
					{true && child('logical')}
				</div>
				<div>
					{'conditional:'}
					{true ? child('conditional') : ''}
				</div>
				<div>
					{'member:'}
					{lookup[getKey()]}
				</div>
				<div>
					{'object:'}
					{{
						[Symbol.for('ripple.element')]: true,
						render() {
							return child('object');
						},
					}}
				</div>
				<div>
					{'sequence:'}
					{(touch(), child('sequence'))}
				</div>
				<div>
					{'tagged:'}
					{tag`tagged`}
				</div>
				<div>
					{'unary:'}
					{void empty()}
				</div>
			</>
		}

		render(Basic);

		expect([...container.querySelectorAll('div')].map((div) => div.textContent)).toEqual([
			'call:call',
			'new:new',
			'chain:chain',
			'ts-wrapper:ts-wrapper',
			'array:array',
			'assignment:assignment',
			'logical:logical',
			'conditional:conditional',
			'member:member',
			'object:object',
			'sequence:sequence',
			'tagged:tagged',
			'unary:',
		]);
	});

	it('does not render unreachable statements after an ASI return', () => {
		function Basic() {
			return;
			const leaked = 'should not render';
			void leaked;
		}

		render(Basic);

		expect(container.textContent).toBe('');
	});

	it('renders bare JSX text in if-else branches', () => {
		function App() @{
			let condition = false;
			@if (condition) {
				<>Hello Ripple</>
			} @else {
				<>Hello React</>
			}
		}

		render(App);

		expect(container.textContent).toBe('Hello React');
	});

	it('renders dynamic text', () => {
		function Basic() @{
			let &[message] = track('Hello World');
			<>
				<button
					onClick={() => {
						message = 'Hello Ripple';
					}}
				>{'Change Text'}</button>
				<div>{message}</div>
			</>
		}

		render(Basic);

		const button = container.querySelector('button');

		button.click();
		flushSync();

		expect(container.querySelector('div').textContent).toEqual('Hello Ripple');
	});

	it('renders empty string literal', () => {
		function Basic() @{
			<div>{''}</div>
		}

		render(Basic);
		expect(container.querySelector('div').textContent).toEqual('');
	});

	it('renders empty template literal', () => {
		function Basic() @{
			<div>{``}</div>
		}

		render(Basic);
		expect(container.querySelector('div').textContent).toEqual('');
	});

	it('renders tick template literal for nested children', () => {
		function Child({ level, children }: { level: number; children: any }) @{
			<>
				@if (level == 1) {
					<h1>{children}</h1>
				}
				@if (level == 2) {
					<h2>{children}</h2>
				}
				@if (level == 3) {
					<h3>{children}</h3>
				}
			</>
		}

		function App() @{
			<Child level={1}>{`Heading 1`}</Child>
		}

		render(App);
		expect(container.querySelector('h1').textContent).toEqual('Heading 1');
	});

	it('renders simple JS expression logic correctly', () => {
		function Example() @{
			let test: Record<number, string> = {};
			let counter = 0;
			test[counter++] = 'Test';
			<>
				<div>{JSON.stringify(test)}</div>
				<div>{JSON.stringify(counter)}</div>
			</>
		}
		render(Example);

		expect(container).toMatchSnapshot();
	});

	it('renders with mixed static and dynamic content', () => {
		function Basic() @{
			let &[name] = track('World');
			let &[count] = track(0);
			const staticMessage = 'Welcome to Ripple!';
			<div class="mixed-content">
				<h1>{staticMessage}</h1>
				<p class="greeting">
					{'Hello, ' + name + '!'}
				</p>
				<p class="notifications">
					{'You have ' + count + ' notifications'}
				</p>
				<button
					onClick={() => {
						count++;
					}}
				>{'Add Notification'}</button>
				<button
					onClick={() => {
						name = name === 'World' ? 'User' : 'World';
					}}
				>{'Toggle Name'}</button>
			</div>
		}

		render(Basic);

		const heading = container.querySelector('h1');
		const greetingP = container.querySelector('.greeting');
		const notificationsP = container.querySelector('.notifications');
		const buttons = container.querySelectorAll('button');

		expect(heading.textContent).toBe('Welcome to Ripple!');
		expect(greetingP.textContent).toBe('Hello, World!');
		expect(notificationsP.textContent).toBe('You have 0 notifications');

		buttons[0].click();
		flushSync();
		expect(notificationsP.textContent).toBe('You have 1 notifications');

		buttons[1].click();
		flushSync();
		expect(greetingP.textContent).toBe('Hello, User!');
	});

	it('basic operations', () => {
		function App() @{
			let &[count] = track(0);
			const a = count++;
			const b = ++count;
			<>
				<div>{a}</div>
				<div>{b}</div>
				<div>{5}</div>
				<div>{count}</div>
			</>
		}

		render(App);
		expect(container).toMatchSnapshot();
	});

	it('renders with conditional rendering using if statements', () => {
		function Basic() @{
			let &[showContent] = track(false);
			let &[userRole] = track('guest');
			<>
				<button
					onClick={() => {
						showContent = !showContent;
					}}
				>{'Toggle Content'}</button>
				<button
					onClick={() => {
						userRole = userRole === 'guest' ? 'admin' : 'guest';
					}}
				>{'Toggle Role'}</button>
				<div class="content">
					@if (showContent) {
						@if (userRole === 'admin') {
							<div class="admin-content">{'Admin content'}</div>
						} @else {
							<div class="user-content">{'User content'}</div>
						}
					} @else {
						<div class="no-content">{'No content'}</div>
					}
				</div>
			</>
		}

		render(Basic);

		const buttons = container.querySelectorAll('button');
		const contentDiv = container.querySelector('.content');

		expect(contentDiv.querySelector('.no-content')).toBeTruthy();
		expect(contentDiv.querySelector('.admin-content')).toBeFalsy();
		expect(contentDiv.querySelector('.user-content')).toBeFalsy();

		buttons[0].click();
		flushSync();

		expect(contentDiv.querySelector('.no-content')).toBeFalsy();
		expect(contentDiv.querySelector('.user-content')).toBeTruthy();
		expect(contentDiv.querySelector('.admin-content')).toBeFalsy();

		buttons[1].click();
		flushSync();

		expect(contentDiv.querySelector('.no-content')).toBeFalsy();
		expect(contentDiv.querySelector('.user-content')).toBeFalsy();
		expect(contentDiv.querySelector('.admin-content')).toBeTruthy();
	});

	it('should handle lexical scopes correctly', () => {
		function App() @{
			let sectionData = 'Nested scope variable';
			<section>{sectionData}</section>
		}

		render(App);
		expect(container).toMatchSnapshot();
	});

	it('runs nested JavaScript blocks inside component-local callables', () => {
		function App() @{
			function readFunction() {
				const label = 'function outer';
				let result = '';

				{
					const label = 'function inner';
					result = label;
				}

				return `${result} / ${label}`;
			}
			const readArrow = () => {
				const offset = 5;
				let value = offset;

				{
					const offset = 17;
					value += offset;
				}

				return value;
			};
			class Reader {
				read() {
					const label = 'method outer';
					let result = '';

					{
						const label = 'method inner';
						result = label;
					}

					return `${result} / ${label}`;
				}
			}
			const reader = new Reader();
			<>
				<div class="block-function">{readFunction()}</div>
				<div class="block-arrow">{readArrow()}</div>
				<div class="block-method">{reader.read()}</div>
			</>
		}

		render(App);

		expect(container.querySelector('.block-function').textContent).toBe(
			'function inner / function outer',
		);
		expect(container.querySelector('.block-arrow').textContent).toBe('22');
		expect(container.querySelector('.block-method').textContent).toBe(
			'method inner / method outer',
		);
	});

	it('should handle consecutive text nodes without duplication', () => {
		function App() @{
			const Something = conditional('a');
			function conditional(item: 'a') {
				let hello = 'Hello';
				const obj = {
					a: function A() @{
						<div>
							{'a'}
							{' '}
							{hello}
						</div>
					},
				};

				return obj[item];
			}
			<Something />
		}

		render(App);
		const div = container.querySelector('div');
		expect(div.textContent).toEqual('a Hello');
	});

	it('should handle multiple consecutive text expressions', () => {
		function App() @{
			let name = 'World';
			<div>
				{'Hello'}
				{' '}
				{name}
				{'!'}
			</div>
		}

		render(App);
		const div = container.querySelector('div');
		expect(div.textContent).toEqual('Hello World!');
	});
});
