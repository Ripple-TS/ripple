import { describe, expect, it } from 'vitest';
import {
	runSharedClassFunctionComponentTests,
	runSharedCompileDiagnosticsTests,
	runSharedComponentLoopControlFlowTests,
	runSharedComponentParamsTests,
	runSharedNestedLazyDestructuringTests,
	runSharedSwitchHelperHoistingTests,
	runSharedTsxExpressionTsrxTests,
} from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'vue',
	rejectsComponentAwait: true,
});
runSharedTsxExpressionTsrxTests({ compile, name: 'vue', classAttrName: 'class' });
runSharedComponentLoopControlFlowTests({ compile, name: 'vue' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'vue' });
runSharedClassFunctionComponentTests({ compile, compile_to_volar_mappings, name: 'vue' });
runSharedComponentParamsTests({ compile, compile_to_volar_mappings, name: 'vue' });
runSharedSwitchHelperHoistingTests({
	compile,
	compile_to_volar_mappings,
	name: 'vue',
	clientHelperShape: 'module-vapor-component',
});
runSharedNestedLazyDestructuringTests({ compile, name: 'vue' });

describe('@tsrx/vue basic', () => {
	it('wraps named component exports in defineVaporComponent', () => {
		const { code } = compile(
			`export function App() @{
				<div>{'Hello'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toMatchSnapshot();
	});

	it('wraps default component exports in defineVaporComponent', () => {
		const { code } = compile(
			`export default function App() @{
				<div>{'Hello'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toMatchSnapshot();
	});

	it('merges defineVaporComponent into existing vue imports', () => {
		const { code } = compile(
			`import { ref } from 'vue';

			function App() @{
				const count = ref(0);
				<button>{count.value}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("import { ref } from 'vue';");
		expect(code).toContain("import { defineVaporComponent } from 'vue-jsx-vapor';");
		expect(code.match(/defineVaporComponent/g)).toHaveLength(2);
	});

	it('supports lazy destructuring in Vue component params', () => {
		const { code } = compile(
			`function Child(&{ count }: { count: number }) @{
				<pre>{count}</pre>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function Child(__lazy0: { count: number })');
		expect(code).toContain('return <pre>{__lazy0.count}</pre>;');
	});

	it('supports lazy destructuring in Vue component bodies', () => {
		const { code } = compile(
			`import { reactive } from 'vue';

			function App() @{
				const state = reactive({ count: 1 });
				let &{ count } = state;
				count++;
				<pre>{count}</pre>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('let __lazy0 = state;');
		expect(code).toContain('__lazy0.count++;');
		expect(code).toContain('return <pre>{__lazy0.count}</pre>;');
	});

	it('keeps return-value branches in component callback props as plain conditionals', () => {
		const { code } = compile(
			`function Test() @{
				<Page
					params={{
						menuAlt: (isAdmin) => {
							if (isAdmin) {
								return ['Delete', 'Edit'];
							}
						},
						direct: () => {
							return ['View'];
						},
						bySwitch: (role) => {
							switch (role) {
								case 'admin':
									return ['Edit'];
								default:
									return ['View'];
							}
						},
						byForOf: (items) => {
							for (const item of items) {
								if (item.active) {
									return [item.label];
								}
							}

							return ['Empty'];
						},
						byTry: (load) => {
							try {
								return [load()];
							} catch (error) {
								return ['Error'];
							}
						},
					}}
				/>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('menuAlt: (isAdmin) => {');
		expect(code).toContain('if (isAdmin)');
		expect(code).toContain("return ['Delete', 'Edit'];");
		expect(code).toContain('direct: () => {');
		expect(code).toContain("return ['View'];");
		expect(code).toContain('bySwitch: (role) => {');
		expect(code).toContain('switch (role)');
		expect(code).toContain('byForOf: (items) => {');
		expect(code).toContain('for (const item of items)');
		expect(code).toContain("return ['Empty'];");
		expect(code).toContain('byTry: (load) => {');
		expect(code).toContain("return ['Error'];");
	});

	it('keeps expression child arrays in fragment and JSX callback props', () => {
		const { code } = compile(
			`function Child(props) @{
					<section />
				}

			function App() @{
					<Child
							fragment={() => <>{[<>Delete</>, <>Edit</>]}</>}
							native={() => <>{[<>Delete</>, <>Edit</>]}</>}
				/>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('fragment={() => <>');
		expect(code).toContain('<>Delete</>');
		expect(code).toContain('<>Edit</>');
		expect(code).toContain('native={() => <>');
	});

	it('emits scoped CSS and applies the scope hash to host elements', () => {
		const { code, css, cssHash } = compile(
			`function App() @{
				<>
					<div class="card">{'Hi'}</div>

					<style>
						.card {
							color: red;
						}
					</style>
				</>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBe('');
		expect(code).toContain(`class="card ${cssHash}"`);
		expect(css).toContain(`.card.${cssHash}`);
		expect(css).toContain('color: red;');
	});

	it('applies scoped css hashes to runtime Dynamic imports and aliases', () => {
		const { code, cssHash } = compile(
			`import { Dynamic } from '@tsrx/vue/dynamic';
			const RuntimeDynamic = Dynamic;

			function App() @{
				<>
					<RuntimeDynamic is="div" class="host">{'hello'}</RuntimeDynamic>

					<style>
						.host {
							color: red;
						}
					</style>
				</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain(`class="host ${cssHash}"`);
	});

	it('lowers dynamic tag syntax to the Vue Dynamic helper import', () => {
		const { code } = compile(
			`function App() @{
				const Tag = 'section';
				<{Tag} class="host">{'hello'}</{Tag}>
			}`,
			'App.tsrx',
		);

		expect(code).toContain(`import { Dynamic as TsrxDynamic } from '@tsrx/vue/dynamic';`);
		expect(code).toContain(`<TsrxDynamic is={Tag} class="host">{'hello'}</TsrxDynamic>`);
	});

	it('ref={fn} on a DOM element compiles to ref={fn}', () => {
		const { code } = compile(
			`function App() @{
				function capture(node: HTMLDivElement) {}
				<div ref={capture}>{'x'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toMatch(/ref=\{capture\}/);
	});

	it('keeps Vue host ref expressions clean in Volar TSX while disabling prop verification', () => {
		const source = `function App() @{
			<div ref={(node: HTMLDivElement) => {}}>{'x'}</div>
		}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx');
		const generated_ref_offset = result.code.indexOf('ref=');
		const ref_mapping = result.mappings.find(
			(mapping) =>
				mapping.generatedOffsets[0] === generated_ref_offset &&
				mapping.generatedLengths[0] === 'ref'.length,
		);

		expect(result.code).toContain('ref={(node: HTMLDivElement) => {}}');
		expect(result.code).not.toContain('as any');
		expect(ref_mapping?.data.verification).toBe(false);
	});

	it('keeps named component ref props direct in Volar TSX for completions', () => {
		const source = `import { ref } from 'vue';

		function NamedForwardInput(props: { type: string; input_ref?: any }) @{
			<input type={props.type} ref={props.input_ref} />
		}

		const named_vue_ref_object = ref<HTMLInputElement | null>(null);

		function App() @{
			<NamedForwardInput type="text" input_ref={named_vue_ref_object} />
		}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx');
		const source_prop_offset = source.indexOf('input_ref={named_vue_ref_object');
		const generated_prop_offset = result.code.indexOf('input_ref={named_vue_ref_object');
		const prop_mapping = result.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === source_prop_offset &&
				mapping.generatedOffsets[0] === generated_prop_offset &&
				mapping.generatedLengths[0] === 'input_ref'.length,
		);

		expect(result.code).toContain(
			'<NamedForwardInput type="text" input_ref={named_vue_ref_object} />',
		);
		expect(result.code).not.toContain('create_ref_prop');
		expect(prop_mapping?.data.completion).toBe(true);
		expect(prop_mapping?.data.verification).toBe(true);
	});

	it('maps Vue function components to the generated function in Volar TSX', () => {
		const source = `import { ref } from 'vue';

		function App() @{
			const count = ref(0);
			<button>{count.value}</button>
		}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx');
		const source_function_offset = source.indexOf('function');
		const source_name_offset = source.indexOf('App');
		const generated_function_keyword_offset = result.code.indexOf('function App');
		const generated_function_name_offset = generated_function_keyword_offset + 'function '.length;
		const generated_define_offset = result.code.indexOf('defineVaporComponent(function App');
		const generated_outer_name_offset = result.code.indexOf('const App') + 'const '.length;
		const find_generated_mapping = (offset) =>
			result.mappings.find(
				(mapping) =>
					mapping.generatedOffsets[0] <= offset &&
					offset < mapping.generatedOffsets[0] + mapping.generatedLengths[0],
			);
		const name_mappings = result.mappings.filter(
			(mapping) =>
				mapping.sourceOffsets[0] === source_name_offset && mapping.lengths[0] === 'App'.length,
		);
		const function_keyword_mapping = result.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === source_function_offset &&
				mapping.lengths[0] === 'function'.length,
		);

		expect(name_mappings).toHaveLength(1);
		expect(name_mappings[0].generatedOffsets[0]).toBe(generated_function_name_offset);
		expect(function_keyword_mapping?.generatedOffsets[0]).toBe(generated_function_keyword_offset);
		expect(find_generated_mapping(generated_define_offset)).toBeUndefined();
		expect(find_generated_mapping(generated_outer_name_offset)).toBeUndefined();
	});

	it('allows ref={...} on composite components as normal Vue JSX', () => {
		const { code } = compile(
			`function Child(props) @{
					<input {...props} />
				}

				function App() @{
					function inputRef(node: HTMLInputElement | null) {}
					<Child ref={inputRef} />
				}`,
			'App.tsrx',
		);

		expect(code).toContain('ref={inputRef}');
	});

	it('preserves explicit mergeRefs calls', () => {
		const { code } = compile(
			`import { mergeRefs } from '@tsrx/vue/ref';

			function App() @{
				function a(node: HTMLInputElement | null) {}
				function b(node: HTMLInputElement | null) {}
				function c(node: HTMLInputElement | null) {}
				<input ref={mergeRefs(a, b, c)} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('ref={mergeRefs(a, b, c)}');
		expect(code).not.toContain('__mergeRefs');
	});

	it('allows named ref props through components and normalizes host spreads', () => {
		const { code } = compile(
			`function Child(props) @{
				<input {...props} />
			}

			function App() @{
				let input;
				<Child input_ref={input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain("from '@tsrx/vue/ref'");
		expect(code).toContain('{...{ input_ref: input }}');
		expect(code).toContain(
			'let Child__spread_props1 = __normalize_spread_props_for_ref_attr(props);',
		);
		expect(code).toContain('{...Child__spread_props1}');
		expect(code).toContain('ref={Child__spread_props1.ref}');
		expect(code.match(/__normalize_spread_props_for_ref_attr\(/g)).toHaveLength(1);
	});

	it('keeps component ref-like props ordinary without host spreads', () => {
		const { code } = compile(
			`function Child(props) @{
				<span>{'child'}</span>
			}

			function App() @{
				let input;
				<Child input_ref={input} />
			}`,
			'App.tsrx',
		);

		expect(code).not.toContain("from '@tsrx/vue/ref'");
		expect(code).toContain('{...{ input_ref: input }}');
		expect(code).not.toContain('normalize_spread_props');
	});

	it('normalizes multiple host spreads once while merging one explicit ref', () => {
		const { code } = compile(
			`function App() @{
			const first = {};
			const second = {};
			function cb(_node) {}
			<input {...first} {...second} ref={cb} />
		}`,
			'App.tsrx',
		);

		expect(code).toContain(
			'let App__spread_props1 = __normalize_spread_props_for_ref_attr(first);',
		);
		expect(code).toContain(
			'let App__spread_props2 = __normalize_spread_props_for_ref_attr(second);',
		);
		expect(code).toContain('{...App__spread_props1}');
		expect(code).toContain('{...App__spread_props2}');
		expect(code).toContain('ref={__mergeRefs(App__spread_props1.ref, App__spread_props2.ref, cb)}');
		expect(code.match(/__normalize_spread_props_for_ref_attr\(/g)).toHaveLength(2);
		expect(code).not.toContain('create_ref_prop');
		expect(code).not.toContain('__normalize_spread_props(first, cb)');
		expect(code).not.toContain('__normalize_spread_props(second, cb)');
	});

	it('rejects multiple ref={...} attributes on the same element', () => {
		expect(() =>
			compile(
				`function App() @{
					function a(node: HTMLInputElement | null) {}
					function b(node: HTMLInputElement | null) {}
					<input ref={a} ref={b} />
				}`,
				'App.tsrx',
			),
		).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
	});

	it('rejects multiple ref={...} on the same composite component', () => {
		expect(() =>
			compile(
				`function Child(props) @{
					<input {...props} />
				}

				function App() @{
					function a(node: HTMLInputElement | null) {}
					function b(node: HTMLInputElement | null) {}
					<Child ref={a} ref={b} />
				}`,
				'App.tsrx',
			),
		).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
	});

	it('preserves host innerHTML props', () => {
		const { code } = compile(
			`function App() @{
				const markup = '<strong>safe enough</strong>';
				<div class="target" innerHTML={markup} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('innerHTML={markup}');
	});

	it('rejects removed {html expr} syntax', () => {
		expect(() =>
			compile(
				`function App() @{
					const markup = '<strong>safe enough</strong>';
					<div>{html markup}</div>
				}`,
				'App.tsrx',
			),
		).toThrow();
	});

	it('compiles a simple if block in component bodies', () => {
		const { code } = compile(
			`function App({ visible }) @{
				@if (visible) {
					<div>{'Visible'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const App__static1 = <div>{'Visible'}</div>;");
		expect(code).toContain('return visible ? App__static1 : null;');
		expect(code).not.toContain('not yet supported in Vue TSRX');
	});

	it('compiles if/else chains in component bodies', () => {
		const { code } = compile(
			`function App({ visible }) @{
				@if (visible) {
					<div>{'Visible'}</div>
				} @else {
					<div>{'Hidden'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain("<div>{'Visible'}</div>");
		expect(code).toContain("<div>{'Hidden'}</div>");
		expect(code).toMatch(/return visible \? App__static\d+ : App__static\d+;/);
	});

	it('rejects return statements inside template @if branches', () => {
		expect(() =>
			compile(
				`function App() @{
					const count = 0;

					<>
						@if (count > 2) {
							return;
						}

						<button>{count}</button>
					</>
				}`,
				'App.tsrx',
			),
		).toThrow(/Return statements are not allowed inside TSRX template @if blocks/);
	});

	it('allows component-body guard returns before TSRX output', () => {
		const { code } = compile(
			`import { ref } from 'vue';

			function App() {
				const skip = ref(false);
				if (skip.value) {
					return null;
				}

				const count = ref(0);
				return <button>{count.value}</button>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('if (skip.value) {');
		expect(code).toContain('return null;');
		expect(code).toContain('const count = ref(0);');
		expect(code).toContain('<button>{count.value}</button>');
	});

	it('compiles for...of statements in component bodies', () => {
		const { code } = compile(
			`function App({ items }) @{
				@for (const item of items) {
					<div>{item}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items}>{(item) => <div>{item}</div>}</VaporFor>');
		expect(code).toContain("import { defineVaporComponent, VaporFor } from 'vue-jsx-vapor';");
		expect(code).not.toContain('not yet supported in Vue TSRX');
	});

	it('compiles keyed for...of statements in component bodies', () => {
		const { code } = compile(
			`function App({ items }: { items: { id: string, text: string }[] }) @{
				@for (const item of items; key item.id) {
					<div>{item.text}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items} getKey={(item) => item.id}>');
		expect(code).toContain('item.value.text');
	});

	it('does not rewrite shadowed loop params inside nested keyed slot functions', () => {
		const { code } = compile(
			`function App({ items, getNew, use }: { items: { id: string, text: string }[], getNew: () => unknown, use: (item: unknown) => void }) @{
				@for (const item of items; key item.id) {
					<button onClick={() => {
						const item = getNew();
						use(item);
					}}>{item.text}</button>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const item = getNew();');
		expect(code).toContain('use(item);');
		expect(code).toContain('item.value.text');
		expect(code).not.toContain('use(item.value)');
	});

	it('compiles indexed keyed for...of statements in component bodies', () => {
		const { code } = compile(
			`function App({ items }: { items: { id: string, text: string }[] }) @{
				@for (const item of items; index i; key item.id) {
					<div>{i}{item.text}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items} getKey={(item, i) => item.id}>');
		expect(code).toContain('{(item, i) => <div>');
		expect(code).toContain('{i.value}');
		expect(code).toContain('item.value.text');
	});

	it('keeps explicit loop keys on single static for...of templates', () => {
		const { code } = compile(
			`function App({ items }: { items: string[] }) @{
				@for (const item of items; index i; key i) {
					<div>{'test'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items} getKey={(item, i) => i}>');
		expect(code).toContain("{(item, i) => <div>{'test'}</div>}");
		expect(code).toContain("<div>{'test'}</div>");
		expect(code).not.toContain('<div key={i}>');
		expect(code).not.toContain('<Fragment');
	});

	it('keeps implicit index keys on multi-child for...of templates', () => {
		const { code } = compile(
			`function App({ items }: { items: string[] }) @{
				@for (const item of items; index i) {
					<>
						<div>{'one'}</div>
						<div>{'two'}</div>
					</>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items} getKey={(item, i) => i}>');
		expect(code).toContain('{(item, i) => <>');
		expect(code).toContain("<div>{'one'}</div>");
		expect(code).toContain("<div>{'two'}</div>");
		expect(code).not.toContain('<Fragment');
	});

	it('falls back without injecting VaporFor for keyed destructuring patterns it cannot rewrite', () => {
		const { code } = compile(
			`function App({ items, keyName }: { items: Array<Record<string, string>>, keyName: string }) @{
				@for (const { [keyName]: label } of items) {
					<div key={label}>{label}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('.map(({ [keyName]: label }) => {');
		expect(code).toContain('<div key={label}>{label}</div>');
		expect(code).not.toContain('VaporFor');
	});

	it('compiles switch statements in component bodies', () => {
		const { code } = compile(
			`function App({ value }) @{
				@switch (value) {
					@case 'a': {
						<div>{'A'}</div>
					}
					@default: {
						<div>{'Fallback'}</div>
					}
				}
				}`,
			'App.tsrx',
		);

		expect(code).toContain('switch (value) {');
		expect(code).toContain("<div>{'A'}</div>");
		expect(code).toContain("<div>{'Fallback'}</div>");
		expect(code).toContain("return <div>{'A'}</div>;");
		expect(code).toContain("return <div>{'Fallback'}</div>;");
		expect(code).not.toContain('not yet supported in Vue TSRX');
	});

	it('compiles switch statements with inline case statements before JSX', () => {
		const { code } = compile(
			`function App({ value }) @{
					@switch (value) {
						@case 'a': {
							const label = 'A';
							<div>{label}</div>
						}
						@default: {
							<div>{'Fallback'}</div>
						}
					}
				}`,
			'App.tsrx',
		);

		expect(code).toContain('switch (value) {');
		expect(code).toContain("const label = 'A';");
		expect(code).toContain('return <div>{label}</div>;');
	});

	it('compiles try/catch into a Vue error boundary wrapper', () => {
		const { code } = compile(
			`function ThrowingChild() @{
				<div>{'might throw'}</div>
			}

			function App() @{
				@try {
					<ThrowingChild />
				} @catch (error) {
					<div>{error.message}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('TsrxErrorBoundary');
		expect(code).toContain("from '@tsrx/vue/error-boundary'");
		expect(code).toContain('fallback={');
		expect(code).toContain('error.message');
		expect(code).not.toContain('not yet supported in Vue TSRX');
		expect(code).not.toContain('Suspense');
	});

	it('compiles try/pending into a Vue Suspense slot boundary', () => {
		const { code } = compile(
			`function App() @{
				@try {
					<div>{'Async content'}</div>
				} @pending {
					<div>{'Loading...'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Suspense');
		expect(code).toContain("from 'vue'");
		expect(code).toContain('v-slots=');
		expect(code).toContain('default: () =>');
		expect(code).toContain('fallback: () =>');
		expect(code).toContain("{'Loading...'}");
		expect(code).not.toContain('fallback={');
		expect(code).not.toContain('TsrxErrorBoundary');
	});

	it('compiles empty pending blocks as null Vue Suspense fallbacks', () => {
		const { code } = compile(
			`function App() @{
				@try {
					<div>{'Async content'}</div>
				} @pending {}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Suspense');
		expect(code).toContain('v-slots=');
		expect(code).toContain('default: () =>');
		expect(code).not.toContain('fallback: () =>');
		expect(code).not.toContain('fallback={');
	});

	it('compiles try/pending/catch into an error boundary around Suspense', () => {
		const { code } = compile(
			`function App() @{
				const suffix = '!';

				@try {
					<div>{'Async content'}</div>
				} @pending {
					<div>{'Loading...'}</div>
				} @catch (error, reset) {
					<button onClick={reset}>{error.message}{suffix}</button>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('TsrxErrorBoundary');
		expect(code).toContain("from '@tsrx/vue/error-boundary'");
		expect(code).toContain('Suspense');
		expect(code).toContain("from 'vue'");
		expect(code).toContain('v-slots=');
		expect(code).toContain('content={() => <Suspense');
		expect(code).toContain('default: () =>');
		expect(code).toContain('content={() =>');
		expect(code).toContain('error.message');
		expect(code.match(/error\.message/g)).toHaveLength(1);
		expect(code).toContain('StatementBodyHook');
		expect(code).toContain('suffix={suffix}');

		const error_boundary_index = code.indexOf('<TsrxErrorBoundary');
		const suspense_index = code.indexOf('<Suspense');
		expect(error_boundary_index).toBeLessThan(suspense_index);
	});

	it('keeps try/pending/catch Suspense lowering valid in type-only output', () => {
		const source = `import { defineVaporAsyncComponent } from 'vue';

			function AsyncResolvedChild(props: { value: string }) @{
				<p class="async-resolved">{props.value}</p>
			}

			function App(props: { promise: Promise<typeof AsyncResolvedChild> }) @{
				const suffix = '!';
				const AsyncChild = defineVaporAsyncComponent(() => props.promise);

				@try {
					<AsyncChild value="hello" />
				} @pending {
					<p class="async-pending">{'loading...'}</p>
				} @catch (err) {
					<p class="async-caught">{(err as Error).message}{suffix}</p>
				}
			}`;
		const { code, errors, mappings } = compile_to_volar_mappings(source, 'App.tsrx');

		expect(errors).toHaveLength(0);
		expect(code).toContain('TsrxErrorBoundary');
		expect(code).toContain('Suspense');
		expect(code).toContain('fallback={(err, _reset) =>');
		expect(code).toContain('default: () => (() => {');
		expect(code).toContain('return <AsyncChild value="hello" />;');
		expect(code).not.toContain('catch(_error)');
		expect(code).not.toContain('return ((err, _reset) =>');
		expect(code).not.toContain('err: any');
		expect(code).not.toContain('suffix: typeof');
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('let App__StatementBodyHook1');
		expect(code).not.toContain('_tsrx_StatementBodyHook1_err = err');

		const catch_param_offset = source.indexOf('catch (err)') + 'catch ('.length;
		expect(
			mappings.some((mapping) => {
				const start = mapping.sourceOffsets[0];
				const end = start + mapping.lengths[0];
				return start <= catch_param_offset && catch_param_offset < end;
			}),
		).toBe(true);
	});

	it('rejects finally clauses in component @try templates', () => {
		expect(() =>
			compile(
				`function App() @{
					@try {
						<div>{'content'}</div>
					} @catch (error) {
						<div>{error.message}</div>
					} finally {
						log(error)
					}
				}`,
				'App.tsrx',
			),
		).toThrow(/Unexpected token/);
	});

	it('rejects await in component bodies', () => {
		expect(() =>
			compile(
				`async function App() @{
						const data = await fetchData();
						<div>{data}</div>
					}`,
				'App.tsrx',
			),
		).toThrow(/`await` is not yet supported in Vue TSRX components\./);
	});

	it('allows await in nested async functions inside component bodies', () => {
		expect(() =>
			compile(
				`function App() @{
					const load = async () => await fetchData();
					<button onClick={load}>{'Load'}</button>
				}`,
				'App.tsrx',
			),
		).not.toThrow();
	});
});
