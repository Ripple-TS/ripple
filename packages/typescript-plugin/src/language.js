/** @import { CodeMapping } from '@tsrx/ripple' */
/** @import {TSRXCompileError, VolarMappingsResult} from '@tsrx/ripple' */

/** @typedef {{ code?: string, js?: { code?: string }, errors?: TSRXCompileError[] }} TSRXCompileResult */
/** @typedef {{ compile?: (source: string, filename: string, options?: { loose?: boolean }) => TSRXCompileResult, compile_to_volar_mappings(source: string, filename: string, options?: { loose?: boolean }): VolarMappingsResult }} TSRXCompilerModule */

/** @typedef {Map<string, CodeMapping>} CachedMappings */
/** @typedef {import('typescript').CompilerOptions} CompilerOptions */
/** @typedef {import('@volar/language-core').IScriptSnapshot} IScriptSnapshot */
/** @typedef {import('@volar/language-core').VirtualCode} VirtualCode */
/** @typedef {string | { fsPath: string }} ScriptId */
// Side-effect import: augments @volar/language-core's LanguagePlugin with the `typescript` field.
/** @typedef {typeof import('@volar/typescript')} _VolarTypeScriptAugmentation */
/** @typedef {import('@volar/language-core').LanguagePlugin<ScriptId, VirtualCode>} RippleLanguagePlugin */

/** @typedef {InstanceType<typeof import('./language.js')["TSRXVirtualCode"]>} TSRXVirtualCodeInstance */

import ts from 'typescript';
import { forEachEmbeddedCode } from '@volar/language-core';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createLogging, DEBUG } from './utils.js';

const require = createRequire(import.meta.url);
const root_dirname = path.dirname(fileURLToPath(import.meta.url));

const { log, logWarning, logError } = createLogging('[Ripple Language]');
/** @type {Set<string>} */
const loggedCompilationFailures = new Set();
export const RIPPLE_EXTENSIONS = ['.tsrx'];
/** @typedef {[string, string[], string[], string[]]} CompilerCandidate */
/** @type {CompilerCandidate[]} */
export const COMPILER_CANDIDATES = [
	[
		'@tsrx/ripple',
		['node_modules', '@tsrx', 'ripple'],
		['.tsrx'],
		['@tsrx/ripple', 'ripple', '@ripple-ts/vite-plugin', '@ripple-ts/compat-react'],
	],
	[
		'@tsrx/react',
		['node_modules', '@tsrx', 'react'],
		['.tsrx'],
		['@tsrx/react', '@tsrx/vite-plugin-react'],
	],
	[
		'@tsrx/solid',
		['node_modules', '@tsrx', 'solid'],
		['.tsrx'],
		['@tsrx/solid', '@tsrx/vite-plugin-solid'],
	],
	[
		'@tsrx/preact',
		['node_modules', '@tsrx', 'preact'],
		['.tsrx'],
		['@tsrx/preact', '@tsrx/vite-plugin-preact'],
	],
	[
		'@tsrx/vue',
		['node_modules', '@tsrx', 'vue'],
		['.tsrx'],
		['@tsrx/vue', '@tsrx/vite-plugin-vue'],
	],
];

/**
 * @param {string} file_name
 * @returns {boolean}
 */
export function is_ripple_file(file_name) {
	return RIPPLE_EXTENSIONS.some((extension) => file_name.endsWith(extension));
}

/**
 * @returns {RippleLanguagePlugin}
 */
export function getRippleLanguagePlugin() {
	log('Creating Ripple language plugin...');

	return {
		getLanguageId(fileNameOrUri) {
			const file_name =
				typeof fileNameOrUri === 'string'
					? fileNameOrUri
					: fileNameOrUri.fsPath.replace(/\\/g, '/');
			if (is_ripple_file(file_name)) {
				log('Identified Ripple file:', file_name);
				return 'ripple';
			}
		},
		createVirtualCode(fileNameOrUri, languageId, snapshot) {
			if (languageId === 'ripple') {
				const file_name = normalizeFileNameOrUri(fileNameOrUri);
				const ripple = get_tsrx_compiler(file_name);
				if (!ripple) {
					logError(`Ripple compiler not found for file: ${file_name}`);
					return undefined;
				}
				log('Creating virtual code for:', file_name);
				try {
					return new TSRXVirtualCode(file_name, snapshot, ripple);
				} catch (err) {
					logError('Failed to create virtual code for:', file_name, ':', err);
					throw err;
				}
			}
			return undefined;
		},
		updateVirtualCode(fileNameOrUri, virtualCode, snapshot) {
			if (virtualCode instanceof TSRXVirtualCode) {
				log('Updating existing virtual code for:', virtualCode.fileName);
				virtualCode.update(snapshot);
				return virtualCode;
			}
			return undefined;
		},

		typescript: {
			extraFileExtensions: RIPPLE_EXTENSIONS.map((extension) => ({
				extension: extension.slice(1),
				isMixedContent: false,
				scriptKind: 7,
			})),
			/**
			 * @param {VirtualCode} ripple_code
			 */
			getServiceScript(ripple_code) {
				for (const code of forEachEmbeddedCode(ripple_code)) {
					if (code.languageId === 'ripple') {
						return {
							code,
							extension: '.tsx',
							scriptKind: 4,
						};
					}
				}
				return undefined;
			},
		},
	};
}

/**
 * @implements {VirtualCode}
 */
export class TSRXVirtualCode {
	/** @type {string} */
	id = 'root';
	/** @type {string} */
	languageId = 'ripple';
	/** @type {unknown[]} */
	codegenStacks = [];
	/** @type {TSRXCompilerModule} */
	tsrx;
	/** @type {string} */
	generatedCode = '';
	/** @type {VirtualCode['embeddedCodes']} */
	embeddedCodes = [];
	/** @type {CodeMapping[]} */
	mappings = [];
	/** @type {TSRXCompileError[]} */
	fatalErrors = [];
	/** @type {TSRXCompileError[]} */
	usageErrors = [];
	/** @type {IScriptSnapshot} */
	snapshot;
	/** @type {IScriptSnapshot} */
	sourceSnapshot;
	/** @type {string} */
	originalCode = '';
	/** @type {unknown[]} */
	diagnostics = [];
	/** @type {CachedMappings | null} */
	#mappingGenToSource = null;
	/** @type {CachedMappings | null} */
	#mappingSourceToGen = null;

	/**
	 * @param {string} file_name
	 * @param {IScriptSnapshot} snapshot
	 * @param {TSRXCompilerModule} tsrx
	 */
	constructor(file_name, snapshot, tsrx) {
		log('Initializing TSRXVirtualCode for:', file_name);

		this.fileName = file_name;
		this.tsrx = tsrx;
		this.snapshot = snapshot;
		this.sourceSnapshot = snapshot;
		this.originalCode = snapshot.getText(0, snapshot.getLength());

		// Validate ripple compiler
		if (!tsrx || typeof tsrx.compile_to_volar_mappings !== 'function') {
			logError('Invalid ripple compiler - missing compile_to_volar_mappings method');
			throw new Error('Invalid ripple compiler');
		}

		this.update(snapshot);
	}

	/**
	 * @param {IScriptSnapshot} snapshot
	 * @returns {void}
	 */
	update(snapshot) {
		log('Updating virtual code for:', this.fileName);

		const newCode = snapshot.getText(0, snapshot.getLength());
		const changeRange = snapshot.getChangeRange(this.sourceSnapshot);
		this.sourceSnapshot = snapshot;

		// Only clear mapping index - don't update snapshot/originalCode yet
		this.#mappingGenToSource = null;
		this.#mappingSourceToGen = null;

		this.fatalErrors = [];
		this.usageErrors = [];

		/** @type {VolarMappingsResult | undefined} */
		let transpiled;

		// Check if a single "." was typed using changeRange
		let isDotTyped = false;
		let dotPosition = -1;

		log('changeRange:', JSON.stringify(changeRange));

		if (changeRange) {
			const changeStart = changeRange.span.start;
			const changeEnd = changeStart + changeRange.span.length;
			const newEnd = changeStart + changeRange.newLength;

			// Get the old text (what was replaced) from originalCode
			const oldText = this.originalCode.substring(changeStart, changeEnd);
			// Get the new text (what replaced it) from newCode
			const newText = newCode.substring(changeStart, newEnd);

			log('Change details:');
			log('  Position:', changeStart, '-', changeEnd, '(length:', changeRange.span.length, ')');
			log('  Old text:', JSON.stringify(oldText));
			log('  New text:', JSON.stringify(newText), '(length:', changeRange.newLength, ')');

			// Check if a dot was added at the end of the new text
			if (newText.endsWith('.')) {
				// The dot is at position newEnd - 1
				// We need to check the character BEFORE the dot (inside the new text)
				const charBeforeDot = newEnd > 1 ? newCode[newEnd - 2] : '';
				log('  Char before dot:', JSON.stringify(charBeforeDot));

				if (/[$#_\u200C\u200D\p{ID_Continue}\)\]\}]/u.test(charBeforeDot)) {
					isDotTyped = true;
					dotPosition = newEnd - 1; // Position of the dot
					log('ChangeRange detected dot typed at position', dotPosition);
				}
			}
		}

		try {
			// If user typed a ".", compile without it and then stitch it back into
			// the generated output so completions can still resolve.
			if (isDotTyped && dotPosition >= 0) {
				const codeWithoutDot =
					newCode.substring(0, dotPosition) + newCode.substring(dotPosition + 1);

				log('Compiling without typed dot at position', dotPosition);
				transpiled = this.tsrx.compile_to_volar_mappings(codeWithoutDot, this.fileName, {
					loose: true,
				});
				log('Compilation without dot successful');

				if (transpiled && transpiled.code && transpiled.mappings.length > 0) {
					const insertedDotPosition = restore_typed_dot_in_transpiled_code(transpiled, dotPosition);

					if (insertedDotPosition === null) {
						logWarning('Failed to restore typed dot into transpiled output');
					} else {
						log('Inserted typed dot at generated position', insertedDotPosition);
					}
				}
			} else {
				// Normal compilation
				log('Compiling Ripple code...');
				transpiled = this.tsrx.compile_to_volar_mappings(newCode, this.fileName, {
					loose: true,
				});
				log('Compilation successful, generated code length:', transpiled?.code?.length || 0);
			}
		} catch (e) {
			const error = /** @type {TSRXCompileError} */ (e);
			logError('Ripple compilation failed for', this.fileName, ':', error);
			if (process.env.TSRX_TSC === 'true') {
				logTSRXErrors(this.fileName, [error]);

				// In tsrx-tsc, swap in a best-effort transpile so we don't fall through
				// to the raw-source fallback below (which would produce a flood of
				// bogus TS diagnostics in the CLI output, drowning the real error).
				// We surface the loose-mode usage errors collected by `compile` so
				// the user still sees the same non-fatal diagnostics they'd get on
				// a successful loose-mode compile.
				const fallback = getFallbackGeneratedCode(this.tsrx, newCode, this.fileName);
				if (fallback !== undefined) {
					logTSRXErrors(this.fileName, fallback.errors);
					transpiled = {
						code: fallback.code,
						mappings: [
							{
								sourceOffsets: [0],
								generatedOffsets: [0],
								lengths: [newCode.length],
								generatedLengths: [fallback.code.length],
								data: {
									verification: false,
									customData: {},
								},
							},
						],
						errors: fallback.errors,
						cssMappings: [],
					};
				}
			}
			error.type = 'fatal';
			this.fatalErrors.push(error);
		}

		if (transpiled && transpiled.code) {
			// Successful compilation - update everything
			this.originalCode = newCode;
			this.generatedCode = transpiled.code;
			this.mappings = transpiled.mappings ?? [];
			this.usageErrors = transpiled.errors;

			if (process.env.TSRX_TSC === 'true' && transpiled.errors.length > 0) {
				logTSRXErrors(this.fileName, transpiled.errors);
			}

			const cssMappings = transpiled.cssMappings;
			if (cssMappings.length > 0) {
				log('Creating', cssMappings.length, 'CSS embedded codes');

				this.embeddedCodes = cssMappings.map((mapping, index) => {
					const cssContent = /** @type {string} */ (mapping.data?.customData?.content);
					log(
						`CSS region ${index}: \
						offset ${mapping.sourceOffsets[0]}-${mapping.sourceOffsets[0] + mapping.lengths[0]}, \
						length ${mapping.lengths[0]}`,
					);

					return {
						id: /** @type {string}  */ (mapping.data?.customData?.embeddedId),
						languageId: 'css',
						snapshot: {
							getText: (/** @type {number} */ start, /** @type {number} */ end) =>
								cssContent.substring(start, end),
							getLength: () => mapping.lengths[0],
							getChangeRange: () => undefined,
						},
						mappings: [mapping],
						embeddedCodes: [],
					};
				});
			} else {
				this.embeddedCodes = [];
			}

			if (DEBUG) {
				log('CSS embedded codes:', (this.embeddedCodes || []).length);
				log('Using transpiled code, mapping count:', this.mappings.length);
				log('Original code length:', newCode.length);
				log('Generated code length:', this.generatedCode.length);
				log('Last 100 chars of original:', JSON.stringify(newCode.slice(-100)));
				log('Last 200 chars of generated:', JSON.stringify(this.generatedCode.slice(-200)));
				log('Last few mappings:');
				const startIdx = Math.max(0, this.mappings.length - 5);
				for (let i = startIdx; i < this.mappings.length; i++) {
					const m = this.mappings[i];
					log(
						`  Mapping ${i}: source[${m.sourceOffsets[0]}:${m.sourceOffsets[0] + m.lengths[0]}] -> gen[${m.generatedOffsets[0]}:${m.generatedOffsets[0] + m.lengths[0]}], len=${m.lengths[0]}, completion=${m.data?.completion}`,
					);
				}
			}

			this.snapshot = /** @type {IScriptSnapshot} */ ({
				getText: (start, end) => this.generatedCode.substring(start, end),
				getLength: () => this.generatedCode.length,
				getChangeRange: () => undefined,
			});
		} else {
			// When compilation fails, show where it failed and disable all
			// TypeScript diagnostics until the compilation error is fixed
			log('Compilation failed, only display where the compilation error occurred.');

			this.originalCode = newCode;

			// In the editor we feed the raw source back as the generated code, with
			// verification enabled. This lets TS parse it and surface errors at the
			// broken construct itself — important when a Ripple compile error has no
			// `pos` (or an unreliable one), since the dedicated diagnostic plugin
			// would otherwise pin the error to offset 0 (top of file, off-screen)
			// and the user would have no signal pointing at the actual problem.
			//
			// In tsrx-tsc we'd rather emit a clean TS-valid placeholder, but that
			// path is handled in the catch above (which sets `transpiled` from
			// `getFallbackGeneratedCode`), so by the time we reach this branch we're
			// in editor context and want the raw-source behavior.
			this.generatedCode = newCode;

			// Create 1:1 mappings for the entire content
			this.mappings = [
				{
					sourceOffsets: [0],
					generatedOffsets: [0],
					lengths: [newCode.length],
					generatedLengths: [newCode.length],
					data: {
						verification: true,
						customData: {},
					},
				},
			];

			// Extract CSS from <style>...</style> tags for embedded codes
			this.embeddedCodes = extractCssFromSource(newCode);

			this.snapshot = /** @type {IScriptSnapshot} */ ({
				getText: (start, end) => this.generatedCode.substring(start, end),
				getLength: () => this.generatedCode.length,
				getChangeRange: () => undefined,
			});
		}
	}

	#buildMappingCache() {
		if (this.#mappingGenToSource || this.#mappingSourceToGen) {
			return;
		}

		this.#mappingGenToSource = new Map();
		this.#mappingSourceToGen = new Map();

		var mapping, genStart, genLength, genEnd, genKey;
		var sourceStart, sourceLength, sourceEnd, sourceKey;
		for (var i = 0; i < this.mappings.length; i++) {
			mapping = this.mappings[i];

			genStart = mapping.generatedOffsets[0];
			genLength = mapping.generatedLengths[0];
			genEnd = genStart + genLength;
			genKey = `${genStart}-${genEnd}`;
			this.#mappingGenToSource.set(genKey, mapping);

			sourceStart = mapping.sourceOffsets[0];
			sourceLength = mapping.lengths[0];
			sourceEnd = sourceStart + sourceLength;
			sourceKey = `${sourceStart}-${sourceEnd}`;
			this.#mappingSourceToGen.set(sourceKey, mapping);
		}
	}

	/**
	 * Find mapping by generated range
	 * @param {number} start - The start offset of the range
	 * @param {number} end - The end offset of the range
	 * @returns {CodeMapping | null} The mapping for this range, or null if not found
	 */
	findMappingByGeneratedRange(start, end) {
		this.#buildMappingCache();
		return /** @type {CachedMappings} */ (this.#mappingGenToSource).get(`${start}-${end}`) ?? null;
	}

	/**
	 * Find mapping by source range
	 * @param {number} start - The start offset of the range
	 * @param {number} end - The end offset of the range
	 * @returns {CodeMapping | null} The mapping for this range, or null if not found
	 */
	findMappingBySourceRange(start, end) {
		this.#buildMappingCache();
		return /** @type {CachedMappings} */ (this.#mappingSourceToGen).get(`${start}-${end}`) ?? null;
	}
}

/**
 * @param {string} file_name
 * @param {ReadonlyArray<unknown>} errors
 */
function logTSRXErrors(file_name, errors) {
	for (const error of errors) {
		const message =
			error && typeof error === 'object' && 'message' in error
				? String(/** @type {{ message: unknown }} */ (error).message)
				: String(error);
		const key = `${file_name}\0${message}`;
		if (loggedCompilationFailures.has(key)) {
			continue;
		}
		loggedCompilationFailures.add(key);
		console.error(`[tsrx-tsc] ${file_name}: ${message}`);
	}
}

/**
 * @param {TSRXCompilerModule} tsrx
 * @param {string} source
 * @param {string} file_name
 * @returns {{ code: string, errors: TSRXCompileError[] } | undefined}
 */
function getFallbackGeneratedCode(tsrx, source, file_name) {
	if (typeof tsrx.compile !== 'function') {
		return;
	}
	try {
		const result = tsrx.compile(source, file_name, { loose: true });
		const code =
			typeof result?.code === 'string'
				? result.code
				: typeof result?.js?.code === 'string'
					? result.js.code
					: undefined;
		if (code !== undefined) {
			return { code, errors: result?.errors ?? [] };
		}
	} catch (error) {
		logError('Fallback compilation failed for', file_name, ':', error);
	}
}

/**
 * Extract CSS content from <style>...</style> tags in source code
 * @param {string} code - The source code to extract CSS from
 * @returns {VirtualCode[]} Array of embedded CSS virtual codes
 */
function extractCssFromSource(code) {
	/** @type {VirtualCode[]} */
	const embeddedCodes = [];
	const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
	let match;
	let index = 0;

	while ((match = styleRegex.exec(code)) !== null) {
		const fullMatch = match[0];
		const cssContent = match[1];
		const styleTagStart = match.index;
		const openTagEnd = fullMatch.indexOf('>') + 1;
		const cssStart = styleTagStart + openTagEnd;
		const cssLength = cssContent.length;

		log(`Extracted CSS region ${index}: offset ${cssStart}, length ${cssLength}`);

		/** @type {CodeMapping} */
		const mapping = {
			sourceOffsets: [cssStart],
			generatedOffsets: [0],
			lengths: [cssLength],
			generatedLengths: [cssLength],
			data: {
				verification: true,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
				customData: {
					content: cssContent,
					embeddedId: `style_${index}`,
				},
			},
		};

		embeddedCodes.push({
			id: `style_${index}`,
			languageId: 'css',
			snapshot: {
				getText: (start, end) => cssContent.substring(start, end),
				getLength: () => cssLength,
				getChangeRange: () => undefined,
			},
			mappings: [mapping],
			embeddedCodes: [],
		});

		index++;
	}

	if (embeddedCodes.length > 0) {
		log(`Extracted ${embeddedCodes.length} CSS embedded codes from style tags`);
	}

	return embeddedCodes;
}

/**
 * Insert a typed dot back into the transpiled code and update mappings so the
 * source and generated offsets stay aligned for completion requests.
 * @param {VolarMappingsResult} transpiled
 * @param {number} dotPosition
 * @returns {number | null}
 */
function restore_typed_dot_in_transpiled_code(transpiled, dotPosition) {
	let dot_mapping = null;

	for (const mapping of transpiled.mappings) {
		const source_end = mapping.sourceOffsets[0] + mapping.lengths[0];
		if (source_end === dotPosition) {
			dot_mapping = mapping;
			break;
		}
	}

	if (!dot_mapping) {
		return null;
	}

	const generated_length = dot_mapping.generatedLengths[0];
	const insertedDotPosition = dot_mapping.generatedOffsets[0] + generated_length;

	transpiled.code =
		transpiled.code.substring(0, insertedDotPosition) +
		'.' +
		transpiled.code.substring(insertedDotPosition);

	// Create a separate 1:1 mapping for the dot character instead of extending
	// the existing mapping. When source and generated lengths differ (e.g.
	// #ripple → _$__u0023_ripple), Volar's translateOffset uses
	// Math.min(relativePos, toLength) which would map the cursor after the dot
	// to the middle of the generated identifier instead of after it.

	/** @type {CodeMapping} */
	const new_dot_mapping = {
		sourceOffsets: [dotPosition],
		generatedOffsets: [insertedDotPosition],
		lengths: [1],
		generatedLengths: [1],
		data: { ...dot_mapping.data },
	};

	// Find the index to insert after dot_mapping
	const dot_mapping_index = transpiled.mappings.indexOf(dot_mapping);
	transpiled.mappings.splice(dot_mapping_index + 1, 0, new_dot_mapping);

	for (const mapping of transpiled.mappings) {
		if (
			mapping !== dot_mapping &&
			mapping !== new_dot_mapping &&
			mapping.generatedOffsets[0] >= insertedDotPosition
		) {
			mapping.generatedOffsets[0] += 1;
		}
		if (
			mapping !== dot_mapping &&
			mapping !== new_dot_mapping &&
			mapping.sourceOffsets[0] >= dotPosition
		) {
			mapping.sourceOffsets[0] += 1;
		}
	}

	return insertedDotPosition;
}

/**
 * @template T
 * @param {{ options?: CompilerOptions } & T} config
 * @returns {{ options: CompilerOptions } & T}
 */
export const resolveConfig = (config) => {
	const baseOptions = config.options ?? /** @type {CompilerOptions} */ ({});
	/** @type {CompilerOptions} */
	const options = { ...baseOptions };

	// Default target: align with modern bundlers while staying configurable.
	if (options.target === undefined) {
		options.target = ts.ScriptTarget.ESNext;
	}

	/** @param {string} libName */
	const normalizeLibName = (libName) => {
		if (typeof libName !== 'string' || libName.length === 0) {
			return undefined;
		}
		const trimmed = libName.trim();
		if (trimmed.startsWith('lib.')) {
			return trimmed.toLowerCase();
		}
		return `lib.${trimmed.toLowerCase().replace(/\s+/g, '').replace(/_/g, '.')}\.d.ts`;
	};

	const normalizedLibs = new Set(
		(options.lib ?? []).map(normalizeLibName).filter((lib) => typeof lib === 'string'),
	);

	if (normalizedLibs.size === 0) {
		const host = ts.createCompilerHost(options);
		const defaultLibFileName = host.getDefaultLibFileName(options).toLowerCase();
		normalizedLibs.add(defaultLibFileName);
		normalizedLibs.add('lib.dom.d.ts');
		normalizedLibs.add('lib.dom.iterable.d.ts');
	}

	options.lib = [...normalizedLibs];

	// Default typeRoots: automatically discover @types like tsserver.
	if (!options.types) {
		const host = ts.createCompilerHost(options);
		const typeRoots = ts.getEffectiveTypeRoots(options, host);
		if (typeRoots && typeRoots.length > 0) {
			options.typeRoots = typeRoots;
		}
	}

	return {
		...config,
		options,
	};
};

/** @type {Map<string, string | null>} */
export const path2RipplePathMap = new Map();
/** @type {Map<string, string>} */
const pathToTypesCache = new Map();
/** @type {Map<string, RegExpMatchArray>} */
const typeNameMatchCache = new Map();
/** @type {Map<string, { name: string | null, dependencies: Set<string> } | null>} */
const pathToPackageManifestCache = new Map();

/**
 * @param {ScriptId} fileNameOrUri
 * @returns {string}
 */
export function normalizeFileNameOrUri(fileNameOrUri) {
	return typeof fileNameOrUri === 'string'
		? fileNameOrUri
		: fileNameOrUri.fsPath.replace(/\\/g, '/');
}

/**
 * @param {string} start_dir
 * @param {(file_path: import('fs').PathLike) => boolean} [exists_sync]
 * @returns {{ name: string | null, dependencies: Set<string> } | null}
 */
function get_nearest_package_manifest(start_dir, exists_sync = fs.existsSync) {
	let current_dir = start_dir;
	/** @type {string[]} */
	const visited_dirs = [];

	while (current_dir) {
		if (pathToPackageManifestCache.has(current_dir)) {
			const cached_manifest = pathToPackageManifestCache.get(current_dir) ?? null;
			for (const visited_dir of visited_dirs) {
				pathToPackageManifestCache.set(visited_dir, cached_manifest);
			}
			return cached_manifest;
		}

		visited_dirs.push(current_dir);

		const package_json_path = path.join(current_dir, 'package.json');
		if (exists_sync(package_json_path)) {
			try {
				const package_json = JSON.parse(fs.readFileSync(package_json_path, 'utf8'));
				const dependencies = new Set([
					...Object.keys(package_json.dependencies ?? {}),
					...Object.keys(package_json.devDependencies ?? {}),
					...Object.keys(package_json.peerDependencies ?? {}),
					...Object.keys(package_json.optionalDependencies ?? {}),
				]);
				const package_manifest = {
					name: typeof package_json.name === 'string' ? package_json.name : null,
					dependencies,
				};

				for (const visited_dir of visited_dirs) {
					pathToPackageManifestCache.set(visited_dir, package_manifest);
				}

				return package_manifest;
			} catch {
				for (const visited_dir of visited_dirs) {
					pathToPackageManifestCache.set(visited_dir, null);
				}
				return null;
			}
		}

		const parent_dir = path.dirname(current_dir);
		if (parent_dir === current_dir) {
			break;
		}
		current_dir = parent_dir;
	}

	for (const visited_dir of visited_dirs) {
		pathToPackageManifestCache.set(visited_dir, null);
	}

	return null;
}

/**
 * @param {{ name: string | null, dependencies: Set<string> } | null} package_manifest
 * @param {string} compiler_name
 * @param {string[]} package_hints
 * @returns {boolean}
 */
function package_manifest_matches_compiler(package_manifest, compiler_name, package_hints) {
	if (!package_manifest) {
		return false;
	}

	if (
		package_manifest.name === compiler_name ||
		package_hints.includes(package_manifest.name ?? '')
	) {
		return true;
	}

	if (package_manifest.dependencies.has(compiler_name)) {
		return true;
	}

	for (const package_hint of package_hints) {
		if (package_manifest.dependencies.has(package_hint)) {
			return true;
		}
	}

	return false;
}

/**
 * @param {string} normalized_file_name
 * @returns {TSRXCompilerModule | undefined}
 */
function get_tsrx_compiler(normalized_file_name) {
	const compiler_path = get_compiler_entry_for_file(normalized_file_name);
	if (compiler_path) {
		return require(compiler_path);
	}
}

/**
 * @param {string} normalized_file_name
 * @param {(file_path: import('fs').PathLike) => boolean} [exists_sync]
 * @param {Map<string, string | null>} [compiler_path_map]
 * @returns {string | undefined}
 */
export function find_workspace_compiler_entry_for_file(
	normalized_file_name,
	exists_sync = fs.existsSync,
	compiler_path_map = path2RipplePathMap,
) {
	const parts = normalized_file_name.split('/');
	const ext = path.extname(normalized_file_name);

	for (let i = parts.length - 2; i >= 0; i--) {
		const dir = parts.slice(0, i + 1).join('/');
		const cache_key = dir + '\0' + ext;

		if (!compiler_path_map.has(cache_key)) {
			/** @type {Array<[string, string, string[]]>} */
			const available_candidates = [];
			for (const [
				compiler_name,
				compiler_dir_parts,
				supported_extensions,
				package_hints,
			] of COMPILER_CANDIDATES) {
				if (!supported_extensions.includes(ext)) {
					continue;
				}
				const full_path = [dir, ...compiler_dir_parts, 'src', 'index.js'].join('/');
				if (exists_sync(full_path)) {
					available_candidates.push([compiler_name, full_path, package_hints]);
				}
			}

			let found_path = null;
			if (available_candidates.length > 0) {
				const package_manifest = get_nearest_package_manifest(dir, exists_sync);
				const preferred_candidate = available_candidates.find(([compiler_name, , package_hints]) =>
					package_manifest_matches_compiler(package_manifest, compiler_name, package_hints),
				);
				found_path = preferred_candidate?.[1] ?? available_candidates[0][1];
				log('Found tsrx compiler at:', found_path, 'for extension:', ext);
			}

			compiler_path_map.set(cache_key, found_path);
		}

		const compiler_path = compiler_path_map.get(cache_key);
		if (compiler_path) {
			return compiler_path;
		}
	}
}

/**
 * @param {string} normalized_file_name
 * @returns {string | undefined}
 */
export function get_compiler_entry_for_file(normalized_file_name) {
	const ext = path.extname(normalized_file_name);
	const package_manifest = get_nearest_package_manifest(path.dirname(normalized_file_name));

	const workspace_compiler_path = find_workspace_compiler_entry_for_file(normalized_file_name);
	if (workspace_compiler_path) {
		return workspace_compiler_path;
	}

	const warn_message = `No supported tsrx compiler found in workspace for ${normalized_file_name}.`;

	// Fallback: look for a packaged compiler.
	let current_dir = root_dirname;

	while (current_dir) {
		/** @type {Array<[string, string, string[]]>} */
		const available_candidates = [];
		for (const [
			compiler_name,
			compiler_dir_parts,
			supported_extensions,
			package_hints,
		] of COMPILER_CANDIDATES) {
			if (!supported_extensions.includes(ext)) {
				continue;
			}
			const full_path = path.join(current_dir, ...compiler_dir_parts);
			const entry_path = path.join(full_path, 'src', 'index.js');
			if (fs.existsSync(entry_path)) {
				available_candidates.push([compiler_name, entry_path, package_hints]);
			}
		}

		if (available_candidates.length > 0) {
			const preferred_candidate = available_candidates.find(([compiler_name, , package_hints]) =>
				package_manifest_matches_compiler(package_manifest, compiler_name, package_hints),
			);
			const entry_path = preferred_candidate?.[1] ?? available_candidates[0][1];
			logWarning(`${warn_message} Using packaged version at ${entry_path}`);
			return entry_path;
		}

		const parent_dir = path.dirname(current_dir);
		if (parent_dir === current_dir) {
			break;
		}
		current_dir = parent_dir;
	}

	return undefined;
}

/**
 * @param {string} typesFilePath
 * @returns {string | undefined}
 */
export function getCachedTypeDefinitionFile(typesFilePath) {
	const cached = pathToTypesCache.get(typesFilePath);
	if (cached) {
		return cached;
	}

	if (!fs.existsSync(typesFilePath)) {
		logWarning(`Types file does not exist at path: ${typesFilePath}`);
		return;
	}

	log(`Found ripple types at: ${typesFilePath}`);

	// Read the file to find the class definition offset
	const fileContent = fs.readFileSync(typesFilePath, 'utf8');

	if (!fileContent) {
		logWarning(`Failed to read content of types file at: ${typesFilePath}`);
		return;
	}

	pathToTypesCache.set(typesFilePath, fileContent);
	return fileContent;
}

/**
 * @param {string} typeName
 * @param {string} text
 * @returns {RegExpMatchArray | undefined}
 */
export function getCachedTypeMatches(typeName, text) {
	const cached = typeNameMatchCache.get(typeName);
	if (cached) {
		return cached;
	}

	const searchPattern = new RegExp(
		`(?:export\\s+(?:declare\\s+)?|declare\\s+)(class|function)\\s+${typeName}`,
	);

	const match = text.match(searchPattern);

	if (match && match.index !== undefined) {
		typeNameMatchCache.set(typeName, match);
		return match;
	}

	return;
}

/**
 * @param {string} normalized_file_name
 * @returns {string | undefined}
 */
export function get_compiler_dir_for_file(normalized_file_name) {
	const entry = get_compiler_entry_for_file(normalized_file_name);
	if (entry) {
		// Walk up from .../src/index.js to the package root
		return path.dirname(path.dirname(entry));
	}
}

export { get_compiler_dir_for_file as getRippleDirForFile };

/** Reset module-level state used in tests. */
export function _reset_for_test() {
	path2RipplePathMap.clear();
	pathToPackageManifestCache.clear();
}
