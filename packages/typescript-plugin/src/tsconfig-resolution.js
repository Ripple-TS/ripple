import path from 'node:path';

/**
 * @typedef {object} TsconfigHost
 * @property {(file_name: string) => boolean} fileExists
 * @property {(file_name: string) => string | undefined} readFile
 * @property {import('typescript').ParseConfigHost['readDirectory']} readDirectory
 * @property {boolean | (() => boolean)} useCaseSensitiveFileNames
 * @property {import('typescript').System['getModifiedTime']} [getModifiedTime]
 */

/**
 * @typedef {object} TsconfigLayer
 * @property {string} path
 * @property {string} dir
 * @property {Record<string, unknown>} config
 * @property {string | undefined} raw_source
 * @property {import('typescript').Diagnostic[]} parse_diagnostics
 */

/** @typedef {TsconfigLayer & { extends_values: unknown[] }} ParsedTsconfigLayer */

/**
 * @typedef {object} TsconfigExtendsFailure
 * @property {string} config_path
 * @property {unknown} extends_value
 * @property {string | undefined} resolved_path
 * @property {import('typescript').Diagnostic[]} diagnostics
 */

/**
 * @typedef {object} ResolvedTsconfigLayers
 * @property {TsconfigLayer[]} layers
 * @property {string[]} dependencies
 * @property {import('typescript').Diagnostic[]} diagnostics
 * @property {TsconfigExtendsFailure[]} extends_failures
 */

/**
 * @template TValue
 * @typedef {{state: 'absent'} | {state: 'found', value: TValue}} ConfigValueResult
 */

/** @typedef {{config_path: string, config_dir: string}} TsconfigValueOrigin */

const no_inputs_found_diagnostic_code = 18003;
const circularity_diagnostic_code = 18000;

/**
 * Load a tsconfig and its explicit inheritance graph from lowest to highest
 * precedence. Parsed files are cached, but traversal intentionally does not
 * deduplicate layers because a shared base must be reapplied in every branch.
 *
 * @param {typeof import('typescript')} ts
 * @param {TsconfigHost} host
 * @param {string} config_file_name
 * @returns {ResolvedTsconfigLayers}
 */
export function load_tsconfig_layers(ts, host, config_file_name) {
	/** @type {Map<string, ParsedTsconfigLayer>} */
	const parsed_file_cache = new Map();
	/** @type {TsconfigLayer[]} */
	const layers = [];
	/** @type {string[]} */
	const dependencies = [];
	const dependency_keys = new Set();
	/** @type {import('typescript').Diagnostic[]} */
	const diagnostics = [];
	/** @type {TsconfigExtendsFailure[]} */
	const extends_failures = [];
	const diagnostic_keys = new Set();
	const active_stack = new Set();
	const use_case_sensitive_file_names =
		typeof host.useCaseSensitiveFileNames === 'function'
			? host.useCaseSensitiveFileNames()
			: host.useCaseSensitiveFileNames;

	/** @type {import('typescript').ParseConfigHost} */
	const parse_host = {
		fileExists: host.fileExists,
		readFile: host.readFile,
		readDirectory: host.readDirectory,
		useCaseSensitiveFileNames: use_case_sensitive_file_names,
	};

	/** @param {string} file_name */
	function normalize_path(file_name) {
		return path.normalize(path.resolve(file_name));
	}

	/** @param {string} file_name */
	function get_path_key(file_name) {
		const normalized_path = normalize_path(file_name);
		return use_case_sensitive_file_names ? normalized_path : normalized_path.toLowerCase();
	}

	/** @param {import('typescript').Diagnostic[]} next_diagnostics */
	function add_diagnostics(next_diagnostics) {
		for (const diagnostic of next_diagnostics) {
			const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
			const key = `${diagnostic.code}\0${diagnostic.file?.fileName ?? ''}\0${diagnostic.start ?? ''}\0${message}`;
			if (!diagnostic_keys.has(key)) {
				diagnostic_keys.add(key);
				diagnostics.push(diagnostic);
			}
		}
	}

	/** @param {string} file_name */
	function add_dependency(file_name) {
		const normalized_path = normalize_path(file_name);
		const key = get_path_key(normalized_path);
		if (!dependency_keys.has(key)) {
			dependency_keys.add(key);
			dependencies.push(normalized_path);
		}
	}

	/**
	 * TypeScript does not expose a failed lookup path for extensionless relative
	 * extends entries. Preserve the conventional JSON candidate so creating it
	 * later invalidates both the mtime cache and the language-server project.
	 * @param {ParsedTsconfigLayer} parsed
	 * @param {unknown} extends_value
	 */
	function get_unresolved_relative_dependency(parsed, extends_value) {
		if (
			typeof extends_value !== 'string' ||
			(!path.isAbsolute(extends_value) && !extends_value.startsWith('.'))
		) {
			return undefined;
		}
		const candidate_path = path.resolve(parsed.dir, extends_value);
		return path.extname(candidate_path) === '' ? `${candidate_path}.json` : candidate_path;
	}

	/** @param {string} file_name */
	function parse_file(file_name) {
		const normalized_path = normalize_path(file_name);
		const key = get_path_key(normalized_path);
		const cached = parsed_file_cache.get(key);
		if (cached) {
			return cached;
		}

		const raw_source = host.readFile(normalized_path);
		const source_file = ts.readJsonConfigFile(normalized_path, host.readFile);
		const source_file_with_diagnostics = /** @type {typeof source_file & {
		 * 	parseDiagnostics: readonly import('typescript').Diagnostic[],
		 * }} */ (source_file);
		/** @type {import('typescript').Diagnostic[]} */
		const parse_diagnostics = [...source_file_with_diagnostics.parseDiagnostics];
		const converted_config = ts.convertToObject(source_file, parse_diagnostics);
		const config =
			converted_config !== null &&
			typeof converted_config === 'object' &&
			!Array.isArray(converted_config)
				? /** @type {Record<string, unknown>} */ (converted_config)
				: {};
		const extends_value = config.extends;
		const extends_values = Array.isArray(extends_value)
			? extends_value
			: extends_value !== undefined
				? [extends_value]
				: [];
		const parsed = {
			path: normalized_path,
			dir: path.dirname(normalized_path),
			config,
			raw_source,
			parse_diagnostics,
			extends_values,
		};
		parsed_file_cache.set(key, parsed);
		add_diagnostics(parse_diagnostics);
		return parsed;
	}

	/**
	 * Resolve one immediate extends entry with TypeScript's own config resolver.
	 * A synthetic config isolates the edge; inherited files remain available to
	 * TypeScript so relative, absolute, package, optional-suffix, and cycle
	 * semantics stay aligned with parseJsonSourceFileConfigFileContent.
	 *
	 * @param {ParsedTsconfigLayer} parsed
	 * @param {unknown} extends_value
	 */
	function resolve_extends_path(parsed, extends_value) {
		const synthetic_source = JSON.stringify({ extends: extends_value, files: [] });
		const source_file = ts.readJsonConfigFile(parsed.path, () => synthetic_source);
		const parsed_command_line = ts.parseJsonSourceFileConfigFileContent(
			source_file,
			parse_host,
			parsed.dir,
			{},
			parsed.path,
		);
		const edge_diagnostics = parsed_command_line.errors.filter(
			(diagnostic) => diagnostic.code !== no_inputs_found_diagnostic_code,
		);
		add_diagnostics(edge_diagnostics);
		const resolved_path = source_file.extendedSourceFiles?.[0];
		const dependency_path =
			resolved_path ?? get_unresolved_relative_dependency(parsed, extends_value);
		if (dependency_path !== undefined) {
			add_dependency(dependency_path);
		}

		const has_cycle = edge_diagnostics.some(
			(diagnostic) => diagnostic.code === circularity_diagnostic_code,
		);
		const is_unresolved = resolved_path === undefined || !host.fileExists(resolved_path);
		if (is_unresolved || has_cycle) {
			extends_failures.push({
				config_path: parsed.path,
				extends_value,
				resolved_path: dependency_path,
				diagnostics: edge_diagnostics,
			});
		}
		return is_unresolved ? undefined : resolved_path;
	}

	/** @param {string} file_name */
	function visit(file_name) {
		const normalized_path = normalize_path(file_name);
		const key = get_path_key(normalized_path);
		if (active_stack.has(key)) {
			return;
		}

		active_stack.add(key);
		add_dependency(normalized_path);
		const parsed = parse_file(normalized_path);
		for (const extends_value of parsed.extends_values) {
			const extended_path = resolve_extends_path(parsed, extends_value);
			if (extended_path !== undefined) {
				visit(extended_path);
			}
		}
		layers.push({
			path: parsed.path,
			dir: parsed.dir,
			config: parsed.config,
			raw_source: parsed.raw_source,
			parse_diagnostics: parsed.parse_diagnostics,
		});
		active_stack.delete(key);
	}

	visit(config_file_name);
	return { layers, dependencies, diagnostics, extends_failures };
}

/**
 * Read a nested config value only when every segment is an own property.
 *
 * @param {unknown} config
 * @param {readonly PropertyKey[]} path_parts
 * @returns {ConfigValueResult<unknown>}
 */
export function get_own_config_value(config, path_parts) {
	let current = config;
	for (const path_part of path_parts) {
		if (
			current === null ||
			(typeof current !== 'object' && typeof current !== 'function') ||
			!Object.prototype.hasOwnProperty.call(current, path_part)
		) {
			return { state: 'absent' };
		}
		current = /** @type {Record<PropertyKey, unknown>} */ (current)[path_part];
	}
	return { state: 'found', value: current };
}

/**
 * Resolve a caller-defined value across layers. The last result whose state is
 * not absent wins and is annotated with the config that declared it.
 *
 * @template {{state: string}} TResult
 * @param {readonly TsconfigLayer[]} layers
 * @param {(layer: TsconfigLayer) => TResult} read_layer
 * @returns {{state: 'absent'} | (TResult & TsconfigValueOrigin)}
 */
export function resolve_inherited_config_value(layers, read_layer) {
	/** @type {{state: 'absent'} | (TResult & TsconfigValueOrigin)} */
	let resolved = { state: 'absent' };
	for (const layer of layers) {
		const value = read_layer(layer);
		if (value.state !== 'absent') {
			resolved = {
				...value,
				config_path: layer.path,
				config_dir: layer.dir,
			};
		}
	}
	return resolved;
}
