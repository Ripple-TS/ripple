import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	get_own_config_value,
	load_tsconfig_layers,
	resolve_inherited_config_value,
} from '../src/tsconfig-resolution.js';

/** @type {string} */
let directory;

/** @typedef {[name: string, files: Array<[string, string | object]>, expected_layers: string[], diagnostic_code?: number, expected_value?: string]} LayerResolutionCase */

/** @param {string} relative_path @param {string | object} config */
function write_config(relative_path, config) {
	const config_path = path.join(directory, relative_path);
	fs.mkdirSync(path.dirname(config_path), { recursive: true });
	fs.writeFileSync(
		config_path,
		typeof config === 'string' ? config : `${JSON.stringify(config)}\n`,
	);
	return config_path;
}

/** @param {Array<[string, string | object]>} files */
function load(files) {
	for (const [file_name, config] of files) write_config(file_name, config);
	return load_tsconfig_layers(ts, ts.sys, path.join(directory, 'tsconfig.json'));
}

beforeEach(() => {
	directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tsrx-tsconfig-resolution-'));
});

afterEach(() => {
	fs.rmSync(directory, { recursive: true, force: true });
});

describe('load_tsconfig_layers', () => {
	it('loads a single config without extends', () => {
		const config_path = write_config('tsconfig.json', { custom: { value: 'root' } });
		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(result.layers).toHaveLength(1);
		expect(result.layers[0]).toMatchObject({
			path: config_path,
			dir: directory,
			config: { custom: { value: 'root' } },
		});
		expect(result.dependencies).toEqual([config_path]);
		expect(result.diagnostics).toEqual([]);
	});

	// Each row is one layer-shape scenario.
	/** @type {LayerResolutionCase[]} */
	const layer_resolution_cases = [
		[
			'loads a transitive extends chain from lowest to highest precedence',
			[
				['base.json', {}],
				['middle.json', { extends: './base' }],
				['tsconfig.json', { extends: './middle.json' }],
			],
			['base.json', 'middle.json', 'tsconfig.json'],
		],
		[
			'terminates an extends cycle and reports a diagnostic',
			[
				['a.json', { extends: './tsconfig' }],
				['tsconfig.json', { extends: './a' }],
			],
			['a.json', 'tsconfig.json'],
			18000,
		],
		[
			'resolves package-based extends with an optional json suffix',
			[
				['node_modules/@consumer/tsconfig/package.json', { name: '@consumer/tsconfig' }],
				['node_modules/@consumer/tsconfig/base.json', { custom: { value: 'package' } }],
				['tsconfig.json', { extends: '@consumer/tsconfig/base' }],
			],
			['base.json', 'tsconfig.json'],
			undefined,
			'package',
		],
		[
			'parses JSONC comments and trailing commas in root and extended configs',
			[
				['base.json', '{ "custom": { "value": "base", }, // trailing\n}'],
				['tsconfig.json', '{ "extends": "./base", }'],
			],
			['base.json', 'tsconfig.json'],
			undefined,
			'base',
		],
	];
	it.each(layer_resolution_cases)(
		'%s',
		(_, files, expected_layers, diagnostic_code, expected_value) => {
			const result = load(files);

			expect(result.layers.map(({ path: file_name }) => path.basename(file_name))).toEqual(
				expected_layers,
			);
			expect(result.diagnostics.some(({ code }) => code === diagnostic_code)).toBe(
				diagnostic_code !== undefined,
			);
			const custom_value = get_own_config_value(result.layers[0].config, ['custom', 'value']);
			expect(custom_value.state === 'found' ? custom_value.value : undefined).toBe(expected_value);
		},
	);

	it('preserves extends-array precedence and reapplies a shared base per branch', () => {
		const result = load([
			['shared.json', { custom: { value: 'shared' } }],
			['a.json', { extends: './shared', custom: { value: 'a' } }],
			['b.json', { extends: './shared.json', custom: { value: 'b' } }],
			['tsconfig.json', { extends: ['./a', './b'] }],
		]);
		const effective = resolve_inherited_config_value(result.layers, ({ config }) =>
			get_own_config_value(config, ['custom', 'value']),
		);

		expect(result.layers.map(({ path: file_name }) => path.basename(file_name))).toEqual([
			'shared.json',
			'a.json',
			'shared.json',
			'b.json',
			'tsconfig.json',
		]);
		expect(effective).toMatchObject({ state: 'found', value: 'b' });
	});

	it('surfaces malformed-layer diagnostics and raw source without applying policy', () => {
		const malformed_source = '{ "custom": { "value": "intent" },\n';
		const malformed_path = write_config('malformed.json', malformed_source);
		const result = load([['tsconfig.json', { extends: './malformed' }]]);

		expect(result.layers[0]).toMatchObject({ path: malformed_path, raw_source: malformed_source });
		expect(result.layers[0].parse_diagnostics.length).toBeGreaterThan(0);
		expect(result.diagnostics.length).toBeGreaterThan(0);
	});

	it('keeps valid extends entries and reports invalid entries in the same array', () => {
		const result = load([
			['base.json', { custom: { value: 'base' } }],
			['tsconfig.json', { extends: ['./base.json', 42] }],
		]);

		expect(result.layers.map(({ path: file_name }) => path.basename(file_name))).toEqual([
			'base.json',
			'tsconfig.json',
		]);
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([expect.objectContaining({ code: 5024 })]),
		);
		expect(result.extends_failures).toHaveLength(1);
	});

	it('tracks the JSON candidate for an unresolved extensionless relative base', () => {
		const config_path = write_config('tsconfig.json', { extends: './configs/base' });
		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(result.dependencies).toEqual([
			config_path,
			path.join(directory, 'configs', 'base.json'),
		]);
		expect(result.extends_failures).toEqual([
			expect.objectContaining({
				config_path,
				extends_value: './configs/base',
				resolved_path: path.join(directory, 'configs', 'base.json'),
			}),
		]);
	});

	it('lists every participating config dependency once', () => {
		const shared_path = write_config('shared.json', {});
		const a_path = write_config('a.json', { extends: './shared' });
		const b_path = write_config('b.json', { extends: './shared' });
		const result = load([['tsconfig.json', { extends: ['./a', './b'] }]]);

		expect(result.dependencies).toEqual([
			path.join(directory, 'tsconfig.json'),
			a_path,
			shared_path,
			b_path,
		]);
	});
});

describe('config value resolution', () => {
	it('requires every path segment to be an own property', () => {
		const inherited_root = Object.create({ custom: { value: 'inherited' } });
		const inherited_leaf = { custom: Object.create({ value: 'inherited' }) };

		expect(get_own_config_value(inherited_root, ['custom', 'value'])).toEqual({ state: 'absent' });
		expect(get_own_config_value(inherited_leaf, ['custom', 'value'])).toEqual({ state: 'absent' });
		expect(get_own_config_value({ custom: { value: undefined } }, ['custom', 'value'])).toEqual({
			state: 'found',
			value: undefined,
		});
	});

	it('returns the last non-absent value with declaring-config annotation', () => {
		/** @type {import('../src/tsconfig-resolution.js').TsconfigLayer[]} */
		const layers = [
			{
				path: '/project/base.json',
				dir: '/project',
				config: { custom: { value: 'base' } },
				raw_source: undefined,
				parse_diagnostics: [],
			},
			{
				path: '/project/middle.json',
				dir: '/project',
				config: {},
				raw_source: undefined,
				parse_diagnostics: [],
			},
			{
				path: '/project/child.json',
				dir: '/project',
				config: { custom: { value: 'child' } },
				raw_source: undefined,
				parse_diagnostics: [],
			},
		];
		const result = resolve_inherited_config_value(layers, ({ config }) =>
			get_own_config_value(config, ['custom', 'value']),
		);

		expect(result).toEqual({
			state: 'found',
			value: 'child',
			config_path: '/project/child.json',
			config_dir: '/project',
		});
	});
});
