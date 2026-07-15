import { describe, expect, it } from 'vitest';
import { identifier_to_jsx_name } from '@tsrx/core';
import {
	build_line_offsets,
	build_src_to_gen_map,
	find_exact_mapping,
	get_generated_position,
	offset_to_line_col,
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
 * component body (without any escape directive)? React and Preact return async
 * functions and accept it; Solid forbids it outright. When true, the shared `AwaitExpression`
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
		it('NewExpression', () =>
			expect_maps(`function C() @{
	const x = new Map();
}`));
		it('computed MemberExpression', () =>
			expect_maps(`function C() @{
	const x = foo[bar];
}`));
		it('empty ObjectExpression', () =>
			expect_maps(`function C() @{
	const x = {};
}`));
		it('non-empty ObjectExpression', () =>
			expect_maps(`function C() @{
	const x = { a: 1 };
}`));
		it('ReturnStatement', () => expect_maps(`function f() { return 1; } function C() @{}`));
		it('ForStatement', () =>
			expect_maps(`function C() @{
	for (let i = 0; i < 10; i++) {}
}`));
		it('ForInStatement', () =>
			expect_maps(`function C() @{
	for (const x in obj) {}
}`));
		it('ForOfStatement', () =>
			expect_maps(`const test = () => { for (const x of Object.keys({})) {}}`));
		it('SwitchStatement', () =>
			expect_maps(`function getStatus(status: 'active' | 'blocked') {
  switch (status) {
    case 'active':
      return { label: 'Running' }
    case 'blocked':
      return { label: 'Blocked' }
    default:
      return { label: 'Idle' }
  }
}`));
		it('TemplateLiteral', () =>
			expect_maps(`function C() @{
	const x = \`hello \${y}\`;
}`));
		it('TaggedTemplateExpression', () =>
			expect_maps(`function C() @{
	tag\`hi\`;
}`));
		// AwaitExpression inside an async function body.
		it('AwaitExpression in async function body', () => {
			expect_maps(`async function C() @{
	await foo();
}`);
		});

		// Class methods should still have defaulted FunctionExpression metadata.
		it('class method', () => expect_maps(`class Foo { bar() { return 1; } } function C() @{}`));
		it('class async method', () =>
			expect_maps(`class Foo { async bar() { return 1; } } function C() @{}`));
		it('class getter/setter', () =>
			expect_maps(`class Foo { get x() { return 1; } set x(v) {} } function C() @{}`));
		it('class static method', () => expect_maps(`class Foo { static bar() {} } function C() @{}`));
		it('object method shorthand', () =>
			expect_maps(`function C() @{
	const o = { foo() { return 1; } };
}`));

		// TS wrapper nodes whose spans (e.g. angle-bracket delimiters around
		// generics) are otherwise invisible to the source map.
		it('generic call with type arguments', () =>
			expect_maps(`function C() @{
	useState<string>('');
}`));
		it('call argument with arrow-function return type', () =>
			expect_maps(
				`function C() @{
	const [itemElements] = useState((): Record<string, HTMLButtonElement | null> => ({}));
}`,
			));
		it('component with type parameters', () =>
			expect_maps(`function C<T extends string>() { return <></>; }`));
		it('as-expression', () =>
			expect_maps(`function C() @{
	const x = y as string;
}`));
		it('union type annotation', () => expect_maps(`function C(p: { x: string | null }) @{}`));
		it('array type annotation', () => expect_maps(`function C(p: { items: string[] }) @{}`));
		it('type predicate (x is T)', () =>
			expect_maps(
				`function isF(x: any): x is string { return typeof x === 'string'; } function C() @{}`,
			));
		it('asserts type predicate', () =>
			expect_maps(
				`function assertF(x: any): asserts x is string { if (typeof x !== 'string') throw new Error(); } function C() @{}`,
			));
		it('asserts without type', () =>
			expect_maps(
				`function assert(x: any): asserts x { if (!x) throw new Error(); } function C() @{}`,
			));
		it.each([
			'interface Foo<T> extends Bar<T> {}',
			'interface Foo extends Bar<string> {}',
			'interface Foo<T, U> extends Bar<T>, Baz<U> {}',
			'interface Foo<T> extends Namespace.Bar<Array<T>> {}',
			'export interface Foo<T extends object> extends Bar<Readonly<T>> {}',
		])('preserves generic interface heritage arguments: %s', (source) => {
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

			expect(result.code).toContain(source);
			expect(result.errors).toEqual([]);
			expect(result.mappings.length).toBeGreaterThan(0);
		});

		// JSX: esrap prints `<`, `>`, `</`, ` /` without location markers.
		// Combined with hoisting to module-level statics, the opening
		// element's start/end positions wouldn't otherwise resolve.
		it('self-closing element', () => expect_maps(`function C() @{ <input /> }`));
		it('self-closing with attribute', () => expect_maps(`function C() @{ <input class="foo" /> }`));
		it('marks self-closing tokens for attribute completions', () => {
			const source = `function C() @{ <input /> }`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_offset = source.indexOf('/>');
			const mapping = result.mappings.find((entry) => {
				const start = entry.sourceOffsets[0];
				const end = start + entry.lengths[0];
				return source_offset >= start && source_offset <= end;
			});

			expect(mapping?.data.completion).toBe(true);
		});
		it('keeps DOM attribute completions when scoped styles are present', () => {
			const source = `function C() @{
	<>
		<img src="logo.png" alt="Logo" class="logo" />
		<style>
			.logo { display: block; }
		</style>
	</>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

			for (const attribute of ['src', 'alt', 'class']) {
				const source_offset = source.indexOf(attribute);
				const mapping = result.mappings.find((entry) => {
					const start = entry.sourceOffsets[0];
					const end = start + entry.lengths[0];
					return source_offset >= start && source_offset <= end;
				});

				expect(mapping?.data.completion).toBe(true);
			}
		});
		it('exposes template style blocks as CSS embedded mappings', () => {
			const source = `function C() @{
	<>
		<div class="logo" />
		<style>
			.logo { display: block; }
		</style>
	</>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const css_mapping = result.cssMappings.find((mapping) =>
				mapping.data?.customData?.content?.includes('.logo { display: block; }'),
			);

			expect(css_mapping).toBeDefined();
			expect(css_mapping?.data.customData.embeddedId).toMatch(/^style-/);
		});
		it('keeps assigned style blocks anchored in type-only output', () => {
			const source = `function C() @{
		const styles = <style>
			.logo { display: block; }
		</style>;

		<div class={styles.logo} />
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_offset = source.indexOf('<style>') + 1;
			const mapping = result.mappings.find((entry) => {
				const start = entry.sourceOffsets[0];
				const end = start + entry.lengths[0];
				return source_offset >= start && source_offset < end;
			});

			expect(result.code).toContain('<style></style>');
			expect(result.code).toContain('const styles = {');
			expect(result.code).not.toContain('(<style></style>,');
			expect(result.code).toContain("'logo'");
			expect(mapping).toBeDefined();
			expect(mapping?.data.completion).toBe(true);
			expect(mapping?.data.verification).toBe(false);
		});
		it('keeps class attribute source mappings narrowed to the attribute name', () => {
			const source = `function C() @{ <div class="app" /> }`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_offset = source.indexOf('class');
			const mapping = result.mappings.find((entry) => {
				const start = entry.sourceOffsets[0];
				const end = start + entry.lengths[0];
				return source_offset >= start && source_offset <= end;
			});

			expect(
				mapping &&
					source.slice(mapping.sourceOffsets[0], mapping.sourceOffsets[0] + mapping.lengths[0]),
			).toBe('class');
		});
		it('maps nested scoped class definitions to their own selectors', () => {
			const source = `function C() @{
	<>
		<div class="app">
			<div class="card"></div>
		</div>
		<style>
			.app { display: block; }
			.card { padding: 1rem; }
		</style>
	</>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_offset = source.indexOf('card');
			const mapping = result.mappings.find((entry) => {
				const start = entry.sourceOffsets[0];
				const end = start + entry.lengths[0];
				return source_offset >= start && source_offset <= end;
			});

			expect(mapping).toBeDefined();
			expect(mapping?.data.completion).toBe(true);
		});
		it('element with attribute spread', () =>
			expect_maps(`function C() @{
	const o = {};
	<div {...o} />
}`));

		// Regression for the original useState<…> crash that started this
		// whole line of investigation — kept as an end-to-end shape check.
		it('calls with explicit type arguments', () =>
			expect_maps(
				`function Test() @{
	const [foo, setFoo] = useState<string | null>(null);
}`,
			));
		it('type annotation on array destructuring pattern', () =>
			expect_maps(
				`function C() @{
	const [s, setS]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState(true);
}`,
			));

		// Class TS shape: type parameters, generic super class, implements clause.
		// esrap's ClassDeclaration printer omits typeParameters/superTypeArguments/
		// implements; without a wrapper the type-position child nodes are dropped
		// from the generated output and segments.js can't resolve their positions.
		it('class with type parameters', () =>
			expect_maps(`class Foo<T> { x: T | null = null; } function C() @{}`));
		it('class with generic extends', () =>
			expect_maps(`class Foo extends Bar<string> {} function C() @{}`));
		it('class with implements clause', () =>
			expect_maps(`interface I { x: number } class Foo implements I { x = 1 } function C() @{}`));
		it('class with generic implements', () =>
			expect_maps(
				`interface I<T> { x: T } class Foo implements I<string> { x = '' as string } function C() @{}`,
			));
		it('class expression with type parameters', () =>
			expect_maps(`function C() @{
	const F = class<T> { x: T | null = null; };
}`));

		// Method shorthand and class methods with type parameters / return types.
		it('class method with type parameters', () =>
			expect_maps(`class Foo { bar<T>(x: T): T { return x; } } function C() @{}`));
		it('class method with return type', () =>
			expect_maps(`class Foo { bar(x: number): string { return ''; } } function C() @{}`));
		it('object method shorthand with type parameters', () =>
			expect_maps(`function C() @{
	const o = { foo<T>(x: T): T { return x; } };
}`));
		// Non-method properties whose value happens to be a FunctionExpression
		// (`node.method === false`) must not be reprinted as method shorthand;
		// the Property override gates on `node.method`.
		it('property with function expression value', () =>
			expect_maps(`function C() @{
	const o = { foo: function() { return 1; } };
}`));
		it('property with named function expression value', () =>
			expect_maps(
				`function C() @{
	const o = { foo: function bar() { return 1; } };
}`,
			));
		it('property with async function expression value', () =>
			expect_maps(
				`function C() @{
	const o = { foo: async function() { return 1; } };
}`,
			));
		it('object literal getter', () =>
			expect_maps(`function C() @{
	const o = { get x() { return 1; } };
}`));
		it('object literal setter', () =>
			expect_maps(`function C() @{
	const o = { set x(v: number) {} };
}`));
		it('object literal getter with return type', () =>
			expect_maps(`function C() @{
	const o = { get x(): number { return 1; } };
}`));

		// TS type operators / mapped / parenthesized types.
		it('keyof type operator', () => expect_maps(`type K<T> = keyof T; function C() @{}`));
		it('readonly type operator', () => expect_maps(`type R = readonly string[]; function C() @{}`));
		it('parenthesized type annotation', () =>
			expect_maps(`function C(p: { x: (string | number) }) @{}`));
		it('mapped type', () => expect_maps(`type M<T> = { [K in keyof T]: T[K] }; function C() @{}`));
		it('mapped type with as remapping', () =>
			expect_maps(
				`type M<T> = { [K in keyof T as \`__\${string & K}\`]: T[K] }; function C() @{}`,
			));
		it('object type keyword', () =>
			expect_maps(`function f(x: object): object { return x; } function C() @{}`));

		// import type / `{ type X }` imports.
		it('import type declaration', () =>
			expect_maps(`import type { ReactNode } from 'react'; function C() @{}`));
		it('inline type import specifier', () =>
			expect_maps(`import { type ReactNode, useState } from 'react'; function C() @{}`));
		it('submodule import declaration', () =>
			expect_maps(`module server {
	export function load() {
		return 1;
	}
}

import { load } from server;

function C() @{
	load();
}`));

		// JS expressions whose esrap printer emits no leading/trailing location
		// marker, mirroring the existing IfStatement / NewExpression cases.
		it('UpdateExpression postfix', () =>
			expect_maps(`function C() @{
	let x = 0;
	x++;
}`));
		it('UpdateExpression prefix', () =>
			expect_maps(`function C() @{
	let x = 0;
	++x;
}`));
		it('UnaryExpression', () =>
			expect_maps(
				`function C() @{
	const x = !true;
	const y = -1;
	const z = typeof x;
}`,
			));
		it('YieldExpression', () =>
			expect_maps(`function* gen() { yield 1; yield* [2, 3]; } function C() @{}`));
		it('AssignmentPattern with type', () =>
			expect_maps(`function f(x: number = 1): number { return x; } function C() @{}`));

		// Arrow with default parameter and return type — combines AssignmentPattern
		// with the ArrowFunctionExpression returnType visitor.
		it('arrow with default-typed parameter and return type', () =>
			expect_maps(`function C() @{
	const f = (x: number = 1): number => x + 1;
}`));

		// TSInstantiationExpression: `identity<string>` used as a value.
		it('TSInstantiationExpression', () =>
			expect_maps(
				`function identity<T>(x: T): T { return x; } const f = identity<string>; function C() @{}`,
			));

		// TSExpressionWithTypeArguments shows up in generic extends/implements.
		// (Already covered by 'class with generic extends'/'class with generic implements'.)
	});

	describe(`[${name}] raw source maps cover one-line guarded return if statements`, () => {
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

	describe(`[${name}] raw source maps cover arrow functions`, () => {
		it('maps the whole arrow function start and end', () => {
			const source = `function C() @{
	const f = (x: number): number => x + 1;
}`;
			const result = compile(source, 'App.tsrx');
			const [src_to_gen_map] = build_src_to_gen_map(
				result.map,
				new Map(),
				build_line_offsets(result.code),
				result.code,
			);
			const source_line_offsets = build_line_offsets(source);
			const arrow_start = source.indexOf('(x: number)');
			const arrow_end = source.indexOf(';', arrow_start);
			const start = offset_to_line_col(arrow_start, source_line_offsets);
			const end = offset_to_line_col(arrow_end, source_line_offsets);

			expect(() => get_generated_position(start.line, start.column, src_to_gen_map)).not.toThrow();
			expect(() => get_generated_position(end.line, end.column, src_to_gen_map)).not.toThrow();
		});
	});

	describe(`[${name}] Volar mappings cover arrow functions`, () => {
		it('adds a verification-only mapping for the whole arrow function', () => {
			const source = `function C() @{
	const f = (x: number): number => x + 1;
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_arrow = '(x: number): number => x + 1';
			const source_offset = source.indexOf(source_arrow);
			const generated_offset = result.code.indexOf(source_arrow);
			const mapping = find_exact_mapping(
				result.mappings,
				source_offset,
				generated_offset,
				source_arrow.length,
			);

			expect(mapping?.data.verification).toBe(true);
			expect(mapping?.data.completion).toBeUndefined();
			expect(mapping?.data.semantic).toBeUndefined();
			expect(mapping?.data.navigation).toBeUndefined();
		});
	});

	describe(`[${name}] raw source maps cover class-like guarded return if statements`, () => {
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

	describe(`[${name}] Volar mappings cover declaration keywords`, () => {
		/**
		 * @param {string} source
		 */
		const expect_class_keyword_mapping = (source) => {
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_class_offset = source.indexOf('class');
			const generated_class_offset = result.code.indexOf('class');
			const mapping = find_exact_mapping(
				result.mappings,
				source_class_offset,
				generated_class_offset,
				'class'.length,
			);
			expect(mapping?.data.structure).toBe(true);
		};

		it('maps named class keywords', () => {
			expect_class_keyword_mapping(`class Store {
	value = 1;
}`);
		});

		it('maps anonymous default class keywords', () => {
			expect_class_keyword_mapping(`export default class {
	value = 1;
}`);
		});

		it('maps JSX function keywords as function keywords', () => {
			const source = `export function App() { return <div />; }`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const source_function_offset = source.indexOf('function');
			const generated_function_offset = result.code.indexOf('function');
			const mapping = find_exact_mapping(
				result.mappings,
				source_function_offset,
				generated_function_offset,
				'function'.length,
			);

			expect(mapping).toBeDefined();
		});
	});

	describe(`[${name}] member-expression element names map each side independently`, () => {
		it('gives <Icons.Button></Icons.Button> distinct opening and closing id mappings', () => {
			const source = `function App() @{
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

	describe(`[${name}] submodule import mappings`, () => {
		it('maps imported, local, and source identifiers in imports from submodules', () => {
			const source = `module server {
	export function load() {
		return 1;
	}
}

import { load as getLoad } from server;

function C() @{
	getLoad();
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			const source_load_offset = source.indexOf('load as');
			const source_get_load_offset = source.indexOf('getLoad }');
			const source_server_offset = source.indexOf('server;');
			const generated_load_offset = result.code.indexOf('load as getLoad');
			const generated_get_load_offset = result.code.indexOf('getLoad');
			const generated_server_offset = result.code.indexOf('server;', generated_load_offset);

			/**
			 * @param {number} sourceOffset
			 * @param {number} generatedOffset
			 * @param {number} length
			 */
			const expect_mapping = (sourceOffset, generatedOffset, length) => {
				const mapping = result.mappings.find(
					(
						/** @type {{ sourceOffsets: number[], generatedOffsets: number[], lengths: number[], generatedLengths: number[] }} */ m,
					) =>
						m.sourceOffsets[0] === sourceOffset &&
						m.generatedOffsets[0] === generatedOffset &&
						m.lengths[0] === length &&
						m.generatedLengths[0] === length,
				);
				expect(mapping).toBeDefined();
			};

			expect(result.errors).toEqual([]);
			expect(result.code).toContain('import { load as getLoad } from server;');
			expect_mapping(source_load_offset, generated_load_offset, 'load'.length);
			expect_mapping(source_get_load_offset, generated_get_load_offset, 'getLoad'.length);
			expect_mapping(source_server_offset, generated_server_offset, 'server'.length);
		});
	});

	describe(`[${name}] lazy destructuring mappings`, () => {
		it('preserves untyped lazy object patterns so source identifiers map identity-style', () => {
			const source = `function Hello(&{ a: value, b }) @{
	<>{value}{b}</>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			/**
			 * @param {number} sourceOffset
			 * @param {number} generatedOffset
			 * @param {number} sourceLength
			 */
			const identity_mapping = (sourceOffset, generatedOffset, sourceLength) =>
				result.mappings.find(
					(
						/** @type {{ sourceOffsets: number[], generatedOffsets: number[], lengths: number[], generatedLengths: number[] }} */ mapping,
					) =>
						mapping.sourceOffsets[0] === sourceOffset &&
						mapping.generatedOffsets[0] === generatedOffset &&
						mapping.lengths[0] === sourceLength &&
						mapping.generatedLengths[0] === sourceLength,
				);

			expect(result.code).toContain('function Hello({ a: value, b })');
			// Pattern keys / aliases / shorthand bindings preserved as-is.
			const src_key_a = source.indexOf('a: value');
			const src_alias_value = source.indexOf('value, b');
			const src_param_b = source.indexOf('b })');
			const src_body_value = source.lastIndexOf('value');
			const src_body_b = source.lastIndexOf('b');
			const gen_key_a = result.code.indexOf('a: value');
			const gen_alias_value = result.code.indexOf('value, b');
			const gen_param_b = result.code.indexOf('b })');
			const gen_body_value = result.code.lastIndexOf('value');
			const gen_body_b = result.code.lastIndexOf('b');

			expect(identity_mapping(src_key_a, gen_key_a, 'a'.length)).toBeDefined();
			expect(identity_mapping(src_alias_value, gen_alias_value, 'value'.length)).toBeDefined();
			expect(identity_mapping(src_param_b, gen_param_b, 'b'.length)).toBeDefined();
			expect(identity_mapping(src_body_value, gen_body_value, 'value'.length)).toBeDefined();
			expect(identity_mapping(src_body_b, gen_body_b, 'b'.length)).toBeDefined();
		});

		it('preserves annotated lazy object params with their type annotation intact', () => {
			const source = `function Hello(&{ a: value, b }: { a: string, b: string }) @{
	<>{value}{b}</>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			expect(result.code).toContain('function Hello({ a: value, b }: { a: string; b: string })');
		});

		it('preserves annotated lazy params on plain functions', () => {
			const source = `function greet(&{ a: c, b }: { a: string, b: string }) {
	return c + b;
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			expect(result.code).toContain('function greet({ a: c, b }: { a: string; b: string })');
		});

		it('reports repeated lazy param bindings in loose mode without throwing', () => {
			const source = `function greet(&{ a: b, b }: { a: string, b: string }) {
	return b;
}`;

			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].message).toBe('Argument name clash');
			expect(result.errors[0].type).toBe('usage');
			expect(source.slice(result.errors[0].pos, result.errors[0].end)).toBe('b');
			expect(result.errors[1].message).toBe('Argument name clash');
			expect(result.errors[1].type).toBe('usage');
			expect(source.slice(result.errors[1].pos, result.errors[1].end)).toBe('b');
			expect(result.code).toContain('function greet({ a: b, b }: { a: string; b: string })');
		});

		it('reports repeated lazy component param bindings in loose mode without throwing', () => {
			const source = `function App(&{ a: b, b }: { a: string, b: string }) @{
	<>{b}</>
}`;

			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].message).toBe('Argument name clash');
			expect(result.errors[0].type).toBe('usage');
			expect(source.slice(result.errors[0].pos, result.errors[0].end)).toBe('b');
			expect(result.errors[1].message).toBe('Argument name clash');
			expect(result.errors[1].type).toBe('usage');
			expect(source.slice(result.errors[1].pos, result.errors[1].end)).toBe('b');
			expect(
				result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === result.errors[0].pos &&
						mapping.lengths[0] === result.errors[0].end - result.errors[0].pos,
				),
			).toBeDefined();
			expect(
				result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === result.errors[1].pos &&
						mapping.lengths[0] === result.errors[1].end - result.errors[1].pos,
				),
			).toBeDefined();
			expect(result.code).toContain('function App({ a: b, b }: { a: string; b: string })');
		});

		it('reports repeated lazy param bindings with full identifier ranges', () => {
			const source = `function App(&{ a: value, value }: { a: string, value: string }) @{
	<>{value}</>
}`;

			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

			expect(result.errors).toHaveLength(2);
			expect(source.slice(result.errors[0].pos, result.errors[0].end)).toBe('value');
			expect(source.slice(result.errors[1].pos, result.errors[1].end)).toBe('value');
			expect(
				result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === result.errors[0].pos &&
						mapping.lengths[0] === result.errors[0].end - result.errors[0].pos,
				),
			).toBeDefined();
			expect(
				result.mappings.find(
					(mapping) =>
						mapping.sourceOffsets[0] === result.errors[1].pos &&
						mapping.lengths[0] === result.errors[1].end - result.errors[1].pos,
				),
			).toBeDefined();
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

	describe(`[${name}] JSX fragments preserve source locations`, () => {
		it('keeps loc on the element inside single-child JSX fragments', () => {
			// Regression: previously `strip_locations` recursively deleted loc on
			// the entire tsx block subtree, destroying Volar mappings for the
			// inner JSX. Mappings for the inner <div> should still resolve.
			const source = `function C() @{ <><div>hi</div></> }`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const div_offset = source.indexOf('<div>');
			const has_div_mapping = result.mappings.some(
				(/** @type {{ sourceOffsets: number[] }} */ m) => m.sourceOffsets[0] === div_offset + 1,
			);
			expect(has_div_mapping).toBe(true);
		});

		it('keeps loc inside multi-child JSX fragments', () => {
			const source = `function C() @{ <><div>a</div><div>b</div></> }`;
			expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
		});

		it('does not crash for the canonical <> and <> unwrap cases', () => {
			// Covers the same shapes asserted in the shared compile harness
			// (`<> and fragment unwrapping`), but as a source-map no-crash
			// sanity sweep to catch regressions at the Volar-mapping layer
			// rather than the compiled-output layer.
			const sources = [
				`class Foo { bar() { return <>{'Hello'}</>; } }`,
				`class Foo { bar() { return <>{'Hello'}</>; } }`,
				`class Foo { bar() { const x = 1; return <>{x}</>; } }`,
				`class Foo { bar() { return <>plain</>; } }`,
			];
			for (const source of sources) {
				expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
			}
		});

		it('handles a JSX fragment whose single child is an expression container', () => {
			const source = `class Foo {
	bar() {
		return <>{'Hello'}</>;
	}
}`;
			expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
		});
	});

	describe(`[${name}] JSX fragments preserve source locations`, () => {
		it('keeps loc on JSX template elements inside fragments', () => {
			const source = `function C() @{ <><div>hi</div></> }`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const div_offset = source.indexOf('<div>');
			const has_div_mapping = result.mappings.some(
				(/** @type {{ sourceOffsets: number[] }} */ m) => m.sourceOffsets[0] === div_offset + 1,
			);
			expect(has_div_mapping).toBe(true);
		});

		it('does not crash for common JSX template fragment shapes', () => {
			const sources = [
				`class Foo { bar() { return <>{"Hello"}</>; } }`,
				`class Foo { bar() { return <>Hello</>; } }`,
				`class Foo { bar() { return <><div>a</div><div>b</div></>; } }`,
				`class Foo { bar() @{
					const x = 1;
					<div>{x}</div>
				} }`,
				`class Foo { bar() { return <><div>ok</div></>; } }`,
				`class Foo { bar() { return <>@if (true) { <div>yes</div> }</>; } }`,
			];
			for (const source of sources) {
				expect(() => compile_to_volar_mappings(source, 'App.tsrx', { loose: true })).not.toThrow();
			}
		});
	});

	describe(`[${name}] shorthand attribute does not duplicate mapping on the generated name`, () => {
		it('does not map the synthesized attribute name back to {count}', () => {
			// `<X {count} />` expands to `<X count={count} />`. The generated
			// attribute name `count=` does not exist in the source, so it must
			// not carry a source mapping — otherwise the editor shows duplicate
			// hover/intellisense (one for the name, one for the value) on the
			// same `{count}` span.
			const source = `function App() @{
	const count = 0;
	const Inner = (p: { count: number }) => null;
	<Inner {count} />
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			expect(result.code).toContain('count={count}');

			const source_count_offset = source.indexOf('{count}') + 1;
			const matching = result.mappings.filter(
				(/** @type {{ sourceOffsets: number[], lengths: number[] }} */ m) =>
					m.sourceOffsets[0] === source_count_offset && m.lengths[0] === 'count'.length,
			);
			// Without the fix, there are two mappings — one for the generated
			// attribute-name `count` and one for the value `count`.
			expect(matching.length).toBe(1);
		});
	});

	describe(`[${name}] named ref-like props use ordinary attribute mappings`, () => {
		it('maps named ref-like prop values once', () => {
			const source = `function Child(props: { inputRef?: any; otherRef?: any }) @{
	<input />
}

function App() @{
	let host_input: HTMLInputElement | undefined;
	let child_input: HTMLInputElement | undefined;
	const state = { input: undefined as HTMLInputElement | undefined };
	<>
		<input type="text" hostRef={host_input} />
		<Child inputRef={child_input} otherRef={state.input} />
	</>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

			const host_ref_offset = source.indexOf('host_input', source.indexOf('hostRef='));
			const child_ref_offset = source.indexOf('child_input', source.indexOf('inputRef='));
			const ref_state_offset = source.indexOf('state.input', source.indexOf('otherRef='));
			const ref_state_input_offset = ref_state_offset + 'state.'.length;
			const generated_host_ref_offset = result.code.indexOf(
				'host_input',
				result.code.indexOf('hostRef='),
			);
			const generated_child_ref_offset = result.code.indexOf(
				'child_input',
				result.code.indexOf('inputRef='),
			);
			const generated_state_getter = result.code.indexOf(
				'state.input',
				result.code.indexOf('otherRef'),
			);

			const find_mappings = (source_offset, length) =>
				result.mappings.filter(
					(mapping) => mapping.sourceOffsets[0] === source_offset && mapping.lengths[0] === length,
				);

			const host_mappings = find_mappings(host_ref_offset, 'host_input'.length);
			const child_mappings = find_mappings(child_ref_offset, 'child_input'.length);
			const state_mappings = find_mappings(ref_state_offset, 'state'.length);
			const state_input_mappings = find_mappings(ref_state_input_offset, 'input'.length);

			expect(result.errors).toEqual([]);
			expect(result.code).toContain('hostRef={host_input}');
			expect(result.code).toContain('inputRef={child_input}');
			expect(result.code).toContain('otherRef={state.input}');
			expect(host_mappings).toHaveLength(1);
			expect(child_mappings).toHaveLength(1);
			expect(state_mappings).toHaveLength(1);
			expect(state_input_mappings).toHaveLength(1);
			expect(host_mappings[0].generatedOffsets[0]).toBe(generated_host_ref_offset);
			expect(child_mappings[0].generatedOffsets[0]).toBe(generated_child_ref_offset);
			expect(state_mappings[0].generatedOffsets[0]).toBe(generated_state_getter);
			expect(state_input_mappings[0].generatedOffsets[0]).toBe(
				generated_state_getter + 'state.'.length,
			);
		});
	});

	describe(`[${name}] generic type arguments on JSX component tags`, () => {
		it('maps the type argument identifier back to source', () => {
			const source = `type User = { name: string };

function RenderProp<Item>(props: { children: (item: Item) => any }) { return <></>; }

export function App() @{
	<RenderProp<User>>
		{(item) => item.name}
	</RenderProp>
}`;
			const result = compile_to_volar_mappings(source, 'App.tsrx');

			// The generated TSX must contain `<RenderProp<User>` (no leading
			// space) so the type argument round-trips through the printer.
			expect(result.code).toContain('<RenderProp<User>');

			const source_user_offset = source.indexOf('<User>') + 1;
			const generated_user_offset = result.code.indexOf('RenderProp<User>') + 'RenderProp<'.length;

			const user_mapping = result.mappings.find(
				(/** @type {{ sourceOffsets: number[], lengths: number[] }} */ m) =>
					m.sourceOffsets[0] === source_user_offset && m.lengths[0] === 'User'.length,
			);
			expect(user_mapping).toBeDefined();
			expect(user_mapping.generatedOffsets[0]).toBe(generated_user_offset);
		});
	});

	describe(`[${name}] shared tests conditionally run for specific frameworks`, () => {
		it.runIf(['react', 'preact'].includes(name))(
			`[${name}] maps source declarations to their own generated declarations when hook helpers are extracted`,
			() => {
				const source = `import { useState } from 'react';

function App() @{
	const [show, setShow] = useState(true);

	@if (show) {
		const [count, setCount] = useState(0);
		<>
			<p>{count}</p>
			<button onClick={() => setCount(count + 1)}>{'inc'}</button>
		</>
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

			function App() @{
				const [show, setShow] = useState(true);

				@if (show) {
					const [count, setCount] = useState(0);
					<>
						<p>{count}</p>
						<button onClick={() => setCount(count + 1)}>{'inc'}</button>
					</>
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
