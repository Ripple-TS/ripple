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
	var anchor = node;
	var html = '';
	/** @type {Node | null} */
	var hydration_start = null;
	/** @type {Node | null} */
	var hydration_last = null;

	// During hydration, skip the opening marker and process the hydration markers
	if (hydrating) {
		set_hydrate_node(anchor); // Start at the opening marker <!--[-->
		var hash_comment = hydrate_next(); // Move to hash comment

		// Walk to find the closing marker
		var next = hydrate_next(); // First content node or closing marker
		hydration_start = next;
		hydration_last = next;

		while (
			next !== null &&
			(next.nodeType !== COMMENT_NODE || /** @type {Comment} */ (next).data !== ']')
		) {
			hydration_last = next;
			next = get_next_sibling(next);
		}

		// Remove the hash comment
		if (hash_comment && hash_comment.parentNode) {
			hash_comment.parentNode.removeChild(hash_comment);
		}

		// Move past the closing marker
		hydrate_next();
	}

	render(() => {
		var block = /** @type {Block} */ (active_block);
		var new_html = get_html() + '';

		// If the HTML hasn't changed, skip the update
		if (html === new_html) {
			return;
		}

		html = new_html;

		if (svg) html = `<svg>${html}</svg>`;
		else if (mathml) html = `<math>${html}</math>`;

		if (block.s !== null && block.s.start !== null) {
			remove_block_dom(block.s.start, /** @type {Node} */ (block.s.end));
			block.s.start = block.s.end = null;
		}

		if (hydrating) {
			// During hydration, just assign the already-hydrated nodes
			if (html !== '' && hydration_start !== null && hydration_last !== null) {
				assign_nodes(hydration_start, hydration_last);
			}
			return;
		}

		if (html === '') return;

		var fragment = create_fragment_from_html(html);

		if (svg || mathml) {
			fragment = /** @type {DocumentFragment} */ (get_first_child(fragment));
		}

		assign_nodes(
			/** @type {Node} */ (get_first_child(fragment)),
			/** @type {Node} */ (fragment.lastChild),
		);

		if (svg || mathml) {
			while (get_first_child(fragment)) {
				anchor.before(/** @type {Node} */ (get_first_child(fragment)));
			}
		} else {
			anchor.before(fragment);
		}
	});
}
