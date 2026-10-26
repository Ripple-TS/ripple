import { acorn } from '@tsrx/core';
import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { check_types, find_exact_mapping } from './test-utils.js';

const supported_enums = [
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

describe('@tsrx/ripple runtime enums', () => {
	for (const mode of ['client', 'server']) {
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
