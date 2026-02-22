/** @import { Block } from '#client' */

import { HYDRATION_END, HYDRATION_START, HYDRATION_START_ELSE } from '../../../constants.js';
import { branch, destroy_block, render } from './blocks.js';
import { IF_BLOCK, UNINITIALIZED } from './constants.js';
import { hydrate_next, hydrate_node, hydrating, set_hydrate_node } from './hydration.js';
import { get_next_sibling } from './operations.js';

/**
 * Skip to the end of a hydration block by finding the matching <!--]-->.
 * Handles nested blocks by tracking depth.
 * @returns {void}
 */
function skip_to_end() {
	var node = hydrate_node;
	var depth = 1;

	while (node !== null) {
		if (node.nodeType === 8) {
			var data = /** @type {Comment} */ (node).data;
			if (data === HYDRATION_START || data === HYDRATION_START_ELSE) {
				depth++;
			} else if (data === HYDRATION_END) {
				depth--;
				if (depth === 0) {
					// Found matching end marker, position for next sibling call
					set_hydrate_node(node);
					return;
				}
			}
		}
		node = get_next_sibling(node);
	}
}

/**
 * @param {Node} node
 * @param {(set_branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void} fn
 * @returns {void}
 */
export function if_block(node, fn) {
	/** @type {boolean | null} */
	var hydrated_else = null; // true if server rendered else branch, false if consequent

	if (hydrating) {
		hydrate_next(); // Move past <!--[-->
		// Check if the next marker is <!--[!--> (else branch)
		var current = hydrate_node;
		if (current !== null && current.nodeType === 8) {
			var data = /** @type {Comment} */ (current).data;
			if (data === HYDRATION_START_ELSE) {
				hydrated_else = true;
				hydrate_next(); // Move past <!--[!-->
			} else if (data === HYDRATION_END) {
				// Server rendered nothing (empty if with no else)
				// hydrated_else stays null
			} else {
				// Some other comment (e.g., nested block) - server rendered consequent
				hydrated_else = false;
			}
		} else if (current !== null) {
			// Non-comment node means server rendered consequent branch content
			hydrated_else = false;
		}
		// If current is null, server rendered nothing
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
		// flag=true means consequent, flag=false means else
		// If server rendered a different branch, skip to end first
		// hydrated_else=false means consequent was rendered, hydrated_else=true means else was rendered
		if (hydrated_else !== null && hydrated_else !== !flag) {
			skip_to_end();
			hydrated_else = null; // Only handle mismatch once
		}
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
				// Client didn't take any branch - skip server content to position cursor
				if (hydrated_else !== null) {
					skip_to_end();
					hydrated_else = null;
				}
				update_branch(null, null);
			}
		},
		null,
		IF_BLOCK,
	);
}
