import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe('@tsrx/preact basic', () => {
	it('compiles a simple component', () => {
		const { code } = compile(
			`export component App() {
				<div>{'Hello world'}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('export function App()');
		expect(code).toContain("{'Hello world'}");
	});

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

	it('rejects {html ...} with Preact-branded message', () => {
		expect(() =>
			compile(
				`export component App() {
					<div>{html '<span>x</span>'}</div>
				}`,
				'App.tsrx',
			),
		).toThrow(/Preact target/);
	});

	describe('interleaved statements and JSX children', () => {
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

			expect(code).not.toContain('_tsrx_child_');
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
});
