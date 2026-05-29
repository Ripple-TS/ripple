import {
	runSharedClassFunctionComponentTests,
	runSharedComponentParamsTests,
} from '@tsrx/core/test-harness/compile';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { describe, expect, it } from 'vitest';
import { find_exact_mapping } from '../../tsrx/src/source-map-utils.js';

runSharedClassFunctionComponentTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});

runSharedComponentParamsTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});

describe('@tsrx/ripple Volar mappings cover declaration keywords', () => {
	/**
	 * @param {string} source
	 */
	const expect_class_keyword_mapping = (source) => {
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const source_class_offset = source.indexOf('class');
		const generated_class_offset = result.code.indexOf('class');
		const mapping = find_exact_mapping(
			result.mappings,
			source_class_offset,
			generated_class_offset,
			'class'.length,
		);

		expect(mapping?.data.structure).toBe(true);
	};

	it('maps named class keywords', () => {
		expect_class_keyword_mapping(`class Store {
	value = 1;
}`);
	});

	it('maps anonymous default class keywords', () => {
		expect_class_keyword_mapping(`export default class {
	value = 1;
}`);
	});
});

describe('@tsrx/ripple Volar mappings cover arrow functions', () => {
	it('adds a verification-only mapping for the whole arrow function', () => {
		const source = `function C() { const f = (x: number): number => x + 1; return <></>; }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const source_arrow = '(x: number): number => x + 1';
		const source_offset = source.indexOf(source_arrow);
		const generated_offset = result.code.indexOf(source_arrow);
		const mapping = find_exact_mapping(
			result.mappings,
			source_offset,
			generated_offset,
			source_arrow.length,
		);

		expect(mapping?.data.verification).toBe(true);
		expect(mapping?.data.completion).toBeUndefined();
		expect(mapping?.data.semantic).toBeUndefined();
		expect(mapping?.data.navigation).toBeUndefined();
	});
});

describe('@tsrx/ripple try pending fallbacks', () => {
	it('allows empty pending blocks as null fallbacks', () => {
		const { code } = compile(
			`function App() { return <>
				try {
					<div>{'content'}</div>
				} pending {}
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.try(');
		expect(code).toContain('template(`<div>content</div>`');
	});
});

describe('@tsrx/ripple named ref props', () => {
	it('keeps named ref-like props ordinary for components', () => {
		const { code } = compile(
			`function Child(props) { return <></>; }
			function App() { return <>
				let input;
				<Child input_ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('input_ref: input');
	});

	it('wraps anonymous ref props for components', () => {
		const { code } = compile(
			`function Child(props) { return <></>; }
			function App() { return <>
				let input;
				<Child ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('ref: _$_.create_ref_prop(() => input, (v) => input = v)');
	});

	it('keeps named ref-like props ordinary on host elements', () => {
		const { code } = compile(
			`function App() { return <>
				let input;
				<input input_ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('input_ref');
		expect(code).not.toContain('_$_.create_ref_prop');
	});

	it('adds assignment setters for host ref attributes with identifiers and member expressions', () => {
		const { code } = compile(
			`function App() { return <>
				let input;
				let state = {};
				<input ref={input} />
				<input ref={state.input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.ref(input_1, () => input, (v) => input = v)');
		expect(code).toContain('_$_.ref(input_2, () => state.input, (v) => state.input = v)');
	});

	it('wraps ref forms on dynamic elements so runtime host spreads can apply them', () => {
		const { code } = compile(
			`function App() { return <>
				let tag = track('input');
				let input;
				let state = {};
				function fn() {}
				<@tag ref={[input, state.other]} input_ref={fn} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('ref: _$_.create_ref_prop(() => [');
		expect(code).toContain('_$_.create_ref_prop(() => input, (v) => input = v)');
		expect(code).toContain('_$_.create_ref_prop(() => state.other, (v) => state.other = v)');
		expect(code).toContain('input_ref: fn');
	});

	it('prints named ref props in Volar TypeScript output', () => {
		const { code } = compile_to_volar_mappings(
			`function App() { return <>
				let input;
				<input input_ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).not.toContain(
			"import { _$_RefProp__create } from 'ripple/compiler/internal/import';",
		);
		expect(code).toContain('<input input_ref={input} />');
	});

	it('preserves child namespaces for nested host ref props in Volar TypeScript output', () => {
		const { code } = compile_to_volar_mappings(
			`function App() { return <>
				let circle;
				let div;
				<svg>
					<circle circle_ref={circle} />
					<foreignObject>
						<div div_ref={div} />
					</foreignObject>
				</svg>
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('<circle circle_ref={circle} />');
		expect(code).toContain('<div div_ref={div} />');
	});

	it('maps named ref-like prop values as ordinary props', () => {
		const source = `function Child(props: { inputRef?: any; otherRef?: any }) { return <>
	<input />
</>; }

function App() { return <>
	let input: HTMLInputElement | undefined;
	const state = { input: undefined as HTMLInputElement | undefined };
	<input type="text" input_ref={input} />
	<Child inputRef={input} otherRef={state.input} />
</>; }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(result.errors).toEqual([]);
		expect(result.code).toContain('input_ref={input}');
		expect(result.code).toContain('otherRef={state.input}');
	});
});

describe('@tsrx/ripple native fragment Volar output', () => {
	it('prints JSX converted from native fragment expression containers', () => {
		const source = `function App() { return <>
	const content = <section>{<div>{'inside'}</div>}</section>;
	{content}
</>; }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(result.code).toContain('<section>');
		expect(result.code).toContain('<div>');
		expect(result.code).toContain("'inside';");
		expect(result.code).not.toContain('<tsx>');
	});

	it('returns children before and after setup statements', () => {
		const source = `class Foo { bar() { return <><div>"before"</div> const x = 1; <div>{x}</div></>; } }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const match = result.code.match(/const ([A-Za-z_$][\w$]*) = \[\] as Array<any>;/);
		expect(match).not.toBeNull();

		const children_id = /** @type {RegExpMatchArray} */ (match)[1];
		const first_push = result.code.indexOf(`${children_id}.push(<div>`);
		const declaration = result.code.indexOf('const x = 1;');
		const second_push = result.code.indexOf(`${children_id}.push(<div>`, first_push + 1);
		const returned_children = result.code.indexOf(`return <>{${children_id}}</>;`);

		expect(first_push).toBeGreaterThan(-1);
		expect(declaration).toBeGreaterThan(-1);
		expect(second_push).toBeGreaterThan(-1);
		expect(returned_children).toBeGreaterThan(-1);
		expect(first_push).toBeLessThan(declaration);
		expect(declaration).toBeLessThan(second_push);
		expect(second_push).toBeLessThan(returned_children);
	});
});

describe('@tsrx/ripple <tsx> expression values', () => {
	it('passes plain identifier props directly in fragment shorthand values', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const placeholder = 'value';
				return <><Some prop={placeholder} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Some(node, { prop: placeholder }, _$_.active_block);');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain identifier props directly in tsx expression values', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const placeholder = 'value';
				return <tsx><Some prop={placeholder} /></tsx>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Some(node, { prop: placeholder }, _$_.active_block);');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain identifier props directly in tsrx expression values', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const placeholder = 'value';
				return <><Some prop={placeholder} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Some(node, { prop: placeholder }, _$_.active_block);');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain identifier props directly in component bodies', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() { return <>
				const placeholder = 'value';
				<Some prop={placeholder} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('Some(node, { prop: placeholder }, _$_.active_block);');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain non-tracked expression props directly', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const first = 'hello';
				const second = 'world';
				return <><Some prop={first + second} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Some(node, { prop: first + second }, _$_.active_block);');
		expect(code).not.toContain('get prop()');
	});

	it('wraps member expression props in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const obj = { value: 'value' };
				return <><Some prop={obj.value} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return obj.value;');
	});

	it('wraps computed member expression props in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const obj = { value: 'value' };
				const key = 'value';
				return <tsx><Some prop={obj[key]} /></tsx>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return obj[key];');
	});

	it('wraps call expression props in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function getValue() {
				return 'value';
			}
			function Test() {
				return <><Some prop={getValue()} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('getValue');
	});

	it('wraps call expression props in fragment shorthand values in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function getValue() {
				return 'value';
			}
			function Test() {
				return <><Some prop={getValue()} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('getValue');
	});

	it('wraps call expression props in component bodies in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function getValue() {
				return 'value';
			}
			function Test() { return <>
				<Some prop={getValue()} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('getValue');
	});

	it('wraps lazy tracked identifier props in fragment shorthand values in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() { return <>
				let &[count] = track(0);
				const content = <><Some prop={count} /></>;
				{content}
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return lazy.value;');
	});

	it('wraps lazy tracked identifier props in function fragment returns in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() {
				let &[count] = track(0);
				return <><Some prop={count} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return lazy.value;');
	});

	it('wraps lazy tracked identifier props in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() { return <>
				let &[count] = track(0);
				const content = <tsx><Some prop={count} /></tsx>;
				{content}
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return lazy.value;');
	});

	it('wraps lazy tracked expression props in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() { return <>
				let &[count] = track(0);
				const content = <><Some prop={count % 2 ? 'odd' : 'even'} /></>;
				{content}
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain(`return lazy.value % 2 ? 'odd' : 'even';`);
	});

	it('lowers tsx values nested in template expressions', () => {
		const { code } = compile(
			`function App() { return <>
				const primary = true;
				<div>
					{<tsx>
						{primary
							? ['first:', <strong>{'one'}</strong>, ':tail']
							: ['second:', <strong>{'two'}</strong>, ':done']}
					</tsx>}
				</div>
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.tsrx_element');
		expect(code).toContain('? [');
		expect(code).not.toContain('<tsx>');
	});

	it('lowers native element values outside components', () => {
		const { code } = compile(`const test = <button>"Hello"</button>;`, 'App.tsrx');

		expect(code).toContain('const test = _$_.tsrx_element');
		expect(code).toContain('template(`<button>Hello</button>`');
	});

	it('lowers bare native element expression statements outside components', () => {
		const { code } = compile(`<button>"Hello"</button>;`, 'App.tsrx');

		expect(code).toContain('_$_.tsrx_element');
		expect(code).toContain('template(`<button>Hello</button>`');
	});

	it('renders native element values assigned inside returned templates on the server', () => {
		const { code } = compile(
			`function App() { return <>
				const test = <button>"Hello"</button>;
				{test}
			</>; }`,
			'App.tsrx',
			{ mode: 'server' },
		);

		expect(code).toContain('const test = _$_.tsrx_element');
		expect(code).toContain('_$_.render_expression(test)');
		expect(code).not.toContain('_$_.escape(test)');
	});

	it('keeps direct arrow component returns on the render path', () => {
		const { code } = compile(`const App = () => <button>"Hello"</button>;`, 'App.tsrx');

		expect(code).toContain('template(`<button>Hello</button>`');
		expect(code).toContain('_$_.append(__anchor, fragment)');
		expect(code).not.toContain('template(``');
	});

	it('keeps returned elements after comments on the render path', () => {
		const { code } = compile(
			`function App() {
				return /* comment */ <div>"Commented"</div>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('template(`<div>Commented</div>`');
		expect(code).toContain('_$_.append(__anchor, fragment)');
	});

	it('keeps directly called PascalCase numeric helpers as ordinary functions', () => {
		const { code } = compile(
			`function StatusCode() {
				return 200;
			}
			const value = StatusCode();`,
			'App.tsrx',
		);

		expect(code).toContain('function StatusCode()');
		expect(code).toContain('return 200;');
		expect(code).toContain('const value = StatusCode();');
		expect(code).not.toContain('function StatusCode(__anchor');
		expect(code).not.toContain('template(`200`');
	});

	it('keeps directly called PascalCase template literal helpers as ordinary functions', () => {
		const { code } = compile(
			`function FormatName(first, last) {
				return \`\${first} \${last}\`;
			}
			const label = FormatName("Ada", "Lovelace");`,
			'App.tsrx',
		);

		expect(code).toContain('function FormatName(first, last)');
		expect(code).toContain('return `${first} ${last}`;');
		expect(code).toContain('const label = FormatName("Ada", "Lovelace");');
		expect(code).not.toContain('function FormatName(__anchor');
	});

	it('componentifies renderable-only PascalCase functions used as elements', () => {
		const { code } = compile(
			`function Label() {
				return "Hi";
			}
			function App() {
				return <Label />;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function Label(__anchor');
		expect(code).toContain('template(`Hi`');
		expect(code).toContain('Label(node, {}, _$_.active_block)');
	});

	it('uses server render_expression for conditional array expression values', () => {
		const { code } = compile(
			`function App() { return <>
				const condition = true;
				const ternary_items = condition ? ['start:', ['one', 2], ':end'] : ['fallback'];
				const logical_items = condition && ['start:', ['one', 2], ':end'];

				<div>{ternary_items}</div>
				<div>{logical_items}</div>
			</>; }`,
			'App.tsrx',
			{ mode: 'server' },
		);

		expect(code).toContain('_$_.render_expression(ternary_items)');
		expect(code).toContain('_$_.render_expression(logical_items)');
		expect(code).not.toContain('_$_.escape(ternary_items)');
		expect(code).not.toContain('_$_.escape(logical_items)');
	});

	it('uses client expression anchors that can hydrate conditional array markers', () => {
		const { code } = compile(
			`function App() { return <>
				const condition = true;
				const items = condition ? ['start:', ['one', 2], ':end'] : ['fallback'];

				<div>{items}</div>
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('template(`<div> </div>`');
		expect(code).toContain('_$_.child(');
		expect(code).not.toContain('_$_.child(div, true)');
		expect(code).toContain('_$_.expression(');
	});
});

describe('@tsrx/ripple nested function fragment returns', () => {
	it('keeps special fragment returns inside component prop arrow functions', () => {
		const { code } = compile(
			`function Child(props) { return <></>; }

			export function App() { return <>
				<Child
					fragment={() => {
						return <><div>fragment</div></>;
					}}
					tsx={() => {
						return <tsx><div>tsx</div></tsx>;
					}}
					tsrx={() => {
						return <><div>"tsrx"</div></>;
					}}
				/>
			</>; }`,
			'App.tsrx',
		);

		expect(code).not.toContain('return;');
		expect(code).toMatch(/fragment: \(\) => {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/tsx: \(\) => {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/tsrx: \(\) => {\s+return _\$_.tsrx_element/);
	});
});
