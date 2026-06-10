import { describe, expect, it } from 'vitest';
import {
	runSharedCompileDiagnosticsTests,
	runSharedCompileTests,
	runSharedTsxExpressionTsrxTests,
} from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'preact',
	rejectsComponentAwait: false,
});

runSharedTsxExpressionTsrxTests({ compile, name: 'preact', classAttrName: 'class' });
runSharedCompileTests({ compile, name: 'preact', classAttrName: 'class' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'preact' });

describe('@tsrx/preact basic', () => {
	it('imports Suspense from preact/compat when try/pending is used', () => {
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
		expect(code).toContain("from 'preact/compat'");
		expect(code).not.toContain("from 'react'");
	});

	it('allows overriding the Suspense import source via compile options', () => {
		const { code } = compile(
			`export function App() @{
				@try {
					<div>{'async content'}</div>
				} @pending {
					<p>{'loading...'}</p>
				}
			}`,
			'App.tsrx',
			{ suspenseSource: 'preact-suspense' },
		);

		expect(code).toContain('Suspense');
		expect(code).toContain("from 'preact-suspense'");
		expect(code).not.toContain("from 'preact/compat'");
	});

	it('imports TsrxErrorBoundary from @tsrx/preact/error-boundary when try/catch is used', () => {
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
		expect(code).toContain("from '@tsrx/preact/error-boundary'");
		expect(code).not.toContain("from '@tsrx/react/error-boundary'");
	});

	it('rejects namespaced template tags', () => {
		expect(() =>
			compile(
				`export function App() @{
					<foo:bar>
						<div>{'namespaced'}</div>
					</foo:bar>
				}`,
				'App.tsrx',
			),
		).toThrow(/Namespaced elements are not supported/);
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
			`import { map_iterable as __map_iterable } from '@tsrx/preact/runtime/iterable';`,
		);
		expect(code).toContain('__map_iterable(items, (item) => {');
		expect(code).not.toContain('Array.from(');
		expect(code).not.toContain('Array.isArray(');
	});

	it('uses map_iterable inside a for-of with hook calls without normalizing the source', () => {
		const { code } = compile(
			`import { useState } from 'preact/hooks';

			export function App({ items }: { items: Iterable<string> }) @{
				@for (const item of items) {
					const [open, setOpen] = useState(false);
					<li key={item}>{open ? item : '-'}</li>
				}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('map_iterable as __map_iterable');
		expect(code).toContain("from '@tsrx/preact/runtime/iterable'");
		expect(code).toContain('useState(false)');
		expect(code).toContain('__map_iterable(items,');
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('type IterationValue as __IterationValue');
		expect(code).not.toContain('Array.from(');
		expect(code).not.toContain('Array.isArray(');
		expect(code).not.toContain('IterationValue as type __IterationValue');
	});

	it('keeps component-body hooks after early null returns without splitting', () => {
		const { code } = compile(
			`import { useEffect } from 'preact/hooks';

				export function App({ x }: { x: boolean }) @{
					if (x) {
						return null;
					}

					useEffect(() => {});
				}`,
			'App.tsrx',
		);

		expect(code).toContain('useEffect(() => {});');
		expect(code).toContain('if (x) {');
		expect(code).toContain('return null;');
		expect(code).not.toContain('StatementBodyHook');
	});

	it('does not split hooks out of ordinary uppercase function bodies', () => {
		const { code } = compile(
			`import { useEffect } from 'preact/hooks';

				export function App({ x }: { x: boolean }) {
					if (x) {
						return null;
					}

					useEffect(() => {});
				}`,
			'App.tsrx',
		);

		expect(code).toContain('export function App({ x }: { x: boolean }) {');
		expect(code).toContain('if (x) {');
		expect(code).toContain('return null;');
		expect(code).toContain('useEffect(() => {});');
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain('return <App__StatementBodyHook');
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

	it('applies scoped css hashes and keeps type selectors for dynamic tags', () => {
		const { code, css, cssHash } = compile(
			`export function App() @{
				const Tag = 'section';
				<>
					<{Tag} class="host">{'hello'}</{Tag}>

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
		expect(code).toContain(`class="host ${cssHash}"`);
		expect(css).toContain(`div.${cssHash}`);
		expect(css).toContain(`.host.${cssHash}`);
	});

	it('lowers dynamic tag syntax to a scoped component alias', () => {
		const { code } = compile(
			`export function App() @{
				const Tag = 'section';
				<{Tag} class="host">{'hello'}</{Tag}>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const TsrxDynamic_1 = Tag;');
		expect(code).toContain(`<TsrxDynamic_1 class="host">{'hello'}</TsrxDynamic_1>`);
		expect(code).not.toContain('@tsrx/preact/dynamic');
	});

	it('keeps the Dynamic component shape in type-only output for dynamic tags', () => {
		const { code } = compile_to_volar_mappings(
			`export function App() @{
				const Tag = 'section';
				<{Tag} class="host">{'hello'}</{Tag}>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code).toContain(`import { Dynamic as TsrxDynamic } from '@tsrx/preact/dynamic';`);
		expect(code).toContain(`<TsrxDynamic is={Tag} class="host"`);
	});

	it('keeps hook-bearing composite children inline without helper prop plumbing', () => {
		const source = `import { useState } from 'preact/hooks';
			import type { PropsWithChildren } from 'ripple';

			function Wrapper(props: PropsWithChildren<{}>) @{
				<section>{props.children}</section>
			}

			function Parent(props: { title: string }) @{
				<Wrapper>@{
					const [count] = useState(0);

					<>
						<h1>{props.title}</h1>
						<span>{count}</span>
					</>
				}</Wrapper>

			}

			function App() @{
				<Parent title="Hello from props" />
			}`;
		const { code } = compile(source, 'App.tsrx');
		const mappings = compile_to_volar_mappings(source, 'App.tsrx');

		expect(code).toContain('<h1>{props.title}</h1>');
		expect(code).not.toContain('StatementBodyHook');
		expect(code).not.toContain(': any');
		expect(mappings.code).toContain('<h1>{props.title}</h1>');
		expect(mappings.code).not.toContain('StatementBodyHook');
		expect(mappings.code).not.toContain('props: any');
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
			expect(code).not.toContain('@tsrx/preact/ref');
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

			expect(code).toContain("from '@tsrx/preact/ref'");
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

			expect(code).not.toContain("from '@tsrx/preact/ref'");
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
				`import { mergeRefs } from '@tsrx/preact/ref';

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
