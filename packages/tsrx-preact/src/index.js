/** @import * as AST from 'estree' */
/** @import { CompileError, ParseOptions } from '@tsrx/core/types' */
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
 * @param {CompileOptions & { collect?: boolean, loose?: boolean }} [compile_options]
 * @returns {{ code: string, map: any, css: string, cssHash: string | null, errors: CompileError[] }}
 */
export function compile(source, filename, compile_options) {
	const errors = /** @type {CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const collect = !!(compile_options?.collect || compile_options?.loose);
	const ast = parseModule(
		source,
		filename,
		collect ? { collect: true, loose: !!compile_options?.loose, errors, comments } : undefined,
	);
	const { ast: _ast, ...result } = transform(
		ast,
		source,
		filename,
		collect
			? { ...compile_options, collect: true, loose: !!compile_options?.loose, errors, comments }
			: compile_options,
	);
	return { ...result, errors };
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
	const errors = /** @type {import('@tsrx/core/types').CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const ast = parseModule(source, filename, {
		...options,
		collect: true,
		loose: !!options?.loose,
		errors,
		comments,
	});
	const transformed = transform(ast, source, filename, {
		...options,
		collect: true,
		loose: !!options?.loose,
		typeOnly: true,
		errors,
		comments,
	});
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
