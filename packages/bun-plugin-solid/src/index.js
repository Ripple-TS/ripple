/** @import { BunPlugin } from 'bun' */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { compile } from '@tsrx/solid';

const require = createRequire(import.meta.url);
const { transformAsync } = require('@babel/core');
const BABEL_PRESET_SOLID = require.resolve('babel-preset-solid');
const BABEL_PRESET_TYPESCRIPT = require.resolve('@babel/preset-typescript');

const DEFAULT_INCLUDE = /\.tsrx$/;
const CSS_QUERY = '?tsrx-css&lang.css';
const CSS_QUERY_PATTERN = /\?tsrx-css&lang\.css$/;

/**
 * @typedef {{
 * 	include?: RegExp,
 * 	exclude?: RegExp | RegExp[],
 * 	emitCss?: boolean,
 * 	solid?: object,
 * }} TsrxSolidBunPluginOptions
 */

/**
 * @param {RegExp} pattern
 * @param {string} value
 * @returns {boolean}
 */
function test_pattern(pattern, value) {
	pattern.lastIndex = 0;
	return pattern.test(value);
}

/**
 * @param {RegExp | RegExp[] | undefined} pattern
 * @param {string} value
 * @returns {boolean}
 */
function matches_pattern(pattern, value) {
	if (!pattern) return false;
	if (Array.isArray(pattern)) {
		return pattern.some((entry) => test_pattern(entry, value));
	}
	return test_pattern(pattern, value);
}

/**
 * @param {TsrxSolidBunPluginOptions} options
 * @param {string} value
 * @returns {boolean}
 */
function should_compile(options, value) {
	const include = options.include ?? DEFAULT_INCLUDE;
	return test_pattern(include, value) && !matches_pattern(options.exclude, value);
}

/**
 * @param {string} file_path
 * @returns {string}
 */
function to_css_id(file_path) {
	return file_path + CSS_QUERY;
}

/**
 * @param {string} source
 * @param {string} file_path
 * @param {object | undefined} solid_options
 */
async function transform_solid(source, file_path, solid_options) {
	const result = await transformAsync(source, {
		filename: file_path.replace(/\.tsrx$/, '.tsx'),
		babelrc: false,
		configFile: false,
		sourceMaps: true,
		presets: [
			[BABEL_PRESET_SOLID, solid_options ?? {}],
			[
				BABEL_PRESET_TYPESCRIPT,
				{
					allExtensions: true,
					isTSX: true,
				},
			],
		],
	});

	return result?.code ?? source;
}

/**
 * Bun plugin for `.tsrx` files that compiles them through `@tsrx/solid`, runs
 * Solid's JSX transform with Babel, and exposes component-local styles as
 * virtual CSS modules.
 *
 * @param {TsrxSolidBunPluginOptions} [options]
 * @returns {BunPlugin}
 */
export function tsrxSolid(options = {}) {
	const emit_css = options.emitCss ?? true;

	/** @type {Map<string, string>} */
	const css_cache = new Map();

	return {
		name: '@tsrx/bun-plugin-solid',

		setup(build) {
			build.onResolve({ filter: CSS_QUERY_PATTERN }, (args) => ({
				path: args.path,
			}));

			build.onLoad({ filter: CSS_QUERY_PATTERN }, (args) => ({
				contents: css_cache.get(args.path) ?? '',
				loader: 'css',
			}));

			build.onLoad(
				{ filter: options.include ?? DEFAULT_INCLUDE, namespace: 'file' },
				async (args) => {
					if (!should_compile(options, args.path)) return undefined;

					const source = await readFile(args.path, 'utf-8');
					const { code, css } = compile(source, args.path);
					const css_id = to_css_id(args.path);

					let output = code;
					if (emit_css && css) {
						css_cache.set(css_id, css);
						output = `import ${JSON.stringify(css_id)};\n${code}`;
					} else {
						css_cache.delete(css_id);
					}

					return {
						contents: await transform_solid(output, args.path, options.solid),
						loader: 'js',
					};
				},
			);
		},
	};
}

export default tsrxSolid;
