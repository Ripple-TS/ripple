import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_CODES } from '../../src/diagnostics.js';

/**
 * @typedef {{
 *   compile: (source: string, filename?: string, options?: any) => { code: string, css: { code: string, hash: string } | null, errors: Array<{ message: string, code?: string }> },
 *   name: string,
 *   classAttrName: 'class' | 'className',
 * }} CompileHarness
 *
 * @typedef {{
 *   compile_to_volar_mappings: (source: string, filename?: string, options?: any) => { errors: Array<{ code?: string }> },
 *   name: string,
 * }} CompileDiagnosticsHarness
 *
 * `classAttrName`: the DOM-element class attribute shape the platform emits.
 * React rewrites `class` → `className`; Preact and Solid keep `class`. Shared
 * tests that assert on a scope-hash class string parameterize it via this.
 */

/**
 * @param {string} haystack
 * @param {string} needle
 * @returns {number}
 */
function count_substring(haystack, needle) {
	return haystack.split(needle).length - 1;
}

/**
 * @param {{ errors: Array<{ code?: string }> }} result
 */
function diagnostic_codes(result) {
	return result.errors.map((error) => error.code);
}

/**
 * Shared compile/editor diagnostics. These do not assert source-map structure;
 * they only verify that editor-facing compile entry points collect diagnostics.
 *
 * @param {CompileDiagnosticsHarness} harness
 */
export function runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name }) {
	describe(`[${name}] compile diagnostics`, () => {
		it('collects volar parser diagnostics without requiring loose mode', () => {
			const result = compile_to_volar_mappings(
				`component C() {
					return <div />;
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.JSX_RETURN_IN_COMPONENT);
		});
	});
}

/**
 * Shared compile-output regressions. These assert observable properties of
 * the generated code (not source-map structure) that every JSX target should
 * satisfy — e.g. the factory walker's `MemberExpression` rewrite of
 * `StyleIdentifier` refs into class-name literals must survive whatever
 * `transformElement` hook the platform wires in.
 *
 * @param {CompileHarness} harness
 */
export function runSharedCompileTests({ compile, name, classAttrName }) {
	describe(`[${name}] component export shapes`, () => {
		// `component X()` maps to `function X()` identically on every target
		// (react / preact / solid) — the keyword rewrite is done at the
		// factory level, and export prefix preservation is a function of
		// how the AST's `declaration` wrapper is left intact through the
		// walk. Any future change that breaks one of these shapes on one
		// target — e.g. double-exporting, stripping the default keyword —
		// fails the suite that notices first.

		it('keeps plain components local unless explicitly exported', () => {
			const { code } = compile(
				`component App() {
					<div>{'Hello world'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App() {');
			expect(code).toContain("{'Hello world'}");
			expect(code).not.toContain('export function App');
			expect(code).not.toContain('export default function App');
		});

		it('preserves named component exports without double-exporting', () => {
			const { code } = compile(
				`export component App() {
					<div>{'Hello world'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export function App()');
			expect(code).toContain("{'Hello world'}");
			expect(code).not.toContain('export export function App()');
		});

		it('preserves default component exports', () => {
			const { code } = compile(
				`export default component App() {
					<div>{'Hello world'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export default function App()');
			expect(code).toContain("{'Hello world'}");
		});

		it('preserves component type parameters on the emitted function', () => {
			const { code } = compile(
				`type Props<Item> = {
					items: readonly Item[];
				}

				export component MyComponent<Item>(props: Props<Item>) {
					<div />
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export function MyComponent<Item>(props: Props<Item>)');
		});
	});

	describe(`[${name}] TypeScript output`, () => {
		it('collects unclosed tag diagnostics without loose recovery silence', () => {
			const result = compile(
				`component App() {
					<div>"hi"
				}`,
				'App.tsrx',
				{ collect: true },
			);

			expect(result.errors.map((error) => error.message)).toContain(
				"Unclosed tag '<div>'. Expected '</div>' before end of component.",
			);
			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.UNCLOSED_TAG);
		});

		it('keeps loose unclosed tag recovery silent', () => {
			const result = compile(
				`component App() {
					<div>"hi"
				}`,
				'App.tsrx',
				{ loose: true },
			);

			expect(result.errors).toEqual([]);
		});

		it('accepts direct double-quoted text children', () => {
			const { code } = compile(
				`export component App({ count }: { count: number }) {
					<p>"clicked " {count} " times"</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"clicked "');
			expect(code).toContain('{count}');
			expect(code).toContain('" times"');
		});

		it('accepts direct double-quoted text at the start of template bodies', () => {
			const { code } = compile(
				`export component App() {
					"hello"
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"hello"');
		});

		it('decodes entities in direct double-quoted text children like JSX attributes', () => {
			const { code } = compile(
				`export component App() {
					<p>"a&amp;b&quot;c"</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"a&b\\"c"');
			expect(code).not.toContain('&quot;');
		});

		it('treats backslashes in direct double-quoted text children as literal text', () => {
			const { code } = compile(
				`export component App() {
					<p>"line\\nbreak"</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"line\\\\nbreak"');
		});

		it('keeps double-quoted strings inside expression containers as JavaScript strings', () => {
			const { code } = compile(
				`export component App() {
					<p>{"line\\nbreak"} {"&amp;"}</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"line\\nbreak"');
			expect(code).toContain('"&amp;"');
		});

		it('rejects literal newlines in double-quoted strings inside expression containers', () => {
			expect(() =>
				compile(
					`export component App() {
						<p>{"line
break"}</p>
					}`,
					'App.tsrx',
				),
			).toThrow(/Unterminated string constant/);
		});

		it('does not use JavaScript quote escapes in direct double-quoted text children', () => {
			expect(() =>
				compile(
					`export component App() {
						<p>"adsa\\""</p>
					}`,
					'App.tsrx',
				),
			).toThrow(/Unterminated double-quoted text child/);
		});

		it('keeps compact string comparisons in expression containers parseable', () => {
			const { code } = compile(
				`export component App({ value }: { value: string }) {
					<p>{"a"<value}</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('{"a" < value}');
		});

		it('preserves regular function type parameters', () => {
			const { code } = compile(
				`type Props<Item> = {
					items: readonly Item[];
				}

				export function getItems<Item>(props: Props<Item>) {
					return props.items;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export function getItems<Item>(props: Props<Item>)');
		});

		it('preserves optional markers in tuple members and function parameters', () => {
			const { code } = compile(
				`export type OptionalTuple = [bar: string, baz?: string];
export type OptionalFn = (bar: string, baz?: string) => void;
export interface OptionalInterfaceFn {
	(bar: string, baz?: string): void;
}
export function optionalFn(bar: string, baz?: string) {
	todo(bar, baz);
}`,
				'App.tsrx',
			);

			expect(code).toContain('export type OptionalTuple = [bar: string, baz?: string];');
			expect(code).toContain('export type OptionalFn = (bar: string, baz?: string) => void;');
			expect(code).toContain('(bar: string, baz?: string): void');
			expect(code).toContain('export function optionalFn(bar: string, baz?: string)');
		});

		it('keeps JavaScript block scopes inside component-local callables', () => {
			const { code } = compile(
				`export component BlockScopeCheck() {
					function fromDeclaration() {
						let result = 0;
						{
							const result = 41;
							return result + 1;
						}
					}

					const fromArrow = () => {
						{
							const token = 'arrow-block';
							return token.toUpperCase();
						}
					};

					class Reader {
						value() {
							{
								const amount = 7;
								return amount * 6;
							}
						}
					}

					const reader = new Reader();

					<output>{fromDeclaration()}{fromArrow()}{reader.value()}</output>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function fromDeclaration()');
			expect(code).toContain('const result = 41');
			expect(code).toContain("const token = 'arrow-block'");
			expect(code).toContain('class Reader');
			expect(code).toContain('const amount = 7');
			expect(code).toContain('{fromDeclaration()}');
			expect(code).toContain('{fromArrow()}');
			expect(code).toContain('{reader.value()}');
		});

		it('still treats component-level braces as template expressions', () => {
			const { code } = compile(
				`export component ExpressionContainerCheck() {
					function ignore() {
						{
							const hidden = 'not rendered';
							return hidden;
						}
					}

					const visible = 'render me';
					{visible}
				}`,
				'App.tsrx',
			);

			expect(code).toContain("const visible = 'render me'");
			expect(code).toContain('return visible;');
			expect(code).not.toMatch(/\{\n\s+visible;\n\s+\}/);
		});

		it('keeps generic-looking arrow expressions parseable after inner blocks in functions', () => {
			const { code } = compile(
				`export component GenericAfterBlockCheck() {
					const make = () => {
						if (true) {
							const local = 1;
							console.log(local);
						}

						<T,>(value: T) => value;
					};

					<div>{make}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('(value: T) => value');
			expect(code).toContain('{make}');
		});
	});

	describe(`[${name}] diagnostic codes`, () => {
		it('collects JSX expression value diagnostic codes', () => {
			const result = compile(
				`component App() {
					const title = <div />;
				}`,
				'App.tsrx',
				{ collect: true },
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.JSX_EXPRESSION_VALUE);
		});

		it('collects component JSX return diagnostic codes', () => {
			const result = compile(
				`component App() {
					return <div />;
				}`,
				'App.tsrx',
				{ collect: true },
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.JSX_RETURN_IN_COMPONENT);
		});

		it('collects function component syntax diagnostic codes', () => {
			const result = compile(
				`function App() {
					return <div />;
				}`,
				'App.tsrx',
				{ collect: true },
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.FUNCTION_COMPONENT_SYNTAX);
		});

		it('collects mismatched closing tag diagnostic codes', () => {
			const result = compile(
				`component App() {
					<div></span>
				}`,
				'App.tsrx',
				{ collect: true },
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG);
		});
	});

	describe(`[${name}] component return validation`, () => {
		it('rejects return statements with values in component scope', () => {
			expect(() =>
				compile(
					`export component App() {
						if (true) {
							return 'hello';
						}

						<div>{'fallback'}</div>
					}`,
					'App.tsrx',
				),
			).toThrow('Return statements inside components cannot have a return value.');
		});

		it('reports component return value errors at the return keyword', () => {
			const source = `export component App() {
				return value;
			}`;
			const return_start = source.indexOf('return');

			expect(() => compile(source, 'App.tsrx')).toThrowError(
				expect.objectContaining({
					pos: return_start,
					end: return_start + 'return'.length,
				}),
			);
		});

		it('allows return values inside functions and classes nested in components', () => {
			expect(() =>
				compile(
					`export component App() {
						function getLabel() {
							return 'label';
						}

						const getCount = () => {
							return 1;
						};

						class Model {
							getValue() {
								return getCount();
							}
						}

						const model = new Model();
						<div>{getLabel()}{model.getValue()}</div>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});
	});

	describe(`[${name}] walker transforms survive element lowering`, () => {
		it('rewrites #style member expressions inside element child expressions', () => {
			const { code } = compile(
				`export component App() {
					<div>{#style.root}</div>
					<style>
						.root { color: blue; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/"tsrx-[a-z0-9]+ root"/);
			expect(code).not.toContain('#style');
		});

		it('rewrites #style bracket notation inside element child expressions', () => {
			const { code } = compile(
				`export component App() {
					<div>{#style['accent']}</div>
					<style>
						.accent { color: red; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/"tsrx-[a-z0-9]+ accent"/);
			expect(code).not.toContain('#style');
		});

		it('rewrites #style inside a {text expr} sole child', () => {
			const { code } = compile(
				`export component App() {
					<div>{text #style.root}</div>
					<style>
						.root { color: blue; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/"tsrx-[a-z0-9]+ root"/);
			expect(code).not.toContain('#style');
			expect(code).not.toContain('StyleIdentifier');
		});
	});

	describe(`[${name}] <tsx> and fragment unwrapping`, () => {
		// All of these exercise the shared `tsx_node_to_jsx_expression`
		// helper in @tsrx/core/transform/jsx/helpers.js — the unwrap / wrap
		// rules for `<tsx>` blocks and `<>` shorthand are platform-agnostic.
		// Tests are wrapped in `class Foo { bar() { return ...; } }` to put
		// the Tsx node in an expression position where unwrap rules apply
		// (vs. a JSX-child position, which is covered by its own cases).

		it('unwraps a tsx block with a single JSXElement child', () => {
			const { code } = compile(
				`class Foo { bar() { return <tsx><div>hi</div></tsx>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('return <div>hi</div>;');
			expect(code).not.toContain('<tsx>');
		});

		it('preserves JSX spread attributes inside tsx blocks', () => {
			const { code } = compile(
				`class Foo { bar() { const props = {}; return <tsx><Bar {...props} /></tsx>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('return <Bar {...props} />;');
			expect(code).not.toContain('<tsx>');
		});

		it('unwraps a tsx block containing a single expression to the expression', () => {
			// Regression: previously `<tsx>{'Hello'}</tsx>` was compiled to
			// `return {'Hello'};`, which is a JS syntax error because `{`
			// opens a block/object literal. The JSXExpressionContainer must
			// be unwrapped to its inner expression in expression position.
			const { code } = compile(`class Foo { bar() { return <tsx>{'Hello'}</tsx>; } }`, 'App.tsrx');
			expect(code).toContain("return 'Hello';");
			expect(code).not.toContain("return {'Hello'}");
		});

		it('unwraps a tsx block containing a single identifier expression', () => {
			const { code } = compile(
				`class Foo { bar() { const x = 1; return <tsx>{x}</tsx>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('return x;');
			expect(code).not.toContain('return {x}');
		});

		it('wraps tsx text-only content in a fragment so it remains valid JSX', () => {
			const { code } = compile(`class Foo { bar() { return <tsx>plain text</tsx>; } }`, 'App.tsrx');
			expect(code).toContain('return <>plain text</>;');
		});

		it('wraps multiple tsx children in a fragment', () => {
			const { code } = compile(
				`class Foo { bar() { return <tsx><div>a</div><div>b</div></tsx>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('return <><div>a</div><div>b</div></>;');
		});

		it('preserves a tsx block whose single child is already a fragment', () => {
			const { code } = compile(`class Foo { bar() { return <tsx><>{'x'}</></tsx>; } }`, 'App.tsrx');
			expect(code).toContain("return <>{'x'}</>;");
		});

		it('unwraps a top-level <> fragment with a single expression', () => {
			// `<>` at the top level is parsed as a Tsx node and hits the
			// same unwrapping path as `<tsx>`.
			const { code } = compile(`class Foo { bar() { return <>{'Hello'}</>; } }`, 'App.tsrx');
			expect(code).toContain("return 'Hello';");
		});

		it('unwraps a top-level <> fragment with a single element', () => {
			const { code } = compile(`class Foo { bar() { return <><div>hi</div></>; } }`, 'App.tsrx');
			expect(code).toContain('return <div>hi</div>;');
		});

		it('keeps a top-level <> fragment with multiple children', () => {
			const { code } = compile(
				`class Foo { bar() { return <><div>a</div><div>b</div></>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('return <><div>a</div><div>b</div></>;');
		});
	});

	describe(`[${name}] lazy destructuring shadowing`, () => {
		// Lazy `&{ name }` destructuring rewrites `name` to `__lazy0.name` at
		// component scope, but locals with the same name must shadow — the
		// shared `applyLazyTransforms` helper in @tsrx/core handles this.

		it('gives untyped lazy object params an object-shaped generated type', () => {
			const { code } = compile(
				`export component App(&{ name, age }) {
					<div>{name}{age}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { name: any; age: any })');
			expect(code).toContain('__lazy0.name');
			expect(code).toContain('__lazy0.age');
		});

		it('uses the source property name for aliased lazy object params', () => {
			const { code } = compile(
				`export component App(&{ name: displayName }) {
					<div>{displayName}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { name: any })');
			expect(code).toContain('__lazy0.name');
			expect(code).not.toContain('__lazy0.displayName');
		});

		it('preserves provided types for aliased lazy object params', () => {
			const { code } = compile(
				`export component App(&{ a: c, b }: { a: string, b: string }) {
					<div>{c}{b}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { a: string; b: string })');
			expect(code).toContain('__lazy0.a');
			expect(code).toContain('__lazy0.b');
		});

		it('rejects repeated local names inside lazy object params on plain functions', () => {
			expect(() =>
				compile(
					`export function greet(&{ a: b, b }: { a: string, b: string }) {
						return b;
					}`,
					'App.tsrx',
				),
			).toThrow(/Argument name clash/);
		});

		it('rejects repeated local names inside lazy object params on components', () => {
			expect(() =>
				compile(
					`export component App(&{ a: b, b }: { a: string, b: string }) {
						<div>{b}</div>
					}`,
					'App.tsrx',
				),
			).toThrow(/Argument name clash/);
		});

		it('allows distinct local names inside lazy object params on plain functions', () => {
			const { code } = compile(
				`export function greet(&{ a: c, b }: { a: string, b: string }) {
					return c + b;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function greet(__lazy0: { a: string; b: string })');
			expect(code).toContain('return __lazy0.a + __lazy0.b');
		});

		it('does not rewrite switch-case variables that shadow lazy bindings', () => {
			const { code } = compile(
				`export component App(&{ name }: { name: string }) {
					switch (name) {
						case 'test': {
							const name = 'local';
							console.log(name);
							break;
						}
					}
					<div>{name}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("const name = 'local'");
			expect(code).toContain('console.log(name)');
		});

		it('does not rewrite body-level variables that shadow lazy bindings', () => {
			const { code } = compile(
				`export component App(&{ name }: { name: string }) {
					const name = 'override';
					<div>{name}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("const name = 'override'");
			expect(code).toContain('{name}');
			expect(code).not.toContain('__lazy0.name');
		});

		it('does not rewrite locally shadowed names inside nested callbacks', () => {
			const { code } = compile(
				`export component App(&{name}: Props) {
					const handler = () => {
						const name = 'local';
						return name;
					};
					<div>{name}</div>
				}`,
				'App.tsrx',
			);

			// The prop reference in JSX should still be rewritten.
			expect(code).toContain('__lazy0.name');
			// The callback should use the local `name`, not the lazy accessor.
			expect(code).toContain("const name = 'local'");
			expect(code).toContain('return name');
			expect(code).not.toMatch(/return __lazy0\.name/);
		});

		it('does not rewrite for-of loop variables that shadow lazy bindings', () => {
			const { code } = compile(
				`export component App(&{name}: Props) {
					const items = ['a', 'b'];
					for (const name of items) {
						console.log(name);
					}
					<div>{name}</div>
				}`,
				'App.tsrx',
			);

			// The prop reference in JSX should be rewritten.
			expect(code).toContain('__lazy0.name');
			// The for-of loop variable should NOT be rewritten.
			expect(code).toContain('console.log(name)');
			expect(code).not.toMatch(/console\.log\(__lazy0\.name\)/);
		});
	});

	describe(`[${name}] interleaved statements and JSX children`, () => {
		// When a mutation sits between JSX siblings, each child has to be
		// captured into a `_tsrx_child_N` const at its source position so
		// later mutations in the outer body don't retroactively change what
		// earlier children rendered. Uses `captureJsxChild` from @tsrx/core.

		it('preserves source order when statements are interleaved with JSX children', () => {
			const { code } = compile(
				`component Card() {
					<div class="card">
						var a = "one"
						<b>{"hello" + a}</b>
						a = "two"
						<b>{"hello" + a}</b>
					</div>
				}`,
				'Card.tsrx',
			);
			const first_capture = code.indexOf('_tsrx_child_0');
			const assign_two = code.indexOf('a = "two"');
			const second_capture = code.indexOf('_tsrx_child_1');
			expect(first_capture).toBeGreaterThan(-1);
			expect(assign_two).toBeGreaterThan(first_capture);
			expect(second_capture).toBeGreaterThan(assign_two);
		});

		it('preserves source order for interleaved JSX across early-return splits', () => {
			// React/Preact extract typed continuation helpers after early returns
			// when top-level hooks follow; Solid has no hook-order rule but still
			// goes through the same capture path for interleaved mutations.
			const { code } = compile(
				`component Card() {
					var a = "one"
					<b>{"hello" + a}</b>
					a = "two"
					<b>{"hello" + a}</b>
					if (true) return
					const x = useState(0)
					<div>{x}</div>
				}`,
				'Card.tsrx',
			);
			const first_capture = code.indexOf('_tsrx_child_0');
			const assign_two = code.indexOf('a = "two"');
			const second_capture = code.indexOf('_tsrx_child_1');
			expect(first_capture).toBeGreaterThan(-1);
			expect(assign_two).toBeGreaterThan(first_capture);
			expect(second_capture).toBeGreaterThan(assign_two);
		});

		it('does not capture JSX into temporaries when all statements precede JSX', () => {
			const { code } = compile(
				`component Card() {
					<div>
						const a = "one"
						const b = "two"
						<span>{a}</span>
						<span>{b}</span>
					</div>
				}`,
				'Card.tsrx',
			);
			// No interleaving, so no capture temporaries should be introduced.
			expect(code).not.toContain('_tsrx_child_');
		});

		it('preserves source order for interleaved statements at the component top level', () => {
			// Same capture guarantee as the element-body case above, but with
			// no wrapper element — tests the component-body interleave path.
			const { code } = compile(
				`component Card() {
					var a = "one"
					<b>{"hello" + a}</b>
					a = "two"
					<b>{"hello" + a}</b>
				}`,
				'Card.tsrx',
			);
			const first_capture = code.indexOf('_tsrx_child_0');
			const assign_two = code.indexOf('a = "two"');
			const second_capture = code.indexOf('_tsrx_child_1');
			expect(first_capture).toBeGreaterThan(-1);
			expect(assign_two).toBeGreaterThan(first_capture);
			expect(second_capture).toBeGreaterThan(assign_two);
		});
	});

	describe(`[${name}] {text expr} coercion`, () => {
		it("coerces null / undefined / false to '' and stringifies the rest", () => {
			const { code } = compile(
				`export component App() {
					const markup = '<span>Not HTML</span>';
					const hidden = false;
					const empty = null;
					const missing = undefined;

					<div class="markup">{text markup}</div>
					<div class="hidden">{text hidden}</div>
					<div class="empty">{text empty}</div>
					<div class="missing">{text missing}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("markup == null ? '' : markup + ''");
			expect(code).toContain("hidden == null ? '' : hidden + ''");
			expect(code).toContain("empty == null ? '' : empty + ''");
			expect(code).toContain("missing == null ? '' : missing + ''");
		});
	});

	describe(`[${name}] {html expr} primitive rejection`, () => {
		// Ripple-only primitive: every JSX target rejects it at compile time
		// with a platform-branded message. The factory inserts the platform
		// name via `transform_context.platform.name`.
		const platform_pattern = new RegExp(
			`not supported on the ${name[0].toUpperCase()}${name.slice(1)} target`,
			'i',
		);

		it('rejects {html expr} as an element child', () => {
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						<article>{html markup}</article>
					}`,
					'App.tsrx',
				),
			).toThrow(platform_pattern);
		});

		it('rejects {html expr} at the component body level', () => {
			// Top-level `{html ...}` must hit the compile-time error rather
			// than falling through `is_jsx_child` and silently landing in
			// the function body as a raw Html AST node.
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						{html markup}
					}`,
					'App.tsrx',
				),
			).toThrow(platform_pattern);
		});
	});

	describe(`[${name}] JSX fragment shorthand in element context`, () => {
		// Distinct from the `<tsx> and fragment unwrapping` block — those
		// cases put `<tsx>` / `<>` in an *expression* position (return value).
		// These put `<>` inside another element, as a prop value, or inside
		// a `<tsx>` block at a JSX-child position.

		it('collapses a single-child fragment inside an element', () => {
			const { code } = compile(
				`export component App() {
					<b><>{111}</></b>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<b>{111}</b>');
			expect(code).not.toContain('<tsx>');
		});

		it('allows JSX fragments inside tsx blocks without throwing', () => {
			expect(() =>
				compile(
					`export component App() {
						<tsx><>{111}</></tsx>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('supports fragment shorthand passed as a component prop', () => {
			const { code } = compile(
				`component Child(props) {
					<div>{props.content}</div>
				}

				export component App() {
					<Child content={<><span>{'hello'}</span></>} />
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Child content={');
			expect(code).toContain("<span>{'hello'}</span>");
			expect(code).not.toContain('<tsx>');
		});
	});

	describe(`[${name}] scoped CSS`, () => {
		it('applies the scope hash to host elements and emits the hashed stylesheet', () => {
			const { code, css } = compile(
				`export component App() {
					<div>{'Hello world'}</div>

					<style>
						.div { color: red; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBeNull();
			expect(code).toContain("{'Hello world'}");
			expect(code).toContain(`${classAttrName}="${css?.hash}"`);
			expect(css?.code).toContain(`.div.${css?.hash}`);
			expect(css?.code).toContain('color: red;');
		});

		it('applies the scope hash inside a <tsx> block', () => {
			const { code, css } = compile(
				`component Card() {
					<tsx>
						<div class="card">
							<h2>{'Scoped title'}</h2>
							<p>{'Styles here do not leak out.'}</p>
						</div>
					</tsx>

					<div class="card">
						<h2>{'Scoped title'}</h2>
						<p>{'Styles here do not leak out.'}</p>
					</div>

					<style>
						.card {
							padding: 1.5rem;
							border: 1px solid #ddd;
						}

						h2 {
							color: #333;
						}
					</style>
				}`,
				'Card.tsrx',
			);

			expect(css).not.toBeNull();
			expect(count_substring(code, `${classAttrName}="card ${css?.hash}"`)).toBe(2);
		});

		it('applies the scope hash inside fragment shorthand', () => {
			const { code, css } = compile(
				`component Card() {
					<>
						<div class="card">
							<h2>{'Scoped title'}</h2>
							<p>{'Styles here do not leak out.'}</p>
						</div>
					</>

					<div class="card">
						<h2>{'Scoped title'}</h2>
						<p>{'Styles here do not leak out.'}</p>
					</div>

					<style>
						.card {
							padding: 1.5rem;
							border: 1px solid #ddd;
						}

						h2 {
							color: #333;
						}
					</style>
				}`,
				'Card.tsrx',
			);

			expect(css).not.toBeNull();
			expect(count_substring(code, `${classAttrName}="card ${css?.hash}"`)).toBe(2);
		});

		it('does not apply scoped css hashes to composite components', () => {
			const { code, css } = compile(
				`component Child() {
					<div>{'Hello world'}</div>
				}

				export component App() {
					<Child />
					<div>{'Styled content'}</div>

					<style>
						.div { color: red; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBeNull();
			expect(code).toContain(`<div ${classAttrName}="${css?.hash}">{'Styled content'}</div>`);
			expect(code).not.toMatch(/<Child\s+class(Name)?="/);
		});

		it('passes #style.name through a composite component prop', () => {
			// `className` here is a prop on a composite component, not a DOM
			// attribute — every target passes prop names through unchanged,
			// so the assertion is cross-platform regardless of the host-
			// element class attribute shape.
			const { code, css } = compile(
				`component Badge({ className }: { className?: string }) {
					<span class={['badge', className ?? '']}>{'New'}</span>

					<style>
						.badge { padding: 0.25rem 0.5rem; }
					</style>
				}

				export component App() {
					<Badge className={#style.highlight} />

					<style>
						.highlight { background: green; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBeNull();
			const app_hash = css?.hash.split(' ').find((h) => code.includes(`"${h} highlight"`));
			expect(app_hash).toBeTruthy();
			expect(code).toContain(`className="${app_hash} highlight"`);
		});

		it('passes #style bracket notation through a composite component prop', () => {
			const { code, css } = compile(
				`export component App() {
					<Child cls={#style['accent']} />

					<style>
						.accent { color: red; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBeNull();
			expect(code).toContain('accent"');
		});
	});
}
