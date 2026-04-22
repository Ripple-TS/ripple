/** @import * as AST from 'estree' */
/** @import { ParseOptions } from '@tsrx/core/types' */
/** @import { CompileOptions } from './transform.js' */

import { createVolarMappingsResult, dedupeMappings, parseModule } from '@tsrx/core';
import { DEFAULT_SUSPENSE_SOURCE, transform } from './transform.js';

export { DEFAULT_SUSPENSE_SOURCE };

/**
 * Parse tsrx-preact source code to an ESTree AST.
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
	return parseModule(source, filename, options);
}

/**
 * Compile tsrx-preact source code to a TSX/JSX module suitable for use with
 * Preact's automatic jsx runtime (consumed by a downstream JSX transform).
 *
 * @param {string} source
 * @param {string} [filename]
 * @param {CompileOptions} [compile_options]
 * @returns {{ code: string, map: any, css: { code: string, hash: string } | null }}
 */
export function compile(source, filename, compile_options) {
	const ast = parseModule(source, filename);
	const { ast: _ast, ...result } = transform(ast, source, filename, compile_options);
	return result;
}

/**
 * Compile tsrx-preact source to virtual TSX plus Volar mappings for editor tooling.
 *
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions & CompileOptions} [options]
 * @returns {import('@tsrx/core/types').VolarMappingsResult}
 */
export function compile_to_volar_mappings(source, filename, options) {
	const ast = parseModule(source, filename, options);
	const transformed = transform(ast, source, filename, options);
	const result = createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		errors: [],
	});

	return {
		...result,
		mappings: dedupeMappings(result.mappings),
	};
}
