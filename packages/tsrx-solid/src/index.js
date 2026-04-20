/** @import * as AST from 'estree' */
/** @import { CodeMapping, ParseOptions } from '@tsrx/core/types' */

import { createVolarMappingsResult, parseModule } from '@tsrx/core';
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
		mappings: dedupe_mappings(result.mappings),
	};
}

/**
 * @param {CodeMapping[]} mappings
 * @returns {CodeMapping[]}
 */
function dedupe_mappings(mappings) {
	const deduped = [];
	const seen = new Set();

	for (const mapping of mappings) {
		const key = JSON.stringify(serialize_mapping_value(mapping));

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		deduped.push(mapping);
	}

	return deduped;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function serialize_mapping_value(value) {
	if (typeof value === 'function') {
		return value.toString();
	}

	if (Array.isArray(value)) {
		return value.map(serialize_mapping_value);
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, nested_value]) => [key, serialize_mapping_value(nested_value)]),
		);
	}

	return value;
}
