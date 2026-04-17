/** @import * as AST from 'estree' */

import { createVolarMappingsResult, parseModule } from '@tsrx/core';
import { transform } from './transform.js';

/**
 * Parse tsrx-react source code to an ESTree AST.
 * @param {string} source
 * @param {string} [filename]
 * @returns {AST.Program}
 */
export function parse(source, filename) {
	return parseModule(source, filename);
}

/**
 * Compile tsrx-react source code to a TSX/JSX module suitable for use with
 * React's automatic jsx runtime (consumed by a downstream JSX transform).
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
 * Compile tsrx-react source to virtual TSX plus Volar mappings for editor tooling.
 *
 * @param {string} source
 * @param {string} [filename]
 * @returns {import('@tsrx/core/types').VolarMappingsResult}
 */
export function compile_to_volar_mappings(source, filename) {
	const ast = parseModule(source, filename);
	const transformed = transform(ast, source, filename);

	return createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		errors: [],
	});
}
