import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

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
});
