import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
import {
	get_own_config_value,
	load_tsconfig_layers,
	resolve_inherited_config_value,
} from '../src/tsconfig-resolution.js';

/** @type {string[]} */
const fixture_directories = [];

function create_fixture_directory() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tsrx-tsconfig-resolution-'));
	fixture_directories.push(directory);
	return directory;
}

/**
 * @param {string} directory
 * @param {string} relative_path
 * @param {string | object} config
 */
function write_config(directory, relative_path, config) {
	const config_path = path.join(directory, relative_path);
	fs.mkdirSync(path.dirname(config_path), { recursive: true });
	fs.writeFileSync(
		config_path,
		typeof config === 'string' ? config : `${JSON.stringify(config, null, 2)}\n`,
	);
	return config_path;
}

function layer_names(result) {
	return result.layers.map((layer) => path.basename(layer.path));
}

afterEach(() => {
	while (fixture_directories.length > 0) {
		fs.rmSync(/** @type {string} */ (fixture_directories.pop()), {
			recursive: true,
			force: true,
		});
	}
});

describe('load_tsconfig_layers', () => {
	it('loads a single config without extends', () => {
		const directory = create_fixture_directory();
		const config_path = write_config(directory, 'tsconfig.json', { custom: { value: 'root' } });

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

	it('loads a transitive extends chain from lowest to highest precedence', () => {
		const directory = create_fixture_directory();
		write_config(directory, 'base.json', { custom: { value: 'base' } });
		write_config(directory, 'middle.json', { extends: './base', custom: { value: 'middle' } });
		const config_path = write_config(directory, 'tsconfig.json', {
			extends: './middle.json',
			custom: { value: 'child' },
		});

		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(layer_names(result)).toEqual(['base.json', 'middle.json', 'tsconfig.json']);
	});

	it('preserves extends-array precedence and reapplies a shared base per branch', () => {
		const directory = create_fixture_directory();
		write_config(directory, 'shared.json', { custom: { value: 'shared' } });
		write_config(directory, 'a.json', { extends: './shared', custom: { value: 'a' } });
		write_config(directory, 'b.json', { extends: './shared.json', custom: { value: 'b' } });
		const config_path = write_config(directory, 'tsconfig.json', {
			extends: ['./a', './b'],
		});

		const result = load_tsconfig_layers(ts, ts.sys, config_path);
		const effective = resolve_inherited_config_value(result.layers, (layer) =>
			get_own_config_value(layer.config, ['custom', 'value']),
		);

		expect(layer_names(result)).toEqual([
			'shared.json',
			'a.json',
			'shared.json',
			'b.json',
			'tsconfig.json',
		]);
		expect(effective).toMatchObject({ state: 'found', value: 'b' });
	});

	it('terminates an extends cycle and reports a diagnostic', () => {
		const directory = create_fixture_directory();
		write_config(directory, 'a.json', { extends: './tsconfig' });
		const config_path = write_config(directory, 'tsconfig.json', { extends: './a' });

		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(layer_names(result)).toEqual(['a.json', 'tsconfig.json']);
		expect(result.diagnostics.some((diagnostic) => diagnostic.code === 18000)).toBe(true);
	});

	it('resolves package-based extends with an optional json suffix', () => {
		const directory = create_fixture_directory();
		write_config(directory, 'node_modules/@consumer/tsconfig/package.json', {
			name: '@consumer/tsconfig',
			version: '1.0.0',
		});
		const base_path = write_config(directory, 'node_modules/@consumer/tsconfig/base.json', {
			custom: { value: 'package' },
		});
		const config_path = write_config(directory, 'tsconfig.json', {
			extends: '@consumer/tsconfig/base',
		});

		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(result.layers.map((layer) => layer.path)).toEqual([base_path, config_path]);
	});

	it('parses JSONC comments and trailing commas in root and extended configs', () => {
		const directory = create_fixture_directory();
		write_config(
			directory,
			'base.json',
			'{\n\t// inherited custom value\n\t"custom": { "value": "base", },\n}\n',
		);
		const config_path = write_config(
			directory,
			'tsconfig.json',
			'{\n\t// extensionless base\n\t"extends": "./base",\n}\n',
		);

		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(result.layers[0].config).toMatchObject({ custom: { value: 'base' } });
		expect(result.diagnostics).toEqual([]);
	});

	it('surfaces malformed-layer diagnostics and raw source without applying policy', () => {
		const directory = create_fixture_directory();
		const malformed_source = '{ "custom": { "value": "intent" },\n';
		const malformed_path = write_config(directory, 'malformed.json', malformed_source);
		const config_path = write_config(directory, 'tsconfig.json', { extends: './malformed' });

		const result = load_tsconfig_layers(ts, ts.sys, config_path);
		const malformed_layer = result.layers[0];

		expect(malformed_layer).toMatchObject({
			path: malformed_path,
			raw_source: malformed_source,
		});
		expect(malformed_layer.diagnostics.length).toBeGreaterThan(0);
		expect(result.diagnostics.length).toBeGreaterThan(0);
	});

	it('lists every participating config dependency once', () => {
		const directory = create_fixture_directory();
		const shared_path = write_config(directory, 'shared.json', {});
		const a_path = write_config(directory, 'a.json', { extends: './shared' });
		const b_path = write_config(directory, 'b.json', { extends: './shared' });
		const config_path = write_config(directory, 'tsconfig.json', { extends: ['./a', './b'] });

		const result = load_tsconfig_layers(ts, ts.sys, config_path);

		expect(result.dependencies).toEqual([config_path, a_path, shared_path, b_path]);
	});
});

describe('get_own_config_value', () => {
	it('requires every path segment to be an own property', () => {
		const inherited_root = Object.create({ custom: { value: 'inherited' } });
		const inherited_leaf = { custom: Object.create({ value: 'inherited' }) };

		expect(get_own_config_value(inherited_root, ['custom', 'value'])).toEqual({
			state: 'absent',
		});
		expect(get_own_config_value(inherited_leaf, ['custom', 'value'])).toEqual({
			state: 'absent',
		});
		expect(get_own_config_value({ custom: { value: undefined } }, ['custom', 'value'])).toEqual({
			state: 'found',
			value: undefined,
		});
	});
});

describe('resolve_inherited_config_value', () => {
	it('returns the last non-absent value with declaring-config annotation', () => {
		const layers = [
			{ path: '/project/base.json', dir: '/project', config: { custom: { value: 'base' } } },
			{ path: '/project/middle.json', dir: '/project', config: {} },
			{ path: '/project/child.json', dir: '/project', config: { custom: { value: 'child' } } },
		];

		const result = resolve_inherited_config_value(layers, (layer) =>
			get_own_config_value(layer.config, ['custom', 'value']),
		);

		expect(result).toEqual({
			state: 'found',
			value: 'child',
			config_path: '/project/child.json',
			config_dir: '/project',
		});
	});
});
