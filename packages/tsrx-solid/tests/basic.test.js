import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

describe('@tsrx/solid basic', () => {
	describe('component → function', () => {
		it('emits a plain function when not exported', () => {
			const { code } = compile(
				`component App() {
					<div>{'Hello'}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('function App()');
			expect(code).not.toContain('export function App');
		});

		it('preserves export keyword', () => {
			const { code } = compile(
				`export component App() {
					<div>{'Hello'}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('export function App()');
			expect(code).not.toContain('export export');
		});

		it('preserves export default', () => {
			const { code } = compile(
				`export default component App() {
					<div>{'Hello'}</div>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('export default function App()');
		});

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

		it('{text expr} coerces null/undefined to empty string', () => {
			const { code } = compile(
				`component App({ name }: { name: string | null }) {
					<p>{text name}</p>
				}`,
				'App.tsrx',
			);
			expect(code).toContain("name == null ? '' : name + ''");
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

		it('rejects `{html expr}` as a child of a host element', () => {
			// The `{html ...}` primitive is Ripple-only. On the Solid target
			// users should spell it as `innerHTML={...}` on the element so
			// the DOM-specific semantics are explicit in the source.
			expect(() =>
				compile(
					`component App({ markup }: { markup: string }) {
						<article>{html markup}</article>
					}`,
					'App.tsrx',
				),
			).toThrow(/not supported on the Solid target/);
		});

		it('rejects `{html expr}` at the component body level', () => {
			// Top-level `{html ...}` reaches `to_jsx_child` rather than the
			// element lowering path; both surfaces should report the same
			// error instead of silently producing garbage AST.
			expect(() =>
				compile(
					`component App({ markup }: { markup: string }) {
						{html markup}
					}`,
					'App.tsrx',
				),
			).toThrow(/not supported on the Solid target/);
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

		it('#style.name compiles to a scoped class literal', () => {
			const { code } = compile(
				`export component App() {
					<div class={#style.root}>{'hi'}</div>
					<style>
						.root { color: blue; }
					</style>
				}`,
				'App.tsrx',
			);
			// `#style.root` macro expands to `"hash root"`; the per-element scope
			// class is additionally templated in, mirroring @tsrx/react behavior.
			expect(code).toMatch(/"tsrx-[a-z0-9]+ root"/);
			expect(code).not.toContain('#style');
		});
	});

	describe('lazy destructuring (variable form)', () => {
		it('let &[a, b] = expr rewrites references', () => {
			const { code } = compile(
				`import { createSignal } from 'solid-js';
				export component App() {
					let &[count, setCount] = createSignal(0);
					<button onClick={() => setCount(count + 1)}>{text count}</button>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('let __lazy0 = createSignal(0)');
			expect(code).toContain('__lazy0[1](__lazy0[0] + 1)');
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

		it('rewrites statement-level lazy assignment as a const declaration', () => {
			const { code } = compile(
				`import { createSignal } from 'solid-js';
				export component App() {
					&[count, setCount] = createSignal(0);
					<button onClick={() => setCount(count + 1)}>{count}</button>
				}`,
				'App.tsrx',
			);
			expect(code).toContain('const __lazy0 = createSignal(0)');
			expect(code).toContain('__lazy0[1](__lazy0[0] + 1)');
			expect(code).toContain('{__lazy0[0]}');
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
});
