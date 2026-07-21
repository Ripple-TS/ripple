/** @typedef {{ state: 'absent' } | { state: 'declared', value: string } | { state: 'invalid', target: 'tsrx' | 'compiler', actual_type: string, actual_value: string }} CompilerDeclaration */

import { createRequire } from 'module';
import path from 'path';
import ts from 'typescript';
import {
	get_own_config_value,
	load_tsconfig_layers,
	resolve_inherited_config_value,
} from './tsconfig-resolution.js';
import { createLogging } from './utils.js';

const { log, logError, logWarning } = createLogging('[Ripple Language]');
// npm scope/package names stay lowercase-strict; case-sensitive export subpaths may use capitals.
const bare_package_specifier_pattern =
	/^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(?:\/[A-Za-z0-9][A-Za-z0-9._~-]*)*$/;
const tsrx_key_pattern = /["']tsrx["']\s*:/;
/** @type {Map<string, string | null>} */
const path_to_root_tsconfig_cache = new Map();
/** @type {Map<string, ReturnType<typeof load_tsconfig_layers>>} */
const root_tsconfig_to_layers_cache = new Map();
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
	const tsrx_result = get_own_config_value(config, ['tsrx']);
	if (tsrx_result.state === 'absent') {
		return { state: 'absent' };
	}

	const tsrx_value = tsrx_result.value;
	if (tsrx_value === null || typeof tsrx_value !== 'object' || Array.isArray(tsrx_value)) {
		return { state: 'invalid', target: 'tsrx', ...describe_config_value(tsrx_value) };
	}
	const compiler_result = get_own_config_value(tsrx_value, ['compiler']);
	if (compiler_result.state === 'absent') {
		return { state: 'absent' };
	}

	const compiler = compiler_result.value;
	if (typeof compiler === 'string' && compiler.trim() !== '') {
		return { state: 'declared', value: compiler.trim() };
	}
	return { state: 'invalid', target: 'compiler', ...describe_config_value(compiler) };
}

/**
 * Find the nearest tsconfig.json to use as the root of inheritance resolution.
 * @param {string} start_dir
 * @param {{fileExists(file_name: string): boolean}} host
 * @returns {string | null}
 */
function get_nearest_root_tsconfig(start_dir, host) {
	let current_dir = start_dir;
	/** @type {string[]} */
	const visited_dirs = [];

	while (current_dir) {
		if (path_to_root_tsconfig_cache.has(current_dir)) {
			const cached_tsconfig = path_to_root_tsconfig_cache.get(current_dir) ?? null;
			for (const visited_dir of visited_dirs) {
				path_to_root_tsconfig_cache.set(visited_dir, cached_tsconfig);
			}
			return cached_tsconfig;
		}

		visited_dirs.push(current_dir);
		const tsconfig_path = path.join(current_dir, 'tsconfig.json');
		if (host.fileExists(tsconfig_path)) {
			for (const visited_dir of visited_dirs) {
				path_to_root_tsconfig_cache.set(visited_dir, tsconfig_path);
			}
			return tsconfig_path;
		}

		const parent_dir = path.dirname(current_dir);
		if (parent_dir === current_dir) {
			break;
		}
		current_dir = parent_dir;
	}

	for (const visited_dir of visited_dirs) {
		path_to_root_tsconfig_cache.set(visited_dir, null);
	}
	return null;
}

/**
 * @param {typeof import('typescript')} typescript
 * @param {import('./tsconfig-resolution.js').TsconfigHost} host
 * @param {string} root_config_path
 */
function get_tsconfig_layers(typescript, host, root_config_path) {
	const cached_layers = root_tsconfig_to_layers_cache.get(root_config_path);
	if (cached_layers) {
		return cached_layers;
	}
	const layers = load_tsconfig_layers(typescript, host, root_config_path);
	root_tsconfig_to_layers_cache.set(root_config_path, layers);
	return layers;
}

/**
 * Resolve the compiler explicitly selected by a consumer tsconfig. A null cache
 * entry records a hard resolution failure and prevents candidate fallback.
 * @param {string} config_path
 * @param {string} specifier
 * @returns {string | null}
 */
function resolve_declared_compiler(config_path, specifier) {
	const cache_key = `${config_path}\0${specifier}`;
	if (declared_compiler_path_map.has(cache_key)) {
		return declared_compiler_path_map.get(cache_key) ?? null;
	}

	if (!bare_package_specifier_pattern.test(specifier)) {
		declared_compiler_path_map.set(cache_key, null);
		logError(
			'Declared TSRX compiler must be a bare package specifier:',
			specifier,
			`in ${config_path}`,
		);
		return null;
	}

	try {
		const tsconfig_require = createRequire(config_path);
		const compiler_path = tsconfig_require.resolve(specifier);
		declared_compiler_path_map.set(cache_key, compiler_path);
		log('Found declared tsrx compiler at:', compiler_path, 'from tsconfig:', config_path);
		return compiler_path;
	} catch {
		declared_compiler_path_map.set(cache_key, null);
		logError(`Unable to resolve declared TSRX compiler "${specifier}" from tsconfig`, config_path);
		return null;
	}
}

/**
 * Return undefined when there is no consumer declaration, null for a declared
 * hard stop, or the resolved compiler path for a valid declaration.
 * @param {string} normalized_file_name
 * @param {{
 *   ts?: typeof import('typescript'),
 *   config_file_name?: string,
 *   config_host?: import('./tsconfig-resolution.js').TsconfigHost,
 *   dependencies?: Set<string>,
 * }} [options]
 * @returns {string | null | undefined}
 */
export function resolve_consumer_compiler_for_file(normalized_file_name, options = {}) {
	const typescript = options.ts ?? ts;
	const config_host = options.config_host ?? typescript.sys;
	const root_config_path =
		options.config_file_name ??
		get_nearest_root_tsconfig(path.dirname(normalized_file_name), config_host);
	if (root_config_path === null) {
		return undefined;
	}
	const resolved_layers = get_tsconfig_layers(typescript, config_host, root_config_path);
	for (const dependency of resolved_layers.dependencies) {
		options.dependencies?.add(dependency);
	}
	const malformed_layers = resolved_layers.layers.filter((layer) => layer.diagnostics.length > 0);
	if (malformed_layers.length > 0) {
		const has_tsrx_intent = resolved_layers.layers.some((layer) => {
			if (get_own_config_value(layer.config, ['tsrx']).state === 'found') {
				return true;
			}
			if (layer.diagnostics.length === 0 || layer.raw_source === undefined) {
				return false;
			}
			// A comment can cause a false positive and hard stop; that fails safe when
			// an unparseable layer may have declared a compiler.
			return tsrx_key_pattern.test(layer.raw_source);
		});
		const log_parse_error = has_tsrx_intent ? logError : logWarning;
		for (const layer of malformed_layers) {
			for (const diagnostic of layer.diagnostics) {
				log_parse_error(
					'Unable to parse tsconfig layer:',
					layer.path,
					typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
				);
			}
		}
		return has_tsrx_intent ? null : undefined;
	}
	const declaration = resolve_inherited_config_value(resolved_layers.layers, (layer) =>
		get_compiler_declaration(layer.config),
	);
	if (declaration.state === 'invalid') {
		logError(
			`Invalid TSRX ${declaration.target} declaration:`,
			declaration.actual_type,
			declaration.actual_value,
			`in ${declaration.config_path}`,
		);
		return null;
	}
	if (declaration.state === 'declared') {
		return resolve_declared_compiler(declaration.config_path, declaration.value);
	}
	return undefined;
}

/** Reset consumer compiler state used in tests. */
export function reset_consumer_compiler_for_test() {
	path_to_root_tsconfig_cache.clear();
	root_tsconfig_to_layers_cache.clear();
	declared_compiler_path_map.clear();
}
