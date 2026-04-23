import { describe, expect, it } from 'vitest';

/**
 * @typedef {{
 *   compile_to_volar_mappings: (source: string, filename?: string, options?: any) => any,
 *   name: string,
 *   rejectsComponentAwait: boolean,
 * }} SourceMappingHarness
 *
 * `rejectsComponentAwait`: does the platform refuse top-level `await` in a
 * component body (without any escape directive)? React returns an async
 * component and accepts it; Preact requires a `"use server"` directive to
 * allow it; Solid forbids it outright. When true, the shared `AwaitExpression`
 * test asserts the compiler throws rather than that it maps successfully.
 */

/**
 * Tests for `compile_to_volar_mappings`
 * @param {SourceMappingHarness} harness
 */
export function runSharedSourceMappingTests({
	compile_to_volar_mappings,
	name,
	rejectsComponentAwait,
}) {
	describe(`[${name}] source mappings do not crash for`, () => {
		/**
		 * @param {string} source
		 */
		const expect_maps = (source) => {
			expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
		};

		// JS nodes whose esrap printer emits leading/trailing literal tokens
		// (like `new`, `return`, backticks, `[...]`) without location markers;
		// segments.js calls get_mapping_from_node() on these directly.
		it('NewExpression', () => expect_maps(`component C() { const x = new Map(); }`));
		it('computed MemberExpression', () => expect_maps(`component C() { const x = foo[bar]; }`));
		it('empty ObjectExpression', () => expect_maps(`component C() { const x = {}; }`));
		it('non-empty ObjectExpression', () => expect_maps(`component C() { const x = { a: 1 }; }`));
		it('ReturnStatement', () => expect_maps(`function f() { return 1; } component C() {}`));
		it('ForStatement', () => expect_maps(`component C() { for (let i = 0; i < 10; i++) {} }`));
		it('ForInStatement', () => expect_maps(`component C() { for (const x in obj) {} }`));
		it('TemplateLiteral', () => expect_maps('component C() { const x = `hello ${y}`; }'));
		it('TaggedTemplateExpression', () => expect_maps('component C() { tag`hi`; }'));
		// AwaitExpression inside a component body. React emits an async
		// component and the source-map walk must handle the AwaitExpression
		// node. Preact (without `"use server"`) and Solid reject this shape
		// at compile time — for them the test asserts the compiler throws,
		// which is the same observable guarantee at a different layer.
		it('AwaitExpression in component body', () => {
			const source = `component C() { await foo(); }`;
			if (rejectsComponentAwait) {
				expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).toThrow();
			} else {
				expect_maps(source);
			}
		});

		// Class methods: segments.js reads node.value.metadata.is_component,
		// so every FunctionExpression needs metadata defaulted on it.
		it('class method', () => expect_maps(`class Foo { bar() { return 1; } } component C() {}`));
		it('class async method', () =>
			expect_maps(`class Foo { async bar() { return 1; } } component C() {}`));
		it('class getter/setter', () =>
			expect_maps(`class Foo { get x() { return 1; } set x(v) {} } component C() {}`));
		it('class static method', () => expect_maps(`class Foo { static bar() {} } component C() {}`));
		it('object method shorthand', () =>
			expect_maps(`component C() { const o = { foo() { return 1; } }; }`));

		// TS wrapper nodes whose spans (e.g. angle-bracket delimiters around
		// generics) are otherwise invisible to the source map.
		it('generic call with type arguments', () =>
			expect_maps(`component C() { useState<string>(''); }`));
		it('component with type parameters', () => expect_maps(`component C<T extends string>() {}`));
		it('as-expression', () => expect_maps(`component C() { const x = y as string; }`));
		it('union type annotation', () => expect_maps(`component C(p: { x: string | null }) {}`));
		it('array type annotation', () => expect_maps(`component C(p: { items: string[] }) {}`));
		it('type predicate (x is T)', () =>
			expect_maps(
				`function isF(x: any): x is string { return typeof x === 'string'; } component C() {}`,
			));
		it('asserts type predicate', () =>
			expect_maps(
				`function assertF(x: any): asserts x is string { if (typeof x !== 'string') throw new Error(); } component C() {}`,
			));
		it('asserts without type', () =>
			expect_maps(
				`function assert(x: any): asserts x { if (!x) throw new Error(); } component C() {}`,
			));

		// JSX: esrap prints `<`, `>`, `</`, ` /` without location markers.
		// Combined with hoisting to module-level statics, the opening
		// element's start/end positions wouldn't otherwise resolve.
		it('self-closing element', () => expect_maps(`component C() { <input /> }`));
		it('self-closing with attribute', () => expect_maps(`component C() { <input class="foo" /> }`));
		it('element with attribute spread', () =>
			expect_maps(`component C() { const o = {}; <div {...o} /> }`));

		// Regression for the original useState<…> crash that started this
		// whole line of investigation — kept as an end-to-end shape check.
		it('calls with explicit type arguments', () =>
			expect_maps(`component Test() { const [foo, setFoo] = useState<string | null>(null) }`));
	});

	describe(`[${name}] <tsx> blocks preserve source locations`, () => {
		it('keeps loc on the JSX inside single-child tsx blocks', () => {
			// Regression: previously `strip_locations` recursively deleted loc on
			// the entire tsx block subtree, destroying Volar mappings for the
			// inner JSX. Mappings for the inner <div> should still resolve.
			const source = `component C() { <tsx><div>hi</div></tsx> }`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const div_offset = source.indexOf('<div>');
			const has_div_mapping = result.mappings.some(
				(/** @type {{ sourceOffsets: number[] }} */ m) => m.sourceOffsets[0] === div_offset + 1,
			);
			expect(has_div_mapping).toBe(true);
		});

		it('keeps loc inside multi-child tsx blocks (fragment wrapped)', () => {
			const source = `component C() { <tsx><div>a</div><div>b</div></tsx> }`;
			expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
		});

		it('handles a tsx block whose single child is a JSXExpressionContainer', () => {
			// The parser emits JSXExpressionContainer (not TSRXExpression) when
			// `{...}` appears inside a <tsx> block. Its `loc` points at `{...}`,
			// but esrap prints `{` and `}` without location markers — so the
			// factory's JSXExpressionContainer visitor must add them.
			const source = `class Foo {
	bar() {
		return <tsx>{'Hello'}</tsx>;
	}
}`;
			expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
		});
	});
}
