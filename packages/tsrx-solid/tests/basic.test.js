import { describe, expect, it } from 'vitest';
import {
	runSharedClassFunctionComponentTests,
	runSharedCompileDiagnosticsTests,
	runSharedCompileTests,
	runSharedComponentParamsTests,
	runSharedSwitchHelperHoistingTests,
	runSharedTsxExpressionTsrxTests,
} from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'solid',
	rejectsComponentAwait: true,
});

runSharedTsxExpressionTsrxTests({ compile, name: 'solid', classAttrName: 'class' });
runSharedCompileTests({ compile, name: 'solid', classAttrName: 'class' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'solid' });
runSharedClassFunctionComponentTests({ compile, compile_to_volar_mappings, name: 'solid' });
runSharedComponentParamsTests({ compile, compile_to_volar_mappings, name: 'solid' });
runSharedSwitchHelperHoistingTests({
	compile,
	compile_to_volar_mappings,
	name: 'solid',
	clientHelperShape: 'module-function',
});

describe('@tsrx/solid basic', () => {
	describe('component → function', () => {
		it('wraps multiple top-level JSX children in a fragment', () => {
			const { code } = compile(
				`function App() @{
					<>
						<h1>{'a'}</h1>
						<h2>{'b'}</h2>
					</>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("const App__static1 = <h1>{'a'}</h1>;");
			expect(code).toContain("const App__static2 = <h2>{'b'}</h2>;");
			expect(code).toContain('return <>{App__static1}{App__static2}</>;');
		});

		it('rejects await in component body', () => {
			expect(() =>
				compile(
					`async function App() @{
							const data = await fetchData();
							<div>{data}</div>
						}`,
					'App.tsrx',
				),
			).toThrow(/`await` is not allowed inside Solid components/);
		});

		it('still rejects await with a top-level use server directive', () => {
			expect(() =>
				compile(
					`'use server';

						async function App() @{
							const data = await fetchData();
							<div>{data}</div>
						}`,
					'App.tsrx',
				),
			).toThrow(/`await` is not allowed inside Solid components/);
		});

		it('rejects for await...of in component body', () => {
			expect(() =>
				compile(
					`async function App({ items }: { items: AsyncIterable<string> }) @{
							@for await (const item of items) {
								<div>{item}</div>
							}
					}`,
					'App.tsrx',
				),
			).toThrow(/`await` is not allowed inside Solid components/);
		});

		it('reports for await...of errors at the await keyword', () => {
			const source = `async function App({ items }: { items: AsyncIterable<string> }) @{
					@for await (const item of items) {
						<div>{item}</div>
					}
			}`;

			try {
				compile(source, 'App.tsrx');
				expect.unreachable('Expected compile() to throw for top-level for await...of');
			} catch (error) {
				const compile_error = /** @type {Error & { pos?: number, end?: number }} */ (error);
				const await_start = source.indexOf('await');

				expect(compile_error.pos).toBe(await_start);
				expect(compile_error.end).toBe(await_start + 'await'.length);
			}
		});

		it('allows await in nested async functions inside component body', () => {
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

	describe('attributes', () => {
		it('keeps class attribute as class (not className)', () => {
			const { code } = compile(`function App() @{ <div class="foo">{'x'}</div> }`, 'App.tsrx');
			expect(code).toContain('class="foo"');
			expect(code).not.toContain('className');
		});

		it('ref={expr} on a DOM element compiles to ref={expr}', () => {
			const { code } = compile(
				`function App() @{
					let el;
					<input ref={el} />
				}`,
				'App.tsrx',
			);
			// Pass the argument through unchanged; Solid's JSX transform assigns
			// mutable-variable identifiers and invokes function values.
			expect(code).toMatch(/ref=\{el\}/);
			expect(code).not.toContain('__ref_el');
		});

		it('ref={fn} on a DOM element passes the function through', () => {
			const { code } = compile(
				`function App() @{
					function divRef(node: HTMLDivElement) {}
					<div ref={divRef} />
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/ref=\{divRef\}/);
		});

		it('ref={expr} on a composite component compiles to ref={expr}', () => {
			const { code } = compile(
				`function Child(props) @{
					<input {...props} />
				}

				function App() @{
					function childRef(node: HTMLInputElement) {}
					<Child ref={childRef} />
				}`,
				'App.tsrx',
			);
			// Solid passes `ref` as a regular prop; when the child spreads
			// `{...props}` onto a DOM element, Solid's spread runtime invokes
			// `props.ref` with the node automatically.
			expect(code).toMatch(/<Child ref=\{childRef\}/);
		});

		it('array ref={...} on the same DOM element stays a ref array', () => {
			const { code } = compile(
				`function App() @{
					function a(node: HTMLInputElement) {}
					function b(node: HTMLInputElement) {}
					<input ref={[a, b]} />
				}`,
				'App.tsrx',
			);
			// Solid's ref runtime iterates array refs via applyRef, so every
			// entry fires with the same element.
			expect(code).toMatch(/ref=\{\[a,\s*b\]\}/);
		});

		it('array ref={...} on a composite component stays a ref array', () => {
			const { code } = compile(
				`function App() @{
					function a(node: HTMLInputElement) {}
					function b(node: HTMLInputElement) {}
					function c(node: HTMLInputElement) {}
					<Child ref={[a, b, c]} />
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/<Child ref=\{\[a,\s*b,\s*c\]\}/);
		});
	});

	describe('control flow', () => {
		it('simple if → <Show when>', () => {
			const { code } = compile(
				`function App({ n }: { n: number }) @{
						@if (n > 0) {
						<div>{'positive'}</div>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Show when={n > 0}>');
			expect(code).toContain("import { Show } from 'solid-js'");
		});

		it('if/else → <Show when fallback>', () => {
			const { code } = compile(
				`function App({ n }: { n: number }) @{
						@if (n > 0) {
						<div>{'pos'}</div>
					} @else {
						<div>{'neg'}</div>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Show when={n > 0} fallback=');
		});

		it('if/else-if/else → <Switch>/<Match>', () => {
			const { code } = compile(
				`function App({ n }: { n: number }) @{
						@if (n > 10) {
						<span>{'big'}</span>
					} @else if (n > 5) {
						<span>{'mid'}</span>
					} @else {
						<span>{'small'}</span>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Switch fallback=');
			expect(code).toContain('<Match when={n > 10}>');
			expect(code).toContain('<Match when={n > 5}>');
			expect(code).toContain("import { Switch, Match } from 'solid-js'");
		});

		it('for-of → <For each>{(item, i) => ...}', () => {
			const { code } = compile(
				`function App({ items }: { items: number[] }) @{
						@for (const item of items; index i) {
						<li>{item}</li>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<For each={items}>');
			expect(code).toMatch(/\(item, i\) =>/);
			expect(code).toContain("import { For } from 'solid-js'");
		});

		it('for-of with `key` clause → <For keyed={...}>', () => {
			const { code } = compile(
				`function App({ items }: { items: { id: string; name: string }[] }) @{
						@for (const item of items; key item.id) {
						<li>{item.name}</li>
					}
				}`,
				'App.tsrx',
			);
			// `key item.id` lifts to `keyed={(item) => item.id}` — Solid 2.0's
			// <For keyed> switches reconciliation from reference identity to
			// the derived key.
			expect(code).toContain('<For each={items}');
			expect(code).toMatch(/keyed=\{\(item\) =>\s*item\.id\}/);
		});

		it('try/catch → <Errored fallback={(err, reset) => ...}>', () => {
			const { code } = compile(
				`function App() @{
						@try {
						<div>{'content'}</div>
					} @catch (err, reset) {
						<div>{'error'}</div>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Errored fallback={(err, reset) =>');
			expect(code).toContain("import { Errored } from 'solid-js'");
		});

		it('try/pending/catch → <Errored><Loading>...', () => {
			const { code } = compile(
				`function App() @{
						@try {
						<div>{'ready'}</div>
					} @pending {
						<div>{'loading'}</div>
					} @catch (err) {
						<div>{'error'}</div>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Errored');
			expect(code).toContain('<Loading fallback=');
			expect(code).toMatch(/import \{[^}]*Errored[^}]*Loading[^}]*\} from 'solid-js'/);
		});

		it('switch statement → <Switch>/<Match> using ===', () => {
			const { code } = compile(
				`function App({ kind }: { kind: string }) @{
						@switch (kind) {
						@case 'a': { <span>{'A'}</span> }
						@case 'b': { <span>{'B'}</span> }
						@default: { <span>{'?'}</span> }
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Switch fallback=');
			expect(code).toMatch(/<Match when=\{kind === 'a'\}>/);
			expect(code).toMatch(/<Match when=\{kind === 'b'\}>/);
		});

		it('element children mixing JSX and statements wrap in an IIFE', () => {
			// Regression: plain statements (VariableDeclaration, ExpressionStatement,
			// DebuggerStatement) interleaved with JSX children must execute as JS
			// rather than print as literal text. The transform wraps the whole
			// child list in an IIFE so the statements run and their locals stay
			// scoped to the block — matching the React target's behaviour.
			const { code } = compile(
				`function FeatureCard({ items }: { items: string[] }) @{
					<ul>@{
						const [state, setState] = createSignal();
						<>
							@for (const item of items; index i) {
								<li>{item}</li>
							}
							<div>@{
								console.log('logged');
								debugger;
							}</div>
						</>
					}
					</ul>
				}`,
				'FeatureCard.tsrx',
			);
			// Outer <ul> wraps mixed statement + JSX children in an IIFE.
			expect(code).toMatch(/<ul>\{\(\(\) =>\s*\{/);
			expect(code).toContain('createSignal()');
			// Inner <div> with only statements also wraps in an IIFE so they run
			// as JS rather than render as children.
			expect(code).toMatch(/<div>\{\(\(\) =>\s*\{/);
			expect(code).toContain("console.log('logged')");
			expect(code).toContain('debugger');
			// Statements must not leak into the output as literal JSX text.
			expect(code).not.toMatch(/<ul>const \[state/);
			expect(code).not.toMatch(/<div>console\.log/);
		});

		it('statement-only element children return null from their IIFE', () => {
			const { code } = compile(
				`function Child() @{
					<div>@{
						const x = 1;
						console.log(x);
					}</div>
				}`,
				'Child.tsrx',
			);

			expect(code).toContain('return <div>{(() => {');
			expect(code).toContain('const x = 1;');
			expect(code).toContain('console.log(x);');
			expect(code).toContain('return null;');
		});

		it('component-body guard returns lower to reactive <Show> after setup', () => {
			const { code } = compile(
				`import { createSignal } from 'solid-js';
					function App({ cond }: { cond: boolean }) @{
					const [doubled, setDoubled] = createSignal(0);
					@if (!cond) {
						<div>{doubled()}</div>
					}
				}`,
				'App.tsrx',
			);
			const signal_idx = code.indexOf('createSignal(0)');
			const show_idx = code.indexOf('<Show when={!cond}');
			expect(signal_idx).toBeGreaterThan(-1);
			expect(show_idx).toBeGreaterThan(-1);
			expect(signal_idx).toBeLessThan(show_idx);
			expect(code).toContain("import { Show } from 'solid-js'");
			expect(code).not.toContain('if (cond)');
		});

		it('component-body guard without a render tail stays conditional', () => {
			const { code } = compile(
				`function App(
					{ cond, items, setup }: { cond: boolean; items: string[]; setup: () => void }
				) @{
					setup();
					<>
						@for (const item of items) {
							<span>{item}</span>
						}
						@if (cond) {
							<> </>
						}
					</>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<For each={items}>');
			expect(code).toContain('<Show when={cond}');
			expect(code).toContain('setup();');
			expect(code).not.toContain('if (cond)');
		});

		it('component-body guard preserves switch trailing render fallback', () => {
			const { code } = compile(
				`function App({ hidden, kind }: { hidden: boolean; kind: string }) @{
					@if (!hidden) {
						@switch (kind) {
							@case 'skip': {
								<span>{'rest'}</span>
							}
							@case 'done': {
								<p>{'done'}</p>
							}
							@default: {
								<span>{'rest'}</span>
							}
						}
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Show when={!hidden}>');
			expect(code).toContain("<Match when={kind === 'skip'}><span>{'rest'}</span></Match>");
			expect(code).toContain("<Match when={kind === 'done'}><p>{'done'}</p></Match>");
			expect(code).toContain("fallback={<span>{'rest'}</span>}");
			expect(code).not.toContain('StatementBodyHook');
			expect(code).not.toContain("<Match when={kind === 'skip'}>{null}</Match>");
		});

		it('component-body if/else returns lower to reactive <Show>', () => {
			const { code } = compile(
				`function App({ cond }: { cond: boolean }) @{
					@if (cond) {
						<div>{'yes'}</div>
					} @else {
						<span>{'no'}</span>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Show when={cond} fallback=');
			expect(code).toContain("{'yes'}");
			expect(code).toContain("{'no'}");
			expect(code).not.toContain('if (cond)');
		});

		it('component-body switch returns lower to reactive <Switch>/<Match>', () => {
			const { code } = compile(
				`function App({ kind }: { kind: string }) @{
					@switch (kind) {
						@case 'a': {
							<div>{'A'}</div>
						}
						@default: {
							<span>{'?'}</span>
						}
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Switch fallback=');
			expect(code).toContain("<Match when={kind === 'a'}>");
			expect(code).not.toContain('switch (kind)');
		});

		it('component-body switch cases are isolated without trailing fallthrough', () => {
			const { code } = compile(
				`function App({ kind }: { kind: string }) @{
					@switch (kind) {
						@case 'skip': {
							<em>{'rest'}</em>
						}
						@case 'a': {
							<span>{'A'}</span>
						}
						@default: {
							<em>{'rest'}</em>
						}
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain("<Match when={kind === 'skip'}><em>{'rest'}</em></Match>");
			expect(code).toContain("<Match when={kind === 'a'}><span>{'A'}</span></Match>");
			expect(code).toContain("fallback={<em>{'rest'}</em>}");
			expect(code).not.toContain('StatementBodyHook');
			expect(code).not.toContain("<Match when={kind === 'skip'}>{null}</Match>");
		});

		it('component-body switch with final return lowers non-returning cases', () => {
			const { code } = compile(
				`function App({ kind }: { kind: string }) @{
					@switch (kind) {
						@case 'a': {
							<span>{'A'}</span>
						}
						@default: {
							<em>{'rest'}</em>
						}
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Switch fallback=');
			expect(code).toContain("<Match when={kind === 'a'}>");
			expect(code).toContain("{'A'}");
			expect(code).toContain("{'rest'}");
			expect(code).not.toContain('switch (kind)');
		});

		it('component-body for-of returns lower to reactive <For>', () => {
			const { code } = compile(
				`function App({ items }: { items: string[] }) @{
					@for (const item of items) {
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<For each={items}>');
			expect(code).toContain('(item) => <div>{item}</div>');
			expect(code).not.toContain('for (const item of items)');
		});

		it('component-body for-of preserves index and key while lowering', () => {
			const { code } = compile(
				`function App({ items }: { items: { id: string; name: string }[] }) @{
					@for (const item of items; index i; key item.id) {
						<div>{i() + item.name}</div>
					}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<For each={items}');
			expect(code).toMatch(/keyed=\{\(item\) =>\s*item\.id\}/);
			expect(code).toContain('(item, i) => <div>{i() + item.name}</div>');
		});

		it('component-body try/pending/catch returns lower to reactive boundaries', () => {
			const { code } = compile(
				`function App() @{
						@try {
							<div>{'ready'}</div>
						} @pending {
							<div>{'loading'}</div>
						} @catch (err) {
							<div>{'error'}</div>
						}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Errored');
			expect(code).toContain('<Loading fallback=');
			expect(code).toMatch(/import \{[^}]*Errored[^}]*Loading[^}]*\} from 'solid-js'/);
			expect(code).not.toContain('try {');
		});

		it('component-body try lowers when only pending returns render output', () => {
			const { code } = compile(
				`function App(
					{ setup, recover }: { setup: () => void; recover: (err: unknown) => void }
				) @{
						@try {
							setup();
						} @pending {
							<div>{'loading'}</div>
						} @catch (err) {
							recover(err);
						}
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Errored');
			expect(code).toContain('<Loading fallback=');
			expect(code).toContain('setup();');
			expect(code).toContain('recover(err);');
			expect(code).toMatch(/import \{[^}]*Errored[^}]*Loading[^}]*\} from 'solid-js'/);
			expect(code).not.toContain('try {');
		});

		it('component-body try/pending/catch direct returns lower to reactive boundaries', () => {
			const { code } = compile(
				`function App() {
					return @try {
						<div>{'ready'}</div>
					} @pending {
						<div>{'loading'}</div>
					} @catch (err) {
						<div>{'error'}</div>
					};
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Errored');
			expect(code).toContain('<Loading fallback=');
			expect(code).toMatch(/import \{[^}]*Errored[^}]*Loading[^}]*\} from 'solid-js'/);
			expect(code).not.toContain('try {');
		});

		it('component-body try lowers when only pending direct returns render output', () => {
			const { code } = compile(
				`function App(
					{ setup, recover }: { setup: () => void; recover: (err: unknown) => void }
				) {
					return @try {
						setup();
					} @pending {
						<div>{'loading'}</div>
					} @catch (err) {
						recover(err);
					};
				}`,
				'App.tsrx',
			);

			expect(code).toContain('<Errored');
			expect(code).toContain('<Loading fallback=');
			expect(code).toContain('setup();');
			expect(code).toContain('recover(err);');
			expect(code).toMatch(/import \{[^}]*Errored[^}]*Loading[^}]*\} from 'solid-js'/);
			expect(code).not.toContain('try {');
		});

		it('rejects return statements inside template @if branches', () => {
			expect(() =>
				compile(
					`export default function A() @{
						let early = true;
						<>
							<>Hello</>
							@if (early) {
								return;
							}
							<>World</>
						</>
					}`,
					'A.tsrx',
				),
			).toThrow(/Return statements are not allowed inside TSRX template @if blocks/);
		});
	});

	describe('switch helper static-alias suppression', () => {
		// Switch hoisting (client vs typeOnly) is exercised by the shared
		// `runSharedSwitchHelperHoistingTests` block above. This block stays
		// Solid-local because it covers Solid's `canHoistStaticNode` veto on
		// bare component invocations — a Solid-specific optimization decision
		// that doesn't apply to React's `App__static` hoisting policy.
		const switch_source = `export function App({ status }: { status: string }) @{
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
		}`;

		it('does not hoist bare helper-component references into App__static aliases', () => {
			// `<App__StatementBodyHook2 />` is just a component invocation; on
			// Solid the static-element-identity optimization React relies on
			// doesn't apply, so hoisting it into a module-level `App__static`
			// const only adds an alias indirection. Truly-static DOM trees
			// (e.g. `<span>'Online'</span>` with no scope refs) should still
			// be hoisted — those are real DOM nodes worth caching.
			const { code } = compile(switch_source, 'App.tsrx');

			// `App__static<N>` declarations should NOT alias a bare
			// StatementBodyHook reference.
			expect(code).not.toMatch(/const App__static\d+\s*=\s*<App__StatementBodyHook\d+\s*\/>/);
			expect(code).toContain('<Match when={status === "active"}><span>{\'Away\'}</span></Match>');
		});
	});

	describe('<> fragments', () => {
		it('<>...</> with multiple children compiles to fragment', () => {
			const { code } = compile(
				`function App() @{
					<>
						<h1>{'a'}</h1>
						<h2>{'b'}</h2>
					</>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("const App__static1 = <h1>{'a'}</h1>;");
			expect(code).toContain("const App__static2 = <h2>{'b'}</h2>;");
			expect(code).toContain('return <>{App__static1}{App__static2}</>;');
		});

		it('rejects namespaced template tags', () => {
			expect(() =>
				compile(
					`function App() @{
						<foo:bar>
							<h1>a</h1>
						</foo:bar>
					}`,
					'App.tsrx',
				),
			).toThrow(/Namespaced elements are not supported/);
		});
	});

	describe('scoped CSS', () => {
		it('emits css and annotates elements with the scope class', () => {
			const { code, css, cssHash } = compile(
				`export function App() @{
					<>
						<div class="wrapper">{'hi'}</div>
						<style>
							.wrapper { color: red; }
						</style>
					</>
				}`,
				'App.tsrx',
			);
			expect(css).not.toBe('');
			expect(css).toContain('.wrapper.');
			// hash is applied to element's class attribute
			expect(code).toMatch(/class="wrapper tsrx-[a-z0-9]+"/);
		});

		it('supports style expressions for scoped class maps', () => {
			const { code } = compile(
				`export function App() @{
					const styles = <style>
						.root { color: blue; }
					</style>;

					<div class={styles.root}>{'hi'}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('styles.root');
			expect(code).toContain('root');
		});
	});

	describe('lazy destructuring (variable form)', () => {
		it('let [a, b] = createSignal uses regular destructuring', () => {
			const { code } = compile(
				`import { createSignal } from 'solid-js';
				export function App() @{
					let [count, setCount] = createSignal(0);
					<button onClick={() => setCount(count + 1)}>{count}</button>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('let [count, setCount] = createSignal(0)');
		});

		it('transforms lazy params on plain function declarations', () => {
			const { code } = compile(
				`export function greet(&{ name }: { name: string }) {
					return 'hello ' + name;
				}`,
				'App.tsrx',
			);
			expect(code).toContain('function greet(__lazy0: { name: string })');
			expect(code).toContain("'hello ' + __lazy0.name");
		});

		it('transforms lazy params on function expressions', () => {
			const { code } = compile(
				`const add = function (&{ a, b }: { a: number; b: number }) {
					return a + b;
				};`,
				'App.tsrx',
			);
			expect(code).toContain('function (__lazy0: { a: number; b: number })');
			expect(code).toContain('__lazy0.a + __lazy0.b');
		});

		it('transforms lazy params in nested functions inside components', () => {
			const { code } = compile(
				`export function App(&{ outer }: { outer: string }) @{
					function greet(&{ name }: { name: string }) {
						return 'hi ' + name + ' from ' + outer;
					}
					<div>{greet}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('function App(__lazy0: { outer: string })');
			expect(code).toContain('function greet(__lazy1: { name: string })');
			expect(code).toContain("'hi ' + __lazy1.name + ' from ' + __lazy0.outer");
		});

		it('statement-level [a, b] = createSignal uses regular destructuring', () => {
			const { code } = compile(
				`import { createSignal } from 'solid-js';
				export function App() @{
					const [count, setCount] = createSignal(0);
					<button onClick={() => setCount(count + 1)}>{count}</button>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('const [count, setCount] = createSignal(0)');
		});
	});

	describe('Volar mappings', () => {
		it('returns a mappings result with non-empty content', () => {
			const result = compile_to_volar_mappings(
				`export function App() @{
					<div>{'hello'}</div>
				}`,
				'App.tsrx',
			);
			expect(result).toBeDefined();
			expect(result.code).toContain('function App');
			expect(Array.isArray(result.mappings)).toBe(true);
		});
	});

	describe('statement-looking JSX text (Solid-specific)', () => {
		it('renders a statement-looking line inside the template as literal text', () => {
			const { code } = compile(
				`function Card(&{ cond }: { cond: boolean }) @{
					var a = "one"
					<>
						<b>{"hello" + a}</b>
						a = "two"
						<b>{"hello" + a}</b>
						<div>{cond ? "done" : "skip"}</div>
					</>
				}`,
				'Card.tsrx',
			);
			// `a = "two"` is inside the render fragment, so it is template text, not a statement.
			expect(code).toContain('a = "two"');
			expect(code).not.toContain('_tsrx_child_');
		});
	});

	describe('ref attributes', () => {
		it('passes a single ref={expr} through as ref={expr} with no array wrapper', () => {
			const { code } = compile(
				`function App() @{
					function refA(_node) {}
					<div ref={refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('[refA');
		});

		it('passes a single TSX-style ref={expr} through as ref={expr} with no array wrapper', () => {
			const { code } = compile(
				`function App() @{
					function refA(_node) {}
					<div ref={refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('[refA');
		});

		it('keeps named ref-like props ordinary while normalizing host spreads', () => {
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

			expect(code).toContain("from '@tsrx/solid/ref'");
			expect(code).toContain('input_ref={input}');
			expect(code).toContain('{...__normalize_spread_props(props)}');
		});

		it('keeps named ref-like props ordinary without host spreads', () => {
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

			expect(code).not.toContain("from '@tsrx/solid/ref'");
			expect(code).toContain('input_ref={input}');
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
			expect(code).toContain('ref={[App__spread_props1.ref, App__spread_props2.ref, cb]}');
			expect(code.match(/__normalize_spread_props_for_ref_attr\(/g)).toHaveLength(2);
			expect(code).not.toContain('create_ref_prop');
			expect(code).not.toContain('__normalize_spread_props(first, cb)');
			expect(code).not.toContain('__normalize_spread_props(second, cb)');
		});

		it('keeps named ref-like props as ordinary props on host elements', () => {
			const { code } = compile(
				`function App() @{
					let input;
					<input input_ref={input} />
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain("from '@tsrx/solid/ref'");
			expect(code).not.toContain('normalize_spread_props');
			expect(code).toContain('input_ref={input}');
		});

		it('rejects multiple ref={expr} attributes on the same element', () => {
			expect(() =>
				compile(
					`function App() @{
						function refA(_node) {}
						function refB(_node) {}
						<div ref={refA} ref={refB}>{'hi'}</div>
					}`,
					'App.tsrx',
				),
			).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
		});

		it('passes Solid-native ref arrays through', () => {
			const { code } = compile(
				`function App() @{
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div ref={[refA, refB, refC]}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={[refA, refB, refC]}');
		});

		it('passes Solid-native ref arrays through with existing JSX syntax', () => {
			const { code } = compile(
				`function App() @{
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div ref={[refA, refB, refC]}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={[refA, refB, refC]}');
		});
	});
});
