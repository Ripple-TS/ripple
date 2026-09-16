import { Fragment, track } from 'ripple';
import type { Tracked, PropsNoChildren } from 'ripple';

describe('basic client', () => {
	it('render static text', async () => {
		function Basic() @{
			<div>{'Hello World'}</div>
		}

		const { head, body } = await render(Basic);

		expect(head).toBe('');
		expect(body).toBeHtml('<div>Hello World</div>');
	});

	it('keeps static text above U+00FF as character references', async () => {
		function Basic() @{
			const text = 'plain';
			<>
				<p title="a — b">
					The Times — …
					<b>»</b>
				</p>
				<span>{text}</span>
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<p title="a &#8212; b">The Times &#8212; &#8230;<b>»</b></p><span>plain</span>',
		);
		// A static em dash would otherwise widen the whole response to two bytes
		// per character; the reference keeps it Latin-1.
		expect(Buffer.byteLength(body, 'latin1')).toBe(body.length);
		expect(Buffer.byteLength(body)).toBe(body.length + 1);
	});

	it('renders string interpolation as escaped text', async () => {
		function Basic() @{
			let markup = '<span>Not HTML</span>';
			<div>{markup}</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>&lt;span>Not HTML&lt;/span></div>');
	});

	it('never prints nullish (null/undefined) in interpolated text', async () => {
		function Basic() @{
			const nothing = null;
			const missing = undefined;
			<>
				<div class="null">value: {nothing}</div>
				<div class="undefined">value: {missing}</div>
				<div class="explicit">raw: {String(nothing)}</div>
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="null">value: </div>' + '<div class="undefined">value: </div>' +
				'<div class="explicit">raw: null</div>',
		);
	});

	it('renders direct JSX text children as text', async () => {
		function Basic() @{
			<>
				<div>Rock &amp; &quot;Roll&quot;</div>
				<div>line break</div>
				<pre>
					first
second
				</pre>
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div>Rock &amp; "Roll"</div><div>line break</div><pre>first\nsecond</pre>',
		);
	});

	it('does not render JavaScript statements outside returned component templates', async () => {
		function Basic() @{
			const ready = true;

			if (ready) {
				const leaked = 'should not render';
				void leaked;
			}

			<>Hello world</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('Hello world');
	});

	it('renders primitive component return branches', async () => {
		function Basic() @{
			const ready = false;
			if (!ready) {
				return 'Waiting';
			}
			<>Ready</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('Waiting');
	});

	it('renders a root plain function that returns only a string', async () => {
		function Basic() {
			return 'Only text';
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('Only text');
	});

	it('renders a root plain function that returns only null', async () => {
		function Basic() {
			return null;
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('');
	});

	it('renders a root plain function that returns only undefined', async () => {
		function Basic() {
			return undefined;
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('');
	});

	it('does not stringify adjacent call-containing expression children', async () => {
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

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div>call:<span>call</span></div><div>new:<span>new</span></div><div>chain:<span>chain</span></div><div>ts-wrapper:<span>ts-wrapper</span></div><div>array:<span>array</span></div><div>assignment:<span>assignment</span></div><div>logical:<span>logical</span></div><div>conditional:<span>conditional</span></div><div>member:<span>member</span></div><div>object:<span>object</span></div><div>sequence:<span>sequence</span></div><div>tagged:<span>tagged</span></div><div>unary:</div>',
		);
	});

	it('does not render unreachable statements after an ASI return', async () => {
		function Basic() {
			return;
			const leaked = 'should not render';
			void leaked;
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('');
	});

	it('renders inline tsrx fragments', async () => {
		function Basic() @{
			const label = 'Server';
			const content = <span>{label}</span>;
			<div>{content}</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div><span>Server</span></div>');
	});

	it('renders Fragment innerHTML', async () => {
		function Basic() @{
			const html = '<strong>Server Fragment HTML</strong>';
			<Fragment innerHTML={html} />
		}

		const { body } = await render(Basic);

		expect(body).toContain('<strong>Server Fragment HTML</strong>');
		expect(body).not.toContain('<fragment');
	});

	it('renders deeply nested tsx and tsrx expression values', async () => {
		function makeFragment(label: string) {
			const test = <>
				{[1, 2, 3, 4].map((item) => <div class="helper-item">{item}</div>)}
			</>;
			return <>
				<span class="label">{label}</span>
				{test}
			</>;
		}

		function Basic() @{
			<>
				{[1, 2, 3].map((item) => <div class="app-item">{item}</div>)}
				{makeFragment('from helper')}
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="app-item">1</div><div class="app-item">2</div><div class="app-item">3</div><span class="label">from helper</span><div class="helper-item">1</div><div class="helper-item">2</div><div class="helper-item">3</div><div class="helper-item">4</div>',
		);
	});

	it('renders tsrx nested directly inside a top-level tsx expression value', async () => {
		function Basic() @{
			const content = <>
				<section class="outer">
					<div class="inner">{'from tsrx'}</div>
				</section>
			</>;
			<>
				{content}
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<section class="outer"><div class="inner">from tsrx</div></section>');
	});

	it('renders nested elements from tsrx inside a top-level tsx value', async () => {
		function Basic() @{
			const content = <>
				<div class="wrapper">
					<section class="native">
						<span class="nested-tsrx">{'inside nested tsrx'}</span>
					</section>
				</div>
			</>;
			<>
				{content}
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="wrapper"><section class="native"><span class="nested-tsrx">inside nested tsrx</span></section></div>',
		);
	});

	it('renders tsx declared before a top-level tsx value', async () => {
		function Basic() @{
			const nested = <span class="nested-tsx">inside nested tsx</span>;
			const content = <><div class="native">{nested}</div></>;
			<>
				{content}
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml(
			'<div class="native"><span class="nested-tsx">inside nested tsx</span></div>',
		);
	});

	it('flattens nested primitive arrays inside mixed tsrx collections', async () => {
		function Basic() @{
			<div>
				{<>
					{[
						'start:',
						['one', 2, true, null, false],
						<strong>{'!'}</strong>,
						':end',
					]}
				</>}
			</div>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>start:one2truefalse<strong>!</strong>:end</div>');
	});

	it('flattens direct primitive array expressions', async () => {
		function Basic() @{
			const items = ['start:', ['one', 2], null, true, false, ':end'];
			<>
				<div>
					{['start:', ['one', 2], null, true, false, ':end']}
				</div>
				<div>{items}</div>
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>start:one2truefalse:end</div><div>start:one2truefalse:end</div>');
	});

	it('flattens conditional primitive array expressions', async () => {
		function Basic() @{
			const condition = true;
			const ternary_items = condition
				? ['start:', ['one', 2], null, true, false, ':end']
				: ['fallback'];
			const logical_items = condition && ['start:', ['one', 2], null, true, false, ':end'];
			<>
				<div>{ternary_items}</div>
				<div>{logical_items}</div>
			</>
		}

		const { body } = await render(Basic);

		expect(body).toBeHtml('<div>start:one2truefalse:end</div><div>start:one2truefalse:end</div>');
	});

	it('renders tracked state updates', async () => {
		function Counter() @{
			const count = track(0);
			count.value++;
			count.value = count.value + 5;
			<div>{count.value}</div>
		}

		const { body } = await render(Counter);

		expect(body).toBeHtml('<div>6</div>');
	});

	it('renders dynamic component with tracked props', async () => {
		function Child({ count, ...rest }: PropsNoChildren<{
			count: Tracked<number>;
			class: { test: boolean };
		}>) @{
			<>
				<div {...rest}>{'Child Component'}</div>
				<div>{count.value}</div>
			</>
		}

		function Parent() @{
			const count = track(10);
			let DynamicChild = track(() => Child);
			<{DynamicChild} {count} class={{ test: true }} />
		}

		const { body } = await render(Parent);

		expect(body).toBeHtml('<div class="test">Child Component</div><div>10</div>');
	});

	it('renders tracked object properties', async () => {
		function ObjCounter() @{
			const obj = { count: track(2) };
			obj.count.value += 3;
			obj.count.value = obj.count.value + 1;
			<div>{obj.count.value}</div>
		}

		const { body } = await render(ObjCounter);

		expect(body).toBeHtml('<div>6</div>');
	});

	it('renders spread props with tracked values', async () => {
		function SpreadProps() @{
			const id = track('unique-id');
			const isActive = track(true);
			const styles = track({ color: 'red', fontSize: '16px' });
			<div
				{...{ id: id.value, class: { active: isActive.value }, style: styles.value }}
			>{'Spread Props'}</div>
		}

		const { body } = await render(SpreadProps);

		expect(body).toBeHtml(
			'<div id="unique-id" class="active" style="color: red; font-size: 16px;">Spread Props</div>',
		);
	});

	it('handles AssignExpressions with tracked values or properties correctly', async () => {
		function Assignments() @{
			const count = track(0);
			const obj = { value: track(5) };
			count.value += 10;
			obj.value.value *= 2;
			<>
				<div>{count.value}</div>
				<div>{obj.value.value}</div>
			</>
		}

		const { body } = await render(Assignments);

		expect(body).toBeHtml('<div>10</div><div>10</div>');
	});

	it(`handles derived changes via tracked dependencies' changes`, async () => {
		function Derived() @{
			const base = track(5);
			const multiplier = track(3);
			const derived = track(() => base.value * multiplier.value);
			const before = derived.value;
			base.value += 2;
			const after = derived.value;
			<>
				<div>{before}</div>
				<div>{after}</div>
			</>
		}

		const { body } = await render(Derived);

		expect(body).toBeHtml('<div>15</div><div>21</div>');
	});

	it(`handles derived changes based on another derived's dependencies' changes`, async () => {
		function NestedDerived() @{
			const a = track(2);
			const b = track(3);
			const sum = track(() => a.value + b.value);
			const product = track(() => sum.value * 2);
			const before = product.value;
			a.value = 4;
			const after = product.value;
			<>
				<div>{before}</div>
				<div>{after}</div>
			</>
		}

		const { body } = await render(NestedDerived);

		expect(body).toBeHtml('<div>10</div><div>14</div>');
	});

	it('handles lexical scopes correctly', async () => {
		function LexicalScopes() @{
			const x = track(1);
			let nested = '';
			let deep = '';
			let deeper = '';
			{
				const x = track(10);
				nested = String(x.value);
			}
			{
				const x = track(12);
				deep = String(x.value);
				{
					const x = track(15);
					deeper = String(x.value);
				}
			}
			<>
				<div>{x.value}</div>
				<div>{nested}</div>
				<div>
					{deep}
					<span>{deeper}</span>
				</div>
			</>
		}

		const { body } = await render(LexicalScopes);

		expect(body).toBeHtml('<div>1</div><div>10</div><div>12<span>15</span></div>');
	});

	it('runs nested JavaScript blocks inside component-local callables', async () => {
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

		const { body } = await render(App);

		expect(body).toBeHtml(
			'<div class="block-function">function inner / function outer</div><div class="block-arrow">22</div><div class="block-method">method inner / method outer</div>',
		);
	});

	it('renders a template element inside an expression container child', async () => {
		function App() @{
			<div>
				{<h1>
					@if (true) {
						<span>{'yes'}</span>
					} @else {
						<span>{'no'}</span>
					}
				</h1>}
			</div>
		}

		const { body } = await render(App);
		expect(body).toContain('<h1>');
		expect(body).toContain('<span>yes</span>');
		expect(body).not.toContain('<span>no</span>');
	});

	it('renders a bigint merged into a text run after a string', async () => {
		function App() @{
			const label = 'big:';
			// prettier-ignore
			<div>{label}{1n}</div>
		}

		const { body } = await render(App);
		expect(body).toContain('<div>big:1</div>');
	});
});
