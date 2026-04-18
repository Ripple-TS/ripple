import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

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
		expect(code).toContain('return <div className=');
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
		expect(code).toContain('if (count > 1) {');
		expect(code).toContain("return <div>{'Count is more than one'}</div>;");
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
		expect(code).toContain("return <div>{'Ready'}</div>;");
		expect(code).toContain("return <div>{'Loading'}</div>;");
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
		expect(code).toContain("return <div>{'Count is more than one'}</div>;");
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
		expect(code).toContain('return <StatementBodyHook1 />;');
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
		expect(code).toContain('<StatementBodyHook1 key={item} />');
	});
});
