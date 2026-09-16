/** @import { Block } from '#client' */

import { is_tsrx_element } from '../../element.js';
import { render_value } from './expression.js';
import { active_block } from './runtime.js';
import { component_invalid } from './errors.js';

export { render_component } from './runtime.js';

/**
 * @param {import('../../element.js').TSRXElement} value
 * @param {Node} anchor
 * @param {Block | null} [block=active_block]
 * @returns {void}
 */
export function render_tsrx_element(value, anchor, block = active_block) {
	render_value(value, /** @type {ChildNode} */ (anchor), block);
}

/**
 * @param {any} value
 * @returns {never}
 */
export function throw_invalid_component_type(value) {
	component_invalid(is_tsrx_element(value));
}
