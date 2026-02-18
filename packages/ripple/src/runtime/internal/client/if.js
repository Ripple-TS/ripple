/** @import { Block } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { IF_BLOCK, UNINITIALIZED } from './constants.js';
import { HYDRATION_END, HYDRATION_START, HYDRATION_START_ELSE } from '../../../constants.js';
import { hydrate_next, hydrating, set_hydrate_node } from './hydration.js';
import { get_next_sibling } from './operations.js';

/**
 * Finds the matching hydration end marker for a block start marker.
 * @param {Node} anchor
 * @returns {Node | null}
 */
function find_hydration_end(anchor) {
	/** @type {Node | null} */
	let node = anchor;
	let depth = 0;

	while (node !== null) {
		if (node.nodeType === Node.COMMENT_NODE) {
			const data = /** @type {Comment} */ (node).data;
			if (data === HYDRATION_START || data === HYDRATION_START_ELSE) {
				depth += 1;
			} else if (data === HYDRATION_END) {
				depth -= 1;
				if (depth === 0) {
					return node;
				}
			}
		}
		node = get_next_sibling(/** @type {Node} */ (node));
	}

	return null;
}

/**
 * @param {Node} node
 * @param {(set_branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void} fn
 * @returns {void}
 */
export function if_block(node, fn) {
	/** @type {Node | null} */
	let hydration_end = null;
	if (hydrating) {
		hydration_end = find_hydration_end(node);
		hydrate_next();
	}

	var anchor = node;
	var has_branch = false;
	/** @type {any} */
	var condition = UNINITIALIZED;
	/** @type {Block | null} */
	var b = null;

	/** @type {(fn: (anchor: Node) => void, flag?: boolean) => void} */
	var set_branch = (fn, flag = true) => {
		has_branch = true;
		update_branch(flag, fn);
	};

	/** @type {(new_condition: any, fn: ((anchor: Node) => void) | null) => void} */
	var update_branch = (new_condition, fn) => {
		if (condition === (condition = new_condition)) return;

		if (b !== null) {
			destroy_block(b);
			b = null;
		}

		if (fn !== null) {
			b = branch(() => fn(anchor));
		}
	};

	render(
		() => {
			has_branch = false;
			fn(set_branch);
			if (!has_branch) {
				update_branch(null, null);
			}
		},
		null,
		IF_BLOCK,
	);

	if (hydrating && hydration_end !== null) {
		if (b !== null) {
			/** @type {Block} */
			var bb = b;
			var state = bb.s;
			if (state !== null) {
				var end = hydration_end.previousSibling;
				if (end !== null && end !== anchor) {
					state.end = end;
				}
			}
		}
		set_hydrate_node(hydration_end);
	}
}
