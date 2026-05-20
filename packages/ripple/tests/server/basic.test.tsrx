import { track } from 'ripple';
import type { Tracked, PropsNoChildren } from 'ripple';

describe('basic client', () => {
	it('render static text', async () => {
		component Basic() {
			<div>{'Hello World'}</div>
		}

		const { head, body } = await render(Basic);

		expect(head).toBe('');
		expect(body).toBeHtml('<div>Hello World</div>');
	});

	it('renders explicit text interpolation as escaped text', async () => {
		component Basic() {
			let markup = '<span>Not HTML</span>';

			<div>{text markup}</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>&lt;span>Not HTML&lt;/span></div>');
	});

	it('renders direct double-quoted text children as text', async () => {
		component Basic() {
			<div>"Rock &amp; &quot;Roll&quot;"</div>
			<div>"line\nbreak"</div>
			<pre>"first
second"</pre>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div>Rock &amp; "Roll"</div><div>line\\nbreak</div><pre>first\nsecond</pre>',
		);
	});

	it('renders inline tsrx fragments', async () => {
		component Basic() {
			const content = <tsrx>
				const label = 'Server';
				<span>{label}</span>
			</tsrx>;

			<div>{content}</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div><span>Server</span></div>');
	});

	it('renders deeply nested tsx and tsrx expression values', async () => {
		function makeFragment(label: string) {
			return <tsrx>
				<span class="label">{label}</span>
				const test = <tsx>
					{[1, 2, 3, 4].map(
						(item) => <tsx>
							{<tsrx>
								<div class="helper-item">{item}</div>
							</tsrx>}
						</tsx>,
					)}
				</tsx>;
				{test}
			</tsrx>;
		}

		component Basic() {
			{<tsx>{[1, 2, 3].map((item) => <div class="app-item">{item}</div>)}</tsx>}
			{makeFragment('from helper')}
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="app-item">1</div><div class="app-item">2</div><div class="app-item">3</div><span class="label">from helper</span><div class="helper-item">1</div><div class="helper-item">2</div><div class="helper-item">3</div><div class="helper-item">4</div>',
		);
	});

	it('renders tsrx nested directly inside a top-level tsx expression value', async () => {
		component Basic() {
			const content = <tsx>
				<section class="outer">
					{<tsrx>
						<div class="inner">{'from tsrx'}</div>
					</tsrx>}
				</section>
			</tsx>;

			{content}
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<section class="outer"><div class="inner">from tsrx</div></section>');
	});

	it('renders nested elements from tsrx inside a top-level tsx value', async () => {
		component Basic() {
			const content = <tsx>
				<div class="wrapper">
					{<tsrx>
						<section class="native">
							<span class="nested-tsrx">{'inside nested tsrx'}</span>
						</section>
					</tsrx>}
				</div>
			</tsx>;

			{content}
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="wrapper"><section class="native"><span class="nested-tsrx">inside nested tsrx</span></section></div>',
		);
	});

	it('renders tsx declared inside tsrx nested from a top-level tsx value', async () => {
		component Basic() {
			const content = <tsx>
				{<tsrx>
					const nested = <tsx>
						<span class="nested-tsx">
							{'inside nested tsx'}
						</span>
					</tsx>;
					<div class="native">{nested}</div>
				</tsrx>}
			</tsx>;

			{content}
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="native"><span class="nested-tsx">inside nested tsx</span></div>',
		);
	});

	it('flattens nested primitive arrays inside mixed tsrx collections', async () => {
		component Basic() {
			<div>
				{<tsx>
					{[
						'start:',
						['one', 2, true, null, false],
						<strong>
							{'!'}
						</strong>,
						':end',
					]}
				</tsx>}
			</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>start:one2truefalse<strong>!</strong>:end</div>');
	});

	it('flattens direct primitive array expressions', async () => {
		component Basic() {
			const items = ['start:', ['one', 2], null, true, false, ':end'];

			<div>{['start:', ['one', 2], null, true, false, ':end']}</div>
			<div>{items}</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>start:one2truefalse:end</div><div>start:one2truefalse:end</div>');
	});

	it('flattens conditional primitive array expressions', async () => {
		component Basic() {
			const condition = true;
			const ternary_items = condition
				? ['start:', ['one', 2], null, true, false, ':end']
				: ['fallback'];
			const logical_items = condition && ['start:', ['one', 2], null, true, false, ':end'];

			<div>{ternary_items}</div>
			<div>{logical_items}</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>start:one2truefalse:end</div><div>start:one2truefalse:end</div>');
	});

	it('renders tracked state updates', async () => {
		component Counter() {
			let &[count] = track(0);

			count++;
			count = count + 5;

			<div>{count}</div>
		}

		const { body } = await render(Counter);

		expect(body).toBeHtml('<div>6</div>');
	});

	it('renders dynamic component with tracked props', async () => {
		component Child({ count, ...rest }: PropsNoChildren<{
			count: Tracked<number>;
			class: { test: boolean };
		}>) {
			<div {...rest}>{'Child Component'}</div>
			<div>{count.value}</div>
		}

		component Parent() {
			const count = track(10);
			let Dynamic = track(() => Child);

			<@Dynamic {count} class={{ test: true }} />
		}

		const { body } = await render(Parent);

		expect(body).toBeHtml('<div class="test">Child Component</div><div>10</div>');
	});

	it('renders tracked object properties', async () => {
		component ObjCounter() {
			const obj = { count: track(2) };

			obj.count.value += 3;
			obj.count.value = obj.count.value + 1;

			<div>{obj.count.value}</div>
		}

		const { body } = await render(ObjCounter);

		expect(body).toBeHtml('<div>6</div>');
	});

	it('renders spread props with tracked values', async () => {
		component SpreadProps() {
			let &[id] = track('unique-id');
			let &[isActive] = track(true);
			let &[styles] = track({ color: 'red', fontSize: '16px' });

			<div {...{ id: id, class: { active: isActive }, style: styles }}>{'Spread Props'}</div>
		}

		const { body } = await render(SpreadProps);

		expect(body).toBeHtml(
			'<div id="unique-id" class="active" style="color: red; font-size: 16px;">Spread Props</div>',
		);
	});

	it('handles AssignExpressions with tracked values or properties correctly', async () => {
		component Assignments() {
			let &[count] = track(0);
			const obj = { value: track(5) };

			count += 10;
			obj.value.value *= 2;

			<div>{count}</div>
			<div>{obj.value.value}</div>
		}

		const { body } = await render(Assignments);

		expect(body).toBeHtml('<div>10</div><div>10</div>');
	});

	it(`handles derived changes via tracked dependencies' changes`, async () => {
		component Derived() {
			let &[base] = track(5);
			let &[multiplier] = track(3);
			let &[derived] = track(() => base * multiplier);

			<div>{derived}</div>

			base += 2;

			<div>{derived}</div>
		}

		const { body } = await render(Derived);

		expect(body).toBeHtml('<div>15</div><div>21</div>');
	});

	it(`handles derived changes based on another derived's dependencies' changes`, async () => {
		component NestedDerived() {
			let &[a] = track(2);
			let &[b] = track(3);
			let &[sum] = track(() => a + b);
			let &[product] = track(() => sum * 2);

			<div>{product}</div>

			a = 4;

			<div>{product}</div>
		}

		const { body } = await render(NestedDerived);

		expect(body).toBeHtml('<div>10</div><div>14</div>');
	});

	it('handles lexical scopes correctly', async () => {
		component LexicalScopes() {
			let &[x] = track(1);
			<div>{x}</div>

			<div>
				let &[x] = track(10);
				{x}
			</div>

			<div>
				let &[x] = track(12);
				{x}
				<span>
					let &[x] = track(15);
					{x}
				</span>
			</div>
		}

		const { body } = await render(LexicalScopes);

		expect(body).toBeHtml('<div>1</div><div>10</div><div>12<span>15</span></div>');
	});

	it('runs nested JavaScript blocks inside component-local callables', async () => {
		component App() {
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

			<div class="block-function">{readFunction()}</div>
			<div class="block-arrow">{readArrow()}</div>
			<div class="block-method">{reader.read()}</div>
		}

		const { body } = await render(App);

		expect(body).toBeHtml(
			'<div class="block-function">function inner / function outer</div><div class="block-arrow">22</div><div class="block-method">method inner / method outer</div>',
		);
	});
});
