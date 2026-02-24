/** @import { Block } from '#client' */

import { branch, create_try_block, destroy_block, is_destroyed, resume_block } from './blocks.js';
import { TRY_BLOCK } from './constants.js';
import {
	hydrate_next,
	hydrate_node,
	hydrating,
	set_hydrate_node,
	set_hydrating,
	skip_to_hydration_end,
} from './hydration.js';
import { get_next_sibling, next_sibling } from './operations.js';
import {
	active_block,
	active_component,
	active_reaction,
	queue_microtask,
	set_active_block,
	set_active_component,
	set_active_reaction,
	set_tracking,
	tracking,
} from './runtime.js';

/**
 * @param {Node} node
 * @param {(anchor: Node) => void} fn
 * @param {((anchor: Node, error: any) => void) | null} catch_fn
 * @param {((anchor: Node) => void) | null} [pending_fn=null]
 * @returns {void}
 */
export function try_block(node, fn, catch_fn, pending_fn = null) {
	var anchor = node;
	/** @type {Block | null} */
	var b = null;
	/** @type {Block | null} */
	var suspended = null;
	var pending_count = 0;
	/** @type {DocumentFragment | null} */
	var offscreen_fragment = null;

	/**
	 * @param {Block} block
	 * @param {DocumentFragment} fragment
	 * @returns {void}
	 */
	function move_block(block, fragment) {
		var state = block.s;
		if (state === null) return;
		var node = state.start;
		var end = state.end;

		while (node !== null) {
			var next = node === end ? null : next_sibling(node);

			fragment.append(node);
			node = next;
		}
	}

	function handle_await() {
		if (pending_count++ === 0) {
			queue_microtask(() => {
				if (b !== null && suspended === null) {
					suspended = b;
					offscreen_fragment = document.createDocumentFragment();
					move_block(b, offscreen_fragment);

					b = branch(() => {
						/** @type {(anchor: Node) => void} */ (pending_fn)(anchor);
					});
				}
			});
		}

		return () => {
			if (--pending_count === 0) {
				if (b !== null) {
					destroy_block(b);
				}
				/** @type {ChildNode} */ (anchor).before(
					/** @type {DocumentFragment} */ (offscreen_fragment),
				);
				offscreen_fragment = null;
				resume_block(/** @type {Block} */ (suspended));
				b = suspended;
				suspended = null;
			}
		};
	}

	/**
	 * @param {any} error
	 * @returns {void}
	 */
	function handle_error(error) {
		if (suspended !== null) {
			destroy_block(suspended);
			suspended = null;
			offscreen_fragment = null;
			pending_count = 0;
		}

		if (b !== null) {
			destroy_block(b);
		}

		b = branch(() => {
			/** @type {(anchor: Node, error: any) => void} */ (catch_fn)(anchor, error);
		});
	}

	var state = {
		a: pending_fn !== null ? handle_await : null,
		c: catch_fn !== null ? handle_error : null,
	};

	if (hydrating && pending_fn !== null) {
		// SSR emits <!--[-->_try <pending_html> <resolved_html> <!--]-->_try
		// Advance past the opening marker, discard SSR content, and recreate fresh
		// client-side DOM in non-hydrating mode.  The `_$_.async` wrapper in blocks.js
		// adds an extra `await Promise.resolve()` before calling unsuspend(), which
		// ensures the pending UI created by handle_await's microtask is observable for
		// at least one event-loop tick before the resolved content replaces it.
		hydrate_next(); // consume <!--[-->_try
		var end = skip_to_hydration_end(); // find matching <!--]-->_try
		// Remove SSR pending+resolved nodes that sit between the two markers
		var n = hydrate_node;
		while (n !== null && n !== end) {
			var next_n = get_next_sibling(n);
			if (n.parentNode) n.parentNode.removeChild(n);
			n = next_n;
		}
		set_hydrate_node(end); // position cursor at <!--]-->_try
		set_hydrating(false);

		// Save a reference to the nearest ancestor branch-block so we can update its
		// DOM-range tracking (s.start) to cover the fresh client-side nodes we are
		// about to insert.  Without this, destroy_block on the parent would try to
		// remove the already-removed SSR node and miss the new content entirely.
		var hydration_parent = active_block;
		// Remember what was before anchor so we can find the first new node afterward.
		var prev_sibling_before = anchor.previousSibling;

		create_try_block(() => {
			b = branch(() => {
				fn(anchor);
			});
		}, state);

		// fn(anchor) inserted new DOM immediately before `anchor`.
		// Find the first of those newly inserted nodes and update the parent block's
		// s.start so that destroy_block can later remove both the hydration markers
		// (<!--[-->/<!--]-->) and the fresh content in one range sweep.
		var new_first =
			prev_sibling_before !== null
				? get_next_sibling(prev_sibling_before)
				: anchor.parentNode
					? anchor.parentNode.firstChild
					: null;
		if (
			new_first !== null &&
			new_first !== anchor &&
			hydration_parent !== null &&
			hydration_parent.s !== null
		) {
			hydration_parent.s.start = new_first;
		}

		set_hydrating(true);
		return;
	}

	create_try_block(() => {
		b = branch(() => {
			fn(anchor);
		});
	}, state);
}

/**
 * @returns {() => void}
 */
export function suspend() {
	var current = active_block;

	while (current !== null) {
		var state = current.s;
		if ((current.f & TRY_BLOCK) !== 0 && state.a !== null) {
			return state.a();
		}
		current = current.p;
	}

	throw new Error('Missing parent `try { ... } pending { ... }` statement');
}

/**
 * @returns {void}
 */
function exit() {
	set_tracking(false);
	set_active_reaction(null);
	set_active_block(null);
	set_active_component(null);
}

/**
 * @returns {() => void}
 */
export function capture() {
	var previous_tracking = tracking;
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_component = active_component;

	return () => {
		set_tracking(previous_tracking);
		set_active_block(previous_block);
		set_active_reaction(previous_reaction);
		set_active_component(previous_component);

		queue_microtask(exit);
	};
}

/**
 * @returns {boolean}
 */
export function aborted() {
	if (active_block === null) {
		return true;
	}
	return is_destroyed(active_block);
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @returns {Promise<() => T>}
 */
export async function resume_context(promise) {
	var restore = capture();
	var value = await promise;

	return () => {
		restore();
		return value;
	};
}
