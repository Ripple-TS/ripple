/** @import { AppendIntoAnchor, Block } from '#client' */

import { is_array } from '@tsrx/core/runtime/language-helpers';
import { branch, destroy_block, render } from './blocks.js';
import { BRANCH_BLOCK, IF_BLOCK, UNINITIALIZED } from './constants.js';
import { create_text, get_next_sibling } from './operations.js';
import { assign_nodes } from './template.js';
import { active_block } from './runtime.js';
import { hydrate_node, hydrating, set_hydrate_node } from './hydration.js';
import { COMMENT_NODE, HYDRATION_END, HYDRATION_START, TEXT_NODE } from '../../../constants.js';
import { is_tsrx_element, TSRX_ELEMENT } from '../../element.js';

/**
 * Finds the nearest enclosing block that owns a DOM range (a branch or an if
 * block) in the block hierarchy.
 * @param {Block | null} block
 * @returns {Block | null}
 */
function find_enclosing_branch(block) {
	while (block !== null) {
		if ((block.f & (BRANCH_BLOCK | IF_BLOCK)) !== 0) {
			return block;
		}
		block = block.p;
	}
	return null;
}

/**
 * @param {any} value
 * @param {ChildNode} anchor
 * @param {Block | null} block
 * @returns {void}
 */
export function render_value(value, anchor, block) {
	// render_tsrx_element, inline: an element's render may return another
	// element (a wrapper), an array, or text.
	var rendered = false;
	// is_tsrx_element, inline: every component render passes through here.
	while (value != null && value[TSRX_ELEMENT] === true) {
		value = value.render(anchor, block, value.p);
		rendered = true;
	}
	if (is_array(value)) {
		render_tsrx_collection(value, anchor, block);
	} else if (value != null) {
		var text = value + '';
		if (rendered || text !== '') {
			render_tsrx_collection_text(text, anchor, true);
		}
	}
}

/**
 * @param {any[]} value
 * @param {ChildNode} anchor
 * @param {Block | null} block
 * @returns {void}
 */
function render_tsrx_collection(value, anchor, block) {
	if (hydrating) {
		assign_nodes(/** @type {Node} */ (hydrate_node ?? anchor), anchor);
		render_tsrx_collection_items(value, anchor, block);
		return;
	}

	var start = document.createComment('');
	var end = document.createComment('');

	insert_before(anchor, start);
	insert_before(anchor, end);
	assign_nodes(start, end);
	render_tsrx_collection_items(value, end, block);
}

/**
 * Inserts `node` before `anchor`, or appends it into the parent when `anchor`
 * is an append-into sentinel (see `append_into`).
 * @param {ChildNode | AppendIntoAnchor} anchor
 * @param {Node} node
 * @returns {void}
 */
function insert_before(anchor, node) {
	if (/** @type {AppendIntoAnchor} */ (anchor).into === true) {
		/** @type {AppendIntoAnchor} */ (anchor).parent.appendChild(node);
	} else {
		/** @type {ChildNode} */ (anchor).before(node);
	}
}

/**
 * @param {any[]} value
 * @param {ChildNode} anchor
 * @param {Block | null} block
 * @returns {void}
 */
function render_tsrx_collection_items(value, anchor, block) {
	for (var i = 0; i < value.length; i++) {
		var item = value[i];

		if (is_tsrx_element(item)) {
			render_tsrx_element(item, anchor, block);
		} else if (is_array(item)) {
			render_tsrx_collection_items(item, anchor, block);
		} else if (item != null) {
			render_tsrx_collection_text(item + '', anchor);
		}
	}
}

/**
 * @param {import('../../element.js').TSRXElement} value
 * @param {ChildNode} anchor
 * @param {Block | null} block
 * @returns {void}
 */
function render_tsrx_element(value, anchor, block) {
	var result = value.render(anchor, block, value.p);

	if (is_tsrx_element(result)) {
		render_tsrx_element(result, anchor, block);
	} else if (is_array(result)) {
		render_tsrx_collection(result, anchor, block);
	} else if (result != null) {
		render_tsrx_collection_text(result + '', anchor, true);
	}
}

/**
 * @param {string} value
 * @param {ChildNode} anchor
 * @param {boolean} [assign=false]
 * @returns {void}
 */
function render_tsrx_collection_text(value, anchor, assign = false) {
	if (!hydrating) {
		var text = create_text(value);
		insert_before(anchor, text);
		if (assign) {
			assign_nodes(text, text);
		}
		return;
	}

	var node = hydrate_node;

	if (node?.nodeType === COMMENT_NODE && /** @type {Comment} */ (node).data === HYDRATION_START) {
		node = get_next_sibling(node);
	}

	if (node?.nodeType === TEXT_NODE) {
		var current_value = /** @type {Text} */ (node).nodeValue ?? '';

		if (current_value !== value) {
			/** @type {Text} */ (node).nodeValue = value;

			if (current_value.startsWith(value)) {
				var remaining = current_value.slice(value.length);

				if (remaining !== '') {
					var remaining_text = create_text(remaining);
					/** @type {ChildNode} */ (node).after(remaining_text);
					if (assign) {
						assign_nodes(node, node);
					}
					set_hydrate_node(remaining_text);
					return;
				}
			}
		}

		if (assign) {
			assign_nodes(node, node);
		}
		set_hydrate_node(get_next_sibling(node) ?? anchor);
		return;
	}

	var new_text = create_text(value);

	if (node !== null && node !== anchor) {
		/** @type {ChildNode} */ (node).before(new_text);
	} else {
		anchor.before(new_text);
	}

	if (assign) {
		assign_nodes(new_text, new_text);
	}
	set_hydrate_node(node ?? anchor);
}

/**
 * @typedef {{
 *   start: Node | null;
 *   end: Node | null;
 *   a: ChildNode;
 *   n: number;
 *   g: () => any;
 *   b: Block | null;
 *   m: Comment | null;
 *   t: Text | null;
 *   v: string | import('../../element.js').TSRXElement | typeof UNINITIALIZED;
 *   e: boolean;
 *   i: boolean;
 *   p: Block | null;
 *   o: Node | null;
 * }} ExpressionState
 */

/**
 * @param {Node} node
 * @param {() => any} get_value
 * @returns {void}
 */
export function expression(node, get_value) {
	// State lives on the render block instead of a per-expression closure, and
	// the anchor's node type is read once since the anchor never changes.
	render(run_expression, {
		start: null,
		end: null,
		a: /** @type {ChildNode} */ (node),
		n: node.nodeType,
		g: get_value,
		// child block rendering a TSRX element / collection
		b: null,
		// hydration end marker
		m: null,
		// text node inserted before a comment anchor
		t: null,
		// last rendered value
		v: UNINITIALIZED,
		// whether the last value was an element / collection
		e: false,
		// whether the block has rendered once
		i: false,
		// enclosing branch whose start was moved to include element content
		p: null,
		// that branch's original start node
		o: null,
	});
}

/**
 * @param {ExpressionState} s
 * @returns {void}
 */
function run_expression(s) {
	var next_value = s.g();
	var anchor = s.a;
	var type = typeof next_value;
	var is_hydration_marker =
		hydrating && s.n === COMMENT_NODE && /** @type {Comment} */ (anchor).data === HYDRATION_START;

	if (is_hydration_marker) {
		s.m ??= ensure_expression_end(anchor);
	}

	var end = s.m;

	if (next_value !== null && (type === 'object' || type === 'function')) {
		var next_is_collection = is_array(next_value);

		if (next_is_collection || is_tsrx_element(next_value)) {
			if (s.i && s.e && s.v === next_value) {
				if (end !== null) {
					settle_hydration(end);
				}
				return;
			}

			if (s.n === TEXT_NODE) {
				/** @type {Text} */ (anchor).nodeValue = '';
			} else if (s.t !== null) {
				s.t.remove();
				s.t = null;
			}

			if (s.b !== null) {
				destroy_block(s.b);
				s.b = null;
				restore_parent_start(s);
			}

			if (end !== null && (s.i || !hydrating)) {
				clear_expression_range(anchor, end);
			}

			if (is_hydration_marker) {
				set_hydrate_node(get_next_sibling(anchor) ?? end);
			}

			// Find the enclosing branch block BEFORE creating the child block
			// so we can update its s.start to include content inserted before anchor
			var parent_branch = find_enclosing_branch(active_block);

			var child_block = (s.b = branch(() => {
				var block = /** @type {Block} */ (active_block);
				if (next_is_collection) {
					render_tsrx_collection(next_value, end ?? anchor, block);
				} else {
					render_tsrx_element(next_value, end ?? anchor, block);
				}
			}));

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
					if (s.p === null) {
						s.p = parent_branch;
						s.o = parent_start;
					}
					parent_branch.s.start = child_start;
				}
			}

			s.v = next_value;
			s.e = true;
			s.i = true;
			if (end !== null) {
				settle_hydration(end);
			}
			return;
		}
	}

	var next_text = next_value == null ? '' : next_value + '';

	if (s.i && !s.e && s.v === next_text) {
		if (end !== null) {
			settle_hydration(end);
		}
		return;
	}

	if (s.b !== null) {
		destroy_block(s.b);
		s.b = null;
		// Restore parent branch's start to original value since the child's DOM nodes
		// have been removed and the old start reference would be stale
		restore_parent_start(s);
	}

	if (is_hydration_marker) {
		var text = (s.t = get_hydrated_text(anchor, /** @type {Comment} */ (end)));

		if (next_text === '') {
			if (text !== null) {
				text.remove();
				s.t = null;
			}
		} else if (text === null) {
			text = s.t = create_text(next_text);
			/** @type {Comment} */ (end).before(text);
		} else if (text.nodeValue !== next_text) {
			text.nodeValue = next_text;
		}
	} else if (s.n === COMMENT_NODE) {
		var text = s.t;
		if (next_text === '') {
			if (text !== null) {
				text.remove();
				s.t = null;
			}
		} else if (text === null) {
			text = s.t = create_text(next_text);
			(end ?? anchor).before(text);
		} else if (text.nodeValue !== next_text) {
			text.nodeValue = next_text;
		}
	} else if (s.n === TEXT_NODE) {
		/** @type {Text} */ (anchor).nodeValue = next_text;
	}

	s.v = next_text;
	s.e = false;
	s.i = true;
	if (end !== null) {
		settle_hydration(end);
	}
}

/**
 * @param {ExpressionState} s
 * @returns {void}
 */
function restore_parent_start(s) {
	var parent = s.p;
	if (parent !== null && parent.s !== null) {
		parent.s.start = s.o;
		s.p = null;
		s.o = null;
	}
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
 * Leaves the hydration cursor on the expression's end marker, the last node
 * the expression owns: the parent steps past it with its own sibling
 * navigation, exactly as it does after an element or a control-flow block.
 * @param {Comment} end
 * @returns {void}
 */
function settle_hydration(end) {
	if (hydrating) {
		set_hydrate_node(end);
	}
}
