import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_CODES } from '../../src/diagnostics.js';

/**
 * @typedef {{
 *   compile: (source: string, filename?: string, options?: any) => { code: string, css: string, cssHash: string | null, errors: Array<{ message: string, code?: string }> },
 *   name: string,
 *   classAttrName: 'class' | 'className',
 *   generatedClassAttrName?: 'class' | 'className',
 * }} CompileHarness
 *
 * @typedef {{
 *   compile_to_volar_mappings: (source: string, filename?: string, options?: any) => { code: string, errors: Array<{ code?: string }> },
 *   name: string,
 * }} CompileDiagnosticsHarness
 *
 * `classAttrName`: the authored DOM-element class attribute shape the platform emits.
 * `generatedClassAttrName`: the class attribute shape the platform uses when
 * injecting scoped CSS hashes.
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

const TSRX_TEMPLATE_RETURN_ERROR =
	'Return statements are not allowed inside TSRX templates. Move the return before the TSRX return value, or use conditional rendering instead.';
const TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR =
	"This function body contains TSRX template output, but it is a normal JavaScript block. Add '@' before the opening brace to use a TSRX statement container.";

/**
 * Shared compile/editor diagnostics. These do not assert source-map structure;
 * they only verify that editor-facing compile entry points collect diagnostics.
 *
 * @param {CompileDiagnosticsHarness} harness
 */
export function runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name }) {
	describe(`[${name}] compile diagnostics`, () => {
		it('keeps callback returns around JSX values clean in type-only output', () => {
			const result = compile_to_volar_mappings(
				`function Test() @{
					<Page
						params={{
							menuAlt: (isAdmin) => {
								if (isAdmin) {
									return [<>Delete</>, <>Edit</>];
								}
							},
							bySwitch: (role) => {
								switch (role) {
									case 'admin':
										return [<>Edit</>];
									default:
										return [<>View</>];
								}
							},
						}}
					/>
				}`,
				'App.tsrx',
				{ loose: true },
			);

			expect(result.errors).toEqual([]);
			expect(result.code).toContain('return [<>Delete</>, <>Edit</>];');
			expect(result.code).toContain('return [<>View</>];');
			expect(result.code).toContain('bySwitch: (role) => {');
		});

		it('reports function bodies that look like forgotten statement containers', () => {
			const result = compile_to_volar_mappings(
				`export function UserBadge({ user }: UserBadgeProps): JSX.Element {
					if (!user) {
						return <span class="muted">Signed out</span>;
					}

					const initials = user.name.slice(0, 2).toUpperCase();

					<button title={user.name}>{initials}</button>
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER);
			expect(result.errors.map((error) => error.message)).toContain(
				TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR,
			);
		});

		it('reports arrow function bodies that look like forgotten statement containers', () => {
			const result = compile_to_volar_mappings(
				`const UserBadge = ({ user }: UserBadgeProps): JSX.Element => {
					const initials = user.name.slice(0, 2).toUpperCase();

					<button title={user.name}>{initials}</button>
				};`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER);
		});

		it('does not report forgotten statement containers when setup follows template output', () => {
			const result = compile_to_volar_mappings(
				`export function UserBadge({ user }: UserBadgeProps): JSX.Element {
					<span>{user.name}</span>;

					const initials = user.name.slice(0, 2).toUpperCase();
					console.log(initials);
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).not.toContain(
				DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER,
			);
		});

		it('does not report ordinary returned JSX', () => {
			const result = compile_to_volar_mappings(
				`export function UserBadge({ user }: UserBadgeProps): JSX.Element {
					return <span>{user.name}</span>;
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).not.toContain(
				DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER,
			);
		});

		it('does not report explicit nested statement containers in ordinary function bodies', () => {
			const result = compile_to_volar_mappings(
				`export function UserBadge({ user }: UserBadgeProps): JSX.Element {
					const badge = @{
						const initials = user.name.slice(0, 2).toUpperCase();

						<button title={user.name}>{initials}</button>
					};

					return badge;
				}`,
				'App.tsrx',
			);

			expect(diagnostic_codes(result)).not.toContain(
				DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER,
			);
		});

		it('allows return statements in localized setup before a template fence', () => {
			const result = compile_to_volar_mappings(
				`function Test() @{
					if (ready) {
						return;
					}

					<div>{'ready'}</div>
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
		});

		it('allows return statements in arrow function statement-container bodies', () => {
			const result = compile_to_volar_mappings(
				`const Test = () => @{
					if (ready) {
						return <div>{'early'}</div>;
					}

					<div>{'ready'}</div>
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
		});

		it('rejects return statements in expression-position statement containers', () => {
			for (const source of [
				`function Test() {
					return @{
						if (ready) {
							return <div>{'early'}</div>;
						}

						<div>{'ready'}</div>
					};
				}`,
				`function Test() @{
					const content = @{
						if (ready) {
							return <div>{'early'}</div>;
						}

						<div>{'ready'}</div>
					};

					<section>{content}</section>
				}`,
				`function Test() @{
					<section>@{
						if (ready) {
							return <div>{'early'}</div>;
						}

						<div>{'ready'}</div>
					}</section>
				}`,
			]) {
				const result = compile_to_volar_mappings(source, 'App.tsrx');

				expect(result.errors.map((error) => error.message)).toContain(TSRX_TEMPLATE_RETURN_ERROR);
			}
		});

		it('allows return statements inside nested ordinary functions in statement containers', () => {
			const result = compile_to_volar_mappings(
				`function Test() @{
					<section>@{
						function render() {
							return <div>{'nested'}</div>;
						}

						<div>{render()}</div>
					}</section>
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
		});

		it('parses JSX callback returns in JSX props without semicolons', () => {
			const result = compile_to_volar_mappings(
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <>
									<span>{item.name}</span>
								</>
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
			expect(result.code).toContain('item.name');
		});

		it('reports semicolon-terminated template expression containers', () => {
			const result = compile_to_volar_mappings(
				`function App() @{
					<div>{
						renderThing();
					}</div>
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

		it('allows html identifiers as ordinary attribute values', () => {
			const result = compile_to_volar_mappings(
				`function Child(_: { body: string }) { return null; }
				function App() @{
					const html = '<strong>safe</strong>';

					<Child body={html} />
				}`,
				'App.tsrx',
			);

			expect(result.errors).toEqual([]);
			expect(result.code).toContain('body={html}');
		});
	});
}

/**
 * @param {CompileHarness} harness
 */
export function runSharedTsxExpressionTsrxTests({ compile, name, classAttrName }) {
	describe(`[${name}] JSX fragments inside expression values`, () => {
		it('preserves nested JSX fragments inside regular function TSX props', () => {
			const { code } = compile(
				`function App3() @{
						<PlainTextPlugin
							ErrorBoundary={LexicalErrorBoundary}
							contentEditable={<>
								<ContentEditable
									aria-placeholder={placeholder}
									class={classes.contentEditable}
									placeholder={<>
										<div class={classes.placeholder}>{placeholder}</div>
									</>}
								/>
							</>}
							placeholder={<>
								<div class={classes.placeholder}>{placeholder}</div>
							</>}
						/>
					}`,
				'App.tsrx',
			);
			expect(code).toContain('contentEditable={<>');
			expect(code).toContain('<ContentEditable');
			expect(code).toContain(` ${classAttrName}={classes.contentEditable}`);
			expect(code).toContain(`placeholder={<>`);
			expect(code).toContain(`<div ${classAttrName}={classes.placeholder}>`);
		});

		it('allows shorthand attributes in JSX fragment values', () => {
			const { code } = compile(
				`export function Test(props) @{
						<List
							items={props.items}
							renderItem={(item) =>
								<>
									<ItemView {item} onSelect={props.onSelect}>
										Selected
									</ItemView>
								</>
							}
						/>
					}`,
				'App.tsrx',
			);
			expect(code).toContain('item={item}');
			expect(code).toContain('onSelect={props.onSelect}');
			expect(code).toContain('Selected');
		});

		it('preserves JSX-style returns in regular functions declared inside TSRX bodies', () => {
			const { code } = compile(
				`function App() @{
					function renderChild() @{
							<span class="nested-return">{'ok'}</span>
						}

					<>
						{renderChild()}
					</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function renderChild()');
			expect(code).toContain('nested-return');
			expect(code).not.toContain('return;\n');
		});
	});

	describe(`[${name}] control flow in expression position`, () => {
		it('lowers @switch assigned to a variable', () => {
			const { code } = compile(
				`function App({ status }: { status: string }) {
						const view = @switch (status) {
							@case 'loading': { <p>Loading...</p> }
							@default: { <p>Unknown status.</p> }
						};
						return view;
					}`,
				'App.tsrx',
			);
			expect(code).toContain('Loading...');
			expect(code).toContain('Unknown status.');
			expect(code).not.toContain('@switch');
			expect(code).not.toContain('JSXSwitchExpression');
		});

		it('lowers @switch in an expression-bodied arrow output', () => {
			const { code } = compile(
				`const StatusMessage = ({ status }: { status: string }) => @switch (status) {
						@case 'loading': { <p>Loading...</p> }
						@case 'success': { <p>Done!</p> }
						@default: { <p>Unknown status.</p> }
					};`,
				'App.tsrx',
			);
			expect(code).toContain('Loading...');
			expect(code).toContain('Done!');
			expect(code).toContain('Unknown status.');
			expect(code).toContain(`'loading'`);
			expect(code).not.toContain('@switch');
			expect(code).not.toContain('JSXSwitchExpression');
		});

		it('lowers @switch in a return statement output', () => {
			const { code } = compile(
				`function StatusMessage({ status }: { status: string }) {
						return @switch (status) {
							@case 'loading': { <p>Loading...</p> }
							@default: { <p>Unknown status.</p> }
						};
					}`,
				'App.tsrx',
			);
			expect(code).toContain('Loading...');
			expect(code).toContain('Unknown status.');
			expect(code).not.toContain('@switch');
			expect(code).not.toContain('JSXSwitchExpression');
		});

		it('lowers @if in an expression-bodied arrow output', () => {
			const { code } = compile(
				`const Banner = ({ ok }: { ok: boolean }) => @if (ok) {
						<p>All good</p>
					} @else {
						<p>Something broke</p>
					};`,
				'App.tsrx',
			);
			expect(code).toContain('All good');
			expect(code).toContain('Something broke');
			expect(code).not.toContain('@if');
			expect(code).not.toContain('JSXIfExpression');
		});

		it('lowers @for in an expression-bodied arrow output', () => {
			const { code } = compile(
				`const List = ({ items }: { items: string[] }) => @for (const item of items) {
						<li>{item}</li>
					};`,
				'App.tsrx',
			);
			expect(code).toContain('<li>');
			expect(code).not.toContain('@for');
			expect(code).not.toContain('JSXForExpression');
		});

		it('lowers @if passed as a call argument', () => {
			const { code } = compile(
				`function StatusBadge({ status }: { status: string }) {
						func(@if (status === 'active') {
							<span class="badge active">Online</span>
						} @else if (status === 'idle') {
							<span class="badge idle">Away</span>
						} @else {
							<span class="badge">Offline</span>
						});
					}`,
				'App.tsrx',
			);
			expect(code).toContain('Online');
			expect(code).toContain('Away');
			expect(code).toContain('Offline');
			expect(code).not.toContain('@if');
			expect(code).not.toContain('JSXIfExpression');
		});

		it('lowers @for passed as a call argument', () => {
			const { code } = compile(
				`function List({ items }: { items: string[] }) {
						render(@for (const item of items) {
							<li>{item}</li>
						});
					}`,
				'App.tsrx',
			);
			expect(code).toContain('<li>');
			expect(code).not.toContain('@for');
			expect(code).not.toContain('JSXForExpression');
		});

		it('lowers @switch passed as a call argument', () => {
			const { code } = compile(
				`function App({ status }: { status: string }) {
						render(@switch (status) {
							@case 'loading': { <p>Loading...</p> }
							@default: { <p>Unknown status.</p> }
						});
					}`,
				'App.tsrx',
			);
			expect(code).toContain('Loading...');
			expect(code).toContain('Unknown status.');
			expect(code).not.toContain('@switch');
			expect(code).not.toContain('JSXSwitchExpression');
		});

		it('lowers @try passed as a call argument', () => {
			const { code } = compile(
				`function App() {
						render(@try {
							<p>Loaded</p>
						} @catch (error) {
							<p>Failed</p>
						});
					}`,
				'App.tsrx',
			);
			expect(code).toContain('Loaded');
			expect(code).toContain('Failed');
			expect(code).not.toContain('@try');
			expect(code).not.toContain('@catch');
			expect(code).not.toContain('JSXTryExpression');
		});

		it('lowers a @{ … } code block passed as a call argument', () => {
			const { code } = compile(
				`function App() {
							render(@{
							const count = 2;
							<span>{count}</span>
						});
					}`,
				'App.tsrx',
			);
			expect(code).toContain('const count = 2;');
			expect(code).toContain('<span>{count}</span>');
			expect(code).not.toContain('JSXCodeBlock');
		});

		it('lowers a dangling @if expression statement', () => {
			const { code } = compile(
				`function StatusBadge({ status }: { status: string }) {
							@if (status === 'active') {
								<span class="badge active">Online</span>
							} @else if (status === 'idle') {
								<span class="badge idle">Away</span>
							} @else {
								<span class="badge">Offline</span>
							}
						}`,
				'App.tsrx',
			);
			expect(code).toContain('Online');
			expect(code).toContain('Away');
			expect(code).toContain('Offline');
			expect(code).not.toContain('@if');
			expect(code).not.toContain('JSXIfExpression');
		});

		it('lowers dangling @ control expressions and code blocks as expression statements', () => {
			const cases = [
				[
					`function App() {
								@for (const item of items) {
									<li>{item}</li>
								}
							}`,
					['<li>', '@for', 'JSXForExpression'],
				],
				[
					`function App() {
								@switch (status) {
									@case 'loading': { <p>Loading...</p> }
									@default: { <p>Unknown status.</p> }
								}
							}`,
					['Loading...', '@switch', 'JSXSwitchExpression'],
				],
				[
					`function App() {
								@try {
									<p>Loaded</p>
								} @catch (error) {
									<p>Failed</p>
								}
							}`,
					['Loaded', '@try', 'JSXTryExpression'],
				],
				[
					`function App() {
								@{
									const count = 2;
									<span>{count}</span>
								}
							}`,
					['const count = 2;', 'JSXCodeBlock', 'JSXCodeBlock'],
				],
			];
			for (const [source, [expected, rawSyntax, rawNode]] of cases) {
				const { code } = compile(source, 'App.tsrx');
				expect(code, source).toContain(expected);
				expect(code, source).not.toContain(rawSyntax);
				expect(code, source).not.toContain(rawNode);
			}
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
				`export function App(&{ outer: &{ inner } }: { outer: { inner: number } }) @{
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
				`export function App(&{ pair: &[first, second] }: { pair: [number, number] }) @{
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
				`export function App(&{ a: &{ b: &{ c } } }: { a: { b: { c: number } } }) @{
					<div>{c}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: { a: { b: { c: number } } })');
			expect(code).toContain('__lazy0.a.b.c');
		});

		it('transforms nested lazy in variable declaration with writeback', () => {
			const { code } = compile(
				`export function App() @{
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
				`export function App() @{
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
				`export function App() @{
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
				`export function App({ something: &[first, second] }: { something: [number, number] }) @{
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
				`export function App([head, &{ inner }]: [number, { inner: number }]) @{
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
				`export function App() @{
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
				`export function App({ a: &{ x }, b: &{ y } }: { a: { x: number }, b: { y: number } }) @{
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
				`export function App({ a: { b: &{ c } } }: { a: { b: { c: number } } }) @{
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
				`export default function A() @{
					<>{"Hello"}</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('return "Hello";');
		});

		it('renders lone expression fragment shorthand inside conditional render bodies', () => {
			const { code } = compile(
				`export function A() @{
					@if (show) {
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
				`export function A() @{
					@for (const value of values) {
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
				`export function A() @{
					@switch (state) {
						@case "ready": {
							<>{"Ready"}</>
						}
						@default: {
							<>{"Waiting"}</>
						}
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
 * Shared switch coverage. JSX `@switch` cases are isolated template branches:
 * they do not fall through and they do not use `break` or `return`.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedSwitchFallthroughTests({ compile, name }) {
	describe(`[${name}] switch case isolation`, () => {
		it.runIf(['react', 'preact', 'vue'].includes(name))(
			'keeps each case body independent without helper chaining',
			() => {
				const { code } = compile(
					`export function StatusBadge({ status }: { status: string }) @{
						@switch (status) {
							@case "idle": {
								<span>{'Online'}</span>
							}
							@case "active": {
								<span>{'Away'}</span>
							}
							@case "offline": {
								<span>{'Offline'}</span>
							}
						}
					}`,
					'App.tsrx',
				);

				expect(count_substring(code, "'Online'")).toBe(1);
				expect(count_substring(code, "'Away'")).toBe(1);
				expect(count_substring(code, "'Offline'")).toBe(1);
				expect(code).not.toContain('StatementBodyHook');
			},
		);

		it('renders each explicit case block once', () => {
			const { code } = compile(
				`export function App({ kind }: { kind: string }) @{
					@switch (kind) {
						@case "a": {
							<span>{'A'}</span>
						}
						@case "b": {
							<span>{'B'}</span>
						}
						@default: {
							<span>{'Other'}</span>
						}
					}
				}`,
				'App.tsrx',
			);

			expect(count_substring(code, "'A'")).toBe(1);
			expect(count_substring(code, "'B'")).toBe(1);
			expect(count_substring(code, "'Other'")).toBe(1);
			if (['react', 'preact', 'vue'].includes(name)) {
				expect(code).not.toContain('StatementBodyHook');
			}
		});

		it.runIf(['react', 'preact', 'vue'].includes(name))(
			'treats stacked case labels as separate isolated cases',
			() => {
				const { code } = compile(
					`export function App({ n }: { n: number }) @{
						@switch (n) {
							@case 1: {
							}
							@case 2: {
								<span>{'one or two'}</span>
							}
							@default: {
								<span>{'other'}</span>
							}
						}
					}`,
					'App.tsrx',
				);

				expect(count_substring(code, "'one or two'")).toBe(1);
				expect(count_substring(code, "'other'")).toBe(1);
				expect(code).not.toContain('StatementBodyHook');
			},
		);

		it.runIf(name === 'solid')(
			'treats stacked case labels as separate isolated <Match> arms',
			() => {
				const { code } = compile(
					`export function App({ n }: { n: number }) @{
						@switch (n) {
							@case 1: {
							}
							@case 2: {
								<span>{'one or two'}</span>
							}
							@default: {
								<span>{'other'}</span>
							}
						}
					}`,
					'App.tsrx',
				);

				expect(count_substring(code, "'one or two'")).toBe(1);
				expect(count_substring(code, "'other'")).toBe(1);
				expect(code).not.toContain('StatementBodyHook');
			},
		);

		it.runIf(['react', 'preact', 'vue'].includes(name))(
			'does not lift downstream case bodies into earlier case blocks',
			() => {
				const { code } = compile(
					`export function App({ status }: { status: string }) @{
						@switch (status) {
							@case "idle": {
								<span>{'Online'}</span>
							}
							@case "active": {
								<span>{'Away'}</span>
							}
							@case "offline": {
								<span>{'Offline'}</span>
							}
						}
					}`,
					'App.tsrx',
				);

				expect(code).toContain('switch (status)');
				expect(code).not.toContain('StatementBodyHook');
				expect(count_substring(code, "'Online'")).toBe(1);
				expect(count_substring(code, "'Away'")).toBe(1);
				expect(count_substring(code, "'Offline'")).toBe(1);
			},
		);

		it.runIf(name === 'solid')('lowers isolated cases to independent <Match> arms', () => {
			const { code } = compile(
				`export function App({ status }: { status: string }) @{
						@switch (status) {
							@case "idle": {
								<span>{'Online'}</span>
							}
							@case "active": {
								<span>{'Away'}</span>
							}
							@case "offline": {
								<span>{'Offline'}</span>
							}
						}
					}`,
				'App.tsrx',
			);

			expect(code).toContain('<Switch');
			expect(code).toMatch(/<Match when=\{status === "idle"\}>/);
			expect(code).toMatch(/<Match when=\{status === "active"\}>/);
			expect(code).toMatch(/<Match when=\{status === "offline"\}>/);
			expect(count_substring(code, "'Offline'")).toBe(1);
			expect(count_substring(code, "'Away'")).toBe(1);
			expect(count_substring(code, "'Online'")).toBe(1);
			expect(code).not.toContain('StatementBodyHook');
		});

		it.runIf(name === 'solid')('routes default cases to <Switch fallback>', () => {
			const { code } = compile(
				`export function App({ kind }: { kind: string }) @{
					@switch (kind) {
						@case "a": {
							<span>{'A'}</span>
						}
						@default: {
							<span>{'D'}</span>
						}
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
 * `StatementBodyHook` helper component for hook-bearing switch cases
 * — module scope for the client transform on every target whose platform
 * sets `moduleScopedHookComponents: true` (Solid, Vue), and a local
 * `let App__StatementBodyHook<N>` cache slot + per-render `?? (= …)` lazy
 * initializer otherwise. `compile_to_volar_mappings` keeps the local-scoped
 * shape regardless of platform default so Volar's virtual TSX can still
 * resolve closure-captured bindings against the component body.
 *
 * The `StatementBodyHook` name is React-flavored historically, but on
 * Vue/Solid the lift solves different problems (avoid re-`defineVaporComponent`
 * per render, keep hooks in stable branch components, etc.) — same machinery
 * either way.
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
		// Two case bodies contain hooks, so two helpers should exist. The
		// non-hook case stays inline and cases remain isolated.
		const switch_source = `export function App({ status }: { status: string }) @{
				@switch (status) {
					@case "idle": {
						const idle_label = useMemo(() => 'Online', [status]);
						<span>{idle_label}</span>
					}
					@case "active": {
						const active_label = useMemo(() => 'Away', [status]);
						<span>{active_label}</span>
					}
					@case "offline": {
						<span>{'Offline'}</span>
					}
				}
			}`;

		it('lifts hook-bearing case bodies in the client transform', () => {
			const { code } = compile(switch_source, 'App.tsrx');

			if (clientHelperShape === 'module-function') {
				// Solid: top-level `function App__StatementBodyHook<N>()`
				// declarations, no per-render cache slots.
				const top_level_helper_count = (
					code.match(/^function App__StatementBodyHook\d+\([^)]*\)/gm) || []
				).length;
				expect(top_level_helper_count).toBe(2);
				expect(code).not.toContain('let App__StatementBodyHook');
			} else if (clientHelperShape === 'module-vapor-component') {
				// Vue: top-level `const App__StatementBodyHook<N> =
				// defineVaporComponent(function App__StatementBodyHook<N>() {...})`.
				const top_level_helper_count = (
					code.match(
						/^const App__StatementBodyHook\d+ = defineVaporComponent\(function App__StatementBodyHook\d+\([^)]*\)/gm,
					) || []
				).length;
				expect(top_level_helper_count).toBe(2);
				expect(code).not.toContain('let App__StatementBodyHook');
			} else {
				// Local cache slot + `?? (= function …)` lazy
				// initializer per hook-bearing body; no top-level declarations.
				const cache_slot_count = (code.match(/^let App__StatementBodyHook\d+;$/gm) || []).length;
				expect(cache_slot_count).toBe(2);
				expect(code).toMatch(
					/const StatementBodyHook\d+\s*=\s*App__StatementBodyHook\d+\s*\?\?\s*\(App__StatementBodyHook\d+\s*=\s*function StatementBodyHook\d+\(\)/,
				);
			}
		});

		it('keeps hook-bearing case helpers local in the typeOnly transform', () => {
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
		it('renders for...of loops inside fragment outputs with JSX siblings', () => {
			const { code } = compile(
				`export function App({ items }: { items: string[] }) @{
					<>
						<h3>head</h3>
						<p>text</p>
						@for (const item of items) {
							<div>{item}</div>
						}
					</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<h3>head</h3>');
			expect(code).toContain('<p>text</p>');
			expect(code).toContain('<div>{item}</div>');
		});

		it('renders an empty fallback for for...of loops', () => {
			const { code } = compile(
				`export function App({ items }: { items: string[] }) @{
					@for (const item of items) {
						<div>{item}</div>
					} @empty {
						<p>{'No items'}</p>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<div>{item}</div>');
			expect(code).toContain('No items');
		});

		it('rejects direct loop exits inside for...of template loops', () => {
			for (const statement of ['continue', 'break', 'return null']) {
				expect(() =>
					compile(
						`export function App({ items }: { items: string[] }) @{
							@for (const item of items) {
								${statement}
								<div>{item}</div>
							}
						}`,
						'App.tsrx',
					),
				).toThrow(
					/(Continue|Break|Return) statements are not allowed inside TSRX template for\.\.\.of loops/,
				);
			}
		});

		it('rejects direct returns inside @if template blocks', () => {
			expect(() =>
				compile(
					`export function App({ ready }: { ready: boolean }) @{
						@if (ready) {
							return null
							<div>{'Ready'}</div>
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/Return statements are not allowed inside TSRX template @if blocks/);
		});

		it('rejects nested exits inside @if template blocks', () => {
			for (const [statement, expected] of [
				['return null', /Return statements are not allowed inside TSRX template @if blocks/],
				['break', /Break statements are not allowed inside TSRX template @if blocks/],
				['continue', /Continue statements are not allowed inside TSRX template @if blocks/],
			]) {
				expect(() =>
					compile(
						`export function App({ ready, items }: { ready: boolean; items: string[] }) @{
							@if (ready) {
								for (const item of items) {
									${statement}
								}
								<div>{'Ready'}</div>
							}
						}`,
						'App.tsrx',
					),
				).toThrow(expected);
			}
		});

		it('allows ordinary guard returns inside statement containers', () => {
			const { code } = compile(
				`export function App({ ready }: { ready: boolean }) @{
					if (ready) {
						return <span>{'Ready'}</span>
					}
					<div>{'Fallback'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('Ready');
			expect(code).toContain('Fallback');
		});

		it.runIf(['react', 'preact'].includes(name))(
			'keeps explicit loop keys on otherwise static children',
			() => {
				const { code } = compile(
					`export function App() @{
						@for (const item of items; index i; key i) {
							<div>{'test'}</div>
						}
					}`,
					'App.tsrx',
				);

				expect(code).toContain("<div key={i}>{'test'}</div>");
				expect(code).not.toContain('__static');
			},
		);

		it.runIf(['react', 'preact'].includes(name))(
			'keeps implicit loop keys on multi-child static loop bodies',
			() => {
				const { code } = compile(
					`export function App() @{
						@for (const item of items; index i) {
							<>
								<div>{'one'}</div>
								<div>{'two'}</div>
							</>
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
				`export function App({ items }: { items: string[] }) @{
					@for (const item of items) {
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
	});
}

/**
 * Shared anonymous function component regressions. These cover parser support
 * for ordinary function expressions and arrow functions that return JSX.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'>} harness
 */
export function runSharedAnonymousComponentTests({ compile, name }) {
	describe(`[${name}] anonymous function components`, () => {
		it('parses arrow function components that return JSX', () => {
			const { code } = compile(
				`const Inline = (props: { x: string }) => <div>{props.x}</div>;`,
				'App.tsrx',
			);

			expect(code).toContain('const Inline = (props: { x: string }) => <div>{props.x}</div>;');
			expect(code).not.toContain('function Inline');
		});

		it('parses function expression components that return JSX', () => {
			const { code } = compile(
				`const Inline = function (props: { x: string }) {
					return <div>{props.x}</div>;
				};`,
				'App.tsrx',
			);

			expect(code).toContain('const Inline = function (props: { x: string })');
			expect(code).toContain('<div>{props.x}</div>');
			expect(code).not.toContain('function Inline');
		});

		it('lowers function component props inside JSX attribute objects', () => {
			const { code } = compile(
				`export function App() @{
					<Page
						params={{
							menuAlt2: ({ isAdmin, children }: { isAdmin: boolean, children: (items: string[]) => JSX.Element }) => {
								const items: string[] = [];
								if (isAdmin) {
									items.push('Delete', 'Edit');
								} else {
									items.push('View');
								}
								return <>{children(items)}</>;
							},
						}}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('menuAlt2');
			expect(code).toContain('items.push');
			expect(code).toContain('return children(items);');
		});

		it('lowers expression-bodied function component props', () => {
			const { code } = compile(
				`export function App() @{
					<Child
						children={({ items }: { items: JSX.Element[] }) => <ul>
							@for (const item of items; index i) {
								<li key={i}>{item}</li>
							}
						</ul>}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('children={({ items }: { items: JSX.Element[] }) => <ul>');
			expect(code).toContain(
				name === 'solid'
					? '<For each={items}>'
					: name === 'vue'
						? '<VaporFor in={items}'
						: '__map_iterable(items, (item, i)',
			);
			expect(code).toContain(name === 'vue' ? '<li>{item.value}</li>' : '<li key={i}>{item}</li>');
		});

		it('parses semicolon-terminated template expression containers', () => {
			const { code } = compile(
				`export function App() @{
					<Child
						children={({ items }: { items: JSX.Element[] }) => {
							return <ul>
								@for (const item of items; index i) {
									<li key={i}>{item}</li>
								}
							</ul>;
						}}
					/>
				}

				function Child({ children }: { children: (props: { items: JSX.Element[] }) => JSX.Element }) @{
					{
						children({ items: [<span>Item 1</span>, <span>Item 2</span>, <span>Item 3</span>] });
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('children({');
			expect(code).toContain('Item 3');
		});
	});
}

/**
 * Shared validation that function components behave like ordinary TypeScript
 * functions. TSRX no longer has a special component parameter syntax, so the
 * compiler should not reject additional function parameters.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'> & Pick<CompileDiagnosticsHarness, 'compile_to_volar_mappings'>} harness
 */
export function runSharedComponentParamsTests({ compile, compile_to_volar_mappings, name }) {
	const removed_message = 'TSRX functions accept ordinary TypeScript parameters.';

	describe(`[${name}] function component params`, () => {
		it('accepts a single props parameter', () => {
			expect(() =>
				compile(
					`export function App(props) @{
						<div>{props.value}</div>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('accepts multiple parameters on ordinary functions that return TSRX', () => {
			expect(() =>
				compile(
					`export function App(a, b, c) @{
						<div>{a}{b}{c}</div>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('does not surface removed props-parameter diagnostics via Volar mappings', () => {
			const result = compile_to_volar_mappings(
				`export function App(a, b, c) @{
					<div>{a}{b}{c}</div>
				}`,
				'App.tsrx',
			);

			expect(
				result.errors.some((error) =>
					/** @type {{ message?: string }} */ (error).message?.includes(removed_message),
				),
			).toBe(false);
		});

		it('accepts multiple parameters on class field function components', () => {
			const source = `export class App {
				Inline = (a, b) => <div>{a}{b}</div>;
				static Other = (a, b) => <span>{a}{b}</span>;
			}`;

			expect(() => compile(source, 'App.tsrx')).not.toThrow();

			const result = compile_to_volar_mappings(source, 'App.tsrx');
			expect(
				result.errors.some((error) =>
					/** @type {{ message?: string }} */ (error).message?.includes(removed_message),
				),
			).toBe(false);
		});
	});
}

/**
 * Shared validation that class members returning TSRX behave like ordinary
 * TypeScript class members. Arrow properties, static arrow properties, methods,
 * and function expression properties are all valid shapes.
 *
 * @param {Pick<CompileHarness, 'compile' | 'name'> & Pick<CompileDiagnosticsHarness, 'compile_to_volar_mappings'>} harness
 */
export function runSharedClassFunctionComponentTests({ compile, compile_to_volar_mappings, name }) {
	describe(`[${name}] class function components`, () => {
		it('allows an arrow function component as a class property', () => {
			expect(() =>
				compile(
					`export class App {
						Inline = () => <div>{'hi'}</div>;
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('allows an arrow function component as a static class property', () => {
			expect(() =>
				compile(
					`export class App {
						static Inline = () => <div>{'hi'}</div>;
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('allows a class method that returns JSX', () => {
			expect(() =>
				compile(
					`export class App {
						Inline() {
							return <div>{'hi'}</div>;
						}
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('allows a function expression class property that returns JSX', () => {
			expect(() =>
				compile(
					`export class App {
						Inline = function () {
							return <div>{'hi'}</div>;
						};
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('does not flag class members returning TSRX via Volar mappings', () => {
			const result = compile_to_volar_mappings(
				`export class App {
					Inline = () => <div>{'hi'}</div>;
					static Other = () => <span>{'hello'}</span>;
					Method() {
						return <p>{'method'}</p>;
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
export function runSharedCompileTests({
	compile,
	name,
	classAttrName,
	generatedClassAttrName = classAttrName,
}) {
	const componentClassAttrName = name === 'react' ? 'className' : 'class';
	const componentClassParam =
		componentClassAttrName === 'className'
			? '{ className }: { className?: string }'
			: '{ class: className }: { class?: string }';

	runSharedComponentLoopControlFlowTests({ compile, name });
	runSharedNestedLazyDestructuringTests({ compile, name });

	describe(`[${name}] component export shapes`, () => {
		// Function export prefix preservation should stay identical across
		// targets. Any future change that double-exports, strips a default,
		// or otherwise changes the declaration wrapper fails here first.

		it('keeps plain components local unless explicitly exported', () => {
			const { code } = compile(
				`function App() @{
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
				`export function App() @{
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
				`export default function App() @{
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

				export function MyComponent<Item>(props: Props<Item>) @{
					<div />
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export function MyComponent<Item>(props: Props<Item>)');
		});

		it('preserves generic type arguments on JSX component tags', () => {
			const { code } = compile(
				`type User = { name: string };

				function RenderProp<Item>(props: { children: (item: Item) => any }) { return null; }

				export function App() @{
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
				`function Box<T>({ value }: { value: T }) @{
					<div>{String(value)}</div>
				}

				export function App() @{
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
				`export function App() @{
					@try {
						<div>{'content'}</div>
					} @pending {}
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
				`function App() @{
					<div>hi
				}`,
				'App.tsrx',
				{ collect: true },
			);

			expect(result.errors.map((error) => error.message)).toContain(
				"Unclosed tag '<div>'. Expected '</div>' before end of template.",
			);
			expect(diagnostic_codes(result)).toContain(DIAGNOSTIC_CODES.UNCLOSED_TAG);
		});

		it('keeps loose unclosed tag recovery silent', () => {
			const result = compile(
				`function App() @{
					<div>hi
				}`,
				'App.tsrx',
				{ loose: true },
			);

			expect(result.errors).toEqual([]);
		});

		it('accepts adjacent JSX text and expression children', () => {
			const { code } = compile(
				`export function App({ count }: { count: number }) @{
						<p>clicked {count} times</p>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('clicked');
			expect(code).toContain('{count}');
			expect(code).toContain('times');
		});

		it('accepts indented JSX text children', () => {
			const { code } = compile(
				`export default function App() @{
						<div>
							Hello
						</div>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('Hello');
			expect(code).not.toContain('"Hello";');
			expect(code).not.toContain('return null;');
		});

		it('accepts JSX text at the start of template bodies', () => {
			const { code } = compile(
				`export function App() @{
						<>hello</>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('hello');
			expect(code).not.toContain('hello;');
			expect(code).not.toContain('return null;');
		});

		it('accepts JSX text in if-else branches', () => {
			const { code } = compile(
				`export function App() @{
						@if (false) {
							<>Hello Ripple</>
					} @else {
						<>Hello React</>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('"Hello Ripple"');
			expect(code).toContain('"Hello React"');
			expect(code).not.toContain('return null;');
		});

		it('keeps plain if blocks in component bodies as setup control flow', () => {
			const { code } = compile(
				`export function App(disabled: boolean) @{
						if (disabled) {
							<span>disabled</span>
						}

						<span>enabled</span>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('if (disabled)');
			expect(code).toContain('<span>disabled</span>');
			expect(code).toContain('enabled');
			expect(code).not.toContain('<Show');
		});

		it('keeps nested plain if blocks in @if bodies as setup control flow', () => {
			const { code } = compile(
				`function StatusBadge(status: string, more: boolean) {
						let a = @if (status === 'active') {
							if (more) {
								<b>111</b>
							} else {
								<b>222</b>
							}
						};
					}`,
				'App.tsrx',
			);

			expect(code).toContain('if (more)');
			expect(code).toContain('<b>111</b>');
			expect(code).toContain('<b>222</b>');
			expect(code).toContain('return null;');
			expect(code).not.toContain('more ?');
		});

		it('preserves entities in JSX text children for JSX runtime decoding', () => {
			const { code } = compile(
				`export function App() @{
						<p>a&amp;b&quot;c</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('a&amp;b&quot;c');
		});

		it('treats backslashes in JSX text children as literal text', () => {
			const { code } = compile(
				`export function App() @{
					<p>line\\nbreak</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('line\\nbreak');
		});

		it('keeps double-quoted strings inside expression containers as JavaScript strings', () => {
			const { code } = compile(
				`export function App() @{
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
					`export function App() @{
						<p>{"line
break"}</p>
					}`,
					'App.tsrx',
				),
			).toThrow(/Unterminated string constant/);
		});

		it('keeps compact string comparisons in expression containers parseable', () => {
			const { code } = compile(
				`export function App({ value }: { value: string }) @{
					<p>{a<value}</p>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('{a < value}');
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
				`export function BlockScopeCheck() @{
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
				`export function ExpressionContainerCheck() @{
					function ignore() {
						{
							const hidden = 'not rendered';
							return hidden;
						}
					}

					const visible = 'render me';
					<>{visible}</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain("const visible = 'render me'");
			expect(code).toContain('return visible;');
			expect(code).not.toMatch(/\{\n\s+visible;\n\s+\}/);
		});

		it('keeps generic-looking arrow expressions parseable after inner blocks in functions', () => {
			const { code } = compile(
				`export function GenericAfterBlockCheck() @{
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
		it('collects mismatched closing tag diagnostic codes', () => {
			expect(() =>
				compile(
					`function App() @{
						<div></span>
					}`,
					'App.tsrx',
					{ collect: true },
				),
			).toThrow(/Unexpected closing tag/);
		});
	});

	describe(`[${name}] component return validation`, () => {
		it('allows return values inside functions and classes nested in components', () => {
			expect(() =>
				compile(
					`export function App() @{
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

		it('rejects return statements inside template @if branches', () => {
			expect(() =>
				compile(
					`export function App() @{
						<>
							@if (x) {
								return <div>hello world</div>;
							}

							<div>hello world 2</div>
						</>
					}`,
					'App.tsrx',
				),
			).toThrow(/Return statements are not allowed inside TSRX template @if blocks/);
		});
	});

	describe(`[${name}] removed style directive syntax`, () => {
		it('does not parse {style} inside element child expressions', () => {
			expect(() =>
				compile(
					`export function App() @{
						<div>{style 'root'}</div>
						<style>
							.root { color: blue; }
						</style>
					}`,
					'App.tsrx',
				),
			).toThrow();
		});

		it('does not parse {style} in attributes', () => {
			expect(() =>
				compile(
					`export function App() @{
						<div class={style 'root'}>{'hi'}</div>
						<style>
							.root { color: blue; }
						</style>
					}`,
					'App.tsrx',
				),
			).toThrow();
		});

		it('does not parse the removed #style syntax', () => {
			expect(() =>
				compile(
					`export function App() @{
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

	describe(`[${name}] <> and fragment unwrapping`, () => {
		// Expression-position JSX fragments unwrap when they only contain a
		// single render expression and wrap when they need to preserve siblings.
		it('unwraps a JSX fragment with a single element child', () => {
			const { code } = compile(`class Foo { bar() { return <><div>hi</div></>; } }`, 'App.tsrx');
			expect(code).toContain('hi');
			expect(code).not.toContain('<tsx');
		});

		it('preserves component spread attributes inside JSX fragments', () => {
			const { code } = compile(
				`class Foo { bar() { const props = {}; return <><Bar {...props} /></>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('return <Bar {...props} />;');
			expect(code).not.toContain('<tsx');
		});

		it('unwraps a JSX fragment containing a single expression to the expression', () => {
			// Regression: previously `<>{'Hello'}</>` was compiled to
			// `return {'Hello'};`, which is a JS syntax error because `{`
			// opens a block/object literal. The JSXExpressionContainer must
			// be unwrapped to its inner expression in expression position.
			const { code } = compile(`class Foo { bar() { return <>{'Hello'}</>; } }`, 'App.tsrx');
			expect(code).toContain("return 'Hello';");
			expect(code).not.toContain("return {'Hello'}");
		});

		it('unwraps a JSX fragment containing a single identifier expression', () => {
			const { code } = compile(`class Foo { bar() { const x = 1; return <>{x}</>; } }`, 'App.tsrx');
			expect(code).toContain('return x;');
			expect(code).not.toContain('return {x}');
		});

		it('unwraps text-only JSX fragments to strings', () => {
			const { code } = compile(`class Foo { bar() { return <>plain text</>; } }`, 'App.tsrx');
			expect(code).toContain('plain text');
			expect(code).not.toContain('return null;');
		});

		it('parses text-only fragment initializers before template expression children', () => {
			const { code } = compile(
				`export function Button() @{
					const x = <>Hello world</>;
					<>{x}</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('const x = "Hello world";');
			expect(code).toContain('return x;');
		});

		it('parses backtick text inside fragments as JSX text', () => {
			const { code } = compile(
				`function a() {
					return <>
						\`333\`
					</>;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('`333`');
		});

		it('parses backtick text around JSX elements inside fragments', () => {
			const { code } = compile(
				`function a() {
					return <>
						\`
						<b></b>
						\`
					</>;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('`');
			expect(code).toContain('<b></b>');
		});

		it('wraps multiple JSX fragment children in a fragment', () => {
			const { code } = compile(
				`class Foo { bar() { return <><div>a</div><div>b</div></>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('a');
			expect(code).toContain('b');
		});

		it('unwraps a JSX fragment whose single child is already a fragment', () => {
			const { code } = compile(`class Foo { bar() { return <><>{'x'}</></>; } }`, 'App.tsrx');
			expect(code).toContain("return 'x';");
		});

		it('unwraps an explicit JSX fragment with a single expression', () => {
			const { code } = compile(`class Foo { bar() { return <>{'Hello'}</>; } }`, 'App.tsrx');
			expect(code).toContain("return 'Hello';");
		});

		it('unwraps an explicit JSX fragment with a single element', () => {
			const { code } = compile(`class Foo { bar() { return <><div>hi</div></>; } }`, 'App.tsrx');
			expect(code).toContain('hi');
		});

		it('keeps an explicit JSX fragment with multiple children', () => {
			const { code } = compile(
				`class Foo { bar() { return <><div>a</div><div>b</div></>; } }`,
				'App.tsrx',
			);
			expect(code).toContain('a');
			expect(code).toContain('b');
		});

		it('keeps special fragment returns inside component-local functions', () => {
			const { code } = compile(
				`export function App() @{
							function FragmentReturn() {
								return <><div>fragment</div></>;
							}
							function TsxReturn() {
							return <><div>tsx</div></>;
						}
							function TsrxReturn() {
								return <><div>tsrx</div></>;
							}

							<div>App</div>
					}`,
				'App.tsrx',
			);

			expect(code).not.toContain('return;');
			expect(code).toMatch(/function FragmentReturn\(\) {\s+return App__static/);
			expect(code).toMatch(/function TsxReturn\(\) {\s+return App__static/);
			expect(code).toMatch(/const App__static\d+ = <div[^>]*>tsrx<\/div>;/);
			expect(code).toMatch(/function TsrxReturn\(\) {\s+return App__static/);
		});

		it('keeps special fragment returns inside component prop arrow functions', () => {
			const { code } = compile(
				`function Child(props) { return null; }

					export function App() @{
						<Child
							fragment={() => {
								return <><div>fragment</div></>;
							}}
							tsx={() => {
								return <><div>tsx</div></>;
							}}
						tsrx={() => {
							return <><div>tsrx</div></>;
						}}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain('return;');
			expect(code).toContain('return <><div>fragment</div></>;');
			expect(code).toContain('return <><div>tsx</div></>;');
			expect(code).toContain('return <><div>tsrx</div></>;');
		});

		it('parses semicolon-less JSX returns in component prop arrow functions', () => {
			const { code } = compile(
				`function Card(props) { return null; }

				function App() @{
					<Card
						children={() => {
							return <>
								<div>Hello, World!</div>
							</>
						}}
					/>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('Hello, World!');
		});

		it('keeps expression child arrays in fragment and JSX callback props', () => {
			const { code } = compile(
				`function Child(props) { return null; }

					export function App() @{
						<Child
							fragment={() => <>{[<>Delete</>, <>Edit</>]}</>}
							native={() => <>{[<>Delete</>, <>Edit</>]}</>}
						/>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('fragment={() => <>');
			expect(code).toContain('native={() => <>');
			expect(code).toContain('<>Delete</>');
			expect(code).toContain('<>Edit</>');
		});
	});

	describe(`[${name}] JSX fragment values`, () => {
		it('preserves JSX template text in expression position', () => {
			const { code } = compile(`class Foo { bar() { return <><div>Hello</div></>; } }`, 'App.tsrx');

			expect(code).toContain('Hello');
		});

		it('parses compact JSX templates before a trailing newline at EOF', () => {
			const { code } = compile(
				[
					`export function App() @{`,
					`\tconst title = <><h1>Hello There</h1>{Test(1, 2)}</>;`,
					`\t<>{title}</>`,
					`}`,
					``,
					`function Test(p1, p2) {`,
					`\treturn <><div>Hello</div><div>{p1}</div><div>{p2}</div></>;`,
					`}`,
					``,
				].join('\n'),
				'App.tsrx',
			);

			expect(code).toContain('Hello');
		});

		it('preserves statements before template output', () => {
			const { code } = compile(
				`class Foo { bar() { return <>
					const label = 'Hi';
					<div>{label}</div>
				</>; } }`,
				'App.tsrx',
			);

			expect(code).toContain("const label = 'Hi';");
			expect(code).toContain('{label}');
		});

		it('supports control flow inside JSX template fragments', () => {
			const { code } = compile(
				`class Foo { bar() { return <>@if (true) { <div>yes</div> }</>; } }`,
				'App.tsrx',
			);

			expect(code).toContain('true');
			expect(code).toContain('yes');
		});

		it('preserves JSX template fragments in component JSX attribute values', () => {
			const { code } = compile(
				`function App() @{ <Card content={<><span>Title</span></>} /> }`,
				'App.tsrx',
			);

			expect(code).toContain('Title');
		});

		it('preserves statement-bodied JSX templates in self-closing component attributes', () => {
			const { code } = compile(
				`function App() @{
					<Card
						content={
							@if (foo) {
								<div>
									@if (foo) {}
								</div>
							}
						}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('foo');
			expect(code).toContain('<Card');
		});

		it('preserves JSX template fragments in JSX attribute values', () => {
			const { code } = compile(
				`class Foo { bar() { return <Card content={<><span>Title</span></>} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('Title');
		});

		it('preserves JSX template fragments in object property JSX attribute values', () => {
			const { code } = compile(
				`class Foo { bar() { return <Card content={{ child: <><span>Title</span></> }} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('Title');
		});

		it('preserves JSX template fragments returned from render callback props', () => {
			const { code } = compile(
				`class Foo { bar() { return <List render={() => { return <><span>Item</span></>; }} />; } }`,
				'App.tsrx',
			);

			expect(code).toContain('Item');
		});

		it('preserves JSX template fragments returned from callback props without semicolons', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <>
									<span>{item.name}</span>
								</>
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('item.name');
		});

		it('preserves JSX template fragments in returned object props without semicolons', () => {
			const { code } = compile(
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return {
									child: <>
										<span>{item.name}</span>
									</>
								}
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('item.name');
		});

		it('preserves JSX template fragments in nested render props without trailing commas', () => {
			const cases = [
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: () => <>
										<div>nested</div>
									</>
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
									render: () => <>
										<div>nested trailing comma</div>
									</>,
								},
							}}
						/>
					}
				}`,
			];

			for (const source of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain('nested');
			}
		});

		it('preserves JSX template fragments in top-level render props', () => {
			const cases = [
				[
					`class Foo {
					bar() {
						return <Page
							params={{
								render: () => <>
									<div>top</div>
								</>,
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
								render: (icon: () => JSX.Element) => <>
									<div>typed top</div>
								</>,
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
									render: () => {
										return [<>View</>];
									},
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
			}
		});

		it('preserves JSX parser state across comments after semicolon-free TSRX returns', () => {
			const cases = [
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <>
									<span>{item.name}</span>
								</> /* block comment */
							}}
						/>
					}
				}`,
				`class Foo {
					bar() {
						return <List
							render={(item) => {
								return <>
									<span>{item.name}</span>
								</> // line comment
							}}
						/>
					}
				}`,
			];

			for (const source of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain('item.name');
			}
		});

		it('preserves JSX template fragments from typed nested render props', () => {
			const cases = [
				`class Foo {
					bar() {
						return <Page
							params={{
								details: {
									render: (icon: () => JSX.Element) => <>
										<div>typed</div>
									</>,
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
									render: (tag: string, className: string, icon: () => JSX.Element) => <>
										<div>typed trailing comma</div>
									</>,
								},
							}}
						/>
					}
				}`,
			];

			for (const source of cases) {
				const { code } = compile(source, 'App.tsrx');

				expect(code).toContain('typed');
			}
		});

		it('preserves JSX templates in complex nested params objects', () => {
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
								menuAlt: (isAdmin) => {
									if (isAdmin) {
										return [<>Delete</>, <>Edit</>];
									}
									return [<>View</>];
								},
									details: {
										label: {
											class: 'custom',
											children: [<>Shipping & returns</>],
										},
										leadingIcon: { children: <>icon</> },
									},
								details2: {
									render: (tag: string, className: string, icon: () => JSX.Element) =>
										@{ <span class={\`\${className}\${icon ? 'has-icon' : ''}\`}>
											{icon ? icon() : null}
										</span> },
								},
							}}
						/>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('Welcome');
			expect(code).toContain('isAdmin');
			expect(code).toContain(`${classAttrName}={`);
			expect(code).toContain('has-icon');
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
				`function App() @{
					<Page params={{
						f: () => @{
							<div>
								<div>x</div>
							</div>
						},
					}} />
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<div');
			expect(code).toContain('x');
			expect(code).not.toContain('return null;');
		});

		it('parses statements before later JS statements in JSX attribute callbacks', () => {
			const { code } = compile(
				`function App() @{
					<Page params={{
						menuAlt: (isAdmin) => {
							const items = [];
							if (isAdmin) {
								items.push('Delete', 'Edit');
							} else {
								items.push('View');
							}
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
		});

		it('keeps regular callback returns with JSX values intact', () => {
			const { code } = compile(
				`function Test() @{
					<Page
						params={{
							menuAlt: (isAdmin) => {
								if (isAdmin) {
									return [<>Delete</>, <>Edit</>];
								}
								return [<>View</>];
							},
							direct: () => {
								return [<>View</>];
							},
							bySwitch: (role) => {
								switch (role) {
									case 'admin':
										return [<>Edit</>];
									default:
										return [<>View</>];
								}
							},
							byForOf: (items) => {
								for (const item of items) {
									if (item.active) {
										return [<>{item.label}</>];
									}
								}

								return [<>Empty</>];
							},
							byTry: (load) => {
								try {
									return [<>{load()}</>];
								} catch (error) {
									return [<>Error</>];
								}
							},
						}}
					/>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('return [<>Delete</>, <>Edit</>];');
			expect(code).toContain('return [<>View</>];');
			expect(code).toContain('bySwitch: (role) => {');
			expect(code).toContain('switch (role)');
			expect(code).toContain('byForOf: (items) => {');
			expect(code).toContain('for (const item of items)');
			expect(code).toContain('return [<>Empty</>];');
			expect(code).toContain('byTry: (load) => {');
			expect(code).toContain('return [<>Error</>];');
		});
	});

	describe(`[${name}] lazy destructuring shadowing`, () => {
		// Lazy `&{ name }` destructuring rewrites `name` to `__lazy0.name` at
		// component scope, but locals with the same name must shadow — the
		// shared `applyLazyTransforms` helper in @tsrx/core handles this.

		it('gives untyped lazy object params an object-shaped generated type', () => {
			const { code } = compile(
				`export function App(&{ name, age }) @{
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
				`export function App(&{ name: displayName }) @{
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
				`export function App(&{ a: c, b }: { a: string, b: string }) @{
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
					`export function App(&{ a: b, b }: { a: string, b: string }) @{
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
				`export function App(&{ name }: { name: string }) {
					switch (name) {
						case 'test': {
							const name = 'local';
							console.log(name);
							break;
						}
					}
					return <>
						<div>{name}</div>
					</>;
				}`,
				'App.tsrx',
			);
			expect(code).toContain("const name = 'local'");
			expect(code).toContain('console.log(name)');
		});

		it('does not rewrite body-level variables that shadow lazy bindings', () => {
			const { code } = compile(
				`export function App(&{ name }: { name: string }) @{
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
				`export function App(&{name}: Props) @{
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
				`export function App(&{name}: Props) @{
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

	describe(`[${name}] fenced setup statements and JSX children`, () => {
		it('keeps element setup statements before rendered children', () => {
			const { code } = compile(
				`function Card() @{
					<div class="card">@{
						var a = "one"
						a = "two"
						<>
							<b>{"hello" + a}</b>
							<b>{"hello" + a}</b>
						</>
					}</div>
				}`,
				'Card.tsrx',
			);
			const assign_two = code.indexOf('a = "two"');
			const first_child = code.indexOf('<b>{"hello" + a}</b>');
			expect(assign_two).toBeGreaterThan(-1);
			expect(first_child).toBeGreaterThan(assign_two);
			expect(code).not.toContain('_tsrx_child_');
		});

		it('keeps component setup statements before rendered children with hook calls', () => {
			const { code } = compile(
				`function Card() @{
					var a = "one"
					a = "two"
					const x = useState(0)
					<>
						<b>{"hello" + a}</b>
						<b>{"hello" + a}</b>
						<div>{x}</div>
					</>
				}`,
				'Card.tsrx',
			);
			const assign_two = code.indexOf('a = "two"');
			const first_child = code.indexOf('<b>{"hello" + a}</b>');
			expect(assign_two).toBeGreaterThan(-1);
			expect(first_child).toBeGreaterThan(assign_two);
			expect(code).not.toContain('_tsrx_child_');
		});

		it('does not capture JSX into temporaries when all statements precede JSX', () => {
			const { code } = compile(
				`function Card() @{
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

		it('keeps component setup statements before rendered children', () => {
			const { code } = compile(
				`function Card() @{
					var a = "one"
					a = "two"
					<>
						<b>{"hello" + a}</b>
						<b>{"hello" + a}</b>
					</>
				}`,
				'Card.tsrx',
			);
			const assign_two = code.indexOf('a = "two"');
			const first_child = code.indexOf('<b>{"hello" + a}</b>');
			expect(assign_two).toBeGreaterThan(-1);
			expect(first_child).toBeGreaterThan(assign_two);
			expect(code).not.toContain('_tsrx_child_');
		});
	});

	describe(`[${name}] text children`, () => {
		it('skips the null-coerce ternary for direct JSX text children', () => {
			// `hello` is statically known to be a non-null string, so the
			// text coercion wrapper is dead weight.
			const { code } = compile(
				`export function App() @{
					<b>hello</b>
				}`,
				'App.tsrx',
			);
			expect(code).not.toContain('== null');
			expect(code).not.toContain("+ ''");
		});

		it('treats text as an ordinary identifier in expression containers', () => {
			const { code } = compile(
				`export function App() @{
					const text = 'hello';
					<b>{text}</b>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('{text}');
		});

		it('rejects the removed {text expr} modifier syntax', () => {
			expect(() =>
				compile(
					`export function App() @{
						<b>{text name}</b>
					}`,
					'App.tsrx',
				),
			).toThrow();
		});

		it.runIf(['react', 'preact', 'solid'].includes(name))(
			`[${name}] hoists direct JSX text and static expression sibling combo to a static`,
			() => {
				// React/Preact/Solid hoist child-free static JSX to a module-level
				// constant so the element identity is stable across renders.
				const { code } = compile(
					`export function App() @{
						<b>hello {'hello'}</b>
					}`,
					'App.tsrx',
				);
				expect(code).toContain('const App__static1 = <b>');
				expect(code).toContain('hello');
				expect(code).toContain("{'hello'}");
				expect(code).toContain('return App__static1');
				expect(code).not.toContain('== null');
			},
		);
	});

	describe(`[${name}] native raw HTML props`, () => {
		it('uses the target framework raw HTML prop directly', () => {
			const html_attribute =
				name === 'react' || name === 'preact'
					? 'dangerouslySetInnerHTML={{ __html: markup }}'
					: 'innerHTML={markup}';
			const { code } = compile(
				`export function App({ markup }: { markup: string }) @{
						<article ${html_attribute} />
					}`,
				'App.tsrx',
			);

			expect(code).toContain(html_attribute);
		});

		it('treats html as an ordinary expression identifier', () => {
			const { code } = compile(
				`export function App() @{
						const html = '<strong>escaped</strong>';
						<article>{html}</article>
					}`,
				'App.tsrx',
			);

			expect(code).toContain('html');
			expect(code).not.toContain('{html ');
		});
	});

	describe(`[${name}] JSX fragment shorthand in element context`, () => {
		// Distinct from the `<> and fragment unwrapping` block — those
		// cases put `<>` / `<>` in an *expression* position (return value).
		// These put `<>` inside another element, as a prop value, or inside
		// a `<>` block at a JSX-child position.

		it('collapses a single-child fragment inside an element', () => {
			const { code } = compile(
				`export function App() @{
					<b><>{111}</></b>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<b>{111}</b>');
			expect(code).not.toContain('<>');
		});

		it('allows JSX fragments inside tsx blocks without throwing', () => {
			expect(() =>
				compile(
					`export function App() @{
						<><>{111}</></>
					}`,
					'App.tsrx',
				),
			).not.toThrow();
		});

		it('supports fragment shorthand passed as a component prop', () => {
			const { code } = compile(
				`function Child(props) @{
					<div>{props.content}</div>
				}

				export function App() @{
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
				`export function App() @{
					<>
						<div>{'Hello world'}</div>

						<style>
							.div { color: red; }
						</style>
					</>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			expect(code).toContain("{'Hello world'}");
			expect(code).toContain(`${generatedClassAttrName}="${cssHash}"`);
			expect(css).toContain(`.div.${cssHash}`);
			expect(css).toContain('color: red;');
		});

		it('applies the scope hash inside a <> block', () => {
			const { code, css, cssHash } = compile(
				`function Card() @{
					<>
						<>
							<div ${generatedClassAttrName}="card">
								<h2>{'Scoped title'}</h2>
								<p>{'Styles here do not leak out.'}</p>
							</div>
						</>

						<div ${generatedClassAttrName}="card">
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
					</>
				}`,
				'Card.tsrx',
			);

			expect(css).not.toBe('');
			expect(count_substring(code, `${generatedClassAttrName}="card ${cssHash}"`)).toBe(2);
		});

		it('applies the scope hash inside fragment shorthand', () => {
			const { code, css, cssHash } = compile(
				`function Card() @{
					<>
						<>
							<div ${generatedClassAttrName}="card">
								<h2>{'Scoped title'}</h2>
								<p>{'Styles here do not leak out.'}</p>
							</div>
						</>

						<div ${generatedClassAttrName}="card">
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
					</>
				}`,
				'Card.tsrx',
			);

			expect(css).not.toBe('');
			expect(count_substring(code, `${generatedClassAttrName}="card ${cssHash}"`)).toBe(2);
		});

		it('does not apply scoped css hashes to composite components', () => {
			const { code, css, cssHash } = compile(
				`function Child() @{
					<div>{'Hello world'}</div>
				}

				export function App() @{
					<>
						<Child />
						<div>{'Styled content'}</div>

						<style>
							.div { color: red; }
						</style>
					</>
				}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			expect(code).toContain(
				`<div ${generatedClassAttrName}="${cssHash}">{'Styled content'}</div>`,
			);
			expect(code).not.toMatch(/<Child\s+class(Name)?="/);
		});

		it('passes style expression classes through a composite component prop', () => {
			const { code, css, cssHash } = compile(
				`function Badge(${componentClassParam}) @{
					<>
						<span class={['badge', className ?? '']}>{'New'}</span>

						<style>
							.badge { padding: 0.25rem 0.5rem; }
						</style>
					</>
				}

					export function App() @{
						const styles = <style>
							.highlight { background: green; }
						</style>;
						<Badge ${componentClassAttrName}={styles.highlight} />
					}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			const app_hash = cssHash.split(' ').find((h) => code.includes(`${h} highlight`));
			expect(app_hash).toBeTruthy();
			expect(code).toContain(`${app_hash} highlight`);
			expect(code).toContain(`${componentClassAttrName}={styles.highlight}`);
		});

		it('passes style expression classes through a composite component prop when the element has children', () => {
			const { code, css, cssHash } = compile(
				`function Child(${componentClassParam}) @{
							<span class={className}>hello world</span>
					}

						export function App() @{
							const styles = <style>
								.container { color: red; }
							</style>;
								<Child ${componentClassAttrName}={styles.container}>hello world</Child>
						}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			const app_hash = cssHash.split(' ').find((h) => code.includes(`${h} container`));
			expect(app_hash).toBeTruthy();
			expect(code).toContain(`${app_hash} container`);
			expect(code).toContain(`${componentClassAttrName}={styles.container}`);
		});

		it('passes hyphenated style expression class names through a composite component prop', () => {
			const { code, css, cssHash } = compile(
				`export function App() @{
						const styles = <style>
							.accent-tone { color: red; }
						</style>;
						<Child cls={styles['accent-tone']} />
					}`,
				'App.tsrx',
			);

			expect(css).not.toBe('');
			expect(code).toContain('accent-tone');
		});
	});

	describe.runIf(['react', 'preact'].includes(name))(
		`[${name}] conditional hooks are not extracted`,
		() => {
			it('leaves hooks inside authored template control flow', () => {
				const { code } = compile(
					`export function App({ show }: { show: boolean }) @{
							@if (show) {
								const [count] = useState(0);
								<div>{count}</div>
							}
						}`,
					'App.tsrx',
				);

				expect(code).toContain('useState(0)');
				expect(code).toContain('return show');
				expect(code).not.toContain('StatementBodyHook');
			});

			it('keeps guard returns and later hooks in the component body', () => {
				const { code } = compile(
					`import { useEffect } from '${name === 'preact' ? 'preact/hooks' : 'react'}';

						export function App({ ready }: { ready: boolean }) @{
							if (!ready) {
								return null;
							}

							useEffect(() => {});

							<div />
						}`,
					'App.tsrx',
				);

				expect(code).toContain('if (!ready) {');
				expect(code).toContain('useEffect(() => {});');
				expect(code).toContain('<div />');
				expect(code).not.toContain('StatementBodyHook');
			});
		},
	);
}
