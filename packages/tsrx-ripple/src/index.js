/** @import * as AST from 'estree' */
/** @import { CompileOptions, CompileError, ParseOptions } from '../types/index' */
/** @import { NonEmptyString } from '@tsrx/core/types/helpers' */

import { createVolarMappingsResult, parseModule } from '@tsrx/core';
import { analyze } from './analyze/index.js';
import { transform_client } from './transform/client/index.js';
import { transform_server } from './transform/server/index.js';
import { normalize_jsx_tsrx_templates } from './utils.js';

/**
 * Parse Ripple source code to ESTree AST
 * @template {string} T
 * @param {string} source
 * @param {NonEmptyString<T>} filename
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse(source, filename, options) {
	const ast = parseModule(source, filename, options);
	normalize_jsx_tsrx_templates(ast);
	strip_metadata_paths(ast);
	return ast;
}

/**
 * Public parse results should be JSON/stringify friendly. Internal transforms
 * keep metadata.path through compile(), but parse() callers do not need the
 * circular ancestor arrays.
 * @param {any} node
 * @param {WeakSet<object>} [seen]
 * @returns {void}
 */
function strip_metadata_paths(node, seen = new WeakSet()) {
	if (!node || typeof node !== 'object' || seen.has(node)) return;
	seen.add(node);
	if (node.metadata?.path) {
		delete node.metadata.path;
	}
	for (const key in node) {
		if (key === 'parent') continue;
		const value = node[key];
		if (Array.isArray(value)) {
			for (const child of value) strip_metadata_paths(child, seen);
		} else if (value && typeof value === 'object') {
			strip_metadata_paths(value, seen);
		}
	}
}

/**
 * Compile Ripple source code to JS/CSS output
 * @param {string} source
 * @param {string} filename
 * @param {CompileOptions} [options]
 * @returns {{ code: string, map: any, css: string, cssHash: string | null, errors: CompileError[], js: { code: string, map: any } }}
 */
export function compile(source, filename, options = {}) {
	const errors = /** @type {CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const collect = !!(options?.collect || options?.loose);
	const ast = parseModule(
		source,
		filename,
		collect ? { ...options, collect, errors, comments } : undefined,
	);
	normalize_jsx_tsrx_templates(ast);
	const analysis = analyze(
		ast,
		filename,
		collect ? { ...options, collect, errors, comments } : options,
	);
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

	const { ast: _ast, ...rest } = result;
	return {
		...rest,
		// Temporary back-compat for the LiveCodes playground
		// (live-codes/livecodes#865), which still reads `js.code`. Remove once
		// the playground is replaced.
		js: { code: rest.code, map: rest.map },
		errors,
	};
}

/**
 * Compile Ripple component to Volar virtual code with TypeScript mappings
 * @param {string} source
 * @param {string} filename
 * @param {{collect?: boolean, loose?: boolean, minify_css?: boolean}} [options]
 * @returns {object}
 */
export function compile_to_volar_mappings(source, filename, options = {}) {
	const errors = /** @type {CompileError[]} */ ([]);
	const comments = /** @type {AST.CommentWithLocation[]} */ ([]);
	const ast = parseModule(source, filename, {
		...options,
		collect: true,
		loose: !!options?.loose,
		errors,
		comments,
	});
	const ast_from_source = structuredClone(ast);
	normalize_jsx_tsrx_templates(ast);
	const analysis = analyze(ast, filename, {
		to_ts: true,
		collect: true,
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
		ast_from_source,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		post_processing_changes: transformed.post_processing_changes,
		line_offsets: transformed.line_offsets,
		errors: transformed.errors,
	});
}
