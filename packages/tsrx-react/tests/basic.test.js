import { describe, expect, it } from 'vitest';
import {
	runSharedCompileDiagnosticsTests,
	runSharedCompileTests,
} from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'react',
	rejectsComponentAwait: false,
});

runSharedCompileTests({ compile, name: 'react', classAttrName: 'className' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'react' });

/**
 * @import { CodeMapping } from '@tsrx/core/types';
 */

/**
 * @param {CodeMapping[]} mappings
 */
function get_duplicate_mapping_keys(mappings) {
	const counts = new Map();

	for (const mapping of mappings) {
		const key = JSON.stringify({
			sourceOffsets: mapping.sourceOffsets,
			generatedOffsets: mapping.generatedOffsets,
			lengths: mapping.lengths,
			generatedLengths: mapping.generatedLengths,
			data: mapping.data,
		});

		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return [...counts.entries()].filter(([, count]) => count > 1);
}

describe('@tsrx/react basic', () => {
	it('emits async component functions for top-level await without requiring use server', () => {
		const { code } = compile(
			`export component App() {
				const data = await fetchData();
				<div>{data}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('export async function App()');
		expect(code).toContain('const data = await fetchData()');
	});

	it('still emits async component functions for await when use server is present', () => {
		const { code } = compile(
			`'use server';

			export component App() {
				const data = await fetchData();
				<div>{data}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('export async function App()');
		expect(code).toContain('const data = await fetchData()');
		expect(code).toContain("'use server';");
	});

	it('rejects for await...of in templates without requiring use server', () => {
		expect(() =>
			compile(
				`export component App({ items }: { items: AsyncIterable<string> }) {
					for await (const item of items) {
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			),
		).toThrow(/does not support `for await\.\.\.of`/);
	});

	it('rejects for await...of in templates even when use server is present', () => {
		expect(() =>
			compile(
				`'use server';

				export component App({ items }: { items: AsyncIterable<string> }) {
					for await (const item of items) {
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			),
		).toThrow(/does not support `for await\.\.\.of`/);
	});

	it('does not require use server for await inside nested async functions', () => {
		const { code } = compile(
			`export component App() {
				const load = async () => await fetchData();
				<button onClick={load}>{'Load'}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('export function App()');
		expect(code).not.toContain('export async function App()');
	});

	it('applies for-control-flow keys to rendered elements', () => {
		const { code } = compile(
			`export component App({ items }: { items: { id: string, text: string }[] }) {
				for (const item of items; key item.id) {
					<div>{item.text}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('.map(');
		expect(code).toContain('key={item.id}');
		expect(code).not.toContain('does not support `key` in `for` control flow');
	});

	// `does not apply scoped css hashes to composite components`
	// additionally asserted the Volar mapping had no errors and its code
	// omitted `<Child className=`. Keep the mapping-assertion piece here
	// since the shared harness only runs `compile` for this class of test.
	it('does not apply scoped css hashes to composite components (Volar mappings)', () => {
		const source = `component Child() {
				<div>{'Hello world'}</div>
			}

			export component App() {
				<Child />
				<div>{'Styled content'}</div>

				<style>
					.div {
						color: red;
					}
				</style>
			}`;
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(mappings.code).not.toContain('<Child className=');
		expect(mappings.errors).toEqual([]);
	});

	it('applies scoped css hashes to elements inside control flow', () => {
		const { code, css } = compile(
			`export component App() {
				if (true) {
					<div>{'inside'}</div>
				}

				<style>
					.div {
						color: red;
					}
				</style>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBeNull();
		expect(code).toContain(`className="${css.hash}"`);
		expect(code).toContain(`App__static1 = <div className="${css.hash}">`);
		expect(css.code).toContain(`.div.${css.hash}`);
	});

	it('renders component-body if statements as React expressions', () => {
		const { code } = compile(
			`export component App() {
				const count = 2;

				if (count > 1) {
					<div>{'Count is more than one'}</div>
				}

				<button>{count}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const count = 2;');
		expect(code).toContain("const App__static1 = <div>{'Count is more than one'}</div>;");
		expect(code).toContain(
			'return <>{count > 1 ? App__static1 : null}<button>{count}</button></>;',
		);
	});

	it('renders if-else statements as React expressions', () => {
		const { code } = compile(
			`export component App() {
				const ready = false;

				if (ready) {
					<div>{'Ready'}</div>
				} else {
					<div>{'Loading'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const App__static2 = <div>{'Ready'}</div>;");
		expect(code).toContain("const App__static1 = <div>{'Loading'}</div>;");
		expect(code).toContain('return ready ? App__static2 : App__static1;');
	});

	it('renders component-body for-of statements as React expressions', () => {
		const { code } = compile(
			`export component App() {
				const items = [1, 2, 3];

				for (const item of items; index i) {
					<div key={i}>{item}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const items = [1, 2, 3];');
		expect(code).toContain('items.map((item, i) => {');
		expect(code).toContain('return <div key={i}>{item}</div>;');
	});

	it('applies for-of key clauses to emitted React elements', () => {
		const { code } = compile(
			`export component App() {
				const items = [1, 2, 3];

				for (const item of items; index i; key item) {
					<div>{item}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('items.map((item, i) => {');
		expect(code).toContain('return <div key={item}>{item}</div>;');
	});

	it('prefers inline JSX keys over for-of key clauses for emitted React elements', () => {
		const { code } = compile(
			`export component App() {
				const items = [{ id: 'a', inner: 'x' }];

				for (const item of items; key item.id) {
					<div key={item.inner}>{item.id}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('items.map((item) => {');
		expect(code).toContain('return <div key={item.inner}>{item.id}</div>;');
		expect(code).not.toContain('return <div key={item.id}>{item.id}</div>;');
	});

	it('supports lone early returns in component-body if statements', () => {
		const { code } = compile(
			`export component App() {
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

		expect(code).toContain('if (count > 2) {');
		expect(code).toContain("const App__static1 = <div>{'Count is more than one'}</div>;");
		expect(code).toContain('return count > 1 ? App__static1 : null;');
		expect(code).toContain(
			'return <>{count > 1 ? App__static1 : null}<button>{count}</button></>;',
		);
	});

	it('keeps transforming unreachable component body statements after bare returns', () => {
		const { code } = compile(
			`export component App() {
				const foo = 'string';

				return;

				const bar = foo.trim();
				<div>{bar}</div>
			}`,
			'App.tsrx',
		);

		const return_pos = code.indexOf('return null;');
		const bar_pos = code.indexOf('const bar = foo.trim();');
		const tail_return_pos = code.indexOf('return <div>{bar}</div>;');

		expect(return_pos).toBeGreaterThan(-1);
		expect(bar_pos).toBeGreaterThan(return_pos);
		expect(tail_return_pos).toBeGreaterThan(bar_pos);
	});

	it('extracts typed cached continuation helpers after early-return if statements', () => {
		const source = `import { useState, useEffect } from 'react';

			export component App() {
				const [count, setCount] = useState(0);

				if (count > 2) {
					return;
				}

				useEffect(() => {
					console.log(count);
				}, [count]);

				<button onClick={() => setCount(count + 1)}>{count}</button>
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('useEffect(');
		expect(code).toContain('count > 2');
		expect(code).toContain('let App__StatementBodyHook1;');
		expect(code).toContain('let App__StatementBodyHook2;');
		expect(code).toContain('const _tsrx_StatementBodyHook2_count = count;');
		expect(code).toContain('const _tsrx_StatementBodyHook2_setCount = setCount;');
		expect(code).toContain('const StatementBodyHook2 = App__StatementBodyHook2 ??');
		expect(code).toContain('<button onClick={() => setCount(count + 1)}>{count}</button>');
		expect(code).not.toContain('App__Continue');
		expect(mappings.errors).toEqual([]);
		expect(mappings.mappings.length).toBeGreaterThan(0);
	});

	it('extracts rendered early-return branches while preserving source local names', () => {
		const source = `import { useEffect } from 'react';

			declare function getFoo(): string | null;

			export component App() {
				const foo = getFoo();

				if (!foo) {
					<div>{'Foo not found'}</div>
					return;
				}

				useEffect(() => {
					console.log(foo);
				}, [foo]);

				<div>{foo.trim()}</div>
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');
		const source_if_foo = source.indexOf('foo', source.indexOf('if (!foo'));
		const generated_if_foo = mappings.code.indexOf('foo', mappings.code.indexOf('if (!foo'));
		const if_foo_mapping = mappings.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === source_if_foo &&
				mapping.generatedOffsets[0] === generated_if_foo &&
				mapping.lengths[0] === 'foo'.length,
		);

		expect(code).toContain('let App__StatementBodyHook1;');
		expect(code).toContain('let App__StatementBodyHook2;');
		expect(code).not.toContain('const _tsrx_StatementBodyHook1_foo = foo;');
		expect(code).toContain('const _tsrx_StatementBodyHook2_foo = foo;');
		expect(code).toContain('return App__static1;');
		expect(code).toContain('useEffect(');
		expect(code).toContain('return <div>{foo.trim()}</div>;');
		expect(code).not.toContain('App__Continue');
		expect(if_foo_mapping?.data.completion).toBe(true);
	});

	it('declares helper prop type aliases before typed cached helpers', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			declare function getFoo(): string | null;

			export component App() {
				const foo = getFoo();

				if (!foo) {
					<div>{'Foo not found'}</div>
					return;
				}

				useEffect(() => {
					console.log(foo);
				}, [foo]);

				<div>{foo.trim()}</div>
			}`,
			'App.tsrx',
		);

		const alias_pos = code.indexOf('const _tsrx_StatementBodyHook2_foo = foo;');
		const helper_pos = code.indexOf('const StatementBodyHook2 = App__StatementBodyHook2 ??');
		const type_ref_pos = code.indexOf('foo: typeof _tsrx_StatementBodyHook2_foo');

		expect(alias_pos).toBeGreaterThan(-1);
		expect(helper_pos).toBeGreaterThan(alias_pos);
		expect(type_ref_pos).toBeGreaterThan(helper_pos);
	});

	it('does not emit duplicate Volar mappings for helper-extracted React output', () => {
		const source = `import { useState, useEffect } from 'react';

			component Child() {
				<div>
					const x = 1;

					console.log(x);
				</div>
			}

			export component App() {
				const [count, setCount] = useState(0);
				const items = [1, 2, 3];

				<Child />

				<h1>
					{'Hello World'}
					if (count > 1) {
						return;
					}
				</h1>

				if (count > 1) {
					<div>
						const [x] = useState(1);

						{'Count is more than ' + x}
					</div>
				}

				useEffect(() => {
					console.log(count);
				}, [count]);

				<button onClick={() => setCount(count + 1)}>{count}</button>

				if (count > 2) {
					return;
				}

				for (const item of items; index i) {
					<div key={i}>{item}</div>
				}
			}`;

		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(mappings.errors).toEqual([]);
		expect(get_duplicate_mapping_keys(mappings.mappings)).toEqual([]);
	});

	it('maps component declarations to both the component keyword and identifier', () => {
		const source = `export component App() {
			<div>{'Hello world'}</div>
		}`;
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');
		const component_offset = source.indexOf('component App');
		const app_offset = source.indexOf('App', component_offset);

		const component_keyword_mapping = mappings.mappings.find(
			(mapping) =>
				mapping.sourceOffsets[0] === component_offset && mapping.lengths[0] === 'component'.length,
		);
		const component_identifier_mapping = mappings.mappings.find(
			(mapping) => mapping.sourceOffsets[0] === app_offset && mapping.lengths[0] === 'App'.length,
		);

		expect(mappings.errors).toEqual([]);
		expect(component_keyword_mapping).toBeDefined();
		expect(component_keyword_mapping?.data.customData.hover).toBeTypeOf('function');
		expect(component_keyword_mapping?.generatedLengths[0]).toBe('function'.length);
		expect(component_identifier_mapping).toBeDefined();
		expect(component_identifier_mapping?.data.semantic).toBe(true);
		expect(component_identifier_mapping?.data.navigation).toBe(true);
		expect(component_identifier_mapping?.data.customData.hover).toBeTypeOf('function');
	});

	it('supports loose-mode Volar parsing for incomplete React source', () => {
		const source = `export component App() {
	<tsx:react>1
}`;

		expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();

		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(result.errors).toEqual([]);
	});

	it('renders component-body switch statements as React expressions', () => {
		const { code } = compile(
			`export component App() {
				const count = 0;

				switch (count) {
					case 0:
						<div>{'Zero'}</div>
						break;
					default:
						<div>{'Other'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('switch (count) {');
		expect(code).toContain("return <div>{'Zero'}</div>;");
		expect(code).toContain("return <div>{'Other'}</div>;");
		expect(code).toContain('return null;');
	});

	it('keeps hooks unconditional after switch-based early exits', () => {
		const source = `import { useEffect } from 'react';

			export component App() {
				const count = 0;

				switch (count) {
					case 0:
						return;
				}

				useEffect(() => {
					console.log(count);
				}, [count]);

				<div>{count}</div>
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('useEffect(');
		expect(code).toContain('switch (count) {');
		expect(code).toContain('case 0:');
		expect(code).toContain('return null;');
		expect(code.indexOf('useEffect(')).toBeLessThan(code.indexOf('return <>'));
		expect(mappings.errors).toEqual([]);
	});

	it('supports statement-based children inside elements', () => {
		const { code } = compile(
			`component Child() {
				<div>
					const x = 1;

					console.log(x);
				</div>
			}`,
			'Child.tsrx',
		);

		expect(code).toContain('function Child() {');
		expect(code).toContain('const x = 1;');
		expect(code).toContain('console.log(x);');
		expect(code).toContain('return <div>{(() => {');
		expect(code).toContain('return null;');
	});

	it('supports less-than comparisons in statement-based element children without whitespace', () => {
		const { code } = compile(
			`component TodoList({ items }: { items: { text: string }[] }) {
				<ul>var a = 3
				<4;</ul>
			}`,
			'TodoList.tsrx',
		);

		expect(code).toContain('function TodoList');
		expect(code).toContain('return <ul>{(() => {');
		expect(code).toContain('var a = 3 < 4;');
		expect(code).toContain('return null;');
	});

	it('allows JSX fragments at line start in component bodies', () => {
		const { code } = compile(
			`export component App() {
				<>
					<div>{'hello'}</div>
				</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("<div>{'hello'}</div>");
		expect(code).not.toContain('<tsx>');
	});

	it('allows JSX fragments at line start inside element children', () => {
		const { code } = compile(
			`component App() {
				<div>
					<>
						<span>{'inner'}</span>
					</>
				</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("<div><span>{'inner'}</span></div>");
		expect(code).not.toContain('<tsx>');
	});

	it('allows JSX fragments alongside other elements in component bodies', () => {
		const { code } = compile(
			`export component App() {
				<h1>{'title'}</h1>
				<>
					<p>{'content'}</p>
				</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("<h1>{'title'}</h1>");
		expect(code).toContain('return <>');
		expect(code).toContain('App__static1');
		expect(code).toContain('App__static2');
		expect(code).not.toContain('<tsx>');
	});

	it('supports early returns inside element child statement bodies', () => {
		const { code } = compile(
			`component App() {
				const count = 0;

				<h1>
					{'Hello World'}
					if (count > 1) {
						return;
					}
					<span>{'After'}</span>
				</h1>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('<h1>{(() => {');
		expect(code).toContain('if (count > 1) {');
		expect(code).toContain("return 'Hello World';");
		expect(code).toContain("<span>{'After'}</span>");
	});

	it('extracts hook-bearing element child statement bodies into local components', () => {
		const source = `import { useState } from 'react';

			component App() {
				if (true) {
					<div>
						const [x] = useState(1);

						{'Count is more than ' + x}
					</div>
				}
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('function StatementBodyHook1() {');
		expect(code).toContain('const [x] = useState(1);');
		expect(code).toContain('<StatementBodyHook1 />');
		expect(mappings.errors).toEqual([]);
	});

	it('supports fragment shorthand passed as props', () => {
		const source = `component Child(props) {
			<div>{props.content}</div>
		}

			export component App() {
				<Child content={<><span>{'hello'}</span></>} />
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('function Child(props) {');
		expect(code).toContain('<Child content={');
		expect(code).toContain("<span>{'hello'}</span>");
		expect(code).not.toContain('<tsx>');
		expect(mappings.errors).toEqual([]);
	});

	it('supports dynamic elements', () => {
		const source = `export component App() {
			const dom = 'section';

			<@dom class="box">
				<span>{'hello'}</span>
			</@dom>
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain("const dom = 'section';");
		expect(code).toContain('const DynamicElement = dom;');
		expect(code).toContain('<DynamicElement className="box">');
		expect(code).toContain("<span>{'hello'}</span>");
		expect(code).toContain('return DynamicElement');
		expect(code).toContain('? <DynamicElement className="box">');
		expect(mappings.errors).toEqual([]);
	});

	it('supports member-form dynamic elements', () => {
		const source = `export component App(props) {
			<@props.as class="box">
				<span>{'hello'}</span>
			</@props.as>
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('function App(props) {');
		expect(code).toContain('const DynamicElement = props.as;');
		expect(code).toContain('<DynamicElement className="box">');
		expect(code).toContain("<span>{'hello'}</span>");
		expect(mappings.errors).toEqual([]);
	});

	it('passes if-statement children through composite components via {children}', () => {
		const source = `component Wrapper(children) {
			<div>{children}</div>
		}

		export component App() {
			<Wrapper>
				if (true) {
					<span>{'visible'}</span>
				}
			</Wrapper>
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('function Wrapper(children)');
		expect(code).toContain('{children}');
		expect(code).toContain("{'visible'}");
		expect(mappings.errors).toEqual([]);
	});

	it('transforms {ref fn} on elements to ref={fn}', () => {
		const source = `export component App() {
			function divRef(node) {
				console.log(node);
			}

			<div {ref divRef}>{'Hello'}</div>
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('ref={divRef}');
		expect(code).not.toContain('{ref divRef}');
		expect(mappings.errors).toEqual([]);
	});

	it('transforms {ref fn} on composite components to ref={fn}', () => {
		const source = `component Child(props) {
			const { ...rest } = props;
			<input {...rest} />
		}

		export component App() {
			function childRef(node) {
				console.log(node);
			}

			<Child {ref childRef} />
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('ref={childRef}');
		expect(code).toContain('function Child(props)');
		expect(mappings.errors).toEqual([]);
	});

	it('transforms {ref fn} alongside other attributes', () => {
		const source = `export component App() {
			function inputRef(node) {}

			<input type="text" {ref inputRef} class="field" />
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('ref={inputRef}');
		expect(code).toContain('type="text"');
		expect(code).toContain('className="field"');
		expect(mappings.errors).toEqual([]);
	});

	it('transforms try/catch into ErrorBoundary wrapper', () => {
		const { code } = compile(
			`component ThrowingChild() {
				<div>{'might throw'}</div>
			}

			export component App() {
				try {
					<ThrowingChild />
				} catch (err) {
					<p>{'caught error'}</p>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('TsrxErrorBoundary');
		expect(code).toContain("from '@tsrx/react/error-boundary'");
		expect(code).toContain('fallback=');
		expect(code).toContain("{'caught error'}");
		// Should not import Suspense when there's no pending block
		expect(code).not.toContain('Suspense');
	});

	it('transforms try/pending into Suspense wrapper', () => {
		const { code } = compile(
			`export component App() {
				try {
					<div>{'async content'}</div>
				} pending {
					<p>{'loading...'}</p>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Suspense');
		expect(code).toContain("from 'react'");
		expect(code).toContain('fallback=');
		expect(code).toContain("{'loading...'}");
		// Should not import ErrorBoundary when there's no catch block
		expect(code).not.toContain('TsrxErrorBoundary');
	});

	it('transforms try/pending/catch into ErrorBoundary wrapping Suspense', () => {
		const { code } = compile(
			`export component App() {
				try {
					<div>{'async content'}</div>
				} pending {
					<p>{'loading...'}</p>
				} catch (err) {
					<p>{'caught error'}</p>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('TsrxErrorBoundary');
		expect(code).toContain('Suspense');
		// ErrorBoundary should wrap Suspense (outer first)
		const errorBoundaryIndex = code.indexOf('<TsrxErrorBoundary');
		const suspenseIndex = code.indexOf('<Suspense');
		expect(errorBoundaryIndex).toBeLessThan(suspenseIndex);
	});

	it('transforms catch with reset parameter', () => {
		const { code } = compile(
			`export component App() {
				try {
					<div>{'content'}</div>
				} catch (err, reset) {
					<button onClick={reset}>{'retry'}</button>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('TsrxErrorBoundary');
		expect(code).toContain('fallback=');
		// The fallback should be a function that receives err and reset
		expect(code).toContain('err');
		expect(code).toContain('reset');
	});

	it('rejects JavaScript try/finally in component templates', () => {
		expect(() =>
			compile(
				`export component App() {
					try {
						<div>{'content'}</div>
					} catch (err) {
						<p>{'error'}</p>
					} finally {
						console.log('done');
					}
				}`,
				'App.tsrx',
			),
		).toThrow('does not support JavaScript `try/finally`');
	});

	it('rejects try/pending when try body has no JSX', () => {
		expect(() =>
			compile(
				`export component App() {
					try {
						const x = 1;
					} pending {
						<p>{'loading'}</p>
					}
				}`,
				'App.tsrx',
			),
		).toThrow('must contain a template in their main body');
	});

	it('rejects try/pending when pending body has no JSX', () => {
		expect(() =>
			compile(
				`export component App() {
					try {
						<div>{'content'}</div>
					} pending {
						const x = 1;
					}
				}`,
				'App.tsrx',
			),
		).toThrow('must contain a template in their "pending" body');
	});

	it('transforms try with use() inside for Suspense triggering', () => {
		const { code } = compile(
			`import { use } from 'react';

			export component App() {
				try {
					const data = use(fetchData());
					<div>{data}</div>
				} pending {
					<p>{'loading...'}</p>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Suspense');
		expect(code).toContain('use(fetchData())');
	});

	it('applies scoped CSS hashes inside try blocks', () => {
		const { code, css } = compile(
			`export component App() {
				try {
					<div class="content">{'hello'}</div>
				} catch (err) {
					<p class="error">{'error'}</p>
				}

				<style>
					.content { color: blue; }
					.error { color: red; }
				</style>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBeNull();
		expect(code).toContain(`className="content ${css.hash}"`);
		expect(code).toContain(`className="error ${css.hash}"`);
	});

	// ── Hook extraction from control flow ──

	it('extracts hooks from if-branch into a local component', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const show = true;
				if (show) {
					const [count, setCount] = useState(0);
					<div>{count}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		expect(code).toContain('useState(0)');
		// The hook call should be inside the helper component, not the IIFE
		const hook_pos = code.indexOf('useState(0)');
		const helper_pos = code.indexOf('function StatementBodyHook');
		expect(hook_pos).toBeGreaterThan(helper_pos);
	});

	it('types hook helper props from branch-local aliases', () => {
		const { code } = compile(
			`import { useState } from 'react';

			declare function getFoo(): string | null;

			export component App() {
				const foo = getFoo();
				if (foo) {
					const [count] = useState(0);
					<div>{foo.trim()}{count}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('let App__StatementBodyHook1;');
		expect(code).toContain('const _tsrx_StatementBodyHook1_foo = foo;');
		expect(code).toContain('const StatementBodyHook1 = App__StatementBodyHook1 ??');
		expect(code).toContain(
			'function StatementBodyHook1({ foo }: { foo: typeof _tsrx_StatementBodyHook1_foo })',
		);
		expect(code).toContain('<StatementBodyHook1 foo={foo} />');
	});

	it('extracts hooks from if-else branches into separate local components', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const show = true;
				if (show) {
					const [a] = useState(1);
					<div>{a}</div>
				} else {
					const [b] = useState(2);
					<span>{b}</span>
				}
			}`,
			'App.tsrx',
		);

		// Both branches should get their own hook-safe components
		const matches = code.match(/function StatementBodyHook\d+/g);
		expect(matches).not.toBeNull();
		expect(matches.length).toBeGreaterThanOrEqual(2);
	});

	it('extracts hooks from for-of loop body into a local component', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const items = [1, 2, 3];
				for (const item of items) {
					const [active, setActive] = useState(false);
					<div key={item}>{active ? 'yes' : 'no'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		// Hook-bearing for-of bodies emit `Array.from(source, callback)` so
		// any Iterable works, with the helper hoisted above the iteration.
		expect(code).toContain('Array.from(');
		// Hook should be inside the helper, not the iteration callback directly
		const hook_pos = code.indexOf('useState(false)');
		const helper_pos = code.indexOf('function StatementBodyHook');
		expect(hook_pos).toBeGreaterThan(helper_pos);
	});

	it('extracts hooks from switch case into a local component', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const page = 'home';
				switch (page) {
					case 'home':
						const [count] = useState(0);
						<div>{count}</div>
						break;
					case 'about':
						<span>{'about'}</span>
						break;
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		expect(code).toContain('useState(0)');
	});

	it('does not extract when branches have no hooks', () => {
		const { code } = compile(
			`export component App() {
				const show = true;
				if (show) {
					const x = 42;
					<div>{x}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).not.toContain('StatementBodyHook');
	});

	it('extracts hooks from deeply nested if-else-if chains', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const mode = 'a';
				if (mode === 'a') {
					<div>{'a'}</div>
				} else if (mode === 'b') {
					const [x] = useState(0);
					<div>{x}</div>
				} else {
					<div>{'c'}</div>
				}
			}`,
			'App.tsrx',
		);

		// Only the else-if branch with hooks should be extracted
		const matches = code.match(/function StatementBodyHook\d+/g);
		expect(matches).not.toBeNull();
		expect(matches.length).toBe(1);
	});

	it('handles member-expression hooks like React.useState in control flow', () => {
		const { code } = compile(
			`import React from 'react';

			export component App() {
				const show = true;
				if (show) {
					const [val] = React.useState(0);
					<div>{val}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
	});

	it('propagates key from loop body element to wrapper component', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const items = ['a', 'b'];
				for (const item of items) {
					const [active] = useState(false);
					<div key={item}>{active ? 'yes' : 'no'}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		// Key should appear on both the inner element and wrapper component
		expect(code).toContain('<StatementBodyHook1 item={item} key={item} />');
		expect(code).not.toContain('items={items}');
	});

	it('adds index key to hook wrapper component when loop has index and no explicit key', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component Component({ items }: { items: string[] }) {
				<ul>
					for (const item of items; index index) {
						const state = useState(0);
						<li>{item}</li>
					}
				</ul>
			}`,
			'Component.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		expect(code).toContain('items.map((item, index) =>');
		expect(code).toContain('<StatementBodyHook1 item={item} key={index} />');
		expect(code).not.toContain('index={index} />');
	});

	it('applies for-of key clauses to hook wrapper components', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App({ items }: { items: { id: string; label: string }[] }) {
				for (const item of items; key item.id) {
					const [active] = useState(false);
					<div>{active ? item.label : item.id}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		expect(code).toContain('<StatementBodyHook1 item={item} key={item.id} />');
		expect(code).not.toContain('items={items}');
	});

	it('prefers inline JSX keys over for-of key clauses for hook wrapper components', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App({ items }: { items: { id: string; inner: string }[] }) {
				for (const item of items; key item.id) {
					const [active] = useState(false);
					<div key={item.inner}>{active ? item.inner : item.id}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function StatementBodyHook');
		expect(code).toContain('<StatementBodyHook1 item={item} key={item.inner} />');
		expect(code).not.toContain('<StatementBodyHook1 item={item} key={item.id} />');
		expect(code).not.toContain('items={items}');
	});

	it('adds index key to non-hook loop items in conditional branches', () => {
		const { code } = compile(
			`export component FeatureCard({
				title,
				items,
				ready,
			}: {
				title: string;
				items: string[];
				ready: boolean;
			}) {
				<section class="feature-card">
					<h2>{title}</h2>

					if (ready) {
						<ul>
							for (const item of items; index index) {
								<li>{item}</li>
							}
						</ul>
					} else {
						<p>{'Loading output...'}</p>
					}
				</section>
			}`,
			'FeatureCard.tsrx',
		);

		expect(code).toContain('items.map((item, index) =>');
		expect(code).toContain('return <li key={index}>{item}</li>;');
	});
});

describe('lazy destructuring', () => {
	it('transforms lazy object destructuring in component params', () => {
		const { code } = compile(
			`export component App(&{name, age}: Props) {
				<div>{name}{age}</div>
			}`,
			'App.tsrx',
		);

		// Param should be replaced with generated identifier
		expect(code).toContain('function App(__lazy0: Props)');
		// References should be member expressions
		expect(code).toContain('__lazy0.name');
		expect(code).toContain('__lazy0.age');
	});

	it('uses regular array destructuring for useState', () => {
		const { code } = compile(
			`export component App() {
				const [count, setCount] = useState(0);
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const [count, setCount] = useState(0)');
		expect(code).toContain('{count}');
	});

	it('transforms lazy object destructuring in variable declarations', () => {
		const { code } = compile(
			`export component App() {
				const &{data, error} = useSWR("/api");
				<div>{data}{error}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const __lazy0 = useSWR("/api")');
		expect(code).toContain('__lazy0.data');
		expect(code).toContain('__lazy0.error');
	});

	it('handles assignment to lazy array bindings', () => {
		const { code } = compile(
			`export component App() {
				let &[val] = getState();
				val = 10;
				val++;
				++val;
				<div>{val}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('__lazy0[0] = 10');
		expect(code).toContain('__lazy0[0]++');
		expect(code).toContain('++__lazy0[0]');
	});

	it('handles shorthand object properties with lazy bindings', () => {
		const { code } = compile(
			`export component App(&{name}: Props) {
				const obj = {name};
				<div>{obj}</div>
			}`,
			'App.tsrx',
		);

		// Shorthand {name} should expand to {name: __lazy0.name}
		expect(code).toContain('name: __lazy0.name');
	});

	it('handles shadowing in inner functions', () => {
		const { code } = compile(
			`export component App(&{name}: Props) {
				const fn = (name: string) => name.toUpperCase();
				<div>{fn(name)}</div>
			}`,
			'App.tsrx',
		);

		// Inner param shadows lazy binding - should stay as `name`
		expect(code).toContain('(name: string) => name.toUpperCase()');
		// Outer reference should use lazy accessor
		expect(code).toContain('fn(__lazy0.name)');
	});

	it('does not hoist static elements that reference lazy bindings', () => {
		const { code } = compile(
			`export component App() {
				const &[count] = useState(0);
				<div>{"static"}</div>
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		// The truly static element should be hoisted
		expect(code).toContain('App__static1');
		expect(code).toContain('App__static1 = <div>{"static"}</div>');
		// The element referencing count should NOT be hoisted
		expect(code).toContain('__lazy0[0]');
		expect(code).not.toContain('App__static2');
	});

	it('does not hoist render-time expressions across early returns', () => {
		const { code } = compile(
			`export component Test() {
				<div>{Date.now()}</div>

				if (Math.random() > 0.5) {
					return;
				}
			}`,
			'Test.tsrx',
		);

		expect(code).not.toContain('const Test__static1');
		expect(code).toContain('if (Math.random() > 0.5) {');
		expect(code.match(/return <div>\{Date\.now\(\)\}<\/div>;/g)).toHaveLength(2);
		expect(code).not.toContain('return null;');
	});

	it('combines lazy params and regular destructuring', () => {
		const { code } = compile(
			`export component App(&{name}: Props) {
				const [count, setCount] = useState(0);
				<div>{name}{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function App(__lazy0: Props)');
		expect(code).toContain('const [count, setCount] = useState(0)');
		expect(code).toContain('__lazy0.name');
		expect(code).toContain('{count}');
	});

	it('uses regular destructuring inside callbacks', () => {
		const { code } = compile(
			`export component App() {
				const [count, setCount] = useState(0);
				const handler = () => setCount(count + 1);
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const [count, setCount] = useState(0)');
		expect(code).toContain('() => setCount(count + 1)');
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
		expect(code).not.toContain('{ name }');
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

	it('uses regular destructuring for useState at statement level', () => {
		const { code } = compile(
			`export component App() {
				const [count] = useState(0);
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const [count] = useState(0)');
		expect(code).toContain('{count}');
	});

	it('uses regular destructuring with tracked references', () => {
		const { code } = compile(
			`export component App() {
				const [count, setCount] = useState(0);
				const inc = () => { setCount(count + 1); };
				<button onClick={inc}>{count}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const [count, setCount] = useState(0)');
		expect(code).toContain('setCount(count + 1)');
		expect(code).toContain('{count}');
	});

	it('does not hoist elements referencing useState bindings', () => {
		const { code } = compile(
			`export component App() {
				const [count] = useState(0);
				<p>{count}</p>
			}`,
			'App.tsrx',
		);

		expect(code).not.toContain('App__static');
		expect(code).toContain('{count}');
	});

	it('does not hoist elements using component-scope bindings as tag names', () => {
		const { code } = compile(
			`export component App({Widget}: {Widget: any}) {
				<div>{"static"}</div>
				<Widget />
			}`,
			'App.tsrx',
		);

		// Pure static element can still be hoisted
		expect(code).toContain('App__static1');
		// Element using a component-scope binding (prop) as tag name must NOT be hoisted
		expect(code).not.toContain('App__static2');
		expect(code).toContain('<Widget');
	});

	it('does not hoist elements using JSXMemberExpression with component-scope object', () => {
		const { code } = compile(
			`export component App({ui}: {ui: any}) {
				<div>{"static"}</div>
				<ui.Button />
			}`,
			'App.tsrx',
		);

		// Pure static element can still be hoisted
		expect(code).toContain('App__static1');
		// Element using a component-scope binding as JSXMemberExpression object must NOT be hoisted
		expect(code).not.toContain('App__static2');
		expect(code).toContain('<ui.Button');
	});

	it('uses regular destructuring with default parameter values', () => {
		const { code } = compile(
			`export component App() {
				const [count] = useState(0);
				const handler = (step = count) => step + 1;
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const [count] = useState(0)');
		expect(code).toContain('step = count');
		expect(code).toContain('step + 1');
	});

	it('hoists JSXMemberExpression elements when only the property matches a scope binding', () => {
		const { code } = compile(
			`import Icons from './Icons';
			export component App({Button}: {Button: any}) {
				<Icons.Button />
			}`,
			'App.tsrx',
		);

		// Icons.Button should be hoisted — Button is a property label, not a variable reference
		// Only the object (Icons) matters, and it's a module-scope import
		expect(code).toContain('App__static1');
	});

	it('does not leak inner-scope bindings into helper component props', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export component App() {
				const show = true;
				if (show) {
					const localVar = 'hello';
					<div>{localVar}</div>
				}
				if (show) {
					const [val] = useState(0);
					<span>{val}</span>
				}
			}`,
			'App.tsrx',
		);

		// The hook-bearing branch gets a helper component
		expect(code).toContain('function StatementBodyHook');

		// The helper component should NOT receive 'localVar' as a prop —
		// it was declared inside the first if block, not in the component scope
		expect(code).not.toContain('localVar={localVar}');
	});

	it('does not pass unrelated future bindings into hook-safe element helpers', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			export component App() {
				<div>
					useEffect(() => {}, []);
					<span>{'ok'}</span>
				</div>

				const later = 'later';
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const later = 'later';");
		expect(code).toContain('function StatementBodyHook1(');
		expect(code).not.toContain('_tsrx_StatementBodyHook1_later');
		expect(code).not.toContain('later={later}');
	});

	it('does not pass helper-local declarations as hook-safe element helper props', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			export component App() {
				<div>
					const later = 'inner';

					useEffect(() => {
						console.log(later);
					}, [later]);

					<span>{later}</span>
				</div>

				const later = 'outer';
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const later = 'inner';");
		expect(code).toContain("const later = 'outer';");
		expect(code).toContain('function StatementBodyHook1(');
		expect(code).not.toContain('_tsrx_StatementBodyHook1_later');
		expect(code).not.toContain('later: typeof _tsrx_StatementBodyHook1_later');
		expect(code).not.toContain('later={later}');
	});

	it('keeps post-split bindings local inside typed cached continuation helpers', () => {
		const { code } = compile(
			`import { useState, useEffect } from 'react';

			export component App() {
				const [count, setCount] = useState(0);

				if (count > 2) {
					return;
				}

				const laterVar = 'after split';

				useEffect(() => {
					console.log(laterVar);
				}, [laterVar]);

				<div>{laterVar}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const laterVar = 'after split';");
		expect(code).toContain('useEffect(');
		expect(code).toContain('let App__StatementBodyHook1;');
		expect(code).toContain('let App__StatementBodyHook2;');
		expect(code).not.toContain('const _tsrx_StatementBodyHook2_count = count;');
		expect(code).not.toContain('const _tsrx_StatementBodyHook2_laterVar = laterVar;');
		expect(code).not.toContain('laterVar: typeof _tsrx_StatementBodyHook2_laterVar');
		expect(code).not.toContain('<StatementBodyHook2 laterVar={laterVar} />');
		expect(code).toContain('return <div>{laterVar}</div>;');
		expect(code).not.toContain('App__Continue');
	});

	describe('ref attributes', () => {
		it('passes a single ref={expr} through unchanged with no helper import', () => {
			const { code } = compile(
				`export component App() {
					function refA(_node) {}
					<div ref={refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('__mergeRefs');
			expect(code).not.toContain('@tsrx/react/merge-refs');
		});

		it('passes a single Ripple {ref expr} through as ref={expr} with no helper import', () => {
			const { code } = compile(
				`export component App() {
					function refA(_node) {}
					<div {ref refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('__mergeRefs');
		});

		it('rejects multiple ref={expr} attributes on the same element', () => {
			expect(() =>
				compile(
					`export component App() {
						function refA(_node) {}
						function refB(_node) {}
						<div ref={refA} ref={refB}>{'hi'}</div>
					}`,
					'App.tsrx',
				),
			).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
		});

		it('merges multiple {ref expr} keyword-form refs into a __mergeRefs call', () => {
			const { code } = compile(
				`export component App() {
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div {ref refA} {ref refB} {ref refC}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={__mergeRefs(refA, refB, refC)}');
			expect(code).toContain("import { mergeRefs as __mergeRefs } from '@tsrx/react/merge-refs'");
		});

		it('merges a single ref={expr} with multiple {ref expr} keyword-form refs', () => {
			const { code } = compile(
				`export component App() {
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div ref={refA} {ref refB} {ref refC}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={__mergeRefs(refA, refB, refC)}');
		});
	});
});
