/** @import { BunPlugin, Target, Transpiler } from 'bun' */

import { readFile } from 'node:fs/promises';
import { compile } from '@tsrx/react';

const DEFAULT_INCLUDE = /\.tsrx$/;
const CSS_QUERY = '?tsrx-css&lang.css';
const CSS_QUERY_PATTERN = /\?tsrx-css&lang\.css$/;

/**
 * @typedef {{
 * 	include?: RegExp,
 * 	exclude?: RegExp | RegExp[],
 * 	jsxImportSource?: string,
 * 	emitCss?: boolean,
 * }} TsrxReactBunPluginOptions
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
 * @param {TsrxReactBunPluginOptions} options
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
 * @param {string} jsx_import_source
 * @param {Target | undefined} target
 * @returns {Transpiler | null}
 */
function create_transpiler(jsx_import_source, target) {
	const Transpiler = globalThis.Bun?.Transpiler;
	if (typeof Transpiler !== 'function') return null;

	return new Transpiler({
		loader: 'tsx',
		target,
		autoImportJSX: true,
		tsconfig: {
			compilerOptions: {
				jsx: 'react-jsx',
				jsxImportSource: jsx_import_source,
			},
		},
	});
}

/**
 * Bun plugin for `.tsrx` files that compiles them through `@tsrx/react` and
 * then runs Bun's TSX transform so the final output calls React's automatic
 * JSX runtime. Component-local styles are exposed as virtual CSS modules.
 *
 * @param {TsrxReactBunPluginOptions} [options]
 * @returns {BunPlugin}
 */
export function tsrxReact(options = {}) {
	const jsx_import_source = options.jsxImportSource ?? 'react';
	const emit_css = options.emitCss ?? true;

	/** @type {Map<string, string>} */
	const css_cache = new Map();

	return {
		name: '@tsrx/bun-plugin-react',

		setup(build) {
			// build.config is only present for Bun.build(); runtime registration
			// via Bun.plugin(), including bun:test preloads, does not provide it.
			const build_config = build.config ?? {};
			const transpiler = create_transpiler(jsx_import_source, build_config.target);

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

					if (transpiler) {
						return {
							contents: transpiler.transformSync(output),
							loader: 'js',
						};
					}

					return {
						contents: output,
						loader: 'tsx',
					};
				},
			);
		},
	};
}

export default tsrxReact;
