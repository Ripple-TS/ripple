/** @import { Block } from '#client' */

import { branch, destroy_block, remove_block_dom, render } from './blocks.js';
import { UNINITIALIZED } from './constants.js';
import { handle_root_events } from './events.js';
import { create_text } from './operations.js';
import { active_block } from './runtime.js';
import {
	hydrating,
	hydrate_next,
	hydrate_node,
	set_hydrating,
	set_hydrate_node,
} from './hydration.js';

/**
 * @param {any} _
 * @param {{ target: Element, children: (anchor: Node, props: {}, block: Block) => void }} props
 * @returns {void}
 */
export function Portal(_, props) {
	// Portals are client-only and don't participate in hydration
	// The compiler-generated code already handles getting the node via sibling()
	var was_hydrating = hydrating;
	var previous_hydrate_node = hydrate_node;

	/** @type {Element | symbol} */
	let target = UNINITIALIZED;
	/** @type {((anchor: Node, props: {}, block: Block) => void) | symbol} */
	let children = UNINITIALIZED;
	/** @type {Block | null} */
	var b = null;
	/** @type {Text | null} */
	var anchor = null;
	/** @type {Node | null} */
	var dom_start = null;
	/** @type {Node | null} */
	var dom_end = null;

	// Temporarily disable hydration for portal content
	if (was_hydrating) {
		set_hydrating(false);
	}

	try {
		render(() => {
			if (target === (target = props.target)) return;
			if (children === (children = props.children)) return;

			if (b !== null) {
				destroy_block(b);
			}

			if (anchor !== null) {
				anchor.remove();
			}

			dom_start = dom_end = null;

			anchor = create_text();
			/** @type {Element} */ (target).append(anchor);

			const cleanup_events = handle_root_events(/** @type {Element} */ (target));

			var block = /** @type {Block} */ (active_block);

			b = branch(() => {
				if (typeof children === 'function') {
					children(/** @type {Text} */ (anchor), {}, block);
				}
			});

			dom_start = b?.s?.start;
			dom_end = b?.s?.end;

			return () => {
				cleanup_events();
				/** @type {Text} */ (anchor).remove();
				if (dom_start && dom_end) {
					remove_block_dom(dom_start, dom_end);
				}
			};
		});
	} finally {
		// Restore hydration state
		if (was_hydrating) {
			set_hydrating(true);
			set_hydrate_node(/** @type {any} */ (previous_hydrate_node));
		}
	}
}
