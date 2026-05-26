import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_CODES } from '../../src/diagnostics.js';

/**
 * @typedef {{
 *   compile: (source: string, filename?: string, options?: any) => { code: string, css: string, cssHash: string | null, errors: Array<{ message: string, code?: string }> },
 *   name: string,
 *   classAttrName: 'class' | 'className',
 * }} CompileHarness
 *
 * @typedef {{
 *   compile_to_volar_mappings: (source: string, filename?: string, options?: any) => { code: string, errors: Array<{ code?: string }> },
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

		it('keeps return-value native TSRX templates clean in type-only output', () => {
			const result = compile_to_volar_mappings(
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
							bySwitch: (role) => <tsrx>
								switch (role) {
									case 'admin':
										return [<>Edit</>];
									default:
										return [<>View</>];
								}
							</tsrx>,
						}}
					/>
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
			expect(result.code).toContain(
				'menuAlt: (isAdmin) => isAdmin ? [<>Delete</>, <>Edit</>] : [<>View</>]',
			);
			expect(result.code).toContain('bySwitch: (role) => (() => {');
			expect(result.code).not.toContain('return null;');
		});

		it('parses native TSRX callback returns in JSX props without semicolons', () => {
			const result = compile_to_volar_mappings(
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <tsrx>
									<span>{item.name}</span>
								</tsrx>
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
			expect(result.code).not.toContain('<tsrx>');
			expect(result.code).toContain('item.name');
		});

		it('reports semicolon-terminated template expression containers', () => {
			const result = compile_to_volar_mappings(
				`component App() {
					{
						renderThing();
					}
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).toContain(
				DIAGNOSTIC_CODES.TEMPLATE_EXPRESSION_TRAILING_SEMICOLON,
			);
			const diagnostic = result.errors.find(
				(error) => error.code === DIAGNOSTIC_CODES.TEMPLATE_EXPRESSION_TRAILING_SEMICOLON,
			);
			expect(diagnostic?.loc?.start).toEqual({ line: 3, column: 19 });
			expect(diagnostic?.loc?.end).toEqual({ line: 3, column: 20 });
			expect(result.code).toContain('renderThing()');
		});

		it('reports named {html ...} attribute values with a diagnostic code', () => {
			const result = compile_to_volar_mappings(
				`component App({ markup }: { markup: string }) {
					<Child body={html markup} />
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).toContain(
				DIAGNOSTIC_CODES.HTML_DIRECTIVE_AS_ATTRIBUTE_VALUE,
			);
			expect(result.errors.map((error) => error.message)).toContain(
				'`{html ...}` is not supported as an attribute value. Use a string literal or expression without `html`.',
			);
		});

		it('reports anonymous {html ...} attributes with a diagnostic code', () => {
			const result = compile_to_volar_mappings(
				`component App({ markup }: { markup: string }) {
					<article {html markup} />
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).toContain(
				DIAGNOSTIC_CODES.HTML_DIRECTIVE_AS_ATTRIBUTE_VALUE,
			);
			expect(result.errors.map((error) => error.message)).toContain(
				'`{html ...}` is not supported as an attribute value. Use a string literal or expression without `html`.',
			);
		});
	});
}

/**
 * @param {CompileHarness} harness
 */
export function runSharedTsxExpressionTsrxTests({ compile, name, classAttrName }) {
	describe(`[${name}] <tsrx> inside TSX expressions`, () => {
		it('lowers nested native TSRX templates inside regular function TSX props', () => {
			const { code } = compile(
				`function App3() {
					return <>
						<PlainTextPlugin
							ErrorBoundary={LexicalErrorBoundary}
							contentEditable={<tsrx>
								<ContentEditable
									aria-placeholder={placeholder}
									class={classes.contentEditable}
									placeholder={<tsrx>
										<div class={classes.placeholder}>{placeholder}</div>
									</tsrx>}
								/>
							</tsrx>}
							placeholder={<tsrx>
								<div class={classes.placeholder}>{placeholder}</div>
							</tsrx>}
						/>
					</>;
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('<tsrx>');
			expect(code).not.toContain('</tsrx>');
			expect(code).toContain('contentEditable={<ContentEditable');
			expect(code).toContain(` ${classAttrName}={classes.contentEditable}`);
			expect(code).toContain(`placeholder={<div ${classAttrName}={classes.placeholder}>`);
		});

		it('allows native shorthand attributes in tsrx blocks nested under TSX', () => {
			const { code } = compile(
				`export function Test(props) {
					return <>
						<List
							items={props.items}
							renderItem={(item) =>
								<tsrx>
									<ItemView {item} onSelect={props.onSelect}>
										"Selected"
									</ItemView>
								</tsrx>
							}
						/>
					</>;
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('<tsrx>');
			expect(code).toContain('item={item}');
			expect(code).toContain('onSelect={props.onSelect}');
			expect(code).toContain('{"Selected"}');
		});
	});
}

/**
 * Nested `&{...}` / `&[...]` patterns must chain accessors through every lazy
 * level: a reference to the inner binding becomes the full member path through
 * the synthesized parent identifier, and assignments to it write back through
 * that same path. These tests are framework-agnostic — every target that
 * supports the lazy `&` syntax should exercise them.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedNestedLazyDestructuringTests({ compile, name }) {
	describe(`[${name}] nested lazy destructuring`, () => {
		it('transforms nested lazy object inside lazy object in component params', () => {
			const { code } = compile(
				`export component App(&{ outer: &{ inner } }: { outer: { inner: number } }) {
					<div>{inner}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { outer: { inner: number } })');
			expect(code).toContain('__lazy0.outer.inner');
			// Bare `inner` must not leak through (any identifier use except as a
			// property key — a property key is followed by `:`).
			expect(code).not.toMatch(/[^.]\binner\b(?!:)/);
		});

		it('transforms nested lazy array inside lazy object in component params', () => {
			const { code } = compile(
				`export component App(&{ pair: &[first, second] }: { pair: [number, number] }) {
					<div>{first}{second}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { pair: [number, number] })');
			expect(code).toContain('__lazy0.pair[0]');
			expect(code).toContain('__lazy0.pair[1]');
		});

		it('transforms nested lazy object inside lazy array in function params', () => {
			const { code } = compile(
				`export function getName(&[&{ name }]: [{ name: string }]) {
					return name;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function getName(__lazy0: [{ name: string }])');
			expect(code).toContain('__lazy0[0].name');
		});

		it('transforms three-level nested lazy object in component params', () => {
			const { code } = compile(
				`export component App(&{ a: &{ b: &{ c } } }: { a: { b: { c: number } } }) {
					<div>{c}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { a: { b: { c: number } } })');
			expect(code).toContain('__lazy0.a.b.c');
		});

		it('transforms nested lazy in variable declaration with writeback', () => {
			const { code } = compile(
				`export component App() {
					const data = { outer: { inner: 5 } };
					let &{ outer: &{ inner } } = data;
					inner = 99;
					<div>{data.outer.inner}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('let __lazy0 = data');
			expect(code).toContain('__lazy0.outer.inner = 99');
			// Plain (non-lazy) destructure of `inner` must not leak through.
			expect(code).not.toContain('{ outer: { inner } } = data');
		});

		it('transforms nested lazy array-in-object in variable declaration with writeback', () => {
			const { code } = compile(
				`export component App() {
					const data = { pair: [1, 2] as [number, number] };
					let &{ pair: &[first, second] } = data;
					first = 100;
					second = 200;
					<div>{data.pair[0]}{data.pair[1]}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('let __lazy0 = data');
			expect(code).toContain('__lazy0.pair[0] = 100');
			expect(code).toContain('__lazy0.pair[1] = 200');
		});

		it('transforms nested lazy in function params with writeback', () => {
			const { code } = compile(
				`export function bump(&{ pair: &[first, second] }: { pair: [number, number] }) {
					first = first + 10;
					second = second + 20;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function bump(__lazy0: { pair: [number, number] })');
			expect(code).toContain('__lazy0.pair[0] = __lazy0.pair[0] + 10');
			expect(code).toContain('__lazy0.pair[1] = __lazy0.pair[1] + 20');
		});

		it('transforms compound assignment through nested lazy chain', () => {
			const { code } = compile(
				`export component App() {
					const data = { a: { b: { c: 5 } } };
					let &{ a: &{ b: &{ c } } } = data;
					c += 10;
					c *= 2;
					<div>{data.a.b.c}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('let __lazy0 = data');
			expect(code).toContain('__lazy0.a.b.c += 10');
			expect(code).toContain('__lazy0.a.b.c *= 2');
		});

		// Lazy `&` markers can appear at any depth — the outer pattern need not
		// be lazy. The non-lazy outer destructure is preserved; only the lazy
		// nested pattern is replaced with its synthesized id.

		it('replaces lazy pattern nested inside non-lazy object component param', () => {
			const { code } = compile(
				`export component App({ something: &[first, second] }: { something: [number, number] }) {
					<div>{first}{second}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App({ something: __lazy0 }');
			expect(code).toContain('__lazy0[0]');
			expect(code).toContain('__lazy0[1]');
			// The inner lazy pattern must not survive as a real destructure.
			expect(code).not.toContain('[first, second]');
		});

		it('replaces lazy pattern nested inside non-lazy array component param', () => {
			const { code } = compile(
				`export component App([head, &{ inner }]: [number, { inner: number }]) {
					<div>{head}{inner}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App([head, __lazy0]');
			expect(code).toContain('__lazy0.inner');
			expect(code).not.toContain('{ inner }');
		});

		it('replaces lazy pattern nested inside non-lazy function param with writeback', () => {
			const { code } = compile(
				`export function bump({ pair: &[first, second] }: { pair: [number, number] }) {
					first = 100;
					second = 200;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function bump({ pair: __lazy0 }');
			expect(code).toContain('__lazy0[0] = 100');
			expect(code).toContain('__lazy0[1] = 200');
		});

		it('replaces lazy pattern nested inside non-lazy let declaration with writeback', () => {
			const { code } = compile(
				`export component App() {
					const data = { outer: { inner: 5 } };
					let { outer: &{ inner } } = data;
					inner = 99;
					<div>{data.outer.inner}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('let { outer: __lazy0 } = data');
			expect(code).toContain('__lazy0.inner = 99');
		});

		it('replaces multiple sibling lazy patterns nested in non-lazy outer', () => {
			const { code } = compile(
				`export component App({ a: &{ x }, b: &{ y } }: { a: { x: number }, b: { y: number } }) {
					<div>{x}{y}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toMatch(/\{\s*a:\s*__lazy0,\s*b:\s*__lazy1\s*\}/);
			expect(code).toContain('__lazy0.x');
			expect(code).toContain('__lazy1.y');
		});

		it('replaces deeply nested lazy pattern through multiple non-lazy levels', () => {
			const { code } = compile(
				`export component App({ a: { b: &{ c } } }: { a: { b: { c: number } } }) {
					<div>{c}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App({ a: { b: __lazy0 } }');
			expect(code).toContain('__lazy0.c');
		});
	});
}

/**
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedFragmentExpressionRenderTests({ compile, name }) {
	describe(`[${name}] fragment expression render bodies`, () => {
		it('renders a component-body fragment shorthand with a lone expression child', () => {
			const { code } = compile(
				`export default component A() {
					<>{"Hello"}</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('return "Hello";');
		});

		it('renders lone expression fragment shorthand inside conditional render bodies', () => {
			const { code } = compile(
				`export component A() {
					if (show) {
						<>{"Hello"}</>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"Hello"');
			expect(code).not.toMatch(/^[\t ]*"Hello";?\n\s*return null;/m);
		});

		it('renders lone expression fragment shorthand inside loop render bodies', () => {
			const { code } = compile(
				`export component A() {
					for (const value of values) {
						<>{value}</>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('value');
			expect(code).not.toMatch(/^[\t ]*value;?\n\s*return null;/m);
		});

		it('renders lone expression fragment shorthand inside switch case bodies', () => {
			const { code } = compile(
				`export component A() {
					switch (state) {
						case "ready":
							<>{"Ready"}</>
							break
						default:
							<>{"Waiting"}</>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"Ready"');
			expect(code).toContain('"Waiting"');
			expect(code).not.toMatch(/^[\t ]*"Ready";?\n\s*break;/m);
			expect(code).not.toMatch(/^[\t ]*"Waiting";?\n\s*return null;/m);
		});
	});
}

/**
 * Shared switch fall-through coverage. JavaScript `switch` semantics let a
 * matched case execute its own body and then continue into subsequent case
 * bodies until a `break` (or terminal `return`) is hit. The TSRX transforms
 * realize that statically: each case's compiled body includes the JSX of
 * downstream cases it would have fallen through into. React/Preact/Vue keep a
 * JS `switch` whose case-arms return the expanded body; Solid lowers to
 * `<Switch>/<Match>` whose individual `<Match>` arms each render the same
 * expanded body. Either way the cross-target invariant is that downstream
 * case JSX appears once per fall-through entry point.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedSwitchFallthroughTests({ compile, name }) {
	describe(`[${name}] switch fall-through`, () => {
		it.runIf(['react', 'preact', 'vue'].includes(name))(
			'lifts each downstream case body into a single helper component',
			() => {
				const { code } = compile(
					`export component StatusBadge({ status }: { status: string }) {
						switch (status) {
							case "idle":
								<span>{'Online'}</span>
							case "active":
								<span>{'Away'}</span>
							case "offline":
								<span>{'Offline'}</span>
						}
					}`,
					'App.tsrx',
				);

				// With the fall-through lift, each downstream case body is
				// hoisted into a helper component that chains into the next
				// helper. Every JSX body appears exactly once regardless of how
				// many arms would have fallen into it.
				expect(count_substring(code, "'Online'")).toBe(1);
				expect(count_substring(code, "'Away'")).toBe(1);
				expect(count_substring(code, "'Offline'")).toBe(1);
			},
		);

		it('treats explicit break as a stop signal and leaves later cases independent', () => {
			const { code } = compile(
				`export component App({ kind }: { kind: string }) {
					switch (kind) {
						case "a":
							<span>{'A'}</span>
							break
						case "b":
							<span>{'B'}</span>
							break
						default:
							<span>{'Other'}</span>
					}
				}`,
				'App.tsrx',
			);

			// Each case stops at its break; the default case is a separate
			// entry so its body is rendered exactly once. No fall-through means
			// no helpers are introduced on the React-family targets either.
			expect(count_substring(code, "'A'")).toBe(1);
			expect(count_substring(code, "'B'")).toBe(1);
			expect(count_substring(code, "'Other'")).toBe(1);
			if (['react', 'preact', 'vue'].includes(name)) {
				expect(code).not.toContain('StatementBodyHook');
			}
		});

		it.runIf(['react', 'preact', 'vue'].includes(name))(
			'treats stacked case labels as fall-through aliases for one lifted body',
			() => {
				const { code } = compile(
					`export component App({ n }: { n: number }) {
						switch (n) {
							case 1:
							case 2:
								<span>{'one or two'}</span>
								break
							default:
								<span>{'other'}</span>
						}
					}`,
					'App.tsrx',
				);

				// Empty `case 1:` falls through to `case 2:` at runtime; the
				// shared body is lifted into a helper so it lives in exactly
				// one place.
				expect(count_substring(code, "'one or two'")).toBe(1);
				expect(count_substring(code, "'other'")).toBe(1);
			},
		);

		it.runIf(name === 'solid')(
			'lifts a shared body into one StatementBodyHook helper across both <Match> arms',
			() => {
				const { code } = compile(
					`export component App({ n }: { n: number }) {
						switch (n) {
							case 1:
							case 2:
								<span>{'one or two'}</span>
								break
							default:
								<span>{'other'}</span>
						}
					}`,
					'App.tsrx',
				);

				// Solid's <Switch>/<Match> is exclusive, so each label still
				// needs its own <Match>, but both Matches now invoke a single
				// hoisted StatementBodyHook helper instead of duplicating the
				// JSX body.
				expect(count_substring(code, "'one or two'")).toBe(1);
				expect(count_substring(code, "'other'")).toBe(1);
				// The helper for the shared body is hoisted to module scope —
				// either as a top-level `function App__StatementBodyHook<N>()`
				// declaration or as a `const App__StatementBodyHook<N> = ...`
				// initializer (the wrapper shape depends on which platform
				// the helper goes through, but the prefix is consistent).
				expect(code).toMatch(/(?:function|const)\s+App__StatementBodyHook\d+/);
			},
		);

		it.runIf(['react', 'preact', 'vue'].includes(name))(
			'lifts duplicated case bodies into StatementBodyHook helpers chained from each arm',
			() => {
				const { code } = compile(
					`export component App({ status }: { status: string }) {
						switch (status) {
							case "idle":
								<span>{'Online'}</span>
							case "active":
								<span>{'Away'}</span>
							case "offline":
								<span>{'Offline'}</span>
						}
					}`,
					'App.tsrx',
				);

				expect(code).toContain('switch (status)');
				// Helper element names are prefixed with the component name on
				// module-scoped platforms (React: `App__StatementBodyHook1`)
				// and bare on local-scoped platforms (Preact/Vue:
				// `StatementBodyHook1`), so the regex accepts either shape.
				const helper_ref = '<[\\w$]*StatementBodyHook\\d+ /\\s*>';
				// First case isn't duplicated downstream, so its body stays
				// inline but appends the next helper invocation as the chain
				// entry point.
				expect(code).toMatch(
					new RegExp(
						`case\\s+"idle":[\\s\\S]*?return <><span>\\{'Online'\\}</span>${helper_ref}</>;`,
					),
				);
				// Duplicated cases just call into their helper.
				expect(code).toMatch(new RegExp(`case\\s+"active":[\\s\\S]*?return ${helper_ref};`));
				expect(code).toMatch(new RegExp(`case\\s+"offline":[\\s\\S]*?return ${helper_ref};`));

				// Exactly two `function <prefix>StatementBodyHook<N>()`
				// definitions exist — one per duplicated case body. The
				// `<prefix>` is empty on Preact/Vue and `App__` on React's
				// module-scoped helpers.
				const helper_def_matches = code.match(
					/function\s+[\w$]*StatementBodyHook\d+\s*\(\)\s*\{[\s\S]*?\n\s*\}/g,
				);
				expect(helper_def_matches).not.toBeNull();
				expect(/** @type {RegExpMatchArray} */ (helper_def_matches).length).toBe(2);
				const helper_defs = /** @type {RegExpMatchArray} */ (helper_def_matches);

				// Exactly one helper is "terminal" (renders its body and stops)
				// and exactly one is "chained" (renders its body then renders
				// the next helper). For the terminal helper, its compiled
				// return uses the same identifier that the static-hoisted
				// `<span>{'Offline'}</span>` was bound to; otherwise it falls
				// back to the literal span. Likewise the chained helper's
				// compiled return references either the `'Away'` static or its
				// span literal alongside another helper invocation.
				const find_static_id = (/** @type {string} */ literal) => {
					const m = code.match(
						new RegExp(`const\\s+([\\w$]+)\\s*=\\s*<span>\\{'${literal}'\\}</span>;`),
					);
					return m ? m[1] : null;
				};
				const offline_static = find_static_id('Offline');
				const away_static = find_static_id('Away');

				const terminal_helpers = helper_defs.filter((def) => {
					const has_offline = offline_static
						? def.includes(offline_static)
						: def.includes("<span>{'Offline'}</span>");
					const has_chain_ref = /<[\w$]*StatementBodyHook\d+\s*\/>/.test(def);
					return has_offline && !has_chain_ref;
				});
				expect(terminal_helpers.length).toBe(1);

				const chained_helpers = helper_defs.filter((def) => {
					const has_away = away_static
						? def.includes(away_static)
						: def.includes("<span>{'Away'}</span>");
					// The chain reference is always inlined directly into the
					// helper body now — bare `<StatementBodyHook />` invocations
					// are not hoisted into `App__staticN` aliases because doing
					// so just adds an indirection without enabling React's
					// element-identity fast path on a non-memo'd helper.
					const inline_chain = /<[\w$]*StatementBodyHook\d+\s*\/>/.test(def);
					return has_away && inline_chain;
				});
				expect(chained_helpers.length).toBe(1);

				// And no `App__staticN` const should alias a bare
				// StatementBodyHook reference anywhere in the output.
				expect(code).not.toMatch(
					/const\s+[\w$]+__static\d+\s*=\s*<[\w$]*StatementBodyHook\d+\s*\/>/,
				);
			},
		);

		it.runIf(name === 'solid')(
			'lowers fall-through to <Match> arms that invoke hoisted helpers',
			() => {
				const { code } = compile(
					`export component App({ status }: { status: string }) {
						switch (status) {
							case "idle":
								<span>{'Online'}</span>
							case "active":
								<span>{'Away'}</span>
							case "offline":
								<span>{'Offline'}</span>
						}
					}`,
					'App.tsrx',
				);

				expect(code).toContain('<Switch');
				expect(code).toMatch(/<Match when=\{status === "idle"\}>/);
				expect(code).toMatch(/<Match when=\{status === "active"\}>/);
				expect(code).toMatch(/<Match when=\{status === "offline"\}>/);
				// Each body literal lives in exactly one place — the lifted
				// helper that defines it. The Match arms reference the
				// helpers; downstream chain is materialized helper-to-helper.
				expect(count_substring(code, "'Offline'")).toBe(1);
				expect(count_substring(code, "'Away'")).toBe(1);
				expect(count_substring(code, "'Online'")).toBe(1);
			},
		);

		it.runIf(name === 'solid')('routes default cases to <Switch fallback>', () => {
			const { code } = compile(
				`export component App({ kind }: { kind: string }) {
					switch (kind) {
						case "a":
							<span>{'A'}</span>
							break
						default:
							<span>{'D'}</span>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Switch fallback=');
			expect(code).toMatch(/<Match when=\{kind === "a"\}>/);
			expect(count_substring(code, "'D'")).toBe(1);
		});
	});
}

/**
 * Shared assertions covering where each target places the lifted
 * `StatementBodyHook` helper component for switch-fall-through deduplication
 * — module scope for the client transform on every target whose platform
 * sets `moduleScopedHookComponents: true` (React, Solid, Vue), and a local
 * `let App__StatementBodyHook<N>` cache slot + per-render `?? (= …)` lazy
 * initializer otherwise. `compile_to_volar_mappings` keeps the local-scoped
 * shape regardless of platform default so Volar's virtual TSX can still
 * resolve closure-captured bindings against the component body.
 *
 * The `StatementBodyHook` name is React-flavored historically, but on
 * Vue/Solid the lift solves different problems (avoid re-`defineVaporComponent`
 * per render, dedup downstream-arm JSX, etc.) — same machinery either way.
 *
 * @typedef {'module-function' | 'module-vapor-component' | 'local-cache'} SwitchHelperClientShape
 *
 * @param {{
 *   compile: CompileHarness['compile'],
 *   compile_to_volar_mappings: CompileDiagnosticsHarness['compile_to_volar_mappings'],
 *   name: string,
 *   clientHelperShape: SwitchHelperClientShape,
 * }} harness
 */
export function runSharedSwitchHelperHoistingTests({
	compile,
	compile_to_volar_mappings,
	name,
	clientHelperShape,
}) {
	describe(`[${name}] StatementBodyHook hoisting (client vs typeOnly)`, () => {
		// Three fall-through cases without break: two of those bodies are
		// duplicated downstream (active, offline) so two helpers should exist.
		const switch_source = `export component App({ status }: { status: string }) {
			switch (status) {
				case "idle":
					<span>{'Online'}</span>
				case "active":
					<span>{'Away'}</span>
				case "offline":
					<span>{'Offline'}</span>
			}
		}`;

		it('lifts duplicated case bodies in the client transform', () => {
			const { code } = compile(switch_source, 'App.tsrx');

			if (clientHelperShape === 'module-function') {
				// React/Solid: top-level `function App__StatementBodyHook<N>()`
				// declarations, no per-render cache slots.
				const top_level_helper_count = (
					code.match(/^function App__StatementBodyHook\d+\(\)/gm) || []
				).length;
				expect(top_level_helper_count).toBe(2);
				expect(code).not.toContain('let App__StatementBodyHook');
			} else if (clientHelperShape === 'module-vapor-component') {
				// Vue: top-level `const App__StatementBodyHook<N> =
				// defineVaporComponent(function App__StatementBodyHook<N>() {...})`.
				const top_level_helper_count = (
					code.match(
						/^const App__StatementBodyHook\d+ = defineVaporComponent\(function App__StatementBodyHook\d+\(\)/gm,
					) || []
				).length;
				expect(top_level_helper_count).toBe(2);
				expect(code).not.toContain('let App__StatementBodyHook');
			} else {
				// Preact: local cache slot + `?? (= function …)` lazy
				// initializer per duplicated body; no top-level declarations.
				const cache_slot_count = (code.match(/^let App__StatementBodyHook\d+;$/gm) || []).length;
				expect(cache_slot_count).toBe(2);
				expect(code).toMatch(
					/const StatementBodyHook\d+\s*=\s*App__StatementBodyHook\d+\s*\?\?\s*\(App__StatementBodyHook\d+\s*=\s*function StatementBodyHook\d+\(\)/,
				);
			}
		});

		it('keeps lifted case bodies inline in the typeOnly transform', () => {
			const { code } = compile_to_volar_mappings(switch_source, 'App.tsrx');

			// Volar's virtual TSX always uses the local cache-slot pattern so
			// closure-captured bindings stay in the component scope for type
			// checking. The wrapper inside the lazy initializer varies per
			// target — `defineVaporComponent(function …)` on Vue, plain
			// `function …` elsewhere — but the slot + `?? (=` shape is uniform.
			const cache_slot_count = (code.match(/^let App__StatementBodyHook\d+;$/gm) || []).length;
			expect(cache_slot_count).toBe(2);
			expect(code).toMatch(
				/const StatementBodyHook\d+\s*=\s*App__StatementBodyHook\d+\s*\?\?\s*\(App__StatementBodyHook\d+\s*=\s*/,
			);
			// No top-level helper declarations in either lifted shape.
			expect(code).not.toMatch(/^function App__StatementBodyHook\d+\(\)/m);
			expect(code).not.toMatch(/^const App__StatementBodyHook\d+ = defineVaporComponent\(/m);
		});
	});
}

/**
 * Shared component-loop regressions. Vue does not share the full JSX output
 * suite because its component export shape differs, but it should still share
 * these component-body validation rules.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedComponentLoopControlFlowTests({ compile, name }) {
	runSharedFragmentExpressionRenderTests({ compile, name });
	runSharedSwitchFallthroughTests({ compile, name });

	describe(`[${name}] component loop control flow`, () => {
		it('uses continue to skip a for...of iteration', () => {
			const { code } = compile(
				`export component App({ items }: { items: string[] }) {
					for (const item of items) {
						if (!item) continue
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('continue;');
			expect(code).toMatch(/return null;|\? (?:null|\[\]) :/);
			expect(code).toContain('<div>{item}</div>');
		});

		it('keeps rendered content before continue branches', () => {
			const { code } = compile(
				`export component App({ items }: { items: string[] }) {
					for (const item of items) {
						<span>{item}</span>
						if (!item) continue
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('continue;');
			expect(code).not.toContain('{}');
			expect(code).toContain('<span>{item}</span>');
			expect(code).toContain('<div>{item}</div>');
		});

		it.runIf(['react', 'preact'].includes(name))(
			'keeps explicit loop keys on otherwise static children',
			() => {
				const { code } = compile(
					`export component App() {
						for (const item of items; index i; key i) {
							<div>{'test'}</div>
						}
					}`,
					'App.tsrx',
				);

				expect(code).toContain("return <div key={i}>{'test'}</div>;");
				expect(code).not.toContain('__static');
			},
		);

		it.runIf(['react', 'preact'].includes(name))(
			'keeps implicit loop keys on multi-child static loop bodies',
			() => {
				const { code } = compile(
					`export component App() {
						for (const item of items; index i) {
							<div>{'one'}</div>
							<div>{'two'}</div>
						}
					}`,
					'App.tsrx',
				);

				const fragment_source = name === 'react' ? 'react' : 'preact';
				expect(code).toContain(`import { Fragment } from '${fragment_source}';`);
				expect(code).toContain('<Fragment key={i}>');
				expect(code).toContain('</Fragment>');
			},
		);

		it('allows ordinary function control flow inside for...of loops', () => {
			const { code } = compile(
				`export component App({ items }: { items: string[] }) {
					for (const item of items) {
						function label(value: string) {
							for (let i = 0; i < 1; i++) {
								while (i < 0) {
									break
								}
								if (!value) return 'missing'
							}
							return value
						}

						<div>{label(item)}</div>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function label');
			expect(code).toContain('label(item)');
		});

		it('rejects return statements inside for...of loops', () => {
			expect(() =>
				compile(
					`export component App({ items }: { items: string[] }) {
						for (const item of items) {
							if (!item) return
							<div>{item}</div>
						}
					}`,
					'App.tsrx',
				),
			).toThrow('Return statements are not allowed inside component for...of loops');
		});

		it('rejects break statements targeting for...of loops', () => {
			expect(() =>
				compile(
					`export component App({ items }: { items: string[] }) {
						for (const item of items) {
							if (!item) break
							<div>{item}</div>
						}
					}`,
					'App.tsrx',
				),
			).toThrow('Break statements are not allowed inside component for...of loops');
		});

		it.each([
			['for', `for (let i = 0; i < items.length; i++) { <div>{items[i]}</div> }`],
			['for...in', `for (const key in items) { <div>{items[key]}</div> }`],
			['while', `while (items.length) { <div>{items[0]}</div> }`],
			['do...while', `do { <div>{items[0]}</div> } while (items.length)`],
		])('rejects %s loops in component templates', (_label, loop) => {
			expect(() =>
				compile(
					`export component App({ items }: { items: string[] }) {
						${loop}
					}`,
					'App.tsrx',
				),
			).toThrow(/loops are not supported in components/);
		});
	});
}

/**
 * Shared anonymous component expression regressions. These cover parser support
 * for arrow-shaped anonymous components and the cross-target lowering contract:
 * arrow-authored anonymous components become arrow functions, legacy anonymous
 * components stay function expressions, and named components continue to use
 * declarations in the broader shared suite.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedAnonymousComponentTests({ compile, name }) {
	describe(`[${name}] anonymous component expressions`, () => {
		const jsx_targets = ['react', 'preact', 'solid'];

		it.runIf(jsx_targets.includes(name))(
			'parses anonymous component arrow expressions as plain arrow functions',
			() => {
				const { code } = compile(
					`const Inline = component(props: { x: string }) => {
						<div>{props.x}</div>
					}`,
					'App.tsrx',
				);

				expect(code).toContain('const Inline = (props: { x: string }) => {');
				expect(code).toContain('<div>{props.x}</div>');
				expect(code).not.toContain('function Inline');
				expect(code).not.toContain('function (props');
			},
		);

		it.runIf(name === 'vue')(
			'parses anonymous component arrow expressions as defineVaporComponent arrows',
			() => {
				const { code } = compile(
					`const Inline = component(props: { x: string }) => {
						<div>{props.x}</div>
					}`,
					'App.tsrx',
				);

				expect(code).toContain('const Inline = defineVaporComponent((props: { x: string }) => {');
				expect(code).toContain('<div>{props.x}</div>');
				expect(code).not.toContain('function Inline');
				expect(code).not.toContain('function (props');
			},
		);

		it.runIf(jsx_targets.includes(name))(
			'lowers legacy anonymous component expressions to plain function expressions',
			() => {
				const { code } = compile(
					`const Inline = component() {
						<div>{'inline'}</div>
					}`,
					'App.tsrx',
				);

				expect(code).toContain('const Inline = function () {');
				expect(code).toContain("<div>{'inline'}</div>");
				expect(code).not.toContain('function Inline');
				expect(code).not.toContain('const Inline = () => {');
			},
		);

		it.runIf(jsx_targets.includes(name))(
			'parses legacy anonymous component expressions inside JSX attribute objects',
			() => {
				const { code } = compile(
					`export component App() {
						<Page
							params={{
								menuAlt2: component({ isAdmin, children }: { isAdmin: boolean, children: (items: JSX.Element[]) => JSX.Element }) {
									const items = [];
									if (isAdmin) {
										items.push(<>Delete</>, <>Edit</>);
									} else {
										items.push(<>View</>);
									}
									{children(items)}
								},
							}}
						/>
					}`,
					'App.tsrx',
				);

				expect(code).toContain('menuAlt2');
				expect(code).toContain('items.push');
				expect(code).toContain('children(items)');
				expect(code).toContain('</>;');
			},
		);

		it.runIf(jsx_targets.includes(name))(
			'parses legacy anonymous component expressions as JSX attribute values',
			() => {
				const { code } = compile(
					`export component App() {
						<Child
							children={component ({ items }: { items: JSX.Element[] }) {
								<ul>
									for (const item of items; index i) {
										<li key={i}>{item}</li>
									}
								</ul>
							}}
						/>
					}`,
					'App.tsrx',
				);

				expect(code).toContain('children={function');
				expect(code).toContain(
					name === 'solid' ? '<For each={items}>' : '__map_iterable(items, (item, i)',
				);
				expect(code).toContain('<li key={i}>{item}</li>');
			},
		);

		it.runIf(jsx_targets.includes(name))(
			'parses semicolon-terminated template expression containers',
			() => {
				const { code } = compile(
					`export component App() {
						<Child
							children={component({ items }: { items: JSX.Element[] }) {
								<ul>
									for (const item of items; index i) {
										<li key={i}>{item}</li>
									}
								</ul>
							}}
						/>
					}

					component Child({ children }: { children: (props: { items: JSX.Element[] }) => JSX.Element }) {
						{
							children({ items: [<><span>Item 1</span></>, <><span>Item 2</span></>, <><span>Item 3</span></>] });
						}
					}`,
					'App.tsrx',
				);

				expect(code).toContain('children({');
				expect(code).toContain('Item 3');
			},
		);

		it.runIf(name === 'vue')(
			'lowers legacy anonymous component expressions to defineVaporComponent functions',
			() => {
				const { code } = compile(
					`const Inline = component() {
						<div>{'inline'}</div>
					}`,
					'App.tsrx',
				);

				expect(code).toContain('const Inline = defineVaporComponent(function () {');
				expect(code).toContain("<div>{'inline'}</div>");
				expect(code).not.toContain('function Inline');
				expect(code).not.toContain('const Inline = defineVaporComponent(() => {');
			},
		);
	});
}

/**
 * Shared validation that components only accept a single (props) parameter.
 * Without this rule, JSX targets pass extra params straight through into the
 * generated function, and ripple silently drops them. The rule is enforced
 * across every component declaration shape — named declaration, anonymous
 * expression (legacy and arrow), and arrow class property (regular and
 * static). Runs against both `compile` (which throws) and
 * `compile_to_volar_mappings` (which collects errors) so the same rule fires
 * for production builds and editor tooling.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'> & Pick<CompileDiagnosticsHarness, 'compile_to_volar_mappings'>} harness
 */
export function runSharedComponentParamsTests({ compile, compile_to_volar_mappings, name }) {
	const expected_message =
		'Components accept a single props parameter. Move additional inputs into the props object instead.';

	/**
	 * @param {string} source
	 * @param {string} label
	 */
	function expect_compile_throws(source, label) {
		it(`rejects ${label} via compile`, () => {
			expect(() => compile(source, 'App.tsrx')).toThrow(/single props parameter/);
		});
	}

	/**
	 * @param {string} source
	 * @param {string} label
	 */
	function expect_volar_collects(source, label) {
		it(`surfaces ${label} via Volar mappings`, () => {
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			expect(
				result.errors.some((error) =>
					/** @type {{ message?: string }} */ (error).message?.includes(expected_message),
				),
			).toBe(true);
		});
	}

	const cases = /** @type {const} */ ([
		[
			'a named component declaration with multiple parameters',
			`export component App(a, b) {
				<div>{a}</div>
			}`,
		],
		[
			'an anonymous component expression with multiple parameters',
			`const Inline = component(a, b) {
				<div>{a}</div>
			}`,
		],
		[
			'an anonymous arrow component expression with multiple parameters',
			`const Inline = component(a, b) => {
				<div>{a}</div>
			}`,
		],
		[
			'an arrow component class property with multiple parameters',
			`export class App {
				Inline = component(a, b) => {
					<div>{a}</div>
				}
			}`,
		],
		[
			'a static arrow component class property with multiple parameters',
			`export class App {
				static Inline = component(a, b) => {
					<div>{a}</div>
				}
			}`,
		],
	]);

	describe(`[${name}] component params`, () => {
		it('accepts a single props parameter', () => {
			expect(() =>
				compile(
					`export component App(props) {
						<div>{props.value}</div>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		for (const [label, source] of cases) {
			expect_compile_throws(source, label);
			expect_volar_collects(source, label);
		}

		it('reports one Volar diagnostic per extra parameter, each at the param position', () => {
			const result = compile_to_volar_mappings(
				`export component App(a, b, c) {
					<div>{a}</div>
				}`,
				'App.tsrx',
			);

			const offending = result.errors.filter((error) =>
				/** @type {{ message?: string }} */ (error).message?.includes(expected_message),
			);

			expect(offending).toHaveLength(2);

			const positions = offending.map((error) => /** @type {{ pos?: number }} */ (error).pos);
			expect(new Set(positions).size).toBe(2);
		});
	});
}

/**
 * Shared validation that components declared inside a class must use an arrow
 * function class property (regular or static). The method-style form
 * (`component foo() {}` inside a class body) is rejected at parse time. The
 * non-arrow property form (`Foo = component() {}`) is rejected by the analyze
 * stage. Runs against both `compile` (which throws) and
 * `compile_to_volar_mappings` (which collects errors) so the rule is enforced
 * in production and editor tooling alike.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'> & Pick<CompileDiagnosticsHarness, 'compile_to_volar_mappings'>} harness
 */
export function runSharedClassComponentDeclarationTests({
	compile,
	compile_to_volar_mappings,
	name,
}) {
	describe(`[${name}] class component declarations`, () => {
		it('allows an arrow component as a class property', () => {
			expect(() =>
				compile(
					`export class App {
						Inline = component() => {
							<div>{'hi'}</div>
						}
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('allows an arrow component as a static class property', () => {
			expect(() =>
				compile(
					`export class App {
						static Inline = component() => {
							<div>{'hi'}</div>
						}
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('rejects a component declared as a class method at parse time', () => {
			expect(() =>
				compile(
					`export class App {
						component Inline() {
							<div>{'hi'}</div>
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/Unexpected token/);
		});

		it('rejects a non-arrow component as a class property value', () => {
			expect(() =>
				compile(
					`export class App {
						Inline = component() {
							<div>{'hi'}</div>
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/Non-arrow component property values are not allowed/);
		});

		it('surfaces non-arrow property class component errors via Volar mappings', () => {
			const result = compile_to_volar_mappings(
				`export class App {
					Inline = component() {
						<div>{'hi'}</div>
					}
				}`,
				'App.tsrx',
			);

			expect(
				result.errors.some((error) =>
					/** @type {{ message?: string }} */ (error).message?.includes(
						'Non-arrow component property values are not allowed',
					),
				),
			).toBe(true);
		});

		it('does not flag arrow component class properties via Volar mappings', () => {
			const result = compile_to_volar_mappings(
				`export class App {
					Inline = component() => {
						<div>{'hi'}</div>
					}
					static Other = component() => {
						<span>{'hello'}</span>
					}
				}`,
				'App.tsrx',
			);

			expect(
				result.errors.some((error) =>
					/** @type {{ message?: string }} */ (error).message?.includes(
						'arrow function class property',
					),
				),
			).toBe(false);
		});
	});
}

/**
 * Shared compile-output regressions. These assert observable properties of
 * the generated code (not source-map structure) that every JSX target should
 * satisfy across whatever `transformElement` hook the platform wires in.
 * Vue should be excluded from running these
 *
 * @param {CompileHarness} harness
 */
export function runSharedCompileTests({ compile, name, classAttrName }) {
	runSharedComponentLoopControlFlowTests({ compile, name });
	runSharedNestedLazyDestructuringTests({ compile, name });

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

		it('preserves generic type arguments on JSX component tags', () => {
			const { code } = compile(
				`type User = { name: string };

				component RenderProp<Item>(props: { children: (item: Item) => any }) {}

				export component App() {
					<RenderProp<User>>
						{(item) => item.name}
					</RenderProp>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<RenderProp<User>>');
		});

		it('preserves generic type arguments on self-closing JSX component tags', () => {
			const { code } = compile(
				`component Box<T>({ value }: { value: T }) {
					<div>{String(value)}</div>
				}

				export component App() {
					<Box<string> value="hi" />
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Box<string>');
		});
	});

	describe(`[${name}] component try pending fallbacks`, () => {
		it('allows empty pending blocks as null fallbacks', () => {
			const { code } = compile(
				`export component App() {
					try {
						<div>{'content'}</div>
					} pending {}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('fallback={null}');
			expect(code).toContain("{'content'}");
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

		it('accepts indented direct double-quoted text children', () => {
			const { code } = compile(
				`export default component App() {
						<div>
							"Hello"
						</div>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('"Hello"');
			expect(code).not.toContain('"Hello";');
			expect(code).not.toContain('return null;');
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

		it('accepts direct double-quoted text in if-else branches', () => {
			const { code } = compile(
				`export component App() {
					if (false) {
						"Hello Ripple"
					} else "Hello React";
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"Hello Ripple"');
			expect(code).toContain('"Hello React"');
			expect(code).not.toContain('return null;');
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

		it('returns accumulated branch templates without an extra empty return', () => {
			const { code } = compile(
				`export component App() {
					if (x) {
						<div>{"hello world"}</div>
						return
					}

					<div>{"hello world 2"}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('hello world');
			expect(code).toContain('hello world 2');
			expect(code).not.toMatch(/return\s*;\s*return/);
			expect(code).not.toMatch(/return <div>\{"hello world"\}<\/div>;\s*return null;/);
		});
	});

	describe(`[${name}] style directive restrictions`, () => {
		it('rejects {style} inside element child expressions', () => {
			expect(() =>
				compile(
					`export component App() {
						<div>{style 'root'}</div>
						<style>
							.root { color: blue; }
						</style>
					}`,
					'App.tsrx',
				),
			).toThrow(/can only be used as an element attribute value/);
		});

		it('rejects {style} directly on DOM elements', () => {
			expect(() =>
				compile(
					`export component App() {
						<div class={style 'root'}>{'hi'}</div>
						<style>
							.root { color: blue; }
						</style>
					}`,
					'App.tsrx',
				),
			).toThrow(/cannot be used directly on DOM elements/);
		});

		it('does not parse the removed #style syntax', () => {
			expect(() =>
				compile(
					`export component App() {
						<Child cls={#style.root} />
						<style>
							.root { color: blue; }
						</style>
					}`,
					'App.tsrx',
				),
			).toThrow();
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

		it('rejects dynamic attribute names inside tsx blocks', () => {
			expect(() =>
				compile(
					`component Some(props) {}
					class Foo {
						bar() {
							const placeholder = 'value';
							return <tsx><Some @prop={placeholder} /></tsx>;
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/not attribute names/);
		});

		it('rejects dynamic element syntax inside tsx blocks', () => {
			expect(() =>
				compile(
					`class Foo {
						bar() {
							const tag = 'section';
							return <tsx><@tag id="x" /></tsx>;
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/only supported in native TSRX templates/);
		});

		it('rejects dynamic element syntax inside fragment shorthand values', () => {
			expect(() =>
				compile(
					`class Foo {
						bar() {
							const tag = 'section';
							return <><@tag id="x" /></>;
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/only supported in native TSRX templates/);
		});

		it('supports dynamic element syntax in native tsrx templates', () => {
			expect(() =>
				compile(
					`export component App() {
						const tag = 'section';
						<@tag id="x" />
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('supports dynamic element syntax in explicit tsrx templates', () => {
			expect(() =>
				compile(
					`class Foo {
						bar() {
							const tag = 'section';
							return <tsrx><@tag id="x" /></tsrx>;
						}
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('supports dynamic element syntax in direct tsrx children of tsx blocks', () => {
			expect(() =>
				compile(
					`class Foo {
						bar() {
							const tag = 'section';
							return <tsx><tsrx><@tag id="x" /></tsrx></tsx>;
						}
					}`,
					'App.tsrx',
				),
			).not.toThrow();
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

		it('parses text-only fragment initializers before template expression children', () => {
			const { code } = compile(
				`export component Button() {
					const x = <>Hello world</>

					{x}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('const x = <>Hello world</>;');
			expect(code).toContain('return x;');
		});

		it('parses backtick text inside fragments as JSX text', () => {
			const { code } = compile(
				`let a = component () {
					<>
						\`333\`
					</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('`333`');
		});

		it('parses backtick text around JSX elements inside fragments', () => {
			const { code } = compile(
				`let a = component () {
					<>
						\`
						<b></b>
						\`
					</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('`');
			expect(code).toContain('<b></b>');
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

		it('keeps special fragment returns inside component-local functions', () => {
			const compat_kind = name === 'solid' ? 'solid' : 'react';
			const { code } = compile(
				`export component App() {
					<div>"App"</div>
					function FragmentReturn() {
						return <><div>fragment</div></>;
					}
					function TsxReturn() {
						return <tsx><div>tsx</div></tsx>;
					}
					function TsrxReturn() {
						return <tsrx><div>"tsrx"</div></tsrx>;
					}
					function CompatReturn() {
						return <tsx:${compat_kind}><div>compat</div></tsx:${compat_kind}>;
					}
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('return;');
			expect(code).toMatch(/function FragmentReturn\(\) {\s+return <div/);
			expect(code).toMatch(/function TsxReturn\(\) {\s+return <div/);
			expect(code).toMatch(/function TsrxReturn\(\) {\s+return <div/);
			expect(code).toMatch(/function CompatReturn\(\) {\s+return <div/);
		});

		it('keeps special fragment returns inside component prop arrow functions', () => {
			const compat_kind = name === 'solid' ? 'solid' : 'react';
			const { code } = compile(
				`component Child(props) {}

				export component App() {
					<Child
						fragment={() => {
							return <><div>fragment</div></>;
						}}
						tsx={() => {
							return <tsx><div>tsx</div></tsx>;
						}}
						tsrx={() => {
							return <tsrx><div>"tsrx"</div></tsrx>;
						}}
						compat={() => {
							return <tsx:${compat_kind}><div>compat</div></tsx:${compat_kind}>;
						}}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('return;');
			expect(code).toMatch(/fragment=\{\(\) => \{\s+return <div/);
			expect(code).toMatch(/tsx=\{\(\) => \{\s+return <div/);
			expect(code).toMatch(/tsrx=\{\(\) => \{\s+return <div/);
			expect(code).toMatch(/compat=\{\(\) => \{\s+return <div/);
		});

		it('parses semicolon-less native TSRX returns in component prop arrow functions', () => {
			const { code } = compile(
				`component Card(props) {}

				component App() {
					<Card
						children={() => {
							return <tsrx>
								<div>"Hello, World!"</div>
							</tsrx>
						}}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('<tsrx>');
			expect(code).toContain('Hello, World!');
		});

		it('keeps expression child arrays in fragment, tsx, and compat callback props', () => {
			const compat_kind = name === 'solid' ? 'solid' : 'react';
			const { code } = compile(
				`component Child(props) {}

				export component App() {
					<Child
						fragment={() => <>{[<>Delete</>, <>Edit</>]}</>}
						tsx={() => <tsx>{[<>Delete</>, <>Edit</>]}</tsx>}
						compat={() => <tsx:${compat_kind}>{[<>Delete</>, <>Edit</>]}</tsx:${compat_kind}>}
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
	});

	describe(`[${name}] <tsrx> template fragments`, () => {
		it('lowers native TSRX template text in expression position', () => {
			const { code } = compile(
				`class Foo { bar() { return <tsrx><div>"Hello"</div></tsrx>; } }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Hello"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('parses compact native TSRX templates before a trailing newline at EOF', () => {
			const { code } = compile(
				[
					`export component App() {`,
					`\tconst title = <tsrx><h1>"Hello There"</h1>{Test(1, 2)}</tsrx>;`,
					`\t{title}`,
					`}`,
					``,
					`function Test(p1, p2) {`,
					`\treturn <tsrx><div>"Hello"</div><div>{p1}</div><div>{p2}</div></tsrx>;`,
					`}`,
					``,
				].join('\n'),
				'App.tsrx',
			);

			expect(code).toContain('{"Hello"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('preserves statements before template output', () => {
			const { code } = compile(
				`class Foo { bar() { return <tsrx>const label = 'Hi'; <div>{label}</div></tsrx>; } }`,
				'App.tsrx',
			);

			expect(code).toContain("const label = 'Hi';");
			expect(code).toContain('{label}');
			expect(code).not.toContain('<tsrx>');
		});

		it('supports control flow inside native template fragments', () => {
			const { code } = compile(
				`class Foo { bar() { return <tsrx>if (true) { <div>"yes"</div> }</tsrx>; } }`,
				'App.tsrx',
			);

			expect(code).toContain('true');
			expect(code).toContain('{"yes"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments in component JSX attribute values', () => {
			const { code } = compile(
				`component App() { <Card content={<tsrx><span>"Title"</span></tsrx>} /> }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Title"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers statement-bodied native TSRX templates in self-closing component attributes', () => {
			const { code } = compile(
				`component App() {
					<Card
						content={<tsrx>
							if (foo) {
								<div>
									if (foo > 1) {}
								</div>
							}
						</tsrx>}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('foo');
			expect(code).toContain('<Card');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments in JSX attribute values', () => {
			const { code } = compile(
				`class Foo { bar() { return <Card content={<tsrx><span>"Title"</span></tsrx>} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Title"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments parenthesized in JSX attribute values', () => {
			const { code } = compile(
				`class Foo { bar() { return <Card content={(<tsrx><span>"Title"</span></tsrx>)} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Title"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments passed to calls in JSX attribute values', () => {
			const { code } = compile(
				`class Foo { bar() { return <Card content={wrap(<tsrx><span>"Title"</span></tsrx>)} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Title"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments in object property JSX attribute values', () => {
			const { code } = compile(
				`class Foo { bar() { return <Card content={{ child: <tsrx><span>"Title"</span></tsrx> }} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Title"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments returned from render callback props', () => {
			const { code } = compile(
				`class Foo { bar() { return <List render={() => { return <tsrx><span>"Item"</span></tsrx>; }} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('{"Item"}');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments returned from callback props without semicolons', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <tsrx>
									<span>{item.name}</span>
								</tsrx>
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('item.name');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments in returned object props without semicolons', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return {
									child: <tsrx>
										<span>{item.name}</span>
									</tsrx>
								}
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('item.name');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX template fragments in nested render props without trailing commas', () => {
			const cases = [
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: () => <tsrx>
										<div>"nested"</div>
									</tsrx>
								}
							}}
						/>
					}
				}`,
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: () => <tsrx>
										<div>"nested trailing comma"</div>
									</tsrx>,
								},
							}}
						/>
					}
				}`,
			];

			for (const source of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain('nested');
				expect(code).not.toContain('<tsrx>');
			}
		});

		it('lowers native TSRX template fragments in top-level render props', () => {
			const cases = [
				[
					`class Foo {
					bar() {
						return <Page
							params={{
								render: () => <tsrx>
									<div>"top"</div>
								</tsrx>,
							}}
						/>
					}
				}`,
					'top',
				],
				[
					`class Foo {
					bar() {
						return <Page
							params={{
								render: (icon: () => JSX.Element) => <tsrx>
									<div>"typed top"</div>
								</tsrx>,
							}}
						/>
					}
				}`,
					'typed top',
				],
				[
					`class Foo {
					bar() {
						return <Page
							params={{
								render: () => <tsrx>
									return [<>View</>];
								</tsrx>,
							}}
						/>
					}
				}`,
					'View',
				],
			];

			for (const [source, expected] of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain(expected);
				expect(code).not.toContain('<tsrx>');
			}
		});

		it('preserves JSX parser state across comments after semicolon-free TSRX returns', () => {
			const cases = [
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <tsrx>
									<span>{item.name}</span>
								</tsrx> /* block comment */
							}}
						/>
					}
				}`,
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <tsrx>
									<span>{item.name}</span>
								</tsrx> // line comment
							}}
						/>
					}
				}`,
			];

			for (const source of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain('item.name');
				expect(code).not.toContain('<tsrx>');
			}
		});

		it('lowers native TSRX template fragments from typed nested render props', () => {
			const cases = [
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: (icon: () => JSX.Element) => <tsrx>
										<div>"typed"</div>
									</tsrx>,
								},
							}}
						/>
					}
				}`,
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: (tag: string, className: string, icon: () => JSX.Element) => <tsrx>
										<div>"typed trailing comma"</div>
									</tsrx>,
								},
							}}
						/>
					}
				}`,
			];

			for (const source of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain('typed');
				expect(code).not.toContain('<tsrx>');
			}
		});

		it('lowers dynamic native TSRX tags from typed nested render props', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: (tag: string, className: string, icon: () => JSX.Element) => <tsrx>
										<@tag class={\`\${className}\${icon ? 'has-icon' : ''}\`}>
											if (icon) {
												icon();
											}
										</@tag>
									</tsrx>,
								},
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('className');
			expect(code).toContain('has-icon');
			expect(code).toContain('icon()');
			expect(code).not.toContain('<tsrx>');
		});

		it('lowers native TSRX templates in complex nested params objects', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <Page
							params={{
								title: 'Welcome',
								header: {
									class: 'foo',
									children: <><h1>Big things are coming!</h1></>,
								},
								content: <><p>Lorem ipsum...</p></>,
								menuItems: [
									<><span>Copy</span></>,
									<><span>Cut</span></>,
									<><span>Delete</span></>,
								],
								menuAlt: (isAdmin) => <tsrx>
									if (isAdmin) {
										return [<>Delete</>, <>Edit</>];
									} else {
										return [<>View</>];
									}
								</tsrx>,
								details: {
									label: {
										class: 'custom',
										children: [<>Shipping & returns</>],
									},
									leadingIcon: { children: <>icon</> },
								},
								details2: {
									render: (tag: string, className: string, icon: () => JSX.Element) => <tsrx>
										<@tag class={\`\${className}\${icon ? 'has-icon' : ''}\`}>
											if (icon) {
												icon();
											}
										</@tag>
									</tsrx>,
								},
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('Welcome');
			expect(code).toContain('isAdmin');
			expect(code).toContain('className');
			expect(code).toContain('has-icon');
			expect(code).not.toContain('<tsrx>');
		});

		it('parses fragment arrays as object property values inside JSX attribute objects', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <Page
							params={{
								menuItems: [
									<><span>Copy</span></>,
									<><span>Cut</span></>,
									<><span>Delete</span></>,
								],
								details: {
									label: {
										children: [<>Shipping & returns</>],
									},
								},
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('Copy');
			expect(code).toContain('Cut');
			expect(code).toContain('Delete');
			expect(code).toContain('Shipping');
		});

		it('expression statement inside a JS function body nested in a JSX attribute', () => {
			const { code } = compile(
				`component App() {
					<Page params={{
						f: () => {
							<tsrx>
								<div>"x"</div>
							</tsrx>
						},
					}} />
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<div');
			expect(code).toContain('"x"');
			expect(code).not.toContain('<tsrx>');
			expect(code).not.toContain('return null;');
		});

		it('parses native TSRX statements before later JS statements in JSX attribute callbacks', () => {
			const { code } = compile(
				`component App() {
					<Page params={{
						menuAlt: (isAdmin) => {
							const items = [];
							<tsrx>
								if (isAdmin) {
									items.push(<>Delete</>, <>Edit</>);
								} else {
									items.push(<>View</>);
								}
							</tsrx>
							return items;
						},
					}} />
				}`,
				'App.tsrx',
			);

			expect(code).toContain('isAdmin');
			expect(code).toContain('return items');
			expect(code).toContain('Delete');
			expect(code).toContain('View');
			expect(code).not.toContain('<tsrx>');
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

		it('skips the null-coerce ternary for direct double-quoted text children', () => {
			// `"hello"` is statically known to be a non-null string, so the
			// `expr == null ? '' : expr + ''` wrapper is dead weight.
			const { code } = compile(
				`export component App() {
					<b>"hello"</b>
				}`,
				'App.tsrx',
			);
			expect(code).not.toContain('== null');
			expect(code).not.toContain("+ ''");
		});

		it('skips the null-coerce ternary for {text expr} when expr is a static string', () => {
			// String literals and zero-interpolation template literals are
			// statically known to be non-null strings, so the runtime
			// coercion in `{text ...}` is a provable no-op.
			const { code } = compile(
				`export component App() {
					<b>{text 'hello'}</b>
					<i>{text \`world\`}</i>
				}`,
				'App.tsrx',
			);
			expect(code).not.toContain('== null');
			expect(code).not.toContain("+ ''");
		});

		it('keeps the ternary for {text expr} when expr is an identifier', () => {
			const { code } = compile(
				`export component App({ name }: { name: string | null }) {
					<b>{text name}</b>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("name == null ? '' : name + ''");
		});

		it.runIf(name === 'solid')(
			`[${name}] returns inline JSX for {'hello'} {text 'hello'} sibling combo`,
			() => {
				// Solid emits the JSX directly in `return` — no static
				// hoisting like React/Preact — and both child forms collapse
				// to the same `{'hello'}` after the static-string optimization.
				const { code } = compile(
					`export component App() {
						<b>{'hello'} {text 'hello'}</b>
					}`,
					'App.tsrx',
				);
				expect(code).toContain("return <b>{'hello'}{'hello'}</b>");
				expect(code).not.toContain('App__static');
				expect(code).not.toContain('== null');
			},
		);

		it.runIf(['react', 'preact'].includes(name))(
			`[${name}] hoists {'hello'} {text 'hello'} sibling combo to a static`,
			() => {
				// React/Preact hoist child-free static JSX to a module-level
				// constant so the element identity is stable across renders.
				// Both child forms collapse to `{'hello'}` after the
				// static-string optimization, leaving the element fully
				// static and eligible for hoisting.
				const { code } = compile(
					`export component App() {
						<b>{'hello'} {text 'hello'}</b>
					}`,
					'App.tsrx',
				);
				expect(code).toContain("const App__static1 = <b>{'hello'}{'hello'}</b>");
				expect(code).toContain('return App__static1');
				expect(code).not.toContain('== null');
			},
		);
	});

	describe(`[${name}] {html expr} raw HTML`, () => {
		const sole_child_pattern = /sole child of an element/;
		const html_attribute_value_pattern = /not supported as an attribute value/;

		it('lowers sole host child {html expr} to the native html prop', () => {
			const { code } = compile(
				`export component App({ markup }: { markup: string }) {
						<article>{html markup}</article>
					}`,
				'App.tsrx',
			);

			if (name === 'react' || name === 'preact') {
				expect(code).toContain('dangerouslySetInnerHTML={{ __html: markup }}');
			} else {
				expect(code).toContain('innerHTML={markup}');
			}
			expect(code).not.toContain('{html markup}');
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
			).toThrow(sole_child_pattern);
		});

		it('rejects child {html expr} on component elements', () => {
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						<Child>{html markup}</Child>
					}`,
					'App.tsrx',
				),
			).toThrow(sole_child_pattern);
		});

		it('rejects child {html expr} when mixed with sibling children', () => {
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						<article>{html markup}<span>{'tail'}</span></article>
					}`,
					'App.tsrx',
				),
			).toThrow(sole_child_pattern);
		});

		it('rejects target-native html content attribute conflicts', () => {
			const conflicting_attribute =
				name === 'react' || name === 'preact'
					? 'dangerouslySetInnerHTML={{ __html: other }}'
					: 'innerHTML={other}';

			expect(() =>
				compile(
					`export component App({ markup, other }: { markup: string; other: string }) {
						<article ${conflicting_attribute}>{html markup}</article>
					}`,
					'App.tsrx',
				),
			).toThrow(/lowers to/);
		});

		it('allows html content attributes that are unrelated on the current target', () => {
			const unrelated_attribute =
				name === 'solid'
					? 'dangerouslySetInnerHTML={{ __html: other }}'
					: name === 'vue'
						? 'textContent={other}'
						: 'innerHTML={other}';

			expect(() =>
				compile(
					`export component App({ markup, other }: { markup: string; other: string }) {
						<article ${unrelated_attribute}>{html markup}</article>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('allows spread attributes with child {html expr}', () => {
			expect(() =>
				compile(
					`export component App({ markup, props }: { markup: string; props: Record<string, unknown> }) {
						<article {...props}>{html markup}</article>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('rejects anonymous host {html expr} attributes', () => {
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						<article {html markup} />
					}`,
					'App.tsrx',
				),
			).toThrow(html_attribute_value_pattern);
		});

		it('rejects named component html props', () => {
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						<Child body={html markup} />
					}`,
					'App.tsrx',
				),
			).toThrow(html_attribute_value_pattern);
		});

		it('rejects anonymous component html props', () => {
			expect(() =>
				compile(
					`export component App({ markup }: { markup: string }) {
						<Child {html markup} />
					}`,
					'App.tsrx',
				),
			).toThrow(html_attribute_value_pattern);
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
			const { code, css, cssHash } = compile(
				`export component App() {
					<div>{'Hello world'}</div>

					<style>
						.div { color: red; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			expect(code).toContain("{'Hello world'}");
			expect(code).toContain(`${classAttrName}="${cssHash}"`);
			expect(css).toContain(`.div.${cssHash}`);
			expect(css).toContain('color: red;');
		});

		it('applies the scope hash inside a <tsx> block', () => {
			const { code, css, cssHash } = compile(
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

			expect(css).not.toBe('');
			expect(count_substring(code, `${classAttrName}="card ${cssHash}"`)).toBe(2);
		});

		it('applies the scope hash inside fragment shorthand', () => {
			const { code, css, cssHash } = compile(
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

			expect(css).not.toBe('');
			expect(count_substring(code, `${classAttrName}="card ${cssHash}"`)).toBe(2);
		});

		it('does not apply scoped css hashes to composite components', () => {
			const { code, css, cssHash } = compile(
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

			expect(css).not.toBe('');
			expect(code).toContain(`<div ${classAttrName}="${cssHash}">{'Styled content'}</div>`);
			expect(code).not.toMatch(/<Child\s+class(Name)?="/);
		});

		it('passes {style} through a composite component prop', () => {
			// `className` here is a prop on a composite component, not a DOM
			// attribute — every target passes prop names through unchanged,
			// so the assertion is cross-platform regardless of the host-
			// element class attribute shape.
			const { code, css, cssHash } = compile(
				`component Badge({ className }: { className?: string }) {
					<span class={['badge', className ?? '']}>{'New'}</span>

					<style>
						.badge { padding: 0.25rem 0.5rem; }
					</style>
				}

				export component App() {
					<Badge className={style 'highlight'} />

					<style>
						.highlight { background: green; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			const app_hash = cssHash.split(' ').find((h) => code.includes(`${h} highlight`));
			expect(app_hash).toBeTruthy();
			expect(code).toMatch(new RegExp(`className=["']${app_hash} highlight["']`));
		});

		it('passes {style} through a composite component prop when the element has children', () => {
			const { code, css, cssHash } = compile(
				`component Child({ className }: { className?: string }) {
						<span class={className}>"hello world"</span>
					}

					export component App() {
						<Child className={style 'container'}>"hello world"</Child>

						<style>
							.container { color: red; }
						</style>
					}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			const app_hash = cssHash.split(' ').find((h) => code.includes(`${h} container`));
			expect(app_hash).toBeTruthy();
			expect(code).toMatch(new RegExp(`className=["']${app_hash} container["']`));
		});

		it('passes hyphenated {style} class names through a composite component prop', () => {
			const { code, css, cssHash } = compile(
				`export component App() {
						<Child cls={style 'accent-tone'} />

					<style>
						.accent-tone { color: red; }
					</style>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			expect(code).toContain('accent-tone');
		});
	});

	describe.runIf(['react', 'preact'].includes(name))(`[${name}] hook isolation constraints`, () => {
		it('extracts hooks in expression-position <tsrx> into stable helper components', () => {
			const { code } = compile(
				`import { useEffect } from '${name === 'preact' ? 'preact/hooks' : 'react'}';
						function App({ active }: { active: boolean }) {
							if (!active) return null;

							return <tsrx>
								useEffect(() => {
									console.log(active);
								}, [active]);
								<span>{active ? 'active' : 'inactive'}</span>
							</tsrx>;
						}`,
				'App.tsrx',
			);

			expect(code).toContain('useEffect(');
			expect(code).toContain('active={active}');
			expect(code).not.toContain('<tsrx>');
			if (name === 'react') {
				expect(code.indexOf('function App__StatementBodyHook1')).toBeLessThan(
					code.indexOf('function App('),
				);
			} else {
				expect(code).toContain('let App__StatementBodyHook1;');
				expect(code).toContain('App__StatementBodyHook1 ??');
			}
		});

		it('allows hook results that stay local to an extracted branch', () => {
			const { code } = compile(
				`export component App({ show }: { show: boolean }) {
							if (show) {
								const [x] = useState(100);
								<div>{x}</div>
							}
							<span>{'after'}</span>
						}`,
				'App.tsrx',
			);

			expect(code).toContain('useState(100)');
			expect(code).toContain('StatementBodyHook');
			expect(code).toContain('after');
		});

		it('allows conditional hook callbacks to read outer bindings', () => {
			const { code } = compile(
				`export component App({ show, value }: { show: boolean; value: string }) {
							const label = value.trim();
							if (show) {
								useEffect(() => {
									console.log(label);
								}, [label]);
								<span>{label}</span>
							}
						}`,
				'App.tsrx',
			);

			expect(code).toContain('useEffect(');
			expect(code).toContain('label={label}');
			expect(code).toContain('StatementBodyHook');
		});

		it('allows conditional hook callbacks to mutate branch-local bindings', () => {
			const { code } = compile(
				`export component App({ show, value }: { show: boolean; value: string }) {
							if (show) {
								let latest: string | undefined;
								useEffect(() => {
									latest = value;
								}, [value]);
								<span>{value}</span>
							}
						}`,
				'App.tsrx',
			);

			expect(code).toContain('latest = value');
			expect(code).toContain('StatementBodyHook');
		});

		it('allows conditional hook callbacks to mutate module-level bindings', () => {
			const { code } = compile(
				`let effectCount = 0;

						export component App({ show }: { show: boolean }) {
							if (show) {
								useEffect(() => {
									effectCount++;
								}, []);
								<span>{effectCount}</span>
							}
						}`,
				'App.tsrx',
			);

			expect(code).toContain('effectCount++');
			expect(code).toContain('StatementBodyHook');
		});

		it('rejects conditional hook callbacks that assign to parent-scope bindings', () => {
			expect(() =>
				compile(
					`export component App({ show, value }: { show: boolean; value: string }) {
								let latest: string | undefined;
								if (show) {
									useEffect(() => {
										latest = value;
									}, [value]);
									<span>{value}</span>
								}
								console.log(latest);
							}`,
					'App.tsrx',
				),
			).toThrow(/useEffect callback mutates `latest`/);
		});

		it('rejects conditional hook cleanup callbacks that mutate parent-scope bindings', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let cleanupCount = 0;
								if (show) {
									useEffect(() => {
										return () => {
											cleanupCount++;
										};
									}, []);
									<span>{'visible'}</span>
								}
							}`,
					'App.tsrx',
				),
			).toThrow(/useEffect callback mutates `cleanupCount`/);
		});

		it('rejects assigning hook results to bindings outside an extracted if branch', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let x: number | undefined;
								if (show) {
									[x] = useState(100);
									<div>{x}</div>
								}
								console.log(x);
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `x`/);
		});

		it('rejects assigning hook-derived values to bindings outside an extracted branch', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let x: number | undefined;
								if (show) {
									const [state] = useState(100);
									x = state;
									<div>{state}</div>
								}
								console.log(x);
							}`,
					'App.tsrx',
				),
			).toThrow(/hook result is assigned to `x`/);
		});

		it('rejects compound assigning hook results to bindings outside an extracted branch', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let total = 0;
								if (show) {
									total += useCustomNumber();
									<div>{total}</div>
								}
								console.log(total);
							}`,
					'App.tsrx',
				),
			).toThrow(/useCustomNumber result is assigned to `total`/);
		});

		it('rejects compound assigning hook-derived locals to bindings outside an extracted branch', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let total = 0;
								if (show) {
									const delta = useCustomNumber();
									total += delta;
									<div>{total}</div>
								}
								console.log(total);
							}`,
					'App.tsrx',
				),
			).toThrow(/hook result is assigned to `total`/);
		});

		it('rejects hook-result assignments nested inside assignment targets', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let key = 0;
								const values: Record<number, string> = {};
								if (show) {
									values[key = useCustomNumber()] = 'active';
									<div>{values[key]}</div>
								}
							}`,
					'App.tsrx',
				),
			).toThrow(/useCustomNumber result is assigned to `key`/);
		});

		it('rejects assigning hook results to outer bindings inside <tsrx> expressions', () => {
			expect(() =>
				compile(
					`function App({ show }: { show: boolean }) {
								let x: number | undefined;
								return <tsrx>
									if (show) {
										[x] = useState(100);
										<div>{x}</div>
									}
								</tsrx>;
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `x`/);
		});
	});

	describe.runIf(['react', 'preact'].includes(name))(
		`[${name}] hook isolation outer binding diagnostics`,
		() => {
			it('rejects assigning hook results to outer bindings inside switch cases', () => {
				expect(() =>
					compile(
						`export component App({ kind }: { kind: 'a' | 'b' }) {
								let x: number | undefined;
								switch (kind) {
									case 'a':
										[x] = useState(100);
										<div>{x}</div>
										break;
									case 'b':
										<span>{'b'}</span>
										break;
								}
								console.log(x);
							}`,
						'App.tsrx',
					),
				).toThrow(/useState result is assigned to `x`/);
			});

			it('allows switch case hook results that stay local', () => {
				const { code } = compile(
					`export component App({ kind }: { kind: 'a' | 'b' }) {
							switch (kind) {
								case 'a':
									const [x] = useState(100);
									<div>{x}</div>
									break;
								case 'b':
									<span>{'b'}</span>
									break;
							}
						}`,
					'App.tsrx',
				);

				expect(code).toContain('useState(100)');
				expect(code).toContain('StatementBodyHook');
			});
		},
	);

	describe.runIf(['react', 'preact'].includes(name))(`[${name}] hook isolation in loops`, () => {
		it('rejects assigning hook results to outer bindings inside for-of bodies', () => {
			expect(() =>
				compile(
					`export component App({ items }: { items: number[] }) {
								let last: number | undefined;
								for (const item of items; index i) {
									[last] = useState(item);
									<div key={i}>{last}</div>
								}
								console.log(last);
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `last`/);
		});

		it('rejects hook results assigned to an outer binding after a for-of with a same-named const declaration', () => {
			expect(() =>
				compile(
					`export component App({ show, items }: { show: boolean; items: number[] }) {
								let x: number | undefined;
								if (show) {
									for (const x of items) {
										<div key={x}>{x}</div>
									}
									[x] = useState(0);
								}
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `x`/);
		});

		it('allows hook usage inside a for-of body whose let-declared loop var shadows an outer binding', () => {
			const { code } = compile(
				`export component App({ show, items }: { show: boolean; items: number[] }) {
							let x: number | undefined;
							if (show) {
								for (let x of items) {
									const [val] = useState(x);
									<div key={x}>{val}</div>
								}
							}
						}`,
				'App.tsrx',
			);
			expect(code).toContain('useState(x)');
			expect(code).toContain('StatementBodyHook');
		});

		it('rejects for-of whose hook iterable is bound into an outer identifier', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let x: number | undefined;
								if (show) {
									for (x of useState(0)) {
										<div>{x}</div>
									}
								}
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `x`/);
		});

		it('rejects for-of whose hook iterable is bound into an outer destructuring target', () => {
			expect(() =>
				compile(
					`export component App({ show }: { show: boolean }) {
								let a: number | undefined;
								let b: number | undefined;
								if (show) {
									for ([a, b] of [useState(0)]) {
										<div>{a}{b}</div>
									}
								}
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `a`, `b`/);
		});

		it('rejects hook results assigned to a for-of assignment-target outer binding', () => {
			expect(() =>
				compile(
					`export component App({ show, items }: { show: boolean; items: number[] }) {
								let x: number | undefined;
								if (show) {
									for (x of items) {
										console.log(x);
									}
									[x] = useState(0);
									<div>{x}</div>
								}
							}`,
					'App.tsrx',
				),
			).toThrow(/useState result is assigned to `x`/);
		});

		it('still extracts hook-bearing for-of bodies when hook results stay local', () => {
			const { code } = compile(
				`export component App({ items }: { items: string[] }) {
							for (const name of items) {
								const [val] = useState(name);
								<div key={name}>{val}</div>
							}
						}`,
				'App.tsrx',
			);

			expect(code).toContain('useState(name)');
			expect(code).toContain('StatementBodyHook');
			expect(code).toContain('__map_iterable(');
		});

		it('falls back to the existing transform for non-hook for-of loops', () => {
			const { code } = compile(
				`export component App({ items }: { items: number[] }) {
							for (const item of items; index i) {
								<div key={i}>{item}</div>
							}
						}`,
				'App.tsrx',
			);

			expect(code).not.toContain('StatementBodyHook');
			expect(code).toContain('__map_iterable(items, (item, i)');
		});
	});

	describe.runIf(['react', 'preact'].includes(name))(
		`[${name}] hook isolation in try blocks`,
		() => {
			it('rejects assigning hook results to outer bindings inside try bodies', () => {
				expect(() =>
					compile(
						`export component App({ load }: { load: () => number }) {
								let data: number | undefined;
								try {
									[data] = useState(load());
									<div>{data}</div>
								} catch (err) {
									<div>{'error'}</div>
								}
								console.log(data);
							}`,
						'App.tsrx',
					),
				).toThrow(/useState result is assigned to `data`/);
			});

			it('rejects assigning hook results to outer bindings inside catch bodies', () => {
				expect(() =>
					compile(
						`export component App({ load }: { load: () => number }) {
								let attempt: number | undefined;
								try {
									<div>{load()}</div>
								} catch (err) {
									[attempt] = useState(0);
									<div>{attempt}</div>
								}
								console.log(attempt);
							}`,
						'App.tsrx',
					),
				).toThrow(/useState result is assigned to `attempt`/);
			});

			it('allows try-body hook results that stay local', () => {
				const { code } = compile(
					`export component App({ load }: { load: () => number }) {
							try {
								const [data] = useState(load());
								<div>{data}</div>
							} catch (err) {
								<div>{'error'}</div>
							}
						}`,
					'App.tsrx',
				);

				expect(code).toContain('useState(load())');
				expect(code).toContain('StatementBodyHook');
			});

			it('try without hooks falls back to the existing transform', () => {
				const { code } = compile(
					`export component App({ load }: { load: () => number }) {
							try {
								<div>{load()}</div>
							} catch (err) {
								<div>{'error'}</div>
							}
						}`,
					'App.tsrx',
				);

				expect(code).not.toContain('StatementBodyHook');
				expect(code).toContain('TsrxErrorBoundary');
			});
		},
	);
}
