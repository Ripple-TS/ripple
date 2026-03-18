/** @import { Block } from '#client' */

import {
	branch_with_self,
	create_try_block,
	destroy_block,
	is_destroyed,
	move_block,
	pause_block,
	resume_block,
} from './blocks.js';
import { TRY_BLOCK } from './constants.js';
import {
	hydrate_next,
	hydrate_node,
	hydrating,
	set_hydrate_node,
	set_hydrating,
	skip_to_hydration_end,
} from './hydration.js';
import { get_next_sibling } from './operations.js';
import { active_block, queue_microtask, with_block } from './runtime.js';

/**
 * @param {Node} node
 * @param {(anchor: Node, block?: Block) => void} fn
 * @param {((anchor: Node, error: any, block?: Block) => void) | null} catch_fn
 * @param {((anchor: Node, block?: Block) => void) | null} [pending_fn=null]
 * @returns {void}
 */
export function try_block(node, fn, catch_fn, pending_fn = null) {
	var anchor = node;
	/** @type {Block | null} */
	var current_block = null;
	var pending_count = 0;
	var request_version = 0;
	/** @type {Set<number>} */
	var active_requests = new Set();
	/** @type {Block | null} */
	var owner = null;
	/** @type {Block | null} */
	var suspended_block = null;
	/** @type {DocumentFragment | null} */
	var offscreen_fragment = null;
	var has_resolved = false;
	/** @type {'resolved' | 'pending' | 'catch'} */
	var mode = 'resolved';

	/**
	 * @param {(anchor: Node, block?: Block) => void} render_fn
	 */
	function replace_branch(render_fn) {
		var parent_block = owner ?? active_block;

		if (parent_block === null || is_destroyed(parent_block)) {
			return;
		}

		if (current_block !== null) {
			destroy_block(current_block);
			current_block = null;
		}

		with_block(parent_block, () => {
			current_block = branch_with_self((block) => {
				render_fn(anchor, block);
			});
		});
	}

	function render_resolved() {
		mode = 'resolved';
		has_resolved = true;
		replace_branch(fn);
	}

	function render_pending() {
		if (pending_fn === null) {
			return;
		}

		if (current_block !== null && suspended_block === null) {
			suspended_block = current_block;
			offscreen_fragment = document.createDocumentFragment();
			move_block(current_block, offscreen_fragment);
			pause_block(suspended_block);
		}

		var parent_block = owner ?? active_block;

		if (parent_block === null || is_destroyed(parent_block)) {
			return;
		}

		mode = 'pending';
		with_block(parent_block, () => {
			current_block = branch_with_self((block) => {
				/** @type {(anchor: Node, block?: Block) => void} */ (pending_fn)(anchor, block);
			});
		});
	}

	/**
	 * @param {any} error
	 * @returns {void}
	 */
	function handle_error(error) {
		pending_count = 0;
		active_requests.clear();

		if (suspended_block !== null) {
			destroy_block(suspended_block);
			suspended_block = null;
			offscreen_fragment = null;
		}

		mode = 'catch';
		replace_branch(() => {
			/** @type {(anchor: Node, error: any, block?: Block) => void} */ (catch_fn)(anchor, error);
		});
	}

	function begin_request() {
		var request_id = ++request_version;
		active_requests.add(request_id);

		if (pending_count++ === 0 && pending_fn !== null) {
			queue_microtask(() => {
				if (owner !== null && !is_destroyed(owner) && pending_count > 0 && mode !== 'pending') {
					render_pending();
				}
			});
		}

		return request_id;
	}

	/**
	 * @param {number} request_id
	 * @param {boolean} [render_resolved_branch=true]
	 * @returns {boolean}
	 */
	function complete_request(request_id, render_resolved_branch = true) {
		if (!active_requests.delete(request_id)) {
			return false;
		}

		pending_count--;

		if (pending_count === 0) {
			if (owner !== null && !is_destroyed(owner) && render_resolved_branch) {
				if (mode !== 'pending' && !has_resolved) {
					render_resolved();
					return true;
				}
			}

			if (owner !== null && !is_destroyed(owner) && pending_count === 0 && mode === 'pending') {
				has_resolved ||= render_resolved_branch;

				if (current_block !== null) {
					destroy_block(current_block);
					current_block = null;
				}

				if (suspended_block !== null) {
					if (render_resolved_branch && offscreen_fragment !== null) {
						/** @type {ChildNode} */ (anchor).before(offscreen_fragment);
						resume_block(suspended_block);
						current_block = suspended_block;
					} else if (!render_resolved_branch) {
						destroy_block(suspended_block);
					}

					offscreen_fragment = null;
					suspended_block = null;
					mode = render_resolved_branch ? 'resolved' : mode;
				} else if (render_resolved_branch) {
					render_resolved();
					mode = 'resolved';
				}
			}
		}

		return true;
	}

	var state = {
		a: pending_fn !== null,
		b: begin_request,
		r: complete_request,
		c: catch_fn !== null ? handle_error : null,
	};

	if (hydrating && pending_fn !== null) {
		// SSR emits <!--[-->_try <pending_html> <resolved_html> <!--]-->_try
		// Advance past the opening marker, discard SSR content, and recreate fresh
		// client-side DOM in non-hydrating mode.
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

		owner = create_try_block(() => {
			render_resolved();
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

	owner = create_try_block(() => {
		render_resolved();
	}, state);
}

/**
 * @param {Block | null} block
 * @returns {Block | null}
 */
export function get_pending_boundary(block) {
	var current = block;

	while (current !== null) {
		var state = current.s;
		if ((current.f & TRY_BLOCK) !== 0 && state.a !== null) {
			return current;
		}
		current = current.p;
	}

	return null;
}

/**
 * Still needed for tsx:react
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
 * @param {Block} boundary
 * @returns {number}
 */
export function begin_boundary_request(boundary) {
	return boundary.s.b();
}

/**
 * @param {Block | null} boundary
 * @param {number} request_id
 * @param {boolean} [render_resolved_branch=true]
 * @returns {boolean}
 */
export function complete_boundary_request(boundary, request_id, render_resolved_branch = true) {
	return boundary !== null && !is_destroyed(boundary)
		? boundary.s.r(request_id, render_resolved_branch)
		: false;
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
