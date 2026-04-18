/** @import { Block } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { BRANCH_BLOCK, UNINITIALIZED } from './constants.js';
import { create_text, get_next_sibling } from './operations.js';
import { active_block } from './runtime.js';
import { hydrating, set_hydrate_node } from './hydration.js';
import { COMMENT_NODE, HYDRATION_END, HYDRATION_START, TEXT_NODE } from '../../../constants.js';
import { is_tsrx_element } from '../../element.js';

/**
 * Finds the nearest enclosing BRANCH_BLOCK in the block hierarchy.
 * @param {Block | null} block
 * @returns {Block | null}
 */
function find_enclosing_branch(block) {
	while (block !== null) {
		if ((block.f & BRANCH_BLOCK) !== 0) {
			return block;
		}
		block = block.p;
	}
	return null;
}

/**
 * @param {Node} node
 * @param {() => any} get_value
 * @returns {void}
 */
export function expression(node, get_value) {
	var anchor = /** @type {ChildNode} */ (node);
	/** @type {Block | null} */
	var child_block = null;
	/** @type {Comment | null} */
	var end = null;
	/** @type {Text | null} */
	var text = null;
	/** @type {string | import('../../element.js').TSRXElement | typeof UNINITIALIZED} */
	var value = UNINITIALIZED;
	var is_element = false;
	var initialized = false;
	/** @type {Block | null} */
	var modified_parent_branch = null;
	/** @type {Node | null} */
	var original_parent_start = null;

	render(() => {
		var next_value = get_value();
		var next_is_element = is_tsrx_element(next_value);
		var is_hydration_marker = hydrating && anchor.nodeType === COMMENT_NODE;

		if (is_hydration_marker) {
			end ??= ensure_expression_end(anchor);
		}

		if (next_is_element) {
			if (initialized && is_element && value === next_value) {
				if (end !== null) {
					advance_hydration(end);
				}
				return;
			}

			if (anchor.nodeType === TEXT_NODE) {
				/** @type {Text} */ (anchor).nodeValue = '';
			} else if (text !== null) {
				text.remove();
				text = null;
			}

			if (child_block !== null) {
				destroy_block(child_block);
				child_block = null;
				// Restore parent branch's start since we may update it again below
				if (modified_parent_branch !== null && modified_parent_branch.s !== null) {
					modified_parent_branch.s.start = original_parent_start;
					modified_parent_branch = null;
					original_parent_start = null;
				}
			}

			if (end !== null && (initialized || !hydrating)) {
				clear_expression_range(anchor, end);
			}

			if (is_hydration_marker) {
				set_hydrate_node(get_next_sibling(anchor) ?? end);
			}

			// Find the enclosing branch block BEFORE creating child_block
			// so we can update its s.start to include content inserted before anchor
			var parent_branch = find_enclosing_branch(active_block);

			child_block = branch(() => {
				var block = active_block;
				next_value.render(end ?? anchor, block);
			});

			// Update parent branch's s.start to include content inserted before anchor.
			// This ensures that when the parent branch is destroyed, the full DOM range
			// (including TSRXElement content) is removed.
			if (
				parent_branch !== null &&
				parent_branch.s !== null &&
				child_block.s !== null &&
				child_block.s.start !== null
			) {
				// The child inserted content before the anchor. Update parent's start
				// to encompass this content.
				var child_start = child_block.s.start;
				var parent_start = parent_branch.s.start;

				// If parent's start is the anchor (or comes after child's start),
				// update it to include the child's content
				if (parent_start === anchor || parent_start === end) {
					// Save original so we can restore it when switching to non-TSRXElement
					if (modified_parent_branch === null) {
						modified_parent_branch = parent_branch;
						original_parent_start = parent_start;
					}
					parent_branch.s.start = child_start;
				}
			}

			value = next_value;
			is_element = true;
			initialized = true;
			if (end !== null) {
				advance_hydration(end);
			}
			return;
		}

		var next_text = (next_value ?? '') + '';

		if (initialized && !is_element && value === next_text) {
			if (end !== null) {
				advance_hydration(end);
			}
			return;
		}

		if (child_block !== null) {
			destroy_block(child_block);
			child_block = null;
			// Restore parent branch's start to original value since the child's DOM nodes
			// have been removed and the old start reference would be stale
			if (modified_parent_branch !== null && modified_parent_branch.s !== null) {
				modified_parent_branch.s.start = original_parent_start;
				modified_parent_branch = null;
				original_parent_start = null;
			}
		}

		if (is_hydration_marker) {
			text = get_hydrated_text(anchor, /** @type {Comment} */ (end));

			if (next_text === '') {
				if (text !== null) {
					text.remove();
					text = null;
				}
			} else if (text === null) {
				text = create_text(next_text);
				/** @type {Comment} */ (end).before(text);
			} else if (text.nodeValue !== next_text) {
				text.nodeValue = next_text;
			}
		} else if (anchor.nodeType === COMMENT_NODE) {
			if (next_text === '') {
				if (text !== null) {
					text.remove();
					text = null;
				}
			} else if (text === null) {
				text = create_text(next_text);
				(end ?? anchor).before(text);
			} else if (text.nodeValue !== next_text) {
				text.nodeValue = next_text;
			}
		} else if (anchor.nodeType === TEXT_NODE) {
			/** @type {Text} */ (anchor).nodeValue = next_text;
		}

		value = next_text;
		is_element = false;
		initialized = true;
		if (end !== null) {
			advance_hydration(end);
		}
	});
}

/**
 * @param {Node} anchor
 * @returns {Comment}
 */
function ensure_expression_end(anchor) {
	if (hydrating) {
		/** @type {Node | null} */
		var current = get_next_sibling(anchor);
		var depth = 0;

		while (current !== null) {
			if (current.nodeType === COMMENT_NODE) {
				var data = /** @type {Comment} */ (current).data;

				if (data === HYDRATION_START) {
					depth += 1;
				} else if (data === HYDRATION_END) {
					if (depth === 0) {
						return /** @type {Comment} */ (current);
					}

					depth -= 1;
				}
			}

			current = get_next_sibling(current);
		}

		throw new Error('Hydration mismatch: expected end marker for expression block');
	}

	var end = document.createComment(HYDRATION_END);
	/** @type {ChildNode} */ (anchor).after(end);
	return end;
}

/**
 * @param {Node} anchor
 * @param {Node} end
 * @returns {Text | null}
 */
function get_hydrated_text(anchor, end) {
	var first = get_next_sibling(anchor);

	if (first === end) {
		return null;
	}

	if (first?.nodeType === TEXT_NODE && get_next_sibling(first) === end) {
		return /** @type {Text} */ (first);
	}

	clear_expression_range(anchor, end);
	return null;
}

/**
 * @param {Node} anchor
 * @param {Node} end
 * @returns {void}
 */
function clear_expression_range(anchor, end) {
	var current = get_next_sibling(anchor);

	while (current !== null && current !== end) {
		var next = get_next_sibling(current);
		/** @type {ChildNode} */ (current).remove();
		current = next;
	}
}

/**
 * @param {Comment} end
 * @returns {void}
 */
function advance_hydration(end) {
	if (!hydrating) {
		return;
	}

	var next = get_next_sibling(end);

	if (next !== null) {
		set_hydrate_node(next);
	}
}
