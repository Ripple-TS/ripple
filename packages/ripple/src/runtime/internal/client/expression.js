/** @import { Block } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { UNINITIALIZED } from './constants.js';
import { create_text, get_next_sibling } from './operations.js';
import { active_block } from './runtime.js';
import { hydrating, set_hydrate_node } from './hydration.js';
import { COMMENT_NODE, HYDRATION_END, HYDRATION_START, TEXT_NODE } from '../../../constants.js';
import { is_ripple_element } from '../../element.js';

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
	/** @type {string | import('../../element.js').RippleElement | typeof UNINITIALIZED} */
	var value = UNINITIALIZED;
	var is_element = false;
	var initialized = false;

	render(() => {
		var next_value = get_value();
		var next_is_element = is_ripple_element(next_value);
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
			}

			if (end !== null && (initialized || !hydrating)) {
				clear_expression_range(anchor, end);
			}

			if (is_hydration_marker) {
				set_hydrate_node(get_next_sibling(anchor) ?? end);
			}

			child_block = branch(() => {
				var block = active_block;
				next_value.render(end ?? anchor, {}, block);
			});

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
