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

	it('compiles a simple if block in component bodies', () => {
		const { code } = compile(
			`component App({ visible }) {
				if (visible) {
					<div>{'Visible'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('if (visible) {');
		expect(code).toContain("const App__static1 = <div>{'Visible'}</div>;");
		expect(code).toContain('return App__static1;');
		expect(code).toContain('return null;');
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

		expect(code).toContain('if (visible) {');
		expect(code).toContain("<div>{'Visible'}</div>");
		expect(code).toContain('else {');
		expect(code).toContain("<div>{'Hidden'}</div>");
		expect(code).toMatch(/return App__static\d+;/);
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

		expect(code).toContain('.map(');
		expect(code).toContain('item) =>');
		expect(code).toContain('return <div>{item}</div>;');
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

		expect(code).toContain('.map(');
		expect(code).toContain('key={item.id}');
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
