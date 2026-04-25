import { describe, expect, it } from 'vitest';
import { runSharedCompileTests } from '@tsrx/core/test-harness/compile';
import { runSharedSourceMappingTests } from '@tsrx/core/test-harness/source-mappings';
import { compile, compile_to_volar_mappings } from '../src/index.js';

runSharedSourceMappingTests({
	compile,
	compile_to_volar_mappings,
	name: 'preact',
	rejectsComponentAwait: true,
});

runSharedCompileTests({ compile, name: 'preact', classAttrName: 'class' });

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

	describe('lazy destructuring', () => {
		it('transforms lazy object destructuring in component params', () => {
			const { code } = compile(
				`export component App(&{name, age}: Props) {
					<div>{name}{age}</div>
				}`,
				'App.tsrx',
			);

			expect(code).toContain('function App(__lazy0: Props)');
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

			expect(code).toContain('(name: string) => name.toUpperCase()');
			expect(code).toContain('fn(__lazy0.name)');
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
	});
});
