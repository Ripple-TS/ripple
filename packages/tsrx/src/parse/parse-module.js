/** @import * as AST from 'estree' */
/** @import { ParseOptions } from '../../types/index' */

import { createParser } from './index.js';
import { TSRXPlugin } from '../plugin.js';

const parse = createParser(TSRXPlugin());

/**
 * Parse source code to an ESTree AST using the TSRX parser.
 * @param {string} source
 * @param {string} [filename]
 * @param {ParseOptions} [options]
 * @returns {AST.Program}
 */
export function parse_module(source, filename, options) {
	return parse(source, filename, options);
}
