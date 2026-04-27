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
