import { describe, expect, it } from 'vitest';
import {
	runSharedAnonymousComponentTests,
	runSharedClassComponentDeclarationTests,
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
runSharedAnonymousComponentTests({ compile, name: 'vue' });
runSharedTsxExpressionTsrxTests({ compile, name: 'vue', classAttrName: 'class' });
runSharedComponentLoopControlFlowTests({ compile, name: 'vue' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'vue' });
runSharedClassComponentDeclarationTests({ compile, compile_to_volar_mappings, name: 'vue' });
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
			`export component App() {
				<div>{'Hello'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toMatchSnapshot();
	});

	it('wraps default component exports in defineVaporComponent', () => {
		const { code } = compile(
			`export default component App() {
				<div>{'Hello'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toMatchSnapshot();
	});

	it('merges defineVaporComponent into existing vue imports', () => {
		const { code } = compile(
			`import { ref } from 'vue';

			component App() {
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
			`component Child(&{ count }: { count: number }) {
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

			component App() {
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

	it('keeps return-value branches in native TSRX callback props as plain conditionals', () => {
		const { code } = compile(
			`component Test() {
				<Page
					params={{
						menuAlt: (isAdmin) => <tsrx>
							if (isAdmin) {
								return [<>Delete</>, <>Edit</>];
							} else {
								return [<>View</>];
							}
						</tsrx>,
						direct: () => <tsrx>
							return [<>View</>];
						</tsrx>,
						bySwitch: (role) => <tsrx>
							switch (role) {
								case 'admin':
									return [<>Edit</>];
								default:
									return [<>View</>];
							}
						</tsrx>,
						byForOf: (items) => <tsrx>
							for (const item of items) {
								if (item.active) {
									return [<>{item.label}</>];
								}
							}

							return [<>Empty</>];
						</tsrx>,
						byTry: (load) => <tsrx>
							try {
								return [<>{load()}</>];
							} catch (error) {
								return [<>Error</>];
							}
						</tsrx>,
					}}
				/>
			}`,
			'App.tsrx',
		);

		expect(code).toContain(
			'menuAlt: (isAdmin) => isAdmin ? [<>Delete</>, <>Edit</>] : [<>View</>]',
		);
		expect(code).toContain('direct: () => [<>View</>]');
		expect(code).toContain('bySwitch: (role) => (() => {');
		expect(code).toContain('switch (role)');
		expect(code).toContain('byForOf: (items) => (() => {');
		expect(code).toContain('for (const item of items)');
		expect(code).toContain('return [<>Empty</>];');
		expect(code).toContain('byTry: (load) => (() => {');
		expect(code).toContain('try {');
		expect(code).toContain('catch(error)');
		expect(code).toContain('return [<>Error</>];');
		expect(code).not.toContain('return null;');
		expect(code).not.toContain('? (() =>');
	});

	it('keeps expression child arrays in fragment, tsx, and compat callback props', () => {
		const { code } = compile(
			`component Child(props) {}

			component App() {
				<Child
					fragment={() => <>{[<>Delete</>, <>Edit</>]}</>}
					tsx={() => <tsx>{[<>Delete</>, <>Edit</>]}</tsx>}
					compat={() => <tsx:vue>{[<>Delete</>, <>Edit</>]}</tsx:vue>}
				/>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('fragment={() => [<>Delete</>, <>Edit</>]}');
		expect(code).toContain('tsx={() => [<>Delete</>, <>Edit</>]}');
		expect(code).toContain('compat={() => [<>Delete</>, <>Edit</>]}');
		expect(code).not.toContain('return null;');
		expect(code).not.toContain('<tsx>');
	});

	it('emits scoped CSS and applies the scope hash to host elements', () => {
		const { code, css, cssHash } = compile(
			`component App() {
				<div class="card">{'Hi'}</div>

				<style>
					.card {
						color: red;
					}
				</style>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBe('');
		expect(code).toContain(`class="card ${cssHash}"`);
		expect(css).toContain(`.card.${cssHash}`);
		expect(css).toContain('color: red;');
	});

	it('{ref fn} on a DOM element compiles to ref={fn}', () => {
		const { code } = compile(
			`component App() {
				function capture(node: HTMLDivElement) {}
				<div {ref capture}>{'x'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toMatch(/ref=\{capture\}/);
	});

	it('keeps Vue host ref expressions clean in Volar TSX while disabling prop verification', () => {
		const source = `component App() {
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

		component NamedForwardInput(props: { type: string; input_ref?: any }) {
			<input type={props.type} ref={props.input_ref} />
		}

		const named_vue_ref_object = ref<HTMLInputElement | null>(null);

		component App() {
			<NamedForwardInput type="text" input_ref={ref named_vue_ref_object} />
		}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx');
		const source_prop_offset = source.indexOf('input_ref={ref');
		const generated_prop_offset = result.code.indexOf('input_ref={__create_ref_prop');
		const prop_mapping = result.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === source_prop_offset &&
				mapping.generatedOffsets[0] === generated_prop_offset &&
				mapping.generatedLengths[0] === 'input_ref'.length,
		);

		expect(result.code).toContain(
			'<NamedForwardInput type="text" input_ref={__create_ref_prop(() => named_vue_ref_object, (v) => named_vue_ref_object = v)} />',
		);
		expect(result.code).not.toContain('input_ref: __create_ref_prop');
		expect(prop_mapping?.data.completion).toBe(true);
		expect(prop_mapping?.data.verification).toBe(true);
	});

	it('maps Vue component declarations to the generated function in Volar TSX', () => {
		const source = `import { ref } from 'vue';

		component App() {
			const count = ref(0);
			<button>{count.value}</button>
		}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx');
		const source_component_offset = source.indexOf('component');
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
		const component_keyword_mapping = result.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === source_component_offset &&
				mapping.lengths[0] === 'component'.length,
		);

		expect(name_mappings).toHaveLength(1);
		expect(name_mappings[0].generatedOffsets[0]).toBe(generated_function_name_offset);
		expect(component_keyword_mapping?.generatedOffsets[0]).toBe(generated_function_keyword_offset);
		expect(find_generated_mapping(generated_define_offset)).toBeUndefined();
		expect(find_generated_mapping(generated_outer_name_offset)).toBeUndefined();
	});

	it('rejects {ref ...} on composite components', () => {
		expect(() =>
			compile(
				`component Child(props) {
					<input {...props} />
				}

				component App() {
					function inputRef(node: HTMLInputElement | null) {}
					<Child {ref inputRef} />
				}`,
				'App.tsrx',
			),
		).toThrow(/only supported on host elements/);
	});

	it('multiple {ref ...} on the same DOM element compile to mergeRefs(...)', () => {
		const { code } = compile(
			`component App() {
				function a(node: HTMLInputElement | null) {}
				function b(node: HTMLInputElement | null) {}
				<input {ref a} {ref b} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('ref={__mergeRefs(a, b)}');
		expect(code).toContain("import { mergeRefs as __mergeRefs } from '@tsrx/vue/ref'");
	});

	it('combines a single ref={expr} with multiple {ref expr} keyword-form refs via mergeRefs', () => {
		const { code } = compile(
			`component App() {
				function a(node: HTMLInputElement | null) {}
				function b(node: HTMLInputElement | null) {}
				function c(node: HTMLInputElement | null) {}
				<input ref={a} {ref b} {ref c} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('ref={__mergeRefs(a, b, c)}');
	});

	it('allows named ref props through components and normalizes host spreads', () => {
		const { code } = compile(
			`component Child(props) {
				<input {...props} />
			}

			component App() {
				let input;
				<Child input_ref={ref input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain("from '@tsrx/vue/ref'");
		expect(code).toContain('{...{ input_ref: __create_ref_prop(() => input, (v) => input = v) }}');
		expect(code).toContain('let Child__spread_props1 = __normalize_spread_props(props);');
		expect(code).toContain('{...Child__spread_props1}');
		expect(code).toContain('ref={Child__spread_props1.ref}');
		expect(code.match(/__normalize_spread_props\(/g)).toHaveLength(1);
	});

	it('imports only create_ref_prop for component ref props without host spreads', () => {
		const { code } = compile(
			`component Child(props) {
				<span>{'child'}</span>
			}

			component App() {
				let input;
				<Child input_ref={ref input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain("from '@tsrx/vue/ref'");
		expect(code).toContain('{...{ input_ref: __create_ref_prop(() => input, (v) => input = v) }}');
		expect(code).not.toContain('normalize_spread_props');
	});

	it('declares normalized host spread refs inside tsx expression blocks', () => {
		const { code } = compile(
			`class Foo {
				bar() {
					const props = {};
					function cb(_node) {}
					return <tsx><input {...props} ref={cb} /></tsx>;
				}
			}`,
			'App.tsrx',
		);
		const declaration_offset = code.indexOf(
			'let _tsrx_spread_props_1 = __normalize_spread_props(props);',
		);
		const spread_offset = code.indexOf('{..._tsrx_spread_props_1}');

		expect(declaration_offset).toBeGreaterThan(-1);
		expect(spread_offset).toBeGreaterThan(declaration_offset);
		expect(code).toContain('_tsrx_spread_props_1.ref');
		expect(code).not.toContain('<tsx>');
	});

	it('normalizes multiple host spreads once while merging one explicit ref', () => {
		const { code } = compile(
			`component App() {
			const first = {};
			const second = {};
			function cb(_node) {}
			<input {...first} {...second} ref={cb} />
		}`,
			'App.tsrx',
		);

		expect(code).toContain('let App__spread_props1 = __normalize_spread_props(first);');
		expect(code).toContain('let App__spread_props2 = __normalize_spread_props(second);');
		expect(code).toContain('{...App__spread_props1}');
		expect(code).toContain('{...App__spread_props2}');
		expect(code).toContain('ref={__mergeRefs(App__spread_props1.ref, App__spread_props2.ref, cb)}');
		expect(code.match(/__normalize_spread_props\(/g)).toHaveLength(2);
		expect(code).not.toContain('create_ref_prop');
		expect(code).not.toContain('__normalize_spread_props(first, cb)');
		expect(code).not.toContain('__normalize_spread_props(second, cb)');
	});

	it('rejects multiple ref={...} attributes on the same element', () => {
		expect(() =>
			compile(
				`component App() {
					function a(node: HTMLInputElement | null) {}
					function b(node: HTMLInputElement | null) {}
					<input ref={a} ref={b} />
				}`,
				'App.tsrx',
			),
		).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
	});

	it('rejects multiple {ref ...} on the same composite component', () => {
		expect(() =>
			compile(
				`component Child(props) {
					<input {...props} />
				}

				component App() {
					function a(node: HTMLInputElement | null) {}
					function b(node: HTMLInputElement | null) {}
					<Child {ref a} {ref b} />
				}`,
				'App.tsrx',
			),
		).toThrow(/only supported on host elements/);
	});

	it('supports {text expr} host children via string coercion', () => {
		const { code } = compile(
			`component App() {
				const markup = '<span>Not HTML</span>';
				<div>{text markup}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("markup == null ? '' : markup + ''");
		expect(code).toContain('<div>{');
	});

	it('lowers a sole {html expr} host child to innerHTML', () => {
		const { code } = compile(
			`component App() {
				const markup = '<strong>safe enough</strong>';
				<div class="target">{html markup}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('innerHTML={markup}');
		expect(code).not.toContain('{html markup}');
	});

	it('rejects {html expr} on composite elements', () => {
		expect(() =>
			compile(
				`component Child(props) {
					<div {...props} />
				}

				component App() {
					const markup = '<strong>safe enough</strong>';
					<Child>{html markup}</Child>
				}`,
				'App.tsrx',
			),
		).toThrow(/only supported as the sole child of an element/);
	});

	it('rejects {html expr} when mixed with sibling children', () => {
		expect(() =>
			compile(
				`component App() {
					const markup = '<strong>safe enough</strong>';
					<div>{html markup}<span>{'tail'}</span></div>
				}`,
				'App.tsrx',
			),
		).toThrow(/only supported as the sole child of an element/);
	});

	it('compiles a simple if block in component bodies', () => {
		const { code } = compile(
			`component App({ visible }) {
				if (visible) {
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
			`component App({ visible }) {
				if (visible) {
					<div>{'Visible'}</div>
				} else {
					<div>{'Hidden'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain("<div>{'Visible'}</div>");
		expect(code).toContain("<div>{'Hidden'}</div>");
		expect(code).toMatch(/return visible \? App__static\d+ : App__static\d+;/);
	});

	it('supports lone early returns in component-body if statements', () => {
		const { code } = compile(
			`component App() {
				const count = 0;

				if (count > 1) {
					<div>{'Count is more than one'}</div>
				}

				if (count > 2) {
					return;
				}

				<button>{count}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const App__static1 = <div>{'Count is more than one'}</div>;");
		// Vue renders the early-return condition reactively as a ternary
		// inside the returned JSX, rather than emitting a setup-time
		// `if (count > 2) { return ... }` block (which would not re-evaluate
		// when `count` changes, since vapor `setup()` runs once).
		expect(code).not.toContain('if (count > 2) {');
		expect(code).toContain(
			'return <>{count > 1 ? App__static1 : null}{count > 2 ? null : <button>{count}</button>}</>;',
		);
	});

	it('inlines bare-JSX continuations after early-return as a render-time ternary', () => {
		const { code } = compile(
			`import { ref } from 'vue';

			component App() {
				const skip = ref(true);

				if (skip.value) {
					return;
				}

				<p class="continuation">{'visible'}</p>
			}`,
			'App.tsrx',
		);

		// The continuation is hoisted as a static and selected by a reactive
		// ternary inside the returned fragment, so flipping `skip.value` after
		// mount toggles the JSX. The setup-time `if` is gone.
		expect(code).toContain('const App__static1 = <p class="continuation">{\'visible\'}</p>;');
		expect(code).not.toContain('if (skip.value) {');
		expect(code).toContain('return skip.value ? null : App__static1;');
	});

	it('helper-splits when the continuation has setup statements like provide', () => {
		const { code } = compile(
			`import { provide, ref } from 'vue';

			component Child() {
				<span>{'x'}</span>
			}

			component App() {
				const skip = ref(true);

				if (skip.value) {
					return;
				}

				provide('theme', 'dark');
				<Child />
			}`,
			'App.tsrx',
		);

		// `provide` is a setup-time side effect that must be scoped to the
		// continuation's lifecycle, not the parent's. Render-time inlining
		// would lift it unconditionally (descendants would always see the
		// provide regardless of `skip.value`), so the continuation is moved
		// into a `StatementBodyHook` helper whose setup runs only when the
		// helper mounts. The same applies to `watch`, `watchEffect`,
		// declarations, and any other non-render statement.
		expect(code).toMatchSnapshot();
	});

	it('extracts ref-bearing continuations after lone early-return if statements', () => {
		const { code } = compile(
			`import { ref } from 'vue';

			component App() {
				const count = ref(0);
				const skip = ref(false);

				if (skip.value) {
					return;
				}

				const doubled = ref(0);

				<button onClick={() => {
					count.value++;
					doubled.value = count.value * 2;
				}}>{count.value}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const App__StatementBodyHook1 = defineVaporComponent(');
		expect(code).not.toContain('App__StatementBodyHook2');
		expect(code).toContain('function App__StatementBodyHook1({ count }');
		expect(code).toContain('const doubled = ref(0);');
		expect(code).toContain('skip.value');
		expect(code).toContain('<App__StatementBodyHook1 count={count} />');
		expect(code).not.toContain('App__Continue');
	});

	describe('if-continuation lift (client vs typeOnly)', () => {
		// Switch fall-through hoisting is exercised by the shared
		// `runSharedSwitchHelperHoistingTests` block above; this block stays
		// Vue-local because it covers the *if + early-return continuation*
		// lift with Vue-specific surface (`ref`-typed prop, the
		// `defineVaporComponent` wrapper around the lazy initializer).
		const if_source = `import { ref } from 'vue';

			component App() {
				const count = ref(0);
				const skip = ref(false);

				if (skip.value) {
					return;
				}

				const doubled = ref(0);

				<button onClick={() => {
					count.value++;
					doubled.value = count.value * 2;
				}}>{count.value}</button>
			}`;

		it('hoists the if-continuation helper to module scope in the client transform', () => {
			const { code } = compile(if_source, 'App.tsrx');

			// Module-scoped declaration: a top-level `const StatementBodyHook =
			// defineVaporComponent(function StatementBodyHook(...) { ... })`
			// declared outside the App component body.
			expect(code).toMatch(
				/^const App__StatementBodyHook\d+ = defineVaporComponent\(function App__StatementBodyHook\d+\(\{ count \}/m,
			);
			// The lazy-cache `let App__StatementBodyHookN;` slot used by the
			// local-scoped path is gone — hoisting removes the need for it.
			expect(code).not.toContain('let App__StatementBodyHook');
			// Component body just references the hoisted name directly.
			expect(code).toContain('<App__StatementBodyHook1 count={count} />');
			expect(code).not.toMatch(/const StatementBodyHook\d+\s*=\s*App__StatementBodyHook/);
		});

		it('keeps the if-continuation helper inline in the typeOnly transform', () => {
			const { code } = compile_to_volar_mappings(if_source, 'App.tsrx');

			// Volar TSX still uses the original local-scoped shape: a
			// module-level `let StatementBodyHook` slot and a per-render
			// lazy `defineVaporComponent` initializer inside the App body.
			expect(code).toContain('let App__StatementBodyHook1;');
			expect(code).toMatch(
				/const StatementBodyHook\d+\s*=\s*App__StatementBodyHook\d+\s*\?\?\s*\(App__StatementBodyHook\d+\s*=\s*defineVaporComponent\(/,
			);
			expect(code).toMatch(/<StatementBodyHook\d+ count=\{count\} \/>/);
		});
	});

	it('compiles for...of statements in component bodies', () => {
		const { code } = compile(
			`component App({ items }) {
				for (const item of items) {
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
			`component App({ items }: { items: { id: string, text: string }[] }) {
				for (const item of items; key item.id) {
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
			`component App({ items, getNew, use }: { items: { id: string, text: string }[], getNew: () => unknown, use: (item: unknown) => void }) {
				for (const item of items; key item.id) {
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
			`component App({ items }: { items: { id: string, text: string }[] }) {
				for (const item of items; index i; key item.id) {
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
			`component App({ items }: { items: string[] }) {
				for (const item of items; index i; key i) {
					<div>{'test'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items} getKey={(item, i) => i}>');
		expect(code).toContain('{(item, i) => <div>');
		expect(code).toContain("<div>{'test'}</div>");
		expect(code).not.toContain('<div key={i}>');
		expect(code).not.toContain('<Fragment');
	});

	it('keeps implicit index keys on multi-child for...of templates', () => {
		const { code } = compile(
			`component App({ items }: { items: string[] }) {
				for (const item of items; index i) {
					<div>{'one'}</div>
					<div>{'two'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<VaporFor in={items} getKey={(item, i) => i}>');
		expect(code).toContain('{(item, i) => <>');
		expect(code).toContain('App__static1');
		expect(code).toContain('App__static2');
		expect(code).not.toContain('<Fragment');
	});

	it('falls back without injecting VaporFor for keyed destructuring patterns it cannot rewrite', () => {
		const { code } = compile(
			`component App({ items, keyName }: { items: Array<Record<string, string>>, keyName: string }) {
				for (const { [keyName]: label } of items) {
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
			`component App({ value }) {
				switch (value) {
					case 'a':
						<div>{'A'}</div>
						break;
					default:
						<div>{'Fallback'}</div>
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
			`component App({ value }) {
				switch (value) {
					case 'a': {
						const label = 'A';
						<div>{label}</div>
						break;
					}
					default:
						<div>{'Fallback'}</div>
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
			`component ThrowingChild() {
				<div>{'might throw'}</div>
			}

			component App() {
				try {
					<ThrowingChild />
				} catch (error) {
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
			`component App() {
				try {
					<div>{'Async content'}</div>
				} pending {
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
			`component App() {
				try {
					<div>{'Async content'}</div>
				} pending {}
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
			`component App() {
				const suffix = '!';

				try {
					<div>{'Async content'}</div>
				} pending {
					<div>{'Loading...'}</div>
				} catch (error, reset) {
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

			component AsyncResolvedChild(props: { value: string }) {
				<p class="async-resolved">{props.value}</p>
			}

			component App(props: { promise: Promise<typeof AsyncResolvedChild> }) {
				const suffix = '!';
				const AsyncChild = defineVaporAsyncComponent(() => props.promise);

				try {
					<AsyncChild value="hello" />
				} pending {
					<p class="async-pending">{'loading...'}</p>
				} catch (err) {
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

	it('rejects JavaScript try/finally in component bodies', () => {
		expect(() =>
			compile(
				`component App() {
					try {
						<div>{'content'}</div>
					} catch (error) {
						<div>{error.message}</div>
					} finally {
						log(error)
					}
				}`,
				'App.tsrx',
			),
		).toThrow(/does not support JavaScript `try\/finally`/);
	});

	it('rejects await in component bodies', () => {
		expect(() =>
			compile(
				`component App() {
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
				`component App() {
					const load = async () => await fetchData();
					<button onClick={load}>{'Load'}</button>
				}`,
				'App.tsrx',
			),
		).not.toThrow();
	});
});
