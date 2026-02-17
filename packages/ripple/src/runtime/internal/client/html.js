/** @import { Block } from '#client' */

import { remove_block_dom, render } from './blocks.js';
import { get_first_child, get_next_sibling } from './operations.js';
import { active_block } from './runtime.js';
import { assign_nodes, create_fragment_from_html } from './template.js';
import { hydrate_next, hydrate_node, hydrating, set_hydrate_node } from './hydration.js';
import { COMMENT_NODE } from '../../../constants.js';

/**
 * Renders dynamic HTML content into the DOM by inserting it before the anchor node.
 * Manages the lifecycle of HTML blocks, removing old content and inserting new content.
 * @param {ChildNode} node
 * @param {() => string} get_html
 * @returns {void}
 */
export function html(node, get_html, svg = false, mathml = false) {
	/** @type {ChildNode} */
	var anchor = node;
	/** @type {string} */
	var html = '';

	render(() => {
		var block = /** @type {Block} */ (active_block);
		var new_html = get_html() + '';

		// If the HTML hasn't changed, just skip to next node during hydration
		if (html === new_html) {
			if (hydrating) hydrate_next();
			return;
		}

		html = new_html;

		if (svg) html = `<svg>${html}</svg>`;
		else if (mathml) html = `<math>${html}</math>`;

		if (block.s !== null && block.s.start !== null) {
			remove_block_dom(block.s.start, /** @type {Node} */ (block.s.end));
			block.s.start = block.s.end = null;
		}

		if (html === '') return;

		if (hydrating) {
			// During hydration, we skip the hash comment and claim the existing nodes
			// The hash comment is: <!--hash_value-->
			var hash_comment = /** @type {Comment} */ (hydrate_node);

			// Skip past the hash comment to the actual content
			/** @type {Node | null} */
			var next = hydrate_next();
			var last = next;

			// Walk through all nodes until we hit the closing marker (<!--]-->)
			while (
				next !== null &&
				(next.nodeType !== COMMENT_NODE || /** @type {Comment} */ (next).data !== ']')
			) {
				last = next;
				next = get_next_sibling(next);
			}

			if (next === null) {
				throw new Error('Hydration mismatch: expected closing marker for HTML block');
			}

			// Assign the nodes between hash comment and closing marker
			if (last !== null) {
				assign_nodes(hydrate_node, last);
			}

			// Set the hydration pointer to the closing marker
			anchor = set_hydrate_node(next);
			return;
		}

		/** @type {DocumentFragment | Element} */
		var node = create_fragment_from_html(html);

		if (svg || mathml) {
			node = /** @type {Element} */ (get_first_child(node));
		}

		assign_nodes(
			/** @type {Element} */ (get_first_child(node)),
			/** @type {Element} */ (node.lastChild),
		);

		if (svg || mathml) {
			while (get_first_child(node)) {
				anchor.before(/** @type {Element} */ (get_first_child(node)));
			}
		} else {
			anchor.before(node);
		}
	});
}
