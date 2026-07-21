/** @typedef {{actual_type: string, actual_value: string}} InvalidConfigValueDetails */
/**
 * @typedef {
 * 	| {state: 'absent'}
 * 	| {state: 'declared', value: string}
 * 	| ({state: 'invalid', target: 'tsrx' | 'compiler'} & InvalidConfigValueDetails)
 * } CompilerDeclaration
 */

/**
 * @typedef {object} CompilerResolutionOptions
 * @property {typeof import('typescript')} [ts]
 * @property {string} [configFileName]
 * @property {import('./tsconfig-resolution.js').TsconfigHost} [configHost]
 * @property {Set<string>} [dependencies]
 */

/**
 * @typedef {object} ConfigHostResolutionCache
 * @property {Map<string, string | null>} nearest_config_paths
 * @property {Map<string, CachedTsconfigLayers>} resolved_config_layers
 */

/**
 * @typedef {object} CachedTsconfigLayers
 * @property {import('./tsconfig-resolution.js').ResolvedTsconfigLayers} value
 * @property {Map<string, number | undefined> | undefined} dependency_modified_times
 */

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
/** @type {WeakMap<object, ConfigHostResolutionCache>} */
let config_host_to_resolution_cache = new WeakMap();
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
 * Keep filesystem-derived config caches isolated per TypeScript/Volar host.
 * Different hosts can expose different snapshots for the same absolute path.
 * @param {import('./tsconfig-resolution.js').TsconfigHost} host
 */
function get_config_host_cache(host) {
	let cache = config_host_to_resolution_cache.get(host);
	if (!cache) {
		cache = {
			nearest_config_paths: new Map(),
			resolved_config_layers: new Map(),
		};
		config_host_to_resolution_cache.set(host, cache);
	}
	return cache;
}

/**
 * @param {string} file_name
 * @param {import('./tsconfig-resolution.js').TsconfigHost} host
 */
function get_config_cache_key(file_name, host) {
	const normalized_path = path.normalize(path.resolve(file_name));
	const use_case_sensitive_file_names =
		typeof host.useCaseSensitiveFileNames === 'function'
			? host.useCaseSensitiveFileNames()
			: host.useCaseSensitiveFileNames;
	return use_case_sensitive_file_names ? normalized_path : normalized_path.toLowerCase();
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
 * @param {import('./tsconfig-resolution.js').TsconfigHost} host
 * @param {ConfigHostResolutionCache} cache
 * @returns {string | null}
 */
function get_nearest_root_tsconfig(start_dir, host, cache) {
	let current_dir = start_dir;
	/** @type {string[]} */
	const visited_dir_keys = [];

	while (current_dir) {
		const current_dir_key = get_config_cache_key(current_dir, host);
		if (cache.nearest_config_paths.has(current_dir_key)) {
			const cached_tsconfig = cache.nearest_config_paths.get(current_dir_key) ?? null;
			for (const visited_dir_key of visited_dir_keys) {
				cache.nearest_config_paths.set(visited_dir_key, cached_tsconfig);
			}
			return cached_tsconfig;
		}

		visited_dir_keys.push(current_dir_key);
		const tsconfig_path = path.join(current_dir, 'tsconfig.json');
		if (host.fileExists(tsconfig_path)) {
			for (const visited_dir_key of visited_dir_keys) {
				cache.nearest_config_paths.set(visited_dir_key, tsconfig_path);
			}
			return tsconfig_path;
		}

		const parent_dir = path.dirname(current_dir);
		if (parent_dir === current_dir) {
			break;
		}
		current_dir = parent_dir;
	}

	for (const visited_dir_key of visited_dir_keys) {
		cache.nearest_config_paths.set(visited_dir_key, null);
	}
	return null;
}

/**
 * @param {typeof import('typescript')} typescript
 * @param {import('./tsconfig-resolution.js').TsconfigHost} host
 * @param {string} root_config_path
 * @param {ConfigHostResolutionCache} cache
 */
function get_tsconfig_layers(typescript, host, root_config_path, cache) {
	const cache_key = get_config_cache_key(root_config_path, host);
	const cached = cache.resolved_config_layers.get(cache_key);
	if (
		cached &&
		(cached.dependency_modified_times === undefined ||
			[...cached.dependency_modified_times].every(
				([dependency, modified_time]) =>
					host.getModifiedTime?.(dependency)?.valueOf() === modified_time,
			))
	) {
		return cached.value;
	}
	const value = load_tsconfig_layers(typescript, host, root_config_path);
	const dependency_modified_times = host.getModifiedTime
		? new Map(
				value.dependencies.map((dependency) => [
					dependency,
					host.getModifiedTime?.(dependency)?.valueOf(),
				]),
			)
		: undefined;
	cache.resolved_config_layers.set(cache_key, { value, dependency_modified_times });
	return value;
}

/**
 * A declaration in the config that owns a failed extends entry, or in a child
 * config above it, has higher precedence than anything the missing base could
 * have declared and therefore makes that failure irrelevant to this value.
 * @param {readonly import('./tsconfig-resolution.js').TsconfigLayer[]} layers
 * @param {import('./tsconfig-resolution.js').TsconfigExtendsFailure} failure
 * @param {string} declaration_config_path
 */
function is_extends_failure_overridden(layers, failure, declaration_config_path) {
	const failure_owner_index = layers.findLastIndex((layer) => layer.path === failure.config_path);
	const declaration_index = layers.findLastIndex((layer) => layer.path === declaration_config_path);
	return failure_owner_index >= 0 && declaration_index >= failure_owner_index;
}

/**
 * Resolve the compiler explicitly selected by a consumer tsconfig. Invalid
 * specifiers are stable and cached, while missing packages are retried so
 * tsserver can recover after the dependency is installed.
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
		logError(`Unable to resolve declared TSRX compiler "${specifier}" from tsconfig`, config_path);
		return null;
	}
}

/**
 * Return undefined when there is no consumer declaration, null for a declared
 * hard stop, or the resolved compiler path for a valid declaration.
 * @param {string} normalized_file_name
 * @param {CompilerResolutionOptions} [options]
 * @returns {string | null | undefined}
 */
export function resolve_consumer_compiler_for_file(normalized_file_name, options = {}) {
	const typescript = options.ts ?? ts;
	const config_host = options.configHost ?? typescript.sys;
	const host_cache = get_config_host_cache(config_host);
	const root_config_path =
		options.configFileName ??
		get_nearest_root_tsconfig(path.dirname(normalized_file_name), config_host, host_cache);
	if (root_config_path === null) {
		return undefined;
	}
	const resolved_layers = get_tsconfig_layers(
		typescript,
		config_host,
		root_config_path,
		host_cache,
	);
	for (const dependency of resolved_layers.dependencies) {
		options.dependencies?.add(dependency);
	}
	const unreadable_layers = resolved_layers.layers.filter(
		(layer) => layer.raw_source === undefined,
	);
	if (unreadable_layers.length > 0) {
		for (const layer of unreadable_layers) {
			logError('Unable to read tsconfig layer:', layer.path);
		}
		return null;
	}
	const malformed_layers = resolved_layers.layers.filter(
		(layer) => layer.parse_diagnostics.length > 0,
	);
	if (malformed_layers.length > 0) {
		const has_tsrx_intent = resolved_layers.layers.some((layer) => {
			if (get_own_config_value(layer.config, ['tsrx']).state === 'found') {
				return true;
			}
			if (layer.parse_diagnostics.length === 0 || layer.raw_source === undefined) {
				return false;
			}
			// A comment can cause a false positive and hard stop; that fails safe when
			// an unparseable layer may have declared a compiler.
			return tsrx_key_pattern.test(layer.raw_source);
		});
		const log_parse_error = has_tsrx_intent ? logError : logWarning;
		for (const layer of malformed_layers) {
			for (const diagnostic of layer.parse_diagnostics) {
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
	const effective_extends_failures = resolved_layers.extends_failures.filter(
		(failure) =>
			declaration.state !== 'declared' ||
			!is_extends_failure_overridden(resolved_layers.layers, failure, declaration.config_path),
	);
	if (effective_extends_failures.length > 0) {
		for (const failure of effective_extends_failures) {
			if (failure.diagnostics.length === 0) {
				logError(
					'Unable to resolve tsconfig extends entry:',
					JSON.stringify(failure.extends_value),
					`in ${failure.config_path}`,
				);
				continue;
			}
			for (const diagnostic of failure.diagnostics) {
				logError(
					'Unable to resolve tsconfig extends entry:',
					JSON.stringify(failure.extends_value),
					`in ${failure.config_path}`,
					typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
				);
			}
		}
		return null;
	}
	if (declaration.state === 'declared') {
		return resolve_declared_compiler(declaration.config_path, declaration.value);
	}
	return undefined;
}

/** Drop all filesystem-derived consumer compiler resolution state. */
export function reset_consumer_compiler_resolution_caches() {
	config_host_to_resolution_cache = new WeakMap();
	declared_compiler_path_map.clear();
}
