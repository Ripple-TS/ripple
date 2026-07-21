/** @import * as AST from 'estree' */
/** @import { CompileError, ParseOptions } from '@tsrx/core/types' */
/** @import { NonEmptyString } from '@tsrx/core/types/helpers' */

import { analyzeTsrx, createVolarMappingsResult, dedupeMappings, parseModule } from '@tsrx/core';
import { transform } from './transform.js';

export { isRefProp } from './ref.js';

/**
 * Parse tsrx-vue source code to an ESTree AST.
 * @template {string} T
 * @param {string} source
 * @param {NonEmptyString<T>} filename
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
	return parseModule(source, filename, options);
}

/**
 * Compile tsrx-vue source code to a TSX module suitable for consumption by
 * vue-jsx-vapor or another Vue JSX transform.
 *
 * @template {string} T
 * @param {string} source
 * @param {NonEmptyString<T>} filename
 * @param {{ collect?: boolean, loose?: boolean }} [options]
 * @returns {{ code: string, map: any, css: string, cssHash: string | null, errors: CompileError[] }}
 */
export function compile(source, filename, options) {
	const errors = /** @type {CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const collect = !!(options?.collect || options?.loose);
	const ast = parseModule(
		source,
		filename,
		collect ? { collect: true, loose: !!options?.loose, errors, comments } : undefined,
	);
	analyzeTsrx(
		ast,
		filename,
		collect ? { collect: true, loose: !!options?.loose, errors, comments } : undefined,
	);
	const { ast: _ast, ...result } = transform(
		ast,
		source,
		filename,
		collect ? { collect: true, loose: !!options?.loose, errors, comments } : undefined,
	);
	return { ...result, errors };
}

/**
 * Compile tsrx-vue source to virtual TSX plus Volar mappings for editor tooling.
 *
 * @template {string} T
 * @param {string} source
 * @param {NonEmptyString<T>} filename
 * @param {ParseOptions} [options]
 * @returns {import('@tsrx/core/types').VolarMappingsResult}
 */
export function compile_to_volar_mappings(source, filename, options) {
	const errors = /** @type {import('@tsrx/core/types').CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const ast = parseModule(source, filename, {
		...options,
		collect: true,
		loose: !!options?.loose,
		preserveParens: true,
		keywordTokens: true,
		errors,
		comments,
	});
	analyzeTsrx(ast, filename, {
		collect: true,
		loose: !!options?.loose,
		typeOnly: true,
		errors,
		comments,
	});
	const transformed = transform(ast, source, filename, {
		collect: true,
		loose: !!options?.loose,
		moduleScopedHookComponents: false,
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
