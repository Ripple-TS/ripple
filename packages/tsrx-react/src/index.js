/** @import * as AST from 'estree' */
/** @import { CompileError, ParseOptions } from '@tsrx/core/types' */

import { createVolarMappingsResult, dedupeMappings, parseModule } from '@tsrx/core';
import { transform } from './transform.js';

/**
 * Parse tsrx-react source code to an ESTree AST.
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
	return parseModule(source, filename, options);
}

/**
 * Compile tsrx-react source code to a TSX/JSX module suitable for use with
 * React's automatic jsx runtime (consumed by a downstream JSX transform).
 *
 * @param {string} source
 * @param {string} [filename]
 * @param {{ loose?: boolean }} [options]
 * @returns {{ code: string, map: any, css: { code: string, hash: string } | null, errors: CompileError[] }}
 */
export function compile(source, filename, options) {
	const errors = /** @type {CompileError[]} */ ([]);
	const collect = !!options?.loose;
	const ast = parseModule(source, filename, collect ? { loose: true, errors } : undefined);
	const { ast: _ast, ...result } = transform(ast, source, filename);
	return { ...result, errors };
}

/**
 * Compile tsrx-react source to virtual TSX plus Volar mappings for editor tooling.
 *
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {import('@tsrx/core/types').VolarMappingsResult}
 */
export function compile_to_volar_mappings(source, filename, options) {
	const errors = /** @type {import('@tsrx/core/types').CompileError[]} */ ([]);
	const ast = parseModule(source, filename, { ...options, errors });
	const transformed = transform(ast, source, filename);
	const result = createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		errors,
	});

	return {
		...result,
		mappings: dedupeMappings(result.mappings),
	};
}
