import { describe, expect, it } from 'vitest';
import { identifier_to_jsx_name } from '@tsrx/core';
import {
	build_line_offsets,
	build_src_to_gen_map,
	get_generated_position,
} from '../../src/source-map-utils.js';

/**
 * @typedef {{
 *   compile: (source: string, filename?: string) => { code: string, map: any },
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
	compile,
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
		it('ForOfStatement', () =>
			expect_maps(`const test = () => { for (const x of Object.keys({})) {}}`));
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
		it('type annotation on array destructuring pattern', () =>
			expect_maps(
				`component C() { const [s, setS]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState(true); }`,
			));
	});

	describe(`[${name}] raw source maps cover one-line early-return if statements`, () => {
		it('maps the if keyword in plain functions', () => {
			const source = `function f(x) {
	if (x) return true
	return false
}`;
			const result = compile(source, 'App.tsrx');
			const [src_to_gen_map] = build_src_to_gen_map(
				result.map,
				new Map(),
				build_line_offsets(result.code),
				result.code,
			);

			expect(() => get_generated_position(2, 1, src_to_gen_map)).not.toThrow();
		});
	});

	describe(`[${name}] raw source maps cover class-like early-return if statements`, () => {
		/**
		 * @param {string} source
		 * @param {number} line
		 * @param {number} column
		 */
		const expect_if_mapping = (source, line, column) => {
			const result = compile(source, 'App.tsrx');
			const [src_to_gen_map] = build_src_to_gen_map(
				result.map,
				new Map(),
				build_line_offsets(result.code),
				result.code,
			);

			expect(() => get_generated_position(line, column, src_to_gen_map)).not.toThrow();
		};

		it('maps the if keyword in class methods', () => {
			expect_if_mapping(
				`class Foo {
	bar(x) {
		if (x) return true
		return false
	}
}`,
				3,
				2,
			);
		});

		it('maps the if keyword in async class methods', () => {
			expect_if_mapping(
				`class Foo {
	async bar(x) {
		if (x) return true
		return false
	}
}`,
				3,
				2,
			);
		});

		it('maps the if keyword in static class methods', () => {
			expect_if_mapping(
				`class Foo {
	static bar(x) {
		if (x) return true
		return false
	}
}`,
				3,
				2,
			);
		});

		it('maps the if keyword in class getters', () => {
			expect_if_mapping(
				`class Foo {
	get bar() {
		if (cond) return true
		return false
	}
}`,
				3,
				2,
			);
		});

		it('maps the if keyword in class field arrows', () => {
			expect_if_mapping(
				`class Foo {
	bar = (x) => {
		if (x) return true
		return false
	}
}`,
				3,
				2,
			);
		});

		it('maps the if keyword in object method shorthand', () => {
			expect_if_mapping(
				`const foo = {
	bar(x) {
		if (x) return true
		return false
	}
}`,
				3,
				2,
			);
		});
	});

	describe(`[${name}] member-expression element names map each side independently`, () => {
		it('gives <Icons.Button></Icons.Button> distinct opening and closing id mappings', () => {
			const source = `component App() {
	<Icons.Button>{'x'}</Icons.Button>
}`;
			const opening_icons = source.indexOf('Icons.Button');
			const closing_icons = source.indexOf('Icons.Button', opening_icons + 1);
			const opening_button = opening_icons + 'Icons.'.length;
			const closing_button = closing_icons + 'Icons.'.length;

			const result = compile_to_volar_mappings(source, 'App.tsrx');
			/**
			 * @param {number} offset
			 * @param {number} length
			 */
			const mapping_at = (offset, length) =>
				result.mappings.find(
					(/** @type {{ sourceOffsets: number[], lengths: number[] }} */ m) =>
						m.sourceOffsets[0] === offset && m.lengths[0] === length,
				);

			expect(mapping_at(opening_icons, 'Icons'.length)).toBeDefined();
			expect(mapping_at(closing_icons, 'Icons'.length)).toBeDefined();
			expect(mapping_at(opening_button, 'Button'.length)).toBeDefined();
			expect(mapping_at(closing_button, 'Button'.length)).toBeDefined();
		});
	});

	describe(`[${name}] optional TypeScript identifiers keep mappings`, () => {
		it('maps manually printed optional tuple labels and function parameters', () => {
			const source = `export type OptionalTuple = [tupleRequired: string, tupleMaybe?: string];
export type OptionalFn = (fnRequired: string, fnMaybe?: string) => void;
export function optionalFn(declRequired: string, declMaybe?: string) {
	todo(declRequired, declMaybe);
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			/**
			 * @param {string} identifier
			 * @param {string} sourceNeedle
			 */
			const expect_identifier_mapping = (identifier, sourceNeedle) => {
				const generated_needle = sourceNeedle;
				const source_offset = source.indexOf(sourceNeedle);
				const generated_offset = result.code.indexOf(generated_needle);
				const mapping = result.mappings.find(
					(
						/** @type {{ sourceOffsets: number[], generatedOffsets: number[], lengths: number[], generatedLengths: number[] }} */ m,
					) =>
						m.sourceOffsets[0] === source_offset &&
						m.generatedOffsets[0] === generated_offset &&
						m.lengths[0] === identifier.length &&
						m.generatedLengths[0] === identifier.length,
				);

				expect(source_offset).toBeGreaterThan(-1);
				expect(generated_offset).toBeGreaterThan(-1);
				expect(mapping).toBeDefined();
			};

			expect(result.errors).toEqual([]);
			expect(result.code).toContain('tupleMaybe?: string');
			expect(result.code).toContain('fnMaybe?: string');
			expect(result.code).toContain('declMaybe?: string');
			expect_identifier_mapping('tupleMaybe', 'tupleMaybe?: string');
			expect_identifier_mapping('fnMaybe', 'fnMaybe?: string');
			expect_identifier_mapping('declMaybe', 'declMaybe?: string');
		});
	});

	describe(`[${name}] component return mappings`, () => {
		it('maps generated bare returns back to source returns', () => {
			const source = `component App() {
	return;
	const value = 'after';
	<div>{value}</div>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');
			const source_return_offset = source.indexOf('return');
			const generated_return_offset = result.code.indexOf('return');
			const return_mapping = result.mappings.find(
				(
					/** @type {{ sourceOffsets: number[], lengths: number[], generatedOffsets: number[], generatedLengths: number[] }} */ mapping,
				) =>
					mapping.sourceOffsets[0] === source_return_offset &&
					mapping.lengths[0] === 'return'.length &&
					mapping.generatedOffsets[0] === generated_return_offset &&
					mapping.generatedLengths[0] === 'return'.length,
			);

			expect(generated_return_offset).toBeGreaterThan(-1);
			expect(return_mapping).toBeDefined();
		});
	});

	describe(`[${name}] identifier_to_jsx_name preserves component metadata`, () => {
		it('flags capitalized identifier names as components', () => {
			const jsx = identifier_to_jsx_name({
				type: 'Identifier',
				name: 'MyComponent',
				metadata: { path: [] },
			});
			expect(jsx.type).toBe('JSXIdentifier');
			expect(jsx.metadata.is_component).toBe(true);
		});

		it('leaves lowercase identifiers unflagged', () => {
			const jsx = identifier_to_jsx_name({
				type: 'Identifier',
				name: 'div',
				metadata: { path: [] },
			});
			expect(jsx.type).toBe('JSXIdentifier');
			expect(jsx.metadata.is_component).toBe(false);
		});
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

		it('does not crash for the canonical <tsx> and <> unwrap cases', () => {
			// Covers the same shapes asserted in the shared compile harness
			// (`<tsx> and fragment unwrapping`), but as a source-map no-crash
			// sanity sweep to catch regressions at the Volar-mapping layer
			// rather than the compiled-output layer.
			const sources = [
				`class Foo { bar() { return <tsx>{'Hello'}</tsx>; } }`,
				`class Foo { bar() { return <>{'Hello'}</>; } }`,
				`class Foo { bar() { const x = 1; return <tsx>{x}</tsx>; } }`,
				`class Foo { bar() { return <tsx>plain</tsx>; } }`,
			];
			for (const source of sources) {
				expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
			}
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

	describe(`[${name}] shared tests conditionally run for specific frameworks`, () => {
		it.runIf(['react', 'preact'].includes(name))(
			`[${name}] maps source declarations to their own generated declarations when hook helpers are extracted`,
			() => {
				const source = `import { useState } from 'react';

	component App() {
		const [show, setShow] = useState(true);

		if (show) {
			const [count, setCount] = useState(0);
			<p>{count}</p>
			<button onClick={() => setCount(count + 1)}>{'inc'}</button>
		}
	}`;

				const result = compile_to_volar_mappings(source, 'App.tsrx');
				const generated_helper_declaration_name_offset = result.code.indexOf('StatementBodyHook1');
				const generated_helper_call_name_offset = result.code.indexOf(
					'StatementBodyHook1',
					generated_helper_declaration_name_offset + 1,
				);
				const generated_helper_count_declaration_offset =
					result.code.indexOf('const [count, setCount]');
				const generated_declaration_offset = result.code.indexOf('const [show, setShow]');
				const source_show_offset = source.indexOf('show, setShow');
				const source_set_show_offset = source.indexOf('setShow');
				const source_count_offset = source.indexOf('count, setCount');
				const source_set_count_offset = source.indexOf('setCount');
				const generated_show_offset = result.code.indexOf('show', generated_declaration_offset);
				const generated_set_show_offset = result.code.indexOf(
					'setShow',
					generated_declaration_offset,
				);
				const generated_count_offset = result.code.indexOf(
					'count',
					generated_helper_count_declaration_offset,
				);
				const generated_set_count_offset = result.code.indexOf(
					'setCount',
					generated_helper_count_declaration_offset,
				);

				const show_mapping = result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === source_show_offset && mapping.lengths[0] === 'show'.length,
				);
				const set_show_mapping = result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === source_set_show_offset &&
						mapping.lengths[0] === 'setShow'.length,
				);
				const count_mapping = result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === source_count_offset &&
						mapping.lengths[0] === 'count'.length,
				);
				const set_count_mapping = result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === source_set_count_offset &&
						mapping.lengths[0] === 'setCount'.length,
				);
				const helper_declaration_name_mapping = result.mappings.find(
					(mapping) =>
						mapping.generatedOffsets[0] <= generated_helper_declaration_name_offset &&
						generated_helper_declaration_name_offset <
							mapping.generatedOffsets[0] + mapping.generatedLengths[0],
				);
				const helper_call_name_mapping = result.mappings.find(
					(mapping) =>
						mapping.generatedOffsets[0] <= generated_helper_call_name_offset &&
						generated_helper_call_name_offset <
							mapping.generatedOffsets[0] + mapping.generatedLengths[0],
				);
				const invalid_mapping = result.mappings.find(
					(mapping) =>
						mapping.lengths[0] < 0 ||
						mapping.generatedLengths[0] < 0 ||
						mapping.sourceOffsets[0] < 0 ||
						mapping.generatedOffsets[0] < 0,
				);

				expect(result.errors).toEqual([]);
				expect(invalid_mapping).toBeUndefined();
				expect(helper_declaration_name_mapping).toBeUndefined();
				expect(helper_call_name_mapping).toBeUndefined();
				expect(show_mapping?.generatedOffsets[0]).toBe(generated_show_offset);
				expect(set_show_mapping?.generatedOffsets[0]).toBe(generated_set_show_offset);
				expect(count_mapping?.generatedOffsets[0]).toBe(generated_count_offset);
				expect(set_count_mapping?.generatedOffsets[0]).toBe(generated_set_count_offset);
			},
		);

		it.runIf(['react', 'preact'].includes(name))(
			'maps captured hook-helper bindings only once at their source declarations',
			() => {
				const source = `import { useState } from 'react';

			component App() {
				const [show, setShow] = useState(true);

				if (show) {
					const [count, setCount] = useState(0);
					<p>{count}</p>
					<button onClick={() => setCount(count + 1)}>{'inc'}</button>
				}
			}`;

				const result = compile_to_volar_mappings(source, 'App.tsrx');
				const generated_helper_count_declaration_offset =
					result.code.indexOf('const [count, setCount]');
				const generated_show_declaration_offset = result.code.indexOf('const [show, setShow]');
				const source_show_offset = source.indexOf('show, setShow');
				const source_set_show_offset = source.indexOf('setShow');
				const source_count_offset = source.indexOf('count, setCount');
				const source_set_count_offset = source.indexOf('setCount');
				const generated_show_offset = result.code.indexOf(
					'show',
					generated_show_declaration_offset,
				);
				const generated_set_show_offset = result.code.indexOf(
					'setShow',
					generated_show_declaration_offset,
				);
				const generated_count_offset = result.code.indexOf(
					'count',
					generated_helper_count_declaration_offset,
				);
				const generated_set_count_offset = result.code.indexOf(
					'setCount',
					generated_helper_count_declaration_offset,
				);

				const find_mappings = (source_offset, length) =>
					result.mappings.filter(
						(mapping) =>
							mapping.sourceOffsets[0] === source_offset && mapping.lengths[0] === length,
					);
				const show_mappings = find_mappings(source_show_offset, 'show'.length);
				const set_show_mappings = find_mappings(source_set_show_offset, 'setShow'.length);
				const count_mappings = find_mappings(source_count_offset, 'count'.length);
				const set_count_mappings = find_mappings(source_set_count_offset, 'setCount'.length);

				expect(result.errors).toEqual([]);
				expect(show_mappings).toHaveLength(1);
				expect(set_show_mappings).toHaveLength(1);
				expect(count_mappings).toHaveLength(1);
				expect(set_count_mappings).toHaveLength(1);
				expect(show_mappings[0].generatedOffsets[0]).toBe(generated_show_offset);
				expect(set_show_mappings[0].generatedOffsets[0]).toBe(generated_set_show_offset);
				expect(count_mappings[0].generatedOffsets[0]).toBe(generated_count_offset);
				expect(set_count_mappings[0].generatedOffsets[0]).toBe(generated_set_count_offset);
			},
		);
	});
}
