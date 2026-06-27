/** @import { Block } from '#client' */

import { branch, destroy_block, get_first_node, get_last_node, render } from './blocks.js';
import { SWITCH_BLOCK } from './constants.js';
import { hydrate_next, hydrate_node, hydrating } from './hydration.js';
import { next_sibling } from './operations.js';
import { append } from './template.js';

/**
 * Moves a block's DOM nodes to before an anchor node
 * @param {Block} block
 * @param {ChildNode} anchor
 * @returns {void}
 */
function move(block, anchor) {
	// Fast path: a normal case records its own range. Only an optimized single
	// control-flow / component root case (DOM rendered through a descendant
	// block, `s.start` null) needs the descent via `get_first_node`/`get_last_node`.
	var s = block.s;
	var node = s !== null ? s.start : null;
	var end;

	if (node === null) {
		node = get_first_node(block);
		if (node === null) {
			return;
		}
		end = get_last_node(block);
	} else {
		end = s.end;
	}
	/** @type {Node | null} */
	var sibling;

	while (node !== null) {
		if (node === end) {
			append(anchor, node);
			break;
		}
		sibling = next_sibling(node);
		append(anchor, node);
		node = sibling;
	}
}

/**
 * @param {ChildNode} anchor
 * @param {() => ((anchor: ChildNode) => void)[] | null} fn
 * @param {boolean} [root_controlled] When true the block renders before the
 *   component's `__anchor` (no `<!>` wrapper); during hydration the SSR boundary
 *   marker is handed to `append()` afterwards for the context-aware cursor
 *   advance the eliminated wrapper used to perform.
 * @returns {void}
 */
export function switch_block(anchor, fn, root_controlled) {
	/** @type {Node | undefined} */
	var boundary;

	if (hydrating) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}
		hydrate_next();
	}

	/** @type {((anchor: ChildNode) => void)[]} */
	var prev = [];
	/** @type {Map<(anchor: ChildNode) => void, Block>} */
	var blocks = new Map();

	render(
		() => {
			var funcs = fn();
			let same = prev.length === funcs?.length || false;

			for (var i = 0; i < prev.length; i++) {
				var p = prev[i];

				if (!funcs || funcs.indexOf(p) === -1) {
					same = false;
					destroy_block(/** @type {Block} */ (blocks.get(p)));
					blocks.delete(p);
				}
			}

			prev = funcs ?? [];

			if (same || !funcs) {
				return;
			}

			for (var i = 0; i < funcs.length; i++) {
				var n = funcs[i];
				var b = blocks.get(n);
				if (b) {
					move(b, anchor);
					continue;
				}

				blocks.set(
					n,
					branch(() => n(anchor)),
				);
			}
		},
		null,
		SWITCH_BLOCK,
	);

	if (hydrating && root_controlled) {
		append(anchor, /** @type {Node} */ (boundary));
	}
}
