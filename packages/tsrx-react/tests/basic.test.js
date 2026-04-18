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
});
