/** @import { AppendIntoAnchor, Block } from '#client' */

import { is_tsrx_element } from '../../element.js';
import { render_value } from './expression.js';
import { active_block, pop_component, push_component } from './runtime.js';

/**
 * @param {Function} fn
 * @param {Node | AppendIntoAnchor} anchor
 * @param {Record<string, any>} props
 * @param {Block | null} [block=active_block]
 * @returns {void}
 */
export function render_component(fn, anchor, props, block = active_block) {
	if (typeof fn !== 'function' || is_tsrx_element(fn)) {
		throw_invalid_component_type(fn);
	}

	run_component(fn, anchor, props, block);
}

/**
 * @param {Function} fn
 * @param {Node | AppendIntoAnchor} anchor
 * @param {Record<string, any>} props
 * @param {Block | null} [block=active_block]
 * @returns {void}
 */
function run_component(fn, anchor, props, block = active_block) {
	push_component();
	render_value(fn(props), /** @type {ChildNode} */ (anchor), block);
	pop_component();
}

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
function throw_invalid_component_type(value) {
	if (is_tsrx_element(value)) {
		throw new TypeError('Invalid component type: received a TSRXElement value.');
	}

	throw new TypeError('Invalid component type: expected a component function.');
}
