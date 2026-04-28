import { describe, expect, it } from 'vitest';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'vue',
	rejectsComponentAwait: true,
});

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

	it('emits scoped CSS and applies the scope hash to host elements', () => {
		const { code, css } = compile(
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

		expect(css).not.toBeNull();
		expect(code).toContain(`class="card ${css?.hash}"`);
		expect(css?.code).toContain(`.card.${css?.hash}`);
		expect(css?.code).toContain('color: red;');
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

	it('multiple {ref ...} on the same DOM element compile to a combined ref callback', () => {
		const { code } = compile(
			`component App() {
				function a(node: HTMLInputElement | null) {}
				function b(node: HTMLInputElement | null) {}
				<input {ref a} {ref b} />
			}`,
			'App.tsrx',
		);

		expect(code).toMatch(/ref=\{\(node\) => \{/);
		expect(code).toMatch(/a\(node\);/);
		expect(code).toMatch(/b\(node\);/);
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
		).toThrow(/only supported as the sole child of a host element/);
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
		).toThrow(/only supported as the sole child of a host element/);
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

		expect(code).toContain('let App__StatementBodyHook1;');
		expect(code).not.toContain('let App__StatementBodyHook2;');
		expect(code).toContain('App__StatementBodyHook1 = defineVaporComponent(');
		expect(code).toContain('function StatementBodyHook1({ count }');
		expect(code).toContain('const doubled = ref(0);');
		expect(code).toContain('skip.value');
		expect(code).toContain('<StatementBodyHook1 count={count} />');
		expect(code).not.toContain('App__Continue');
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

		expect(code).toContain('<template v-for={item in items}><div>{item}</div></template>');
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

		expect(code).toContain('<template v-for={item in items} key={item.id}>');
		expect(code).toContain('key={item.id}');
		expect(code).toContain('item.text');
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

		expect(code).toContain('<template v-for={(item, i) in items} key={item.id}>');
		expect(code).toContain('{i}');
		expect(code).toContain('item.text');
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

	it('rejects pending blocks in component try statements with a Vue-specific explanation', () => {
		expect(() =>
			compile(
				`component App() {
					try {
						<div>{'Async content'}</div>
					} pending {
						<div>{'Loading...'}</div>
					} catch (error, reset) {
						<button onClick={reset}>{error.message}</button>
					}
				}`,
				'App.tsrx',
			),
		).toThrow(
			/Vue TSRX does not support `pending` blocks in component templates yet\. Vue Suspense uses fallback slots rather than a `fallback` prop/,
		);
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
