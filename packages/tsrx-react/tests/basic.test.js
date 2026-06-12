import { describe, expect, it } from 'vitest';
import {
	runSharedCodeBlockChildrenTests,
	runSharedCompileDiagnosticsTests,
	runSharedCompileTests,
	runSharedTsxExpressionTsrxTests,
} from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { find_exact_mapping } from '../../tsrx/src/source-map-utils.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'react',
	rejectsComponentAwait: false,
});

runSharedTsxExpressionTsrxTests({ compile, name: 'react', classAttrName: 'class' });
runSharedCompileTests({
	compile,
	name: 'react',
	classAttrName: 'class',
	generatedClassAttrName: 'className',
});
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'react' });
runSharedCodeBlockChildrenTests({ compile, name: 'react' });

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
	describe('JSX function components', () => {
		it('compiles returned JSX from function declarations', () => {
			const { code } = compile(
				`export function MyApp() {
					return <div />;
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export function MyApp()');
			expect(code).toContain('const MyApp__static1 = <div />;');
			expect(code).toContain('return MyApp__static1;');
		});

		it('lowers directive children inside returned JSX fragments', () => {
			const { code, css, cssHash } = compile(
				`export function MyApp() @{
					<>
							@if (x) {
								<div>works</div>
							} @else {
								<span>idle</span>
						}

						<style>
							div { color: red; }
						</style>
					</>
					}`,
				'App.tsrx',
			);

			expect(cssHash).toBeTruthy();
			expect(css).toContain(`div.${cssHash}`);
			expect(css).toContain('color: red;');
			expect(code).toContain(`className="${cssHash}"`);
			expect(code).toContain('return x ?');
			expect(code).toContain('idle');
			expect(code).not.toContain('<style>');
		});

		it('converts expression-bodied arrows with statement fragments to block bodies', () => {
			const { code } = compile(
				`export const MyApp = () => @{
					const value = 1;
					<div>{value}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('export const MyApp = () => {');
			expect(code).toContain('const value = 1;');
			expect(code).toContain('return <div>{value}</div>;');
		});

		it('leaves hook-bearing returned fragment branches inline', () => {
			const { code } = compile(
				`import { useState } from 'react';

				export function MyApp() @{
						@if (x) {
							const [value] = useState(0);
							<div>{value}</div>
						}
					}`,
				'App.tsrx',
			);

			expect(code).toContain('const [value] = useState(0);');
			expect(code).toContain('return x');
			expect(code).not.toContain('StatementBodyHook');
		});
	});

	it('supports async function components without requiring use server', () => {
		const { code } = compile(
			`export async function App() @{
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

			export async function App() @{
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
				`export async function App({ items }: { items: AsyncIterable<string> }) @{
					@for await (const item of items) {
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

				export async function App({ items }: { items: AsyncIterable<string> }) @{
					@for await (const item of items) {
						<div>{item}</div>
					}
				}`,
				'App.tsrx',
			),
		).toThrow(/does not support `for await\.\.\.of`/);
	});

	it('does not require use server for await inside nested async functions', () => {
		const { code } = compile(
			`export function App() @{
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
			`export function App({ items }: { items: { id: string, text: string }[] }) @{
				@for (const item of items; key item.id) {
					<div>{item.text}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('__map_iterable(');
		expect(code).toContain('key={item.id}');
		expect(code).not.toContain('does not support `key` in `for` control flow');
	});

	// `does not apply scoped css hashes to composite components`
	// additionally asserted the Volar mapping had no errors and its code
	// omitted a generated class prop on `<Child>`. Keep the mapping-assertion piece here
	// since the shared harness only runs `compile` for this class of test.
	it('does not apply scoped css hashes to composite components (Volar mappings)', () => {
		const source = `function Child() @{
				<div>{'Hello world'}</div>
			}

			export function App() @{
				<>
					<Child />
					<div>{'Styled content'}</div>

					<style>
						.div {
							color: red;
						}
					</style>
				</>
			}`;
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(mappings.code).not.toMatch(/<Child\s+class(Name)?=/);
		expect(mappings.errors).toEqual([]);
	});

	it('applies scoped css hashes to elements inside control flow', () => {
		const { code, css, cssHash } = compile(
			`export function App() @{
				<>
					@if (true) {
						<div className="div">{'inside'}</div>
					}

					<style>
						.div {
							color: red;
						}
					</style>
				</>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBe('');
		expect(code).toContain(`className="div ${cssHash}"`);
		expect(code).toContain(`App__static1 = <div className="div ${cssHash}">`);
		expect(css).toContain(`.div.${cssHash}`);
	});

	it('does not rewrite authored class attributes when scoped css applies', () => {
		const { code, cssHash } = compile(
			`export function App() @{
				<>
					<div class="content">{'hello'}</div>

					<style>
						.content {
							color: red;
						}
					</style>
				</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain(`class="content ${cssHash}"`);
		expect(code).not.toContain(`className="content ${cssHash}"`);
	});

	it('applies scoped css hashes and keeps type selectors for dynamic tags', () => {
		const { code, css, cssHash } = compile(
			`export function App() @{
				const Tag = 'section';
				<>
					<{Tag} className="host">{'hello'}</{Tag}>

					<style>
						div {
							color: red;
						}
						.host {
							color: blue;
						}
					</style>
				</>
			}`,
			'App.tsrx',
		);

		// The tag resolves at runtime, so it could be any element: type
		// selectors must survive pruning and the element's class gets the hash.
		expect(code).toContain(`className="host ${cssHash}"`);
		expect(css).toContain(`div.${cssHash}`);
		expect(css).toContain(`.host.${cssHash}`);
	});

	it('lowers dynamic tag syntax to a scoped component alias', () => {
		const { code } = compile(
			`export function App() @{
				const Tag = 'section';
				<{Tag} className="host">{'hello'}</{Tag}>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const TsrxDynamic_1 = Tag;');
		expect(code).toContain(`<TsrxDynamic_1 className="host">{'hello'}</TsrxDynamic_1>`);
		expect(code).not.toContain('@tsrx/react/dynamic');
	});

	it('keeps the Dynamic component shape in type-only output for dynamic tags', () => {
		const { code } = compile_to_volar_mappings(
			`export function App() @{
				const Tag = 'section';
				<{Tag} className="host">{'hello'}</{Tag}>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code).toContain(`import { Dynamic as TsrxDynamic } from '@tsrx/react/dynamic';`);
		expect(code).toContain(`<TsrxDynamic is={Tag} className="host"`);
	});

	it('does not map generated Dynamic tag names over dynamic tag props', () => {
		const source = `export function App() @{
			const tag = 'div';
			const className = 'test-class';
			<{tag} className={className} id="test">{'Content'}</{tag}>
		}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx');
		const generated_tag_offset = result.code.indexOf('<TsrxDynamic') + 1;
		const generated_is_value_offset = result.code.indexOf('tag', result.code.indexOf('is={'));
		const generated_class_offset = result.code.indexOf('className=', generated_tag_offset);
		const source_class_offset = source.indexOf('className=');
		const source_closing_tag_offset = source.indexOf('tag}', source.indexOf('</{'));

		const generated_tag_mapping = result.mappings.find((mapping) => {
			const generated_offset = mapping.generatedOffsets[0];
			const generated_length = mapping.generatedLengths?.[0] ?? mapping.lengths[0];
			return (
				generated_offset <= generated_tag_offset &&
				generated_tag_offset < generated_offset + generated_length
			);
		});
		const class_mapping = find_exact_mapping(
			result.mappings,
			source_class_offset,
			generated_class_offset,
			'className'.length,
		);
		const closing_tag_mapping = find_exact_mapping(
			result.mappings,
			source_closing_tag_offset,
			generated_is_value_offset,
			'tag'.length,
		);

		expect(generated_tag_mapping).toBeUndefined();
		expect(class_mapping).toBeDefined();
		expect(closing_tag_mapping).toBeDefined();
	});

	it('renders component-body if statements as React expressions', () => {
		const { code } = compile(
			`export function App() @{
				const count = 2;

				<>
					@if (count > 1) {
						<div>{'Count is more than one'}</div>
					}

					<button>{count}</button>
				</>
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
			`export function App() @{
				const ready = false;

				@if (ready) {
					<div>{'Ready'}</div>
				} @else {
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
			`export function App() @{
				const items = [1, 2, 3];

				@for (const item of items; index i) {
					<div key={i}>{item}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const items = [1, 2, 3];');
		expect(code).toContain(
			`import { map_iterable as __map_iterable } from '@tsrx/react/runtime/iterable';`,
		);
		expect(code).toContain('__map_iterable(items, (item, i) => {');
		expect(code).toContain('return <div key={i}>{item}</div>;');
	});

	it('applies for-of key clauses to emitted React elements', () => {
		const { code } = compile(
			`export function App() @{
				const items = [1, 2, 3];

				@for (const item of items; index i; key item) {
					<div>{item}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('__map_iterable(items, (item, i) => {');
		expect(code).toContain('return <div key={item}>{item}</div>;');
	});

	it('prefers inline JSX keys over for-of key clauses for emitted React elements', () => {
		const { code } = compile(
			`export function App() @{
				const items = [{ id: 'a', inner: 'x' }];

				@for (const item of items; key item.id) {
					<div key={item.inner}>{item.id}</div>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('__map_iterable(items, (item) => {');
		expect(code).toContain('return <div key={item.inner}>{item.id}</div>;');
		expect(code).not.toContain('return <div key={item.id}>{item.id}</div>;');
	});

	it('uses map_iterable for for-of over a Set without normalizing it', () => {
		const { code } = compile(
			`export function App({ items }: { items: Set<string> }) @{
				@for (const item of items) {
					<li key={item}>{item}</li>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain(
			`import { map_iterable as __map_iterable } from '@tsrx/react/runtime/iterable';`,
		);
		expect(code).toContain('__map_iterable(items, (item) => {');
		expect(code).not.toContain('Array.from(');
		expect(code).not.toContain('Array.isArray(');
	});

	it('uses map_iterable for for-of over a Map without normalizing it', () => {
		const { code } = compile(
			`export function App({ entries }: { entries: Map<string, number> }) @{
				@for (const [key, value] of entries) {
					<li key={key}>{key + ':' + value}</li>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('__map_iterable(entries,');
		expect(code).not.toContain('Array.from(');
		expect(code).not.toContain('Array.isArray(');
	});

	it('uses map_iterable inside a for-of with hook calls without normalizing the source', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export function App({ items }: { items: Iterable<string> }) @{
				@for (const item of items) {
					const [open, setOpen] = useState(false);
					<li key={item}>{open ? item : '-'}</li>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain(
			`import { map_iterable as __map_iterable } from '@tsrx/react/runtime/iterable';`,
		);
		expect(code).toContain('useState(false)');
		expect(code).toContain('__map_iterable(items,');
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('Array.from(');
		expect(code).not.toContain('Array.isArray(');
	});

	it('keeps type-only for-of output simple when hook calls stay inline', () => {
		const { code } = compile_to_volar_mappings(
			`import { useState } from 'react';

			export function App({ items }: { items: Iterable<string> }) @{
				@for (const item of items) {
					const [open, setOpen] = useState(false);
					<li key={item}>{open ? item : '-'}</li>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('map_iterable as __map_iterable');
		expect(code).toContain('useState(false)');
		expect(code).toContain("from '@tsrx/react/runtime/iterable'");
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('type IterationValue as __IterationValue');
		expect(code).not.toContain('IterationValue as type __IterationValue');
	});

	it('rejects return statements inside template @if branches', () => {
		expect(() =>
			compile(
				`export function App() @{
					<>
						@if (count > 2) {
							return;
						}

						<button>{count}</button>
					</>
				}`,
				'App.tsrx',
			),
		).toThrow(/Return statements are not allowed inside TSRX template @if blocks/);
	});

	it('keeps setup guard returns before fenced template output without hook splitting', () => {
		const source = `import { useState, useEffect } from 'react';

				export function App() @{
					const [count, setCount] = useState(0);

					if (count > 2) {
						return null;
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
		expect(code).toContain('if (count > 2) {');
		expect(code).toContain('return null;');
		expect(code).not.toContain(': any');
		expect(code).toContain('return <button onClick={() => setCount(count + 1)}>{count}</button>;');
		expect(code).not.toContain('App__Continue');
		expect(code).not.toContain('StatementBodyHook');
		expect(mappings.code).not.toContain('StatementBodyHook');
		expect(mappings.code).not.toContain('count: any');
		expect(mappings.errors).toEqual([]);
		expect(mappings.mappings.length).toBeGreaterThan(0);
	});

	it('does not split hooks out of ordinary uppercase function bodies', () => {
		const { code } = compile(
			`import { useEffect, useState } from 'react';

			export function App() {
				const [tab, setTab] = useState('overview');
				const posts = [
					{ title: 'Compiler update' },
					{ title: 'Runtime notes' },
					{ title: 'Hydration deep dive' },
				];

				if (foo) {
					return;
				}

				useEffect(() => {});
			}`,
			'App.tsrx',
		);

		expect(code).toContain('export function App() {');
		expect(code).toContain("const [tab, setTab] = useState('overview');");
		expect(code).toContain('if (foo) {');
		expect(code).toContain('return;');
		expect(code).toContain('useEffect(() => {});');
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('return <App__StatementBodyHook');
	});

	it('does not split hooks out of ordinary functions that return TSRX control flow', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			export function StatusBadge({
				status,
			}: {
				status: 'active' | 'idle' | 'offline';
			}) {
				if (status === 'active') {
					return <span class="badge active">Online</span>;
				}

				useEffect(() => {
					console.log('!');
				}, []);

				return <>
					@if (status === 'idle') {
						<span class="badge idle">Away</span>
					} @else {
						<span class="badge">Offline</span>
					}
				</>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('export function StatusBadge');
		expect(code).toContain('useEffect(');
		expect(code).toContain("status === 'idle' ?");
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('return <StatusBadge__StatementBodyHook');
	});

	it('keeps setup guard returns while preserving source local names without hook splitting', () => {
		const source = `import { useEffect } from 'react';

			declare function getFoo(): string | null;

				export function App() @{
					const foo = getFoo();

					if (!foo) {
						return null;
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

		expect(code).toContain('if (!foo) {');
		expect(code).toContain('return null;');
		expect(code).not.toContain(': any');
		expect(code).not.toContain('StatementBodyHook');
		expect(mappings.code).not.toContain('StatementBodyHook');
		expect(mappings.code).not.toContain('foo: any');
		expect(code).toContain('useEffect(');
		expect(code).toContain('return <div>{foo.trim()}</div>;');
		expect(code).not.toContain('App__Continue');
		expect(if_foo_mapping?.data.completion).toBe(true);
	});

	it('keeps setup guard returns in the parent component', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			declare function getFoo(): string | null;

				export function App() @{
					const foo = getFoo();

					if (!foo) {
						return null;
					}

					useEffect(() => {
						console.log(foo);
					}, [foo]);

					<div>{foo.trim()}</div>
				}`,
			'App.tsrx',
		);

		const app_pos = code.indexOf('export function App()');

		expect(app_pos).toBeGreaterThan(-1);
		expect(code).toContain('if (!foo) {');
		expect(code).toContain('return null;');
		expect(code).toContain('return <div>{foo.trim()}</div>;');
		expect(code).not.toContain(': any');
		expect(code).not.toContain('StatementBodyHook');
	});

	it('does not emit helper prop type aliases for setup guard returns', () => {
		const { code } = compile_to_volar_mappings(
			`import { useEffect } from 'react';

			declare function getFoo(): string | null;

				export function App() @{
					const foo = getFoo();

					if (!foo) {
						return null;
					}

					useEffect(() => {
						console.log(foo);
					}, [foo]);

					<div>{foo.trim()}</div>
				}`,
			'App.tsrx',
		);

		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('_tsrx_StatementBodyHook1_foo');
		expect(code).not.toContain('foo: any');
	});

	it('does not emit duplicate Volar mappings for React output with inline hooks', () => {
		const source = `import { useState, useEffect } from 'react';

			function Child() @{
				<div>
					@{
						const x = 1;
						console.log(x);
					}
				</div>
			}

			export function App() @{
				const [count, setCount] = useState(0);
				const items = [1, 2, 3];
				useEffect(() => {
					console.log(count);
				}, [count]);

				<>
					<Child />

					<h1>
						{'Hello World'}
						@if (count > 1) {
							<span>{'Counted'}</span>
						}
					</h1>

					@if (count > 1) {
						<div>
							@{
								const [x] = useState(1);
								<>{'Count is more than ' + x}</>
							}
						</div>
					}

					<button onClick={() => setCount(count + 1)}>{count}</button>

					@for (const item of items; index i) {
						<div key={i}>{item}</div>
					}
				</>
			}`;

		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(mappings.errors).toEqual([]);
		expect(get_duplicate_mapping_keys(mappings.mappings)).toEqual([]);
	});

	it('maps JSX functions to the function identifier', () => {
		const source = `export function App() @{
			<div>{'Hello world'}</div>
		}`;
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');
		const function_offset = source.indexOf('function App');
		const app_offset = source.indexOf('App', function_offset);

		const function_identifier_mapping = mappings.mappings.find(
			(mapping) => mapping.sourceOffsets[0] === app_offset && mapping.lengths[0] === 'App'.length,
		);

		expect(mappings.errors).toEqual([]);
		expect(function_identifier_mapping).toBeDefined();
		expect(function_identifier_mapping?.data.semantic).toBe(true);
		expect(function_identifier_mapping?.data.navigation).toBe(true);
		expect(function_identifier_mapping?.data.customData.hover).toBeUndefined();
	});

	it('renders template switch directives as React expressions', () => {
		const { code } = compile(
			`export function App() @{
					const count = 0;

					@switch (count) {
					@case 0: {
						<div>{'Zero'}</div>
					}
					@default: {
						<div>{'Other'}</div>
					}
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('switch (count) {');
		expect(code).toContain("return <div>{'Zero'}</div>;");
		expect(code).toContain("return <div>{'Other'}</div>;");
		expect(code).toContain('return null;');
	});

	it('keeps hooks unconditional after switch-based component guard returns', () => {
		const source = `import { useEffect } from 'react';

					export function App() @{
						const count = 0;

					switch (count) {
						case 0:
							return null;
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
		expect(code.indexOf('useEffect(')).toBeLessThan(code.indexOf('return <'));
		expect(mappings.errors).toEqual([]);
	});

	it('keeps hooks after setup early null returns in the component body without splitting', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

					export function App({ x }: { x: boolean }) @{
						if (x) {
							return null;
						}

						useEffect(() => {});

					}`,
			'App.tsrx',
		);

		expect(code).toContain('if (x) {');
		expect(code).toContain('return null;');
		expect(code).toContain('useEffect(() => {});');
		expect(code).toContain('return null;');
		expect(code).not.toContain('StatementBodyHook');
	});

	it('supports template statement children inside elements', () => {
		const { code } = compile(
			`function Child() @{
				<div>
					@{
						const x = 1;

						console.log(x);
					}
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

	it('supports less-than comparisons in template statement element children without whitespace', () => {
		const { code } = compile(
			`function TodoList({ items }: { items: { text: string }[] }) @{
				<ul>
					@{
						var a = 3 < 4;
					}
				</ul>
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
			`export function App() @{
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
			`function App() @{
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
			`export function App() @{
				<>
					<h1>{'title'}</h1>
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

	it('rejects return statements inside element child template @if branches', () => {
		expect(() =>
			compile(
				`function App() @{
					const count = 0;

					<h1>
						{'Hello World'}
						@if (count > 1) {
							return;
						}
						<span>{'After'}</span>
					</h1>
				}`,
				'App.tsrx',
			),
		).toThrow(/Return statements are not allowed inside TSRX template @if blocks/);
	});

	it('leaves hook-bearing element child statement bodies inline', () => {
		const source = `import { useState } from 'react';

			function App() @{
				@if (true) {
					<div>
						@{
							const [x] = useState(1);
							<>{'Count is more than ' + x}</>
						}
					</div>
				}
			}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('const [x] = useState(1);');
		expect(code).not.toContain(': any');
		expect(code).not.toContain('StatementBodyHook');
		expect(mappings.code).not.toContain('StatementBodyHook');
		expect(mappings.errors).toEqual([]);
	});

	it('supports fragment shorthand passed as props', () => {
		const source = `function Child(props) @{
			<div>{props.content}</div>
		}

			export function App() @{
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

	it('passes if-statement children through composite components via {children}', () => {
		const source = `function Wrapper(children) @{
			<div>{children}</div>
		}

		export function App() @{
			<Wrapper>
				@if (true) {
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

	it('transforms ref={fn} on elements to ref={fn}', () => {
		const source = `export function App() @{
			function divRef(node) {
				console.log(node);
			}

			<div ref={divRef}>{'Hello'}</div>
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('ref={divRef}');
		expect(mappings.errors).toEqual([]);
	});

	it('transforms ref={fn} on composite components to ref={fn}', () => {
		const source = `function Child(props) @{
			const { ...rest } = props;
			<input {...rest} />
		}

		export function App() @{
			function childRef(node) {
				console.log(node);
			}

			<Child ref={childRef} />
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('ref={childRef}');
		expect(code).toContain('function Child(props)');
		expect(mappings.errors).toEqual([]);
	});

	it('transforms ref={fn} alongside other attributes', () => {
		const source = `export function App() @{
			function inputRef(node) {}

			<input type="text" ref={inputRef} class="field" />
		}`;

		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('ref={inputRef}');
		expect(code).toContain('type="text"');
		expect(code).toContain('class="field"');
		expect(mappings.errors).toEqual([]);
	});

	it('transforms try/catch into ErrorBoundary wrapper', () => {
		const { code } = compile(
			`function ThrowingChild() @{
				<div>{'might throw'}</div>
			}

			export function App() @{
				@try {
					<ThrowingChild />
				} @catch (err) {
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
			`export function App() @{
				@try {
					<div>{'async content'}</div>
				} @pending {
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
			`export function App() @{
				@try {
					<div>{'async content'}</div>
				} @pending {
					<p>{'loading...'}</p>
				} @catch (err) {
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
			`export function App() @{
				@try {
					<div>{'content'}</div>
				} @catch (err, reset) {
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

	it('rejects finally clauses in component @try templates', () => {
		expect(() =>
			compile(
				`export function App() @{
					@try {
						<div>{'content'}</div>
					} @catch (err) {
						<p>{'error'}</p>
					} finally {
						console.log('done');
					}
				}`,
				'App.tsrx',
			),
		).toThrow(/Unexpected token/);
	});

	it('transforms try with use() inside for Suspense triggering', () => {
		const { code } = compile(
			`import { use } from 'react';

			export function App() @{
				@try {
					const data = use(fetchData());
					<div>{data}</div>
				} @pending {
					<p>{'loading...'}</p>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('Suspense');
		expect(code).toContain('use(fetchData())');
	});

	it('applies scoped CSS hashes inside try blocks', () => {
		const { code, css, cssHash } = compile(
			`export function App() @{
				<>
					@try {
						<div className="content">{'hello'}</div>
					} @catch (err) {
						<p className="error">{'error'}</p>
					}

					<style>
						.content { color: blue; }
						.error { color: red; }
					</style>
				</>
			}`,
			'App.tsrx',
		);

		expect(css).not.toBe('');
		expect(code).toContain(`className="content ${cssHash}"`);
		expect(code).toContain(`className="error ${cssHash}"`);
	});

	it('adds index key to non-hook loop items in conditional branches', () => {
		const { code } = compile(
			`export function FeatureCard({
				title,
				items,
				ready,
			}: {
				title: string;
				items: string[];
				ready: boolean;
			}) @{
				<section class="feature-card">
					<h2>{title}</h2>

					@if (ready) {
						<ul>
							@for (const item of items; index index) {
								<li>{item}</li>
							}
						</ul>
					} @else {
						<p>{'Loading output...'}</p>
					}
				</section>
			}`,
			'FeatureCard.tsrx',
		);

		expect(code).toContain('__map_iterable(items, (item, index) =>');
		expect(code).toContain('return <li key={index}>{item}</li>;');
	});
});

describe('lazy destructuring', () => {
	it('transforms lazy object destructuring in component params', () => {
		const { code } = compile(
			`export function App(&{name, age}: Props) @{
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
			`export function App() @{
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
			`export function App() @{
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
			`export function App() @{
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
			`export function App(&{name}: Props) @{
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
			`export function App(&{name}: Props) @{
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
			`export function App() @{
				const &[count] = useState(0);
				<>
					<div>{"static"}</div>
					<div>{count}</div>
				</>
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

	it('does not hoist render-time expressions from template bodies', () => {
		const { code } = compile(
			`export function Test() @{
				<div>{Date.now()}</div>
			}`,
			'Test.tsrx',
		);

		expect(code).not.toContain('const Test__static1');
		expect(code).toContain('return <div>{Date.now()}</div>;');
	});

	it('combines lazy params and regular destructuring', () => {
		const { code } = compile(
			`export function App(&{name}: Props) @{
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
			`export function App() @{
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

	it('uses regular destructuring for useState at statement level', () => {
		const { code } = compile(
			`export function App() @{
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
			`export function App() @{
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
			`export function App() @{
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
			`export function App({Widget}: {Widget: any}) @{
				<>
					<div>{"static"}</div>
					<Widget />
				</>
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
			`export function App({ui}: {ui: any}) @{
				<>
					<div>{"static"}</div>
					<ui.Button />
				</>
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
			`export function App() @{
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

	it('treats JSXMemberExpression property labels as not referencing scope bindings', () => {
		const { code } = compile(
			`import Icons from './Icons';
			export function App({Button}: {Button: any}) @{
				<Icons.Button />
			}`,
			'App.tsrx',
		);

		// Bare `<Component />` references (no attributes, no children) are
		// not hoisted into module-level `App__static` aliases — hoisting
		// would just add an alias indirection without enabling React's
		// element-identity fast path on the (non-memo'd) helper. The point
		// of this test is the *scope-binding* analysis: `Icons.Button` is
		// a property-access shape where the `Button` part is a label, not
		// a variable reference, so the `{Button}` component param doesn't
		// turn `Icons.Button` into a scope-referencing element.
		expect(code).toContain('<Icons.Button />');
		expect(code).not.toContain('App__static');
	});

	it('does not generate helper component props for conditional hook branches', () => {
		const { code } = compile(
			`import { useState } from 'react';

			export function App() @{
				const show = true;
				<>
					@if (show) {
						const localVar = 'hello';
						<div>{localVar}</div>
					}
					@if (show) {
						const [val] = useState(0);
						<span>{val}</span>
					}
				</>
			}`,
			'App.tsrx',
		);

		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('localVar={localVar}');
	});

	it('does not generate element helpers for statement children with hooks', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			export function App() @{
				const later = 'later';

				<div>
					@{
						useEffect(() => {}, []);
						<span>{'ok'}</span>
					}
				</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const later = 'later';");
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('_tsrx_StatementBodyHook1_later');
		expect(code).not.toContain('later={later}');
	});

	it('does not generate helper-local prop plumbing for inline statement children', () => {
		const { code } = compile(
			`import { useEffect } from 'react';

			export function App() @{
				const later = 'outer';

				<div>
					@{
						const later = 'inner';

						useEffect(() => {
							console.log(later);
						}, [later]);

						<span>{later}</span>
					}
				</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("const later = 'inner';");
		expect(code).toContain("const later = 'outer';");
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('_tsrx_StatementBodyHook1_later');
		expect(code).not.toContain('later: typeof _tsrx_StatementBodyHook1_later');
		expect(code).not.toContain('later={later}');
	});

	it('keeps post-guard bindings local after setup guard returns', () => {
		const { code } = compile(
			`import { useState, useEffect } from 'react';

				export function App() @{
					const [count, setCount] = useState(0);

					if (count > 2) {
						return null;
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
		expect(code).toContain('if (count > 2) {');
		expect(code).toContain('return null;');
		expect(code).not.toContain('let App__StatementBodyHook');
		expect(code).not.toContain('const _tsrx_StatementBodyHook1_count = count;');
		expect(code).not.toContain('const _tsrx_StatementBodyHook1_laterVar = laterVar;');
		expect(code).not.toContain('laterVar: typeof _tsrx_StatementBodyHook1_laterVar');
		expect(code).not.toContain('<App__StatementBodyHook1 laterVar={laterVar} />');
		expect(code).toContain('return <div>{laterVar}</div>;');
		expect(code).not.toContain('App__Continue');
	});

	describe('ref attributes', () => {
		it('passes a single ref={expr} through unchanged with no helper import', () => {
			const { code } = compile(
				`export function App() @{
					function refA(_node) {}
					<div ref={refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('__mergeRefs');
			expect(code).not.toContain('@tsrx/react/ref');
		});

		it('passes a single Ripple ref={expr} through as ref={expr} with no helper import', () => {
			const { code } = compile(
				`export function App() @{
					function refA(_node) {}
					<div ref={refA}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={refA}');
			expect(code).not.toContain('__mergeRefs');
		});

		it('keeps named ref-like props ordinary while normalizing host spreads', () => {
			const { code } = compile(
				`export function Child(props) @{
					<input {...props} />
				}

				export function App() @{
					let input;
					<Child input_ref={input} />
				}`,
				'App.tsrx',
			);

			expect(code).toContain("from '@tsrx/react/ref'");
			expect(code).toContain('input_ref={input}');
			expect(code).toContain('{...__normalize_spread_props(props)}');
		});

		it('keeps named ref-like props ordinary without host spreads', () => {
			const { code } = compile(
				`export function Child(props) @{
					<span>{'child'}</span>
				}

				export function App() @{
					let input;
					<Child input_ref={input} />
				}`,
				'App.tsrx',
			);

			expect(code).not.toContain("from '@tsrx/react/ref'");
			expect(code).toContain('input_ref={input}');
			expect(code).not.toContain('normalize_spread_props');
		});

		it('normalizes multiple host spreads once while merging one explicit ref', () => {
			const { code } = compile(
				`export function App() @{
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
			expect(code).toContain(
				'ref={__mergeRefs(App__spread_props1.ref, App__spread_props2.ref, cb)}',
			);
			expect(code.match(/__normalize_spread_props_for_ref_attr\(/g)).toHaveLength(2);
			expect(code).not.toContain('create_ref_prop');
			expect(code).not.toContain('__normalize_spread_props(first, cb)');
			expect(code).not.toContain('__normalize_spread_props(second, cb)');
		});

		it('rejects multiple ref={expr} attributes on the same element', () => {
			expect(() =>
				compile(
					`export function App() @{
						function refA(_node) {}
						function refB(_node) {}
						<div ref={refA} ref={refB}>{'hi'}</div>
					}`,
					'App.tsrx',
				),
			).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
		});

		it('preserves explicit mergeRefs calls', () => {
			const { code } = compile(
				`import { mergeRefs } from '@tsrx/react/ref';

				export function App() @{
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div ref={mergeRefs(refA, refB, refC)}>{'hi'}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('ref={mergeRefs(refA, refB, refC)}');
			expect(code).not.toContain('__mergeRefs');
		});

		it('rejects repeated ref={expr} attributes after the keyword removal', () => {
			expect(() =>
				compile(
					`export function App() @{
					function refA(_node) {}
					function refB(_node) {}
					function refC(_node) {}
					<div ref={refA} ref={refB} ref={refC}>{'hi'}</div>
				}`,
					'App.tsrx',
				),
			).toThrow(/multiple `ref=\{\.\.\.\}` attributes/);
		});
	});
});
