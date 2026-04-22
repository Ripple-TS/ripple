import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

/**
 * @param {Array<{
 * 	sourceOffsets: number[],
 * 	generatedOffsets: number[],
 * 	lengths: number[],
 * 	generatedLengths?: number[],
 * 	data: unknown,
 * }>} mappings
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

	it('emits the text content and scoped css for the basic styled example', () => {
		const { code, css } = compile(
			`export component App() {
				<div>{'Hello world'}</div>

				<style>
					.div {
						color: red;
					}
				</style>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBeNull();
		expect(code).toContain("{'Hello world'}");
		expect(code).toContain(`className="${css.hash}"`);
		expect(css.code).toContain(`.div.${css.hash}`);
		expect(css.code).toContain('color: red;');
	});

	it('does not apply scoped css hashes to composite components', () => {
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
		const { code, css } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(css).not.toBeNull();
		expect(code).toContain(`<div className="${css.hash}">{'Styled content'}</div>`);
		expect(code).not.toContain('<Child className=');
		expect(mappings.code).not.toContain('<Child className=');
		expect(mappings.errors).toEqual([]);
	});

	it('coerces explicit text interpolation to React text children', () => {
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

	it('rejects `{html expr}` on the React target', () => {
		expect(() =>
			compile(
				`export component App({ markup }: { markup: string }) {
					<article>{html markup}</article>
				}`,
				'App.tsrx',
			),
		).toThrow(/not supported on the React target/);
	});

	it('rejects `{html expr}` at the component body level', () => {
		// Top-level `{html ...}` must hit the compile-time error rather than
		// falling through `is_jsx_child` and silently landing in the function
		// body as a raw Html AST node.
		expect(() =>
			compile(
				`export component App({ markup }: { markup: string }) {
					{html markup}
				}`,
				'App.tsrx',
			),
		).toThrow(/not supported on the React target/);
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

	it('transforms #style member expressions into scoped class strings', () => {
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
		const app_hash = css.hash.split(' ').find((h) => code.includes(`"${h} highlight"`));
		expect(app_hash).toBeTruthy();
		expect(code).toContain(`className="${app_hash} highlight"`);
	});

	it('transforms #style bracket notation into scoped class strings', () => {
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
		expect(code).toContain('if (count > 1) {');
		expect(code).toContain("App__static1 = <div>{'Count is more than one'}</div>");
		expect(code).toContain('return null;');
		expect(code).toContain('<button>{count}</button>');
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

		expect(code).toContain('if (ready) {');
		expect(code).toContain("App__static2 = <div>{'Ready'}</div>");
		expect(code).toContain("App__static1 = <div>{'Loading'}</div>");
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

	it('rejects Ripple for-of key clauses in React mode', () => {
		expect(() =>
			compile(
				`export component App() {
					const items = [1, 2, 3];

					for (const item of items; index i; key i) {
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			),
		).toThrow('Put the key on the rendered element instead');
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
		expect(code).toContain('return (() => {');
		expect(code).toContain("App__static1 = <div>{'Count is more than one'}</div>");
		expect(code).toContain('return null;');
		expect(code).toContain('<button>{count}</button>');
	});

	it('extracts hook-bearing continuations after lone early-return if statements', () => {
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

		expect(code).toContain('function App__Continue1({ count, setCount }) {');
		expect(code).toContain('useEffect(');
		expect(code).toContain('count > 2');
		expect(code).toContain('<App__Continue1 count={count} setCount={setCount} />');
		expect(mappings.errors).toEqual([]);
		expect(mappings.mappings.length).toBeGreaterThan(0);
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

	it('supports JSX fragments at line start in component bodies', () => {
		const { code } = compile(
			`export component App() {
				<>
					<div>{'hello'}</div>
				</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function App()');
		expect(code).toContain('<>');
		expect(code).toContain('</>');
		expect(code).toContain("{'hello'}");
	});

	it('supports JSX fragments at line start inside element children', () => {
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

		expect(code).toContain('function App()');
		expect(code).toContain('<>');
		expect(code).toContain('</>');
		expect(code).toContain("{'inner'}");
	});

	it('supports JSX fragments alongside other elements in component bodies', () => {
		const { code } = compile(
			`export component App() {
				<h1>{'title'}</h1>
				<>
					<p>{'content'}</p>
				</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function App()');
		expect(code).toContain("{'title'}");
		expect(code).toContain("{'content'}");
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

	it('supports tsx blocks passed as props', () => {
		const source = `component Child(props) {
			<div>{props.content}</div>
		}

			export component App() {
				<Child content={<tsx><span>{'hello'}</span></tsx>} />
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

	it('rejects finally blocks in component templates', () => {
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
		).toThrow('does not support `finally` blocks');
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
		expect(code).toContain('.map(');
		// Hook should be inside the helper, not the map callback directly
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
		expect(code).toContain('<StatementBodyHook1 items={items} item={item} key={item} />');
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
		expect(code).toContain(
			'<StatementBodyHook1 items={items} item={item} index={index} key={index} />',
		);
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

	it('transforms lazy array destructuring in variable declarations', () => {
		const { code } = compile(
			`export component App() {
				let &[count, setCount] = useState(0);
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		// Declaration should use generated identifier
		expect(code).toContain('let __lazy0 = useState(0)');
		// Reference should be array index access
		expect(code).toContain('__lazy0[0]');
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

	it('combines lazy params and lazy variables', () => {
		const { code } = compile(
			`export component App(&{name}: Props) {
				const &[count, setCount] = useState(0);
				<div>{name}{count}</div>
			}`,
			'App.tsrx',
		);

		// Param uses __lazy0, variable uses __lazy1
		expect(code).toContain('function App(__lazy0: Props)');
		expect(code).toContain('const __lazy1 = useState(0)');
		expect(code).toContain('__lazy0.name');
		expect(code).toContain('__lazy1[0]');
	});

	it('transforms lazy bindings inside callbacks', () => {
		const { code } = compile(
			`export component App() {
				let &[count, setCount] = useState(0);
				const handler = () => setCount(count + 1);
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('() => __lazy0[1](__lazy0[0] + 1)');
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

	it('rewrites statement-level lazy assignment as a const declaration', () => {
		const { code } = compile(
			`export component App() {
				&[count] = useState(0);
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const __lazy0 = useState(0)');
		expect(code).toContain('__lazy0[0]');
	});

	it('handles statement-level lazy assignment with tracked references', () => {
		const { code } = compile(
			`export component App() {
				&[count] = useState(0);
				const inc = () => { count++; };
				<button on_click={inc}>{count}</button>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const __lazy0 = useState(0)');
		expect(code).toContain('__lazy0[0]++');
		expect(code).toContain('{__lazy0[0]}');
	});

	it('does not hoist elements referencing statement-level lazy bindings', () => {
		const { code } = compile(
			`export component App() {
				&[count] = useState(0);
				<p>{count}</p>
			}`,
			'App.tsrx',
		);

		// The JSX references `count` (via __lazy0[0]) and must not be hoisted.
		expect(code).not.toContain('App__static');
		expect(code).toContain('__lazy0[0]');
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

	it('does not rewrite locally shadowed names inside blocks', () => {
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

		// The prop reference should be rewritten
		expect(code).toContain('__lazy0.name');
		// The callback should use the local 'name', not the lazy accessor
		expect(code).toContain("const name = 'local'");
		expect(code).toContain('return name');
		expect(code).not.toMatch(/return __lazy0\.name/);
	});

	it('does not rewrite loop variables that shadow lazy bindings', () => {
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

		// The prop reference in JSX should be rewritten
		expect(code).toContain('__lazy0.name');
		// The for-of loop variable should NOT be rewritten
		expect(code).toContain('console.log(name)');
		expect(code).not.toMatch(/console\.log\(__lazy0\.name\)/);
	});

	it('transforms default parameter values referencing lazy bindings', () => {
		const { code } = compile(
			`export component App() {
				const &[count] = useState(0);
				const handler = (step = count) => step + 1;
				<div>{count}</div>
			}`,
			'App.tsrx',
		);

		// The default value should be rewritten to the lazy accessor
		expect(code).toContain('step = __lazy0[0]');
		// The param name 'step' itself should NOT be rewritten
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

	it('does not pass post-split bindings as helper component props', () => {
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

		// The continuation helper should receive count/setCount from before the split
		expect(code).toContain('App__Continue');
		expect(code).toContain('count={count}');

		// laterVar is declared AFTER the split — it must NOT appear as a prop
		// on the helper element at the call site (it's not in scope there)
		expect(code).not.toContain('laterVar={laterVar}');
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

		// The 'name' inside the switch case should NOT be rewritten to a lazy accessor
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

		// The body-level 'name' shadows the lazy binding — references should
		// use the local variable, not the lazy accessor
		expect(code).toContain("const name = 'override'");
		// The div should use plain 'name', not __lazy0.name
		expect(code).toContain('{name}');
		expect(code).not.toContain('__lazy0.name');
	});

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

		// Each JSX child must be captured into a const at its source position
		// so the first <b> sees a = "one" and the second sees a = "two".
		const first_capture = code.indexOf('_tsrx_child_0');
		const assign_two = code.indexOf('a = "two"');
		const second_capture = code.indexOf('_tsrx_child_1');
		expect(first_capture).toBeGreaterThan(-1);
		expect(assign_two).toBeGreaterThan(first_capture);
		expect(second_capture).toBeGreaterThan(assign_two);
	});

	it('preserves source order for interleaved JSX across a hook-safe split', () => {
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

		// The pre-split portion must still capture JSX at source position so
		// the first <b> observes a = "one" and the second observes a = "two".
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
});
