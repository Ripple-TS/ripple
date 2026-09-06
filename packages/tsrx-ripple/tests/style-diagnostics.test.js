import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

// The style diagnostics of RFC tsrx-org/RFCs#1 come from the shared analyzer
// in @tsrx/core; these tests pin that the Ripple target surfaces them, with
// their codes, in both strict and collect mode.

/**
 * @param {string} source
 * @returns {string[]}
 */
function error_codes(source) {
	return compile(source, 'App.tsrx', { collect: true }).errors.map((error) => error.code);
}

describe('@tsrx/ripple scoped-style diagnostics', () => {
	it('rejects an apply target declared after the block that applies it', () => {
		const source = `
export function App() @{
	<>
		<style apply={theme} />
		<div>{'x'}</div>
	</>
}
const theme = <style>div { color: red; }</style>;
`;
		expect(error_codes(source)).toEqual(['tsrx-style-apply-before-declaration']);
		expect(() => compile(source, 'App.tsrx')).toThrow(/before its declaration/);
	});

	it('rejects an apply target that is not a style block, and a literal apply value', () => {
		expect(
			error_codes(`
const theme = { $class: 'x' };
export function App() @{
	<>
		<style apply={theme} />
		<div>{'x'}</div>
	</>
}`),
		).toEqual(['tsrx-style-apply-target']);
		expect(
			error_codes(`
const theme = <style>div { color: red; }</style>;
export function App() @{
	<>
		<style apply="theme" />
		<div>{'x'}</div>
	</>
}`),
		).toEqual(['tsrx-style-apply-value']);
	});

	it('rejects a lone <style> as the output of a code block and a raw block in plain TSX', () => {
		expect(
			error_codes(`
export function App() @{
	<style>div { color: red; }</style>
}`),
		).toEqual(['tsrx-style-standalone-needs-fragment']);
		expect(
			error_codes(`
export function App() {
	return <>
		<style>div { color: red; }</style>
		<div>{'x'}</div>
	</>;
}`),
		).toEqual(['tsrx-style-standalone-outside-template']);
	});

	it('leaves <style>{css}</style> alone as an ordinary element', () => {
		const { code, css } = compile(
			`
export function App({ css }: { css: string }) {
	return <div><style>{css}</style></div>;
}`,
			'App.tsrx',
		);
		expect(css).toBe('');
		expect(code).toContain('<style>');
		expect(code).not.toContain('tsrx-');
	});
});

describe('@tsrx/ripple scoped styles in type-only output', () => {
	it('verifies apply targets through a $class read on the style stand-in', () => {
		const source = `
import { theme } from './theme.tsrx';
const local = <style apply={theme}>.a { color: red; }</style>;
export function App() @{
	<>
		<style apply={[theme, local]}>.in { margin: 0; }</style>
		<div class="in">{'in'}</div>
	</>
}`;
		const { code, errors } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(errors).toEqual([]);
		// The assigned block's class map reads the imported target itself; its
		// hoisted stand-in carries no reads (they would sit above `theme`).
		expect(code).toContain("'$class': theme.$class + ' tsrx-");
		expect(code).toContain('const style_anchor = <style></style>;');
		expect(code).toContain('<style data-tsrx-apply={[theme.$class, local.$class]}></style>');
		// The stamped scope classes are a runtime detail: the authored class
		// stays as written in the type-only view.
		expect(code).toContain('<div class="in">');
	});
});
