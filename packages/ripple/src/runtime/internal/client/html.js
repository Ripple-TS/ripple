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

	render(() => {
		var block = /** @type {Block} */ (active_block);
		var new_html = get_html() + '';

		// If the HTML hasn't changed, skip the update (but still hydrate on first run)
		if (html === new_html) {
			// During hydration, we need to skip past the content and end marker even if value hasn't changed
			if (hydrating) {
				// The anchor is the hash comment - we need to skip past it and its content
				set_hydrate_node(anchor);
				var next = hydrate_next();

				// Walk until we find the empty comment end marker
				while (
					next !== null &&
					(next.nodeType !== COMMENT_NODE || /** @type {Comment} */ (next).data !== '')
				) {
					next = get_next_sibling(next);
				}

				// Move past the end marker (if next sibling exists)
				if (next !== null) {
					var next_node = get_next_sibling(next);
					if (next_node !== null) {
						set_hydrate_node(next_node);
					}
				}
			}
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
			set_hydrate_node(anchor);

			/** @type {Node | null} */
			var next = hydrate_next();

			// Walk through content nodes until we hit the empty comment end marker
			while (
				next !== null &&
				(next.nodeType !== COMMENT_NODE || /** @type {Comment} */ (next).data !== '')
			) {
				next = get_next_sibling(next);
			}

			if (next === null) {
				throw new Error('Hydration mismatch: expected end marker for HTML block');
			}

			// Include the hash comment and end marker in the assigned nodes
			// This follows Svelte's approach where these markers are part of the effect's managed DOM
			// They will be cleaned up when/if the content updates
			assign_nodes(anchor, next);

			// Move past the end marker for the next operation
			// For empty HTML or end of container, next sibling might be null - that's okay
			var next_node = get_next_sibling(next);
			if (next_node !== null) {
				set_hydrate_node(next_node);
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
