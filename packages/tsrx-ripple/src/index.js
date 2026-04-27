/** @import * as AST from 'estree' */
/** @import { CompileOptions, CompileError, ParseOptions } from '../types/index' */

import { createVolarMappingsResult, parseModule } from '@tsrx/core';
import { analyze } from './analyze/index.js';
import { transform_client } from './transform/client/index.js';
import { transform_server } from './transform/server/index.js';

/**
 * Parse Ripple source code to ESTree AST
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
	return parseModule(source, filename, options);
}

/**
 * Compile Ripple source code to JS/CSS output
 * @param {string} source
 * @param {string} filename
 * @param {CompileOptions} [options]
 * @returns {object}
 */
export function compile(source, filename, options = {}) {
	const errors = /** @type {CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const collect = !!options?.loose;
	const ast = parseModule(source, filename, collect ? { ...options, errors, comments } : undefined);
	const analysis = analyze(ast, filename, collect ? { ...options, errors, comments } : options);
	const result =
		options.mode === 'server'
			? transform_server(
					filename,
					source,
					analysis,
					options?.minify_css ?? false,
					options?.dev ?? false,
				)
			: transform_client(
					filename,
					source,
					analysis,
					false,
					options?.minify_css ?? false,
					options?.hmr ?? false,
				);

	return { ...result, errors };
}

/**
 * Compile Ripple component to Volar virtual code with TypeScript mappings
 * @param {string} source
 * @param {string} filename
 * @param {{loose?: boolean, minify_css?: boolean}} [options]
 * @returns {object}
 */
export function compile_to_volar_mappings(source, filename, options = {}) {
	const errors = /** @type {CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const ast = parseModule(source, filename, { ...options, errors, comments });
	const analysis = analyze(ast, filename, {
		to_ts: true,
		loose: !!options?.loose,
		errors,
		comments,
	});
	const transformed = transform_client(
		filename,
		source,
		analysis,
		true,
		options?.minify_css ?? false,
	);

	return createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.js.code,
		source_map: transformed.js.map,
		post_processing_changes: transformed.js.post_processing_changes,
		line_offsets: transformed.js.line_offsets,
		errors: transformed.errors,
	});
}
