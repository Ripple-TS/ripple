import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TURBOPACK_LOADER = path.join(__dirname, 'loader.js');
const DEFAULT_RESOLVE_EXTENSIONS = ['.tsrx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'];

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
 * @returns {{ condition: { not: string }, loaders: string[], as: string }}
 */
export function create_tsrx_react_turbopack_rule() {
	return {
		condition: { not: 'foreign' },
		loaders: [TURBOPACK_LOADER],
		as: '*.tsx',
	};
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
 * @returns {any}
 */
function merge_tsrx_rule(existing_rule) {
	const rule = create_tsrx_react_turbopack_rule();
	if (!existing_rule) return rule;
	return Array.isArray(existing_rule) ? [rule, ...existing_rule] : [rule, existing_rule];
}

/**
 * Merge the Turbopack settings needed for `.tsrx` React modules into a Next.js
 * config object.
 *
 * The helper installs a loader-backed `*.tsrx` rule that compiles TSRX to TSX,
 * then hands the output back to Turbopack as `*.tsx` so Next's React pipeline
 * can finish the JSX transform.
 *
 * @param {NextTurbopackConfig} [next_config]
 * @returns {NextTurbopackConfig}
 */
export function tsrxReactTurbopack(next_config = {}) {
	const turbopack = next_config.turbopack ?? {};
	const rules = { ...(turbopack.rules ?? {}) };
	rules['*.tsrx'] = merge_tsrx_rule(rules['*.tsrx']);

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