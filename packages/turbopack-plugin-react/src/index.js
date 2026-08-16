import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TURBOPACK_JS_LOADER = path.join(__dirname, 'loader.js');
const TURBOPACK_CSS_LOADER = path.join(__dirname, 'css-loader.js');
const DEFAULT_RESOLVE_EXTENSIONS = ['.tsrx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'];
const CSS_QUERY = '?tsrx-css&lang.css';

/**
 * @typedef {{
 * 	turbopack?: {
 * 		root?: string,
 * 		rules?: Record<string, any>,
 * 		resolveAlias?: Record<string, any>,
 * 		resolveExtensions?: string[],
 * 		debugIds?: boolean,
 * 	},
 * 	[key: string]: any,
 * }} NextTurbopackConfig
 */

/**
 * @typedef {{ runtimeImports?: 'compiler' | 'direct' }} TsrxReactTurbopackOptions
 */

/**
 * @param {TsrxReactTurbopackOptions} [options]
 * @returns {{ condition: { all: any[] }, loaders: Array<string | { loader: string, options: TsrxReactTurbopackOptions }>, as: string }}
 */
export function create_tsrx_react_turbopack_rule(options = {}) {
	return {
		condition: {
			all: [{ not: 'foreign' }, { not: { query: CSS_QUERY } }],
		},
		loaders: [with_loader_options(TURBOPACK_JS_LOADER, options)],
		as: '*.tsx',
	};
}

/**
 * @param {TsrxReactTurbopackOptions} [options]
 * @returns {{ condition: { all: any[] }, loaders: Array<string | { loader: string, options: TsrxReactTurbopackOptions }>, type: string }}
 */
export function create_tsrx_react_turbopack_css_rule(options = {}) {
	return {
		condition: {
			all: [{ not: 'foreign' }, { query: CSS_QUERY }],
		},
		loaders: [with_loader_options(TURBOPACK_CSS_LOADER, options)],
		type: 'css',
	};
}

/**
 * Preserve the original string loader shape unless the caller has compiler
 * options that Turbopack needs to pass into the loader.
 *
 * @param {string} loader
 * @param {TsrxReactTurbopackOptions} options
 * @returns {string | { loader: string, options: TsrxReactTurbopackOptions }}
 */
function with_loader_options(loader, options) {
	return options.runtimeImports === undefined ? loader : { loader, options };
}

/**
 * @param {string[] | undefined} resolve_extensions
 * @returns {string[]}
 */
function merge_resolve_extensions(resolve_extensions) {
	const merged = resolve_extensions ? [...resolve_extensions] : [...DEFAULT_RESOLVE_EXTENSIONS];
	if (!merged.includes('.tsrx')) {
		merged.unshift('.tsrx');
	}
	return merged;
}

/**
 * @param {any} existing_rule
 * @param {TsrxReactTurbopackOptions} options
 * @returns {any}
 */
function merge_tsrx_rule(existing_rule, options) {
	const rules = [
		create_tsrx_react_turbopack_rule(options),
		create_tsrx_react_turbopack_css_rule(options),
	];
	if (!existing_rule) return rules;
	return Array.isArray(existing_rule) ? [...rules, ...existing_rule] : [...rules, existing_rule];
}

/**
 * Merge the Turbopack settings needed for `.tsrx` React modules into a Next.js
 * config object.
 *
 * The helper installs loader-backed `*.tsrx` rules that compile TSRX to TSX,
 * route component-local `<style>` blocks through a sibling virtual CSS import,
 * and then hand the TSX output back to Turbopack so Next's React pipeline can
 * finish the JSX transform.
 *
 * @param {NextTurbopackConfig} [next_config]
 * @param {TsrxReactTurbopackOptions} [options]
 * @returns {NextTurbopackConfig}
 */
export function tsrxReactTurbopack(next_config = {}, options = {}) {
	const turbopack = next_config.turbopack ?? {};
	const rules = { ...(turbopack.rules ?? {}) };
	rules['*.tsrx'] = merge_tsrx_rule(rules['*.tsrx'], options);

	return {
		...next_config,
		turbopack: {
			...turbopack,
			rules,
			resolveExtensions: merge_resolve_extensions(turbopack.resolveExtensions),
		},
	};
}

export default tsrxReactTurbopack;
