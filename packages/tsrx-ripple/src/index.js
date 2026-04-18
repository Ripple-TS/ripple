/** @import * as AST from 'estree' */
/** @import { CompileOptions, CompileError, PostProcessingChanges, LineOffsets, ParseOptions } from '../types/index' */

import { convertSourceMapToMappings, parseModule } from '@tsrx/core';
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
	const ast = parseModule(source, filename, undefined);
	const analysis = analyze(ast, filename, options);
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

	return result;
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

	return {
		...convertSourceMapToMappings(
			transformed.ast,
			ast,
			source,
			transformed.js.code,
			transformed.js.map,
			/** @type {PostProcessingChanges} */ (transformed.js.post_processing_changes),
			/** @type {LineOffsets} */ (transformed.js.line_offsets),
		),
		errors: transformed.errors,
	};
}
