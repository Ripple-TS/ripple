/** @import * as AST from 'estree' */
/** @import { ParseOptions } from '@tsrx/core/types' */

import { createVolarMappingsResult, dedupeMappings, parseModule } from '@tsrx/core';
import { transform } from './transform.js';

/**
 * Parse tsrx-solid source code to an ESTree AST.
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
	return parseModule(source, filename, options);
}

/**
 * Compile tsrx-solid source code to a TSX module suitable for use with
 * Solid's JSX transform (typically via `vite-plugin-solid`).
 *
 * @param {string} source
 * @param {string} [filename]
 * @returns {{ code: string, map: any, css: { code: string, hash: string } | null }}
 */
export function compile(source, filename) {
	const ast = parseModule(source, filename);
	const { ast: _ast, ...result } = transform(ast, source, filename);
	return result;
}

/**
 * Compile tsrx-solid source to virtual TSX plus Volar mappings for editor tooling.
 *
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {import('@tsrx/core/types').VolarMappingsResult}
 */
export function compile_to_volar_mappings(source, filename, options) {
	const ast = parseModule(source, filename, options);
	const transformed = transform(ast, source, filename);
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
