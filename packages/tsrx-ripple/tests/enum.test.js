import { acorn } from '@tsrx/core';
import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { check_types, find_exact_mapping } from './test-utils.js';

const message =
	'Ripple does not support runtime TypeScript enums in .tsrx files. Move the enum to a .ts module and import it, or use an object with `as const` instead.';

const runtime_enums = [
	['an exported enum', 'export enum Stage { Ready, Done }'],
	['a local enum', 'enum Stage { Ready, Done }'],
	['a const enum', 'export const enum Stage { Ready, Done }'],
	['a string enum', 'export enum Stage { Ready = "ready", Done = "done" }'],
	['a function-local enum', 'function read() { enum Stage { Ready, Done } return Stage.Ready; }'],
	['a namespace enum', 'namespace App { export enum Stage { Ready, Done } }'],
	[
		'a component-local enum',
		'export function Badge() @{ enum Stage { Ready, Done } <b>{Stage.Ready}</b> }',
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

describe('@tsrx/ripple enum diagnostics', () => {
	for (const mode of ['client', 'server']) {
		it(`rejects the exported enum reproduction before emitting ${mode} JavaScript`, () => {
			const source = `export enum Stage { Ready, Done }
export function Badge() @{ <b>{Stage.Ready}</b> }`;
			expect(() => compile(source, 'Badge.tsrx', { mode, hydration: true })).toThrow(message);
		});

		it.each(runtime_enums)(`reports %s in ${mode} collect and loose modes`, (_, source) => {
			for (const options of [{ collect: true }, { loose: true }]) {
				const { errors } = compile(source, 'Badge.tsrx', { mode, ...options });
				expect(errors.map((error) => error.message)).toEqual([message]);
				expect(errors[0]).toMatchObject({
					fileName: 'Badge.tsrx',
					pos: source.indexOf('Stage'),
					end: source.indexOf('Stage') + 'Stage'.length,
				});
			}
		});

		it.each(ambient_enums)(`erases %s from ${mode} JavaScript`, (source) => {
			const { code, errors } = compile(source, 'Badge.tsrx', { mode });
			expect(errors).toEqual([]);
			expect(code).not.toContain('enum');
			expect(() =>
				acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }),
			).not.toThrow();
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
			expect(() =>
				acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }),
			).not.toThrow();
		});
	}

	it.each(runtime_enums)('reports %s in editor output', (_, source) => {
		const result = compile_to_volar_mappings(source, 'Badge.tsrx');
		expect(result.errors.map((error) => error.message)).toEqual([message]);
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
});
