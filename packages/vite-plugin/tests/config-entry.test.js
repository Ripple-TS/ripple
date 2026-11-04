import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as config_entry from '@ripple-ts/vite-plugin/config';
import * as main_entry from '@ripple-ts/vite-plugin';

const src_dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

/**
 * Collect every module reachable from `file` through static imports/re-exports.
 * @param {string} file
 * @param {Map<string, string[]>} [seen] module path -> its import specifiers
 * @returns {Map<string, string[]>}
 */
function collect_static_graph(file, seen = new Map()) {
	if (seen.has(file)) return seen;
	const source = fs.readFileSync(file, 'utf8');
	const specifiers = [
		...source.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/gm),
		...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
	].map((match) => match[1]);
	seen.set(file, specifiers);
	for (const specifier of specifiers) {
		if (specifier.startsWith('.'))
			collect_static_graph(path.resolve(path.dirname(file), specifier), seen);
	}
	return seen;
}

describe('@ripple-ts/vite-plugin/config', () => {
	it('exports the config helpers', () => {
		expect(Object.keys(config_entry).sort()).toEqual([
			'RenderRoute',
			'ServerRoute',
			'defineConfig',
		]);
	});

	it('shares its exports with the main entry', () => {
		expect(main_entry.defineConfig).toBe(config_entry.defineConfig);
		expect(main_entry.RenderRoute).toBe(config_entry.RenderRoute);
		expect(main_entry.ServerRoute).toBe(config_entry.ServerRoute);
	});

	it('returns the config object unchanged', () => {
		const options = { router: { routes: [] } };
		expect(config_entry.defineConfig(options)).toBe(options);
	});

	it('keeps the plugin, compiler, and dev server out of its module graph', () => {
		const graph = collect_static_graph(path.join(src_dir, 'config.js'));
		const external = [...graph.values()].flat().filter((specifier) => !specifier.startsWith('.'));
		expect(external).toEqual([]);
		expect([...graph.keys()].map((file) => path.relative(src_dir, file)).sort()).toEqual([
			'config.js',
			'routes.js',
		]);
	});
});
