/** @import { Block } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { IF_BLOCK, UNINITIALIZED } from './constants.js';
import { hydrate_next, hydrate_node, hydrating } from './hydration.js';
import { append } from './template.js';

/**
 * @param {Node} node
 * @param {(set_branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void} fn
 * @param {boolean} [root_controlled] When true the block renders directly before
 *   the component's `__anchor` (no synthesized `<!>` wrapper). During hydration
 *   the SSR boundary start marker sits at the cursor; we hand it to `append()`
 *   afterwards so it performs the same context-aware boundary advance the
 *   eliminated wrapper's `append()` used to do.
 * @returns {void}
 */
export function if_block(node, fn, root_controlled) {
	/** @type {Node | undefined} */
	var boundary;

	if (hydrating) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}
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

	if (hydrating && root_controlled) {
		append(/** @type {ChildNode} */ (anchor), /** @type {Node} */ (boundary));
	}
}
