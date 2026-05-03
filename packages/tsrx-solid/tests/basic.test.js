import { describe, expect, it } from 'vitest';
import {
	runSharedAnonymousComponentTests,
	runSharedCompileDiagnosticsTests,
	runSharedCompileTests,
} from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'solid',
	rejectsComponentAwait: true,
});

runSharedAnonymousComponentTests({ compile, name: 'solid' });
runSharedCompileTests({ compile, name: 'solid', classAttrName: 'class' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'solid' });

describe('@tsrx/solid basic', () => {
	describe('component → function', () => {
		it('wraps multiple top-level JSX children in a fragment', () => {
			const { code } = compile(
				`component App() {
					<h1>{'a'}</h1>
					<h2>{'b'}</h2>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('return <><h1>');
			expect(code).toContain('</h2></>;');
		});

		it('rejects await in component body', () => {
			expect(() =>
				compile(
					`component App() {
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

					component App() {
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
					`component App({ items }: { items: AsyncIterable<string> }) {
						for await (const item of items) {
							<div>{item}</div>
						}
					}`,
					'App.tsrx',
				),
			).toThrow(/`await` is not allowed inside Solid components/);
		});

		it('reports for await...of errors at the await keyword', () => {
			const source = `component App({ items }: { items: AsyncIterable<string> }) {
				for await (const item of items) {
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
					`component App() {
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
			const { code } = compile(`component App() { <div class="foo">{'x'}</div> }`, 'App.tsrx');
			expect(code).toContain('class="foo"');
			expect(code).not.toContain('className');
		});

		it('{ref expr} on a DOM element compiles to ref={expr}', () => {
			const { code } = compile(
				`component App() {
					let el;
					<input {ref el} />
				}`,
				'App.tsrx',
			);
			// Pass the argument through unchanged; Solid's JSX transform assigns
			// mutable-variable identifiers and invokes function values.
			expect(code).toMatch(/ref=\{el\}/);
			expect(code).not.toContain('__ref_el');
		});

		it('{ref fn} on a DOM element passes the function through', () => {
			const { code } = compile(
				`component App() {
					function divRef(node: HTMLDivElement) {}
					<div {ref divRef} />
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/ref=\{divRef\}/);
		});

		it('{ref expr} on a composite component compiles to ref={expr}', () => {
			const { code } = compile(
				`component Child(props) {
					<input {...props} />
				}

				component App() {
					function childRef(node: HTMLInputElement) {}
					<Child {ref childRef} />
				}`,
				'App.tsrx',
			);
			// Solid passes `ref` as a regular prop; when the child spreads
			// `{...props}` onto a DOM element, Solid's spread runtime invokes
			// `props.ref` with the node automatically.
			expect(code).toMatch(/<Child ref=\{childRef\}/);
		});

		it('multiple {ref ...} on the same DOM element compile to a ref array', () => {
			const { code } = compile(
				`component App() {
					function a(node: HTMLInputElement) {}
					function b(node: HTMLInputElement) {}
					<input {ref a} {ref b} />
				}`,
				'App.tsrx',
			);
			// Solid's ref runtime iterates array refs via applyRef, so every
			// entry fires with the same element.
			expect(code).toMatch(/ref=\{\[a,\s*b\]\}/);
		});

		it('multiple {ref ...} on a composite component compile to a ref array', () => {
			const { code } = compile(
				`component App() {
					function a(node: HTMLInputElement) {}
					function b(node: HTMLInputElement) {}
					function c(node: HTMLInputElement) {}
					<Child {ref a} {ref b} {ref c} />
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/<Child ref=\{\[a,\s*b,\s*c\]\}/);
		});

		it('{text expr} as the only child of a host element lowers to textContent', () => {
			// Setting `textContent` as a DOM property is cheaper than Solid's
			// default `insert()`-based text-node binding, so hoist the single
			// `{text ...}` child up to an attribute on the parent element.
			const { code } = compile(
				`component App({ name }: { name: string | null }) {
					<p>{text name}</p>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/<p\s+textContent=\{name == null \? '' : name \+ ''\}\s*\/>/);
			expect(code).not.toContain('</p>');
		});

		it('does not hoist {text expr} when there are sibling children', () => {
			// With siblings, setting `textContent` would clobber them.
			const { code } = compile(
				`component App({ name }: { name: string | null }) {
					<p>{text name}<span>{'!'}</span></p>
				}`,
				'App.tsrx',
			);
			expect(code).not.toContain('textContent=');
			expect(code).toContain('</p>');
		});

		it('does not hoist {text expr} on composite components', () => {
			// `textContent` is a DOM primitive; on a composite component it
			// would just be an opaque prop with no defined semantics.
			const { code } = compile(
				`component Label(props: { children?: any }) {
					<span>{props.children}</span>
				}

				component App({ name }: { name: string | null }) {
					<Label>{text name}</Label>
				}`,
				'App.tsrx',
			);
			expect(code).not.toContain('textContent=');
			expect(code).toContain('<Label>');
			expect(code).toContain('</Label>');
		});

		it('does not hoist {text expr} when the user already set textContent', () => {
			const { code } = compile(
				`component App({ name, fallback }: { name: string | null; fallback: string }) {
					<p textContent={fallback}>{text name}</p>
				}`,
				'App.tsrx',
			);
			// User-supplied `textContent` wins; the child is left as a regular
			// text binding so no duplicate attribute is emitted.
			expect(code).toContain('textContent={fallback}');
			expect(code).not.toMatch(/textContent=\{name == null/);
		});

		it('still hoists {text expr} alongside other attributes', () => {
			const { code } = compile(
				`component App({ name, id }: { name: string | null; id: string }) {
					<p class="greeting" id={id}>{text name}</p>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/textContent=\{name == null \? '' : name \+ ''\}/);
			expect(code).toContain('class="greeting"');
			expect(code).toContain('id={id}');
			expect(code).not.toContain('</p>');
		});
	});

	describe('control flow', () => {
		it('simple if → <Show when>', () => {
			const { code } = compile(
				`component App({ n }: { n: number }) {
					if (n > 0) {
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
				`component App({ n }: { n: number }) {
					if (n > 0) {
						<div>{'pos'}</div>
					} else {
						<div>{'neg'}</div>
					}
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<Show when={n > 0} fallback=');
		});

		it('if/else-if/else → <Switch>/<Match>', () => {
			const { code } = compile(
				`component App({ n }: { n: number }) {
					if (n > 10) {
						<span>{'big'}</span>
					} else if (n > 5) {
						<span>{'mid'}</span>
					} else {
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
				`component App({ items }: { items: number[] }) {
					for (const item of items; index i) {
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
				`component App({ items }: { items: { id: string; name: string }[] }) {
					for (const item of items; key item.id) {
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
				`component App() {
					try {
						<div>{'content'}</div>
					} catch (err, reset) {
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
				`component App() {
					try {
						<div>{'ready'}</div>
					} pending {
						<div>{'loading'}</div>
					} catch (err) {
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
				`component App({ kind }: { kind: string }) {
					switch (kind) {
						case 'a': <span>{'A'}</span>; break;
						case 'b': <span>{'B'}</span>; break;
						default: <span>{'?'}</span>;
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
				`component FeatureCard({ items }: { items: string[] }) {
					<ul>
						const [state, setState] = createSignal();
						for (const item of items; index i) {
							<li>{item}</li>
						}
						<div>
							console.log('logged');
							debugger;
						</div>
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
				`component Child() {
					<div>
						const x = 1;

						console.log(x);
					</div>
				}`,
				'Child.tsrx',
			);

			expect(code).toContain('return <div>{(() => {');
			expect(code).toContain('const x = 1;');
			expect(code).toContain('console.log(x);');
			expect(code).toContain('return null;');
		});

		it('early-return keeps non-JSX after statements in outer body', () => {
			// Regression: non-JSX statements declared after `if (cond) return;`
			// (e.g. createSignal calls) must run once at setup rather than
			// inside the generated <Show> callback, otherwise they re-execute
			// on every reactive toggle and lose state.
			const { code } = compile(
				`import { createSignal } from 'solid-js';
				component App({ cond }: { cond: boolean }) {
					if (cond) return;
					const [doubled, setDoubled] = createSignal(0);
					<div>{doubled()}</div>
				}`,
				'App.tsrx',
			);
			// The signal declaration should precede the <Show> element in the
			// outer function body, not live inside the Show's function child.
			const signal_idx = code.indexOf('createSignal(0)');
			const show_idx = code.indexOf('<Show when={!cond}');
			expect(signal_idx).toBeGreaterThan(-1);
			expect(show_idx).toBeGreaterThan(-1);
			expect(signal_idx).toBeLessThan(show_idx);
		});

		it('early-return keeps preceding JSX outside the guarded continuation', () => {
			const { code } = compile(
				`export default component A() {
					let early = true;
					<>"Hello"</>
					if (early) {
						return
					}
					<>"World"</>
				}`,
				'A.tsrx',
			);

			const hello_idx = code.indexOf('<>"Hello"</>');
			const show_idx = code.indexOf('<Show when={!early}');
			const world_idx = code.indexOf('<>"World"</>');
			expect(hello_idx).toBeGreaterThan(-1);
			expect(show_idx).toBeGreaterThan(-1);
			expect(world_idx).toBeGreaterThan(show_idx);
			expect(hello_idx).toBeLessThan(show_idx);
			expect(code).not.toContain('return <Show when={!early}');
		});

		it('nests sequential early-return continuations', () => {
			const { code } = compile(
				`export default component A() {
					let early = true
					<>"Hello"</>
					if (early) {
						return
					}
					<>"World"</>
					if (!early) {
						return
					}
					<>"done"</>
				}`,
				'A.tsrx',
			);

			const hello_idx = code.indexOf('<>"Hello"</>');
			const outer_show_idx = code.indexOf('<Show when={!early}');
			const world_idx = code.indexOf('<>"World"</>');
			const inner_show_idx = code.indexOf('<Show when={early}');
			const done_idx = code.indexOf('<>"done"</>');
			expect(hello_idx).toBeGreaterThan(-1);
			expect(outer_show_idx).toBeGreaterThan(hello_idx);
			expect(world_idx).toBeGreaterThan(outer_show_idx);
			expect(inner_show_idx).toBeGreaterThan(world_idx);
			expect(done_idx).toBeGreaterThan(inner_show_idx);
			expect(code).not.toContain('<Show when={!early}>{(_) =>');
		});
	});

	describe('<tsx> fragments', () => {
		it('<tsx>...</tsx> with multiple children compiles to fragment', () => {
			const { code } = compile(
				`component App() {
					<tsx>
						<h1>{'a'}</h1>
						<h2>{'b'}</h2>
					</tsx>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('<><h1>');
		});

		it('rejects <tsx:react> compat block', () => {
			expect(() =>
				compile(
					`component App() {
						<tsx:react>
							<h1>a</h1>
						</tsx:react>
					}`,
					'App.tsrx',
				),
			).toThrow(/<tsx:react>/);
		});
	});

	describe('scoped CSS', () => {
		it('emits css and annotates elements with the scope class', () => {
			const { code, css } = compile(
				`export component App() {
					<div class="wrapper">{'hi'}</div>
					<style>
						.wrapper { color: red; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(css).not.toBeNull();
			expect(css?.code).toContain('.wrapper.');
			// hash is applied to element's class attribute
			expect(code).toMatch(/class="wrapper tsrx-[a-z0-9]+"/);
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
	});

	describe('lazy destructuring (variable form)', () => {
		it('let [a, b] = createSignal uses regular destructuring', () => {
			const { code } = compile(
				`import { createSignal } from 'solid-js';
				export component App() {
					let [count, setCount] = createSignal(0);
					<button onClick={() => setCount(count + 1)}>{text count}</button>
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
				`export component App(&{ outer }: { outer: string }) {
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
				export component App() {
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
				`export component App() {
					<div>{'hello'}</div>
				}`,
				'App.tsrx',
			);
			expect(result).toBeDefined();
			expect(result.code).toContain('function App');
			expect(Array.isArray(result.mappings)).toBe(true);
		});
	});

	// Solid-specific: the early-return path lifts JSX into a `<Show>`, which
	// the generic shared tests don't assert on. The shared harness covers
	// the same interleave-capture behavior for `<div>`-wrapped and top-level
	// component bodies, so only the `<Show>` variant stays here.
	describe('interleaved statements and JSX children (Solid-specific)', () => {
		it('preserves source order for interleaved JSX across an early-return guard', () => {
			const { code } = compile(
				`component Card(&{ cond }: { cond: boolean }) {
					var a = "one"
					<b>{"hello" + a}</b>
					a = "two"
					<b>{"hello" + a}</b>
					if (cond) return
					<div>{"done"}</div>
				}`,
				'Card.tsrx',
			);

			// The early-return path lifts JSX into a <Show>, but mutations between
			// JSX siblings must still be honored — each JSX child is captured at its
			// source position in the outer body so the first <b> sees a = "one".
			const first_capture = code.indexOf('_tsrx_child_0');
			const assign_two = code.indexOf('a = "two"');
			const second_capture = code.indexOf('_tsrx_child_1');
			expect(first_capture).toBeGreaterThan(-1);
			expect(assign_two).toBeGreaterThan(first_capture);
			expect(second_capture).toBeGreaterThan(assign_two);
			expect(code).toContain('<Show');
		});
	});

	describe('ref attributes', () => {
		it('passes a single {ref expr} through as ref={expr} with no array wrapper', () => {
			const { code } = compile(
				`component App() {
					function refA(_node) {}
					<div {ref refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('[refA');
		});

		it('passes a single TSX-style ref={expr} through as ref={expr} with no array wrapper', () => {
			const { code } = compile(
				`component App() {
					function refA(_node) {}
					<div ref={refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('[refA');
		});

		it('rejects multiple ref={expr} attributes on the same element', () => {
			expect(() =>
				compile(
					`component App() {
						function refA(_node) {}
						function refB(_node) {}
						<div ref={refA} ref={refB}>{'hi'}</div>
					}`,
					'App.tsrx',
				),
			).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
		});

		it('collapses multiple {ref expr} keyword-form refs into a Solid-native array literal', () => {
			const { code } = compile(
				`component App() {
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div {ref refA} {ref refB} {ref refC}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={[refA, refB, refC]}');
		});

		it('combines a single TSX-style ref={expr} with multiple {ref expr} keyword-form refs', () => {
			const { code } = compile(
				`component App() {
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div ref={refA} {ref refB} {ref refC}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={[refA, refB, refC]}');
		});
	});
});
