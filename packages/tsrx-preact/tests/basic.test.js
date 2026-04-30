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
	name: 'preact',
	rejectsComponentAwait: true,
});

runSharedCompileTests({ compile, name: 'preact', classAttrName: 'class' });
runSharedCompileDiagnosticsTests({ compile_to_volar_mappings, name: 'preact' });

describe('@tsrx/preact basic', () => {
	it('imports Suspense from preact/compat when try/pending is used', () => {
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
		expect(code).toContain("from 'preact/compat'");
		expect(code).not.toContain("from 'react'");
	});

	it('allows overriding the Suspense import source via compile options', () => {
		const { code } = compile(
			`export component App() {
				try {
					<div>{'async content'}</div>
				} pending {
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
		expect(code).toContain("from '@tsrx/preact/error-boundary'");
		expect(code).not.toContain("from '@tsrx/react/error-boundary'");
	});

	it('accepts <tsx:preact> blocks', () => {
		const { code } = compile(
			`export component App() {
				<tsx:preact>
					<div>{'preact tsx'}</div>
				</tsx:preact>
			}`,
			'App.tsrx',
		);

		expect(code).toContain("{'preact tsx'}");
	});

	it('rejects unsupported tsx compat kinds with Preact-branded message', () => {
		expect(() =>
			compile(
				`export component App() {
					<tsx:solid>
						<div>{'solid tsx'}</div>
					</tsx:solid>
				}`,
				'App.tsrx',
			),
		).toThrow(/Preact TSRX/);
	});

	it('rejects await without use server directive with Preact-branded message', () => {
		expect(() =>
			compile(
				`export component App() {
					const data = await fetchData();
					<div>{data}</div>
				}`,
				'App.tsrx',
			),
		).toThrow(/Preact components/);
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

	it('preserves parent prop types in hook-bearing composite children', () => {
		const { code } = compile(
			`import { useState } from 'preact/hooks';
			import type { PropsWithChildren } from 'ripple';

			component Wrapper(props: PropsWithChildren<{}>) {
				<section>{props.children}</section>
			}

			component Parent(props: { title: string }) {
				<Wrapper>
					const [count] = useState(0);

					<h1>{props.title}</h1>
					<span>{count}</span>
				</Wrapper>
			}

			component App() {
				<Parent title="Hello from props" />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('const _tsrx_StatementBodyHook1_props = props;');
		expect(code).toContain(
			'function StatementBodyHook1({ props }: { props: typeof _tsrx_StatementBodyHook1_props })',
		);
		expect(code).toContain('<h1>{props.title}</h1>');
		expect(code).not.toContain('function StatementBodyHook1({ props })');
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
			expect(code).not.toContain('@tsrx/preact/merge-refs');
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
			expect(code).toContain("import { mergeRefs as __mergeRefs } from '@tsrx/preact/merge-refs'");
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
