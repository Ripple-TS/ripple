/** @typedef {{ path: string, dir: string, compiler: string | null, error: import('typescript').Diagnostic | null }} ConsumerTsconfig */

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import ts from 'typescript';
import { createLogging } from './utils.js';

const { log, logError } = createLogging('[Ripple Language]');
const bare_package_specifier_pattern =
	/^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(?:\/[a-z0-9][a-z0-9._~-]*)*$/;
/** @type {Map<string, ConsumerTsconfig | null>} */
const path_to_consumer_tsconfig_cache = new Map();
/** @type {Map<string, string | null>} */
const declared_compiler_path_map = new Map();

/**
 * Find and parse the nearest tsconfig.json that can declare a TSRX compiler.
 * Only that file's own top-level `tsrx` entry counts in v1; `extends` chains are
 * intentionally not resolved.
 * @param {string} start_dir
 * @returns {ConsumerTsconfig | null}
 */
function get_nearest_consumer_tsconfig(start_dir) {
	let current_dir = start_dir;
	/** @type {string[]} */
	const visited_dirs = [];

	while (current_dir) {
		if (path_to_consumer_tsconfig_cache.has(current_dir)) {
			const cached_tsconfig = path_to_consumer_tsconfig_cache.get(current_dir) ?? null;
			for (const visited_dir of visited_dirs) {
				path_to_consumer_tsconfig_cache.set(visited_dir, cached_tsconfig);
			}
			return cached_tsconfig;
		}

		visited_dirs.push(current_dir);
		const tsconfig_path = path.join(current_dir, 'tsconfig.json');
		if (fs.existsSync(tsconfig_path)) {
			const tsconfig_source = fs.readFileSync(tsconfig_path, 'utf8');
			const parsed_tsconfig = ts.parseConfigFileTextToJson(tsconfig_path, tsconfig_source);
			const compiler =
				typeof parsed_tsconfig.config?.tsrx?.compiler === 'string'
					? parsed_tsconfig.config.tsrx.compiler
					: null;
			const tsconfig = {
				path: tsconfig_path,
				dir: current_dir,
				compiler,
				error: parsed_tsconfig.error ?? null,
			};
			for (const visited_dir of visited_dirs) {
				path_to_consumer_tsconfig_cache.set(visited_dir, tsconfig);
			}
			return tsconfig;
		}

		const parent_dir = path.dirname(current_dir);
		if (parent_dir === current_dir) {
			break;
		}
		current_dir = parent_dir;
	}

	for (const visited_dir of visited_dirs) {
		path_to_consumer_tsconfig_cache.set(visited_dir, null);
	}
	return null;
}

/**
 * Resolve the compiler explicitly selected by a consumer tsconfig. A null cache
 * entry records a hard resolution failure and prevents candidate fallback.
 * @param {ConsumerTsconfig} tsconfig
 * @returns {string | null}
 */
function resolve_declared_compiler(tsconfig) {
	if (declared_compiler_path_map.has(tsconfig.dir)) {
		return declared_compiler_path_map.get(tsconfig.dir) ?? null;
	}

	const specifier = /** @type {string} */ (tsconfig.compiler);
	if (!bare_package_specifier_pattern.test(specifier)) {
		declared_compiler_path_map.set(tsconfig.dir, null);
		logError(
			'Declared TSRX compiler must be a bare package specifier:',
			specifier,
			`in ${tsconfig.path}`,
		);
		return null;
	}

	try {
		const tsconfig_require = createRequire(tsconfig.path);
		const compiler_path = tsconfig_require.resolve(specifier);
		declared_compiler_path_map.set(tsconfig.dir, compiler_path);
		log('Found declared tsrx compiler at:', compiler_path, 'from tsconfig:', tsconfig.path);
		return compiler_path;
	} catch {
		declared_compiler_path_map.set(tsconfig.dir, null);
		logError(
			`Unable to resolve declared TSRX compiler "${specifier}" from tsconfig`,
			tsconfig.path,
		);
		return null;
	}
}

/**
 * Return undefined when there is no consumer declaration, null for a declared
 * hard stop, or the resolved compiler path for a valid declaration.
 * @param {string} normalized_file_name
 * @returns {string | null | undefined}
 */
export function resolve_consumer_compiler_for_file(normalized_file_name) {
	const consumer_tsconfig = get_nearest_consumer_tsconfig(path.dirname(normalized_file_name));
	if (consumer_tsconfig?.error) {
		logError(
			'Unable to parse nearest tsconfig:',
			consumer_tsconfig.path,
			ts.flattenDiagnosticMessageText(consumer_tsconfig.error.messageText, '\n'),
		);
		return null;
	}
	if (consumer_tsconfig?.compiler !== null && consumer_tsconfig?.compiler !== undefined) {
		return resolve_declared_compiler(consumer_tsconfig);
	}
	return undefined;
}

/** Reset consumer compiler state used in tests. */
export function reset_consumer_compiler_for_test() {
	path_to_consumer_tsconfig_cache.clear();
	declared_compiler_path_map.clear();
}
