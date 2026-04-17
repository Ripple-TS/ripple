/** @import * as AST from 'estree' */

import { parseModule } from '@tsrx/core';
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
	return transform(ast, source, filename);
}
