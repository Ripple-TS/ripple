/** @typedef {{ state: 'absent' } | { state: 'declared', value: string } | { state: 'invalid', target: 'tsrx' | 'compiler', actual_type: string, actual_value: string }} CompilerDeclaration */
/** @typedef {{ path: string, dir: string, declaration: CompilerDeclaration, error: import('typescript').Diagnostic | null }} ConsumerTsconfig */

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import ts from 'typescript';
import { createLogging } from './utils.js';

const { log, logError, logWarning } = createLogging('[Ripple Language]');
// npm scope/package names stay lowercase-strict; case-sensitive export subpaths may use capitals.
const bare_package_specifier_pattern =
	/^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(?:\/[A-Za-z0-9][A-Za-z0-9._~-]*)*$/;
const tsrx_key_pattern = /["']tsrx["']\s*:/;
/** @type {Map<string, ConsumerTsconfig | null>} */
const path_to_consumer_tsconfig_cache = new Map();
/** @type {Map<string, string | null>} */
const declared_compiler_path_map = new Map();

/**
 * @param {unknown} value
 * @returns {{ actual_type: string, actual_value: string }}
 */
function describe_config_value(value) {
	const actual_type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
	return {
		actual_type,
		actual_value: JSON.stringify(value) ?? String(value),
	};
}

/**
 * @param {unknown} config
 * @returns {CompilerDeclaration}
 */
function get_compiler_declaration(config) {
	if (
		config === null ||
		typeof config !== 'object' ||
		!Object.prototype.hasOwnProperty.call(config, 'tsrx')
	) {
		return { state: 'absent' };
	}

	const tsrx_value = /** @type {{ tsrx: unknown }} */ (config).tsrx;
	if (tsrx_value === null || typeof tsrx_value !== 'object' || Array.isArray(tsrx_value)) {
		return { state: 'invalid', target: 'tsrx', ...describe_config_value(tsrx_value) };
	}
	const tsrx_config = /** @type {Record<string, unknown>} */ (tsrx_value);
	if (!Object.prototype.hasOwnProperty.call(tsrx_config, 'compiler')) {
		return { state: 'absent' };
	}

	const compiler = tsrx_config.compiler;
	if (typeof compiler === 'string' && compiler.trim() !== '') {
		return { state: 'declared', value: compiler.trim() };
	}
	return { state: 'invalid', target: 'compiler', ...describe_config_value(compiler) };
}

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
			/** @type {CompilerDeclaration} */
			let declaration;
			if (parsed_tsconfig.error) {
				// A comment can cause a false positive and hard stop; that is safer than
				// silently falling back when a malformed file may have declared a compiler.
				declaration = tsrx_key_pattern.test(tsconfig_source)
					? {
							state: 'invalid',
							target: 'tsrx',
							actual_type: 'unknown',
							actual_value: 'unparseable',
						}
					: { state: 'absent' };
			} else {
				declaration = get_compiler_declaration(parsed_tsconfig.config);
			}
			const tsconfig = {
				path: tsconfig_path,
				dir: current_dir,
				declaration,
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
 * @param {string} specifier
 * @returns {string | null}
 */
function resolve_declared_compiler(tsconfig, specifier) {
	if (declared_compiler_path_map.has(tsconfig.dir)) {
		return declared_compiler_path_map.get(tsconfig.dir) ?? null;
	}

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
		const log_parse_error =
			consumer_tsconfig.declaration.state === 'absent' ? logWarning : logError;
		log_parse_error(
			'Unable to parse nearest tsconfig:',
			consumer_tsconfig.path,
			ts.flattenDiagnosticMessageText(consumer_tsconfig.error.messageText, '\n'),
		);
		return consumer_tsconfig.declaration.state === 'absent' ? undefined : null;
	}
	if (consumer_tsconfig?.declaration.state === 'invalid') {
		logError(
			`Invalid TSRX ${consumer_tsconfig.declaration.target} declaration:`,
			consumer_tsconfig.declaration.actual_type,
			consumer_tsconfig.declaration.actual_value,
			`in ${consumer_tsconfig.path}`,
		);
		return null;
	}
	if (consumer_tsconfig?.declaration.state === 'declared') {
		return resolve_declared_compiler(consumer_tsconfig, consumer_tsconfig.declaration.value);
	}
	return undefined;
}

/** Reset consumer compiler state used in tests. */
export function reset_consumer_compiler_for_test() {
	path_to_consumer_tsconfig_cache.clear();
	declared_compiler_path_map.clear();
}
