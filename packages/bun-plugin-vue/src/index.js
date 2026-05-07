/** @import { BunPlugin, Target, Transpiler } from 'bun' */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { compile } from '@tsrx/vue';

const require = createRequire(import.meta.url);
const { transformVueJsxVapor } = require('vue-jsx-vapor/api');

const DEFAULT_INCLUDE = /\.tsrx$/;
const CSS_QUERY = '?tsrx-css&lang.css';
const CSS_QUERY_PATTERN = /\?tsrx-css&lang\.css$/;
const DEFAULT_VAPOR_OPTIONS = {
	macros: true,
	compiler: {
		runtimeModuleName: 'vue-jsx-vapor',
	},
};

/**
 * @typedef {{
 * 	include?: RegExp,
 * 	exclude?: RegExp | RegExp[],
 * 	emitCss?: boolean,
 * 	vapor?: {
 * 		interop?: boolean,
 * 		macros?: boolean | object,
 * 		compiler?: { runtimeModuleName?: string },
 * 	},
 * }} TsrxVueBunPluginOptions
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
 * @param {TsrxVueBunPluginOptions} options
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
 * @param {Target | undefined} target
 * @returns {Transpiler | null}
 */
function create_transpiler(target) {
	const Transpiler = globalThis.Bun?.Transpiler;
	if (typeof Transpiler !== 'function') return null;

	return new Transpiler({
		loader: 'ts',
		target,
	});
}

/**
 * @param {TsrxVueBunPluginOptions['vapor']} options
 */
function resolve_vapor_options(options) {
	return {
		...DEFAULT_VAPOR_OPTIONS,
		...options,
		compiler: {
			...DEFAULT_VAPOR_OPTIONS.compiler,
			...options?.compiler,
		},
	};
}

/**
 * Bun plugin for `.tsrx` files that compiles them through `@tsrx/vue`, runs
 * the downstream `vue-jsx-vapor` transform, then strips the remaining
 * TypeScript syntax with Bun. Component-local styles are exposed as virtual CSS
 * modules.
 *
 * @param {TsrxVueBunPluginOptions} [options]
 * @returns {BunPlugin}
 */
export function tsrxVue(options = {}) {
	const emit_css = options.emitCss ?? true;
	const vapor_options = resolve_vapor_options(options.vapor);

	/** @type {Map<string, string>} */
	const css_cache = new Map();

	return {
		name: '@tsrx/bun-plugin-vue',

		setup(build) {
			// build.config is only present for Bun.build(); runtime registration
			// via Bun.plugin(), including bun:test preloads, does not provide it.
			const build_config = build.config ?? {};
			const transpiler = create_transpiler(build_config.target);

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

					const transformed = transformVueJsxVapor(
						output,
						args.path.replace(/\.tsrx$/, '.tsx'),
						vapor_options,
						false,
						false,
						false,
					);

					if (transpiler) {
						return {
							contents: transpiler.transformSync(transformed.code),
							loader: 'js',
						};
					}

					return {
						contents: transformed.code,
						loader: 'ts',
					};
				},
			);
		},
	};
}

export default tsrxVue;
