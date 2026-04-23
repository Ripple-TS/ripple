import { describe, expect, it } from 'vitest';

/**
 * @typedef {{
 *   compile: (source: string, filename?: string, options?: any) => { code: string, css: { code: string, hash: string } | null },
 *   name: string,
 * }} CompileHarness
 */

/**
 * Shared compile-output regressions. These assert observable properties of
 * the generated code (not source-map structure) that every JSX target should
 * satisfy — e.g. the factory walker's `MemberExpression` rewrite of
 * `StyleIdentifier` refs into class-name literals must survive whatever
 * `transformElement` hook the platform wires in.
 *
 * @param {CompileHarness} harness
 */
export function runSharedCompileTests({ compile, name }) {
	describe(`[${name}] walker transforms survive element lowering`, () => {
		it('rewrites #style member expressions inside element child expressions', () => {
			const { code } = compile(
				`export component App() {
					<div>{#style.root}</div>
					<style>
						.root { color: blue; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/"tsrx-[a-z0-9]+ root"/);
			expect(code).not.toContain('#style');
		});

		it('rewrites #style bracket notation inside element child expressions', () => {
			const { code } = compile(
				`export component App() {
					<div>{#style['accent']}</div>
					<style>
						.accent { color: red; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/"tsrx-[a-z0-9]+ accent"/);
			expect(code).not.toContain('#style');
		});

		it('rewrites #style inside a {text expr} sole child', () => {
			const { code } = compile(
				`export component App() {
					<div>{text #style.root}</div>
					<style>
						.root { color: blue; }
					</style>
				}`,
				'App.tsrx',
			);
			expect(code).toMatch(/"tsrx-[a-z0-9]+ root"/);
			expect(code).not.toContain('#style');
			expect(code).not.toContain('StyleIdentifier');
		});
	});
}
