import { acorn } from '@tsrx/core';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { check_types, find_exact_mapping } from './test-utils.js';

const supported_enums = [
	[
		'enums in template branches',
		'export function App() @{ enum E { A = 1 } <>@if (true) { enum E { A = 2 } <p>{E.A}</p> }</> }',
	],
	[
		'enums in template loops',
		'export function App() @{ @for (const i of [1, 2]) { enum E { A = i } <p>{E.A}</p> } }',
	],
	[
		'same-name enums in template switch arms',
		'export function App({value}) @{ @switch (value) { @case 1: { enum E { A = 1 } <p>{E.A}</p> } @default: { enum E { A = 2 } <p>{E.A}</p> } } }',
	],
	['an exported enum', 'export enum Stage { Ready, Done }'],
	['a local enum', 'enum Stage { Ready, Done }'],
	['a string enum', 'export enum Stage { Ready = "ready", Done = "done" }'],
	['a function-local enum', 'function read() { enum Stage { Ready, Done } return Stage.Ready; }'],
	[
		'a block-local enum',
		'let value; if (true) { enum Stage { Ready, Done } value = Stage.Done; } export { value };',
	],
	[
		'a component-local enum',
		'export function Badge() @{ enum Stage { Ready, Done } <b>{Stage.Ready}</b> }',
	],
	[
		'a nested same-name enum without merging',
		'enum Stage { Ready } export function Badge() @{ enum Stage { Done } <b>{Stage.Done}</b> }',
	],
];

const unsupported_enums = [
	[
		'an enum in a class static block',
		'class App { static { enum Stage { Ready } } }',
		'enums in class static blocks',
	],
	['a const enum', 'export const enum Stage { Ready, Done }', 'const enums'],
	[
		'a namespace enum',
		'namespace App { export enum Stage { Ready, Done } }',
		'inside runtime namespaces or modules',
	],
	[
		'merged enums',
		'enum Stage { Ready } enum Stage { Done }',
		'merged TypeScript enum declarations',
	],
	[
		'enum and namespace merging',
		'enum Stage { Ready } namespace Stage {}',
		'merged TypeScript enum declarations',
	],
	[
		'enums merged across switch cases',
		'switch (0) { case 0: enum Stage { Ready = 1 } break; case 1: enum Stage { Done = 2 } }',
		'merged TypeScript enum declarations',
	],
];

const ambient_enums = [
	'declare enum Stage { Ready, Done }',
	'export declare enum Stage { Ready, Done }',
	'declare const enum Stage { Ready, Done }',
	'declare namespace App { enum Stage { Ready, Done } }',
	'declare namespace App { namespace Nested { export enum Stage { Ready, Done } } }',
	'declare module "app" { export enum Stage { Ready, Done } }',
];

let execution_id = 0;

/** Execute pure enum modules without their unused Ripple runtime import. */
async function execute(code) {
	const executable = code.replace(
		/^import \* as .+ from 'ripple\/internal\/(?:client|server)';\s*/,
		'',
	);
	return import(`data:text/javascript,${encodeURIComponent(executable)}#${execution_id++}`);
}

function assert_valid_javascript(code) {
	expect(() => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })).not.toThrow();
}

const scope_cases = [
	[
		'later module enum constants',
		'function make() { enum E { A = Outer.N, B, S = Outer.S } return E; } enum Outer { N = 4, S = "ready" } export const result = make();',
	],
	[
		'nested enum references to outer members',
		'enum E { A = 1, B = (() => { enum F { C = A } return F.C; })() } export const result = E;',
	],
	[
		'class static blocks',
		'enum E { A = 1, B = (class { static { const A = 8; } static value = A; }).value } export const result = E;',
	],
	[
		'static var isolation',
		'enum E { A = 1, B = (() => { const result = A; class C { static { var A = 8; } } return result; })() } export const result = E;',
	],
	[
		'computed string members',
		'const value = () => 2; enum E { A = `v${value()}`, B = "v" + value() } export const result = E;',
	],
	[
		'loop closures',
		'const readers = []; for (let i = 0; i < 2; i++) { enum E { A = i } readers.push(() => E.A); } export const result = readers.map((read) => read());',
	],
	[
		'enum shadowing in an earlier closure',
		'enum E { A = 1, B = (() => { const read = () => A.C; enum A { C = 8 } return read(); })() } export const result = E;',
	],
	[
		'switch blocks',
		'export const result = []; switch (0) { case 0: enum E { A = 8 } result.push(E); break; }',
	],
	[
		'constant aliases',
		'const N = 4; const S = "ready"; enum E { A = N, B, C = S } export const result = E;',
	],
	[
		'other enum members',
		'enum Outer { N = 4, S = "ready" } enum E { A = Outer.N, B, C = Outer.S } export const result = E;',
	],
	[
		'shadowed enum constants',
		'enum Outer { N = 4 } export const result = []; { enum Outer { N = 8 } enum E { A = Outer.N, B } result.push(E); }',
	],
	[
		'constant aliases in their declaration scope',
		'const N = 4; const V = N; export const result = []; { const N = 8; enum E { A = V, B } result.push(E); }',
	],
	['outer const', 'const E = 9; { enum E { A } } export const result = E;'],
	['outer enum', 'enum E { A = 1 } { enum E { B = 2 } } export const result = E;'],
	[
		'sibling blocks',
		'export const result = []; { enum E { A = 1 } result.push(E); } { enum E { B = 2 } result.push(E); }',
	],
	[
		'loop iterations',
		'export const result = []; for (let i = 0; i < 2; i++) { enum E { A = i } result.push(E); }',
	],
	[
		'function parameter',
		'function read(E) { { enum E { A } } return E; } export const result = read(9);',
	],
	[
		'function declaration',
		'function E() { return 9; } { enum E { A } } export const result = E();',
	],
	[
		'class declaration',
		'class E { static value = 9; } { enum E { A } } export const result = E.value;',
	],
	[
		'enum initialization callbacks',
		'const read = () => E.A; enum E { A = 1, B = read() } export const result = E;',
	],
	[
		'block initialization callbacks',
		'export const result = []; { const read = () => E.A; enum E { A = 1, B = read() } result.push(E); }',
	],
	[
		'nested enum initializer',
		'enum E { A = 1, B = (() => { enum A { C = 8 } return A.C; })() } export const result = E;',
	],
	[
		'named class expression',
		'enum E { A = 1, B = (class A { static value = 8; static read() { return A.value; } }).read() } export const result = E;',
	],
	[
		'destructuring and catch bindings',
		'enum E { A = 1, B = (({ A = 8 }) => A)({}), C = (() => { try { throw 9; } catch (A) { return A; } })(), D = ({ [A]: 10 })[1] } export const result = E;',
	],
];

describe('@tsrx/ripple runtime enums', () => {
	for (const mode of ['client', 'server']) {
		it(`respects parameters shadowing other enum names in ${mode}`, async () => {
			const source =
				'enum Outer { N = 4 } function read(Outer) { enum E { A = Outer.N } return E.A; } export const result = read({ N: 8 });';
			expect((await execute(compile(source, 'E.tsrx', { mode }).code)).result).toBe(8);
		});
		it(`avoids capturing enum member reads in ${mode}`, async () => {
			const source = `const __enum_0 = 10;
				enum E { A = 1, B = ((E) => A + E)(8), C = __enum_0 }
				export const result = [E.A, E.B, E.C];`;
			const { code } = compile(source, 'E.tsrx', { mode });
			assert_valid_javascript(code);
			expect((await execute(code)).result).toEqual([1, 9, 10]);
		});
		it.each(scope_cases)(`preserves %s like TypeScript in ${mode}`, async (_, source) => {
			const { code, errors } = compile(source, 'E.tsrx', { mode });
			expect(errors).toEqual([]);
			assert_valid_javascript(code);
			const expected = await execute(
				ts.transpileModule(source, {
					compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
				}).outputText,
			);
			const actual = await execute(code);
			expect(actual.result).toEqual(expected.result);
		});
		it.each(supported_enums)(
			`compiles %s in ${mode} strict, collect and loose modes`,
			(_, source) => {
				for (const options of [{}, { collect: true }, { loose: true }]) {
					const { code, errors } = compile(source, 'Badge.tsrx', { mode, ...options });
					expect(errors).toEqual([]);
					expect(code).not.toContain('enum Stage');
					assert_valid_javascript(code);
				}
			},
		);

		it(`preserves numeric, string and heterogeneous runtime semantics in ${mode}`, async () => {
			const source = `export enum E {
				Zero, One, Four = 4, Five, Negative = -2, Next, Float = 1.5, AfterFloat,
				String = 'x', 'a-b' = 2
			}`;
			const { code, errors } = compile(source, 'E.tsrx', { mode });
			expect(errors).toEqual([]);
			const { E } = await execute(code);
			expect([E.Zero, E.One, E.Four, E.Five]).toEqual([0, 1, 4, 5]);
			expect([E.Negative, E.Next, E.Float, E.AfterFloat]).toEqual([-2, -1, 1.5, 2.5]);
			expect([E[0], E[4], E[-2], E[2]]).toEqual(['Zero', 'Four', 'Negative', 'a-b']);
			expect(E.String).toBe('x');
			expect(E.x).toBeUndefined();
			expect(E['a-b']).toBe(2);
		});

		it(`evaluates constants and previous members without executing user code in ${mode}`, async () => {
			const source = `export enum E {
				A = 1, B = A + 2, C = B * 3, D = E.C, Shift = 1 << 2, AfterShift,
				S = 'a' + 'b', T = S, U = \`value:\${S}\`, V = ('v' satisfies string)
			}`;
			const { code } = compile(source, 'E.tsrx', { mode });
			const { E } = await execute(code);
			expect([E.A, E.B, E.C, E.D, E.Shift, E.AfterShift]).toEqual([1, 3, 9, 9, 4, 5]);
			expect([E.S, E.T, E.U, E.V]).toEqual(['ab', 'ab', 'value:ab', 'v']);
			expect(E.ab).toBeUndefined();
			expect(E['value:ab']).toBeUndefined();
		});

		it(`runs computed initializers once in order in ${mode}`, async () => {
			const source = `globalThis.__enumCalls = [];
			function compute(name, value) { globalThis.__enumCalls.push(name); return value; }
			export enum E { A = compute('a', 1), B = compute('b', 2), C, D = 4 }
			export const calls = globalThis.__enumCalls;`;
			const { code } = compile(source, 'E.tsrx', { mode });
			const { E, calls } = await execute(code);
			expect(calls).toEqual(['a', 'b']);
			expect([E.A, E.B, E.C, E.D]).toEqual([1, 2, undefined, 4]);
			expect(E.undefined).toBe('C');
		});

		it(`preserves outer, local and parameter shadowing rules in ${mode}`, async () => {
			const source = `const A = 100;
			function read(A) { return A; }
			export enum E {
				A = 1,
				B = A,
				C = (() => { const A = 9; return A; })(),
				D = read(A),
				F = ((A) => A)(7),
				G = E.A,
				H = { A }.A
			}`;
			const { code, errors } = compile(source, 'E.tsrx', { mode });
			expect(errors).toEqual([]);
			const { E } = await execute(code);
			expect([E.A, E.B, E.C, E.D, E.F, E.G, E.H]).toEqual([1, 1, 9, 1, 7, 1, 1]);
		});

		it(`supports function-local values and later named exports in ${mode}`, async () => {
			const source = `function read() { enum Local { A = 2, B } return [Local.A, Local.B, Local[2]]; }
			enum Exported { X = 3 }
			export { Exported as E };
			export const values = read();`;
			const { code, errors } = compile(source, 'E.tsrx', { mode });
			expect(errors).toEqual([]);
			const { E, values } = await execute(code);
			expect(E.X).toBe(3);
			expect(values).toEqual([2, 3, 'A']);
		});

		it(`uses void 0 after string, computed and non-finite members in ${mode}`, async () => {
			const source = `function value() { return 1; }
			export enum E { A = 'x', B, C = value(), D, F = NaN, G }`;
			const { code } = compile(source, 'E.tsrx', { mode });
			const { E } = await execute(code);
			expect([E.B, E.D, E.G]).toEqual([undefined, undefined, undefined]);
		});

		it.each(unsupported_enums)(
			`reports %s in ${mode} collect and loose modes`,
			(_, source, fragment) => {
				for (const options of [{ collect: true }, { loose: true }]) {
					const { errors } = compile(source, 'Badge.tsrx', { mode, ...options });
					expect(errors.length).toBeGreaterThan(0);
					expect(errors.every((error) => error.message.includes(fragment))).toBe(true);
					expect(errors[0]).toMatchObject({
						fileName: 'Badge.tsrx',
						pos: source.indexOf('Stage'),
						end: source.indexOf('Stage') + 'Stage'.length,
					});
				}
			},
		);

		it.each(unsupported_enums)(`rejects %s in ${mode} strict mode`, (_, source, fragment) => {
			expect(() => compile(source, 'Badge.tsrx', { mode })).toThrow(fragment);
		});

		it.each(ambient_enums)(`erases %s from ${mode} JavaScript`, (source) => {
			const { code, errors } = compile(source, 'Badge.tsrx', { mode });
			expect(errors).toEqual([]);
			expect(code).not.toContain('enum');
			assert_valid_javascript(code);
		});

		it.each([
			['an imported enum', 'import { Stage } from "./stage.ts";'],
			['an object with as const', 'const Stage = { Ready: 0, Done: 1 } as const;'],
		])(`accepts %s in ${mode} output`, (_, declaration) => {
			const { code, errors } = compile(
				`${declaration} export function Badge() @{ <b>{Stage.Ready}</b> }`,
				'Badge.tsrx',
				{ mode },
			);
			expect(errors).toEqual([]);
			expect(code).toContain('Stage.Ready');
			assert_valid_javascript(code);
		});
	}

	it('keeps ordinary enums in editor output with types and navigation mappings', () => {
		const source = 'export enum Stage { Ready, Done }';
		const result = compile_to_volar_mappings(source, 'Badge.tsrx');
		expect(result.errors).toEqual([]);
		expect(result.code).toContain('enum Stage');
		expect(check_types(result.code).errors).toEqual([]);
		const mapping = find_exact_mapping(
			result.mappings,
			source.indexOf('Stage'),
			result.code.indexOf('Stage'),
			'Stage'.length,
		);
		expect(mapping?.data.navigation).toBe(true);
	});

	it.each(unsupported_enums)('reports %s in editor output', (_, source, fragment) => {
		const result = compile_to_volar_mappings(source, 'Badge.tsrx');
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors.every((error) => error.message.includes(fragment))).toBe(true);
		expect(result.code).toContain('enum Stage');
	});

	it.each(ambient_enums)('preserves %s in editor output', (source) => {
		const result = compile_to_volar_mappings(source, 'Badge.tsrx');
		expect(result.errors).toEqual([]);
		expect(result.code).toContain('enum Stage');
		expect(check_types(result.code).errors).toEqual([]);
		const mapping = find_exact_mapping(
			result.mappings,
			source.indexOf('Stage'),
			result.code.indexOf('Stage'),
			'Stage'.length,
		);
		expect(mapping?.data.navigation).toBe(true);
	});

	it('still rejects user-authored var declarations in components', () => {
		const { errors } = compile(
			'export function Badge() @{ var value = 1; <b>{value}</b> }',
			'Badge.tsrx',
			{
				mode: 'client',
				collect: true,
			},
		);
		expect(errors.map((error) => error.message)).toEqual([
			'`var` declarations are not allowed in components, use let or const instead',
		]);
	});
});
