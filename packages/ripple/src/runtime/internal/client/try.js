/** @import { Block } from '#client' */

import { branch, create_try_block, destroy_block, is_destroyed, move_block } from './blocks.js';
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
	@typedef {(
		anchor: Node,
		error: any,
		reset?: () => void
	) => void} CatchFunction

	@typedef {(anchor: Node) => void} PendingFunction
 */

/**
 * @param {Node} node
 * @param {(anchor: Node, block?: Block) => void} fn
 * @param {CatchFunction | null} catch_fn
 * @param {PendingFunction | null} [pending_fn=null]
 * @returns {void}
 */
export function try_block(node, fn, catch_fn, pending_fn = null) {
	var anchor = node;
	var pending_count = 0;
	var request_version = 0;
	/** @type {Set<number>} */
	var active_requests = new Set();
	/** @type {Block | null} */
	var try_block = null;
	/** @type {Block | null} */
	var resolved_branch = null;
	/** @type {Block | null} */
	var pending_branch = null;
	/** @type {Block | null} */
	var catch_branch = null;
	/** @type {DocumentFragment | null} */
	var offscreen_fragment = null;
	var has_resolved = false;
	/** @type {'resolved' | 'pending' | 'catch'} */
	var mode = 'resolved';
	/** @type {Map<number, (reason: any) => void>} */
	var pending_deferreds = new Map();

	function render_resolved() {
		if (
			try_block !== null &&
			!is_destroyed(try_block) &&
			(resolved_branch === null || is_destroyed(resolved_branch))
		) {
			if (catch_branch !== null) {
				destroy_block(catch_branch);
				catch_branch = null;
			}
			mode = 'resolved';
			if (active_block !== try_block) {
				with_block(try_block, () => {
					resolved_branch = branch(() => fn(anchor));
				});
			} else {
				resolved_branch = branch(() => fn(anchor));
			}
		}
	}

	function destroy_resolved() {
		if (resolved_branch !== null && !is_destroyed(resolved_branch)) {
			destroy_block(resolved_branch);
		}
		resolved_branch = null;
		offscreen_fragment = null;
	}

	function move_resolved_offscreen() {
		if (resolved_branch !== null) {
			if (!offscreen_fragment) {
				// if offcreen_fragment exists, it means the resolved_branch is already offscreen,
				// so we can skip moving it again
				offscreen_fragment = document.createDocumentFragment();
				move_block(resolved_branch, offscreen_fragment);
			}
		}
	}

	function render_pending() {
		if (pending_fn === null || mode === 'pending') {
			return;
		}

		move_resolved_offscreen();

		mode = 'pending';

		var create_pending = () => {
			pending_branch = branch(() => {
				/** @type {PendingFunction} */ (pending_fn)(anchor);
			});
		};

		// with_block ensures the branch is parented under the TRY_BLOCK when called
		// from async contexts (microtasks) where active_block is null. During synchronous
		// execution (try_block not yet assigned), active_block is already the TRY_BLOCK.
		if (try_block !== null && !is_destroyed(try_block) && active_block !== try_block) {
			with_block(try_block, create_pending);
		} else {
			create_pending();
		}
	}

	function destroy_pending() {
		if (pending_branch !== null && !is_destroyed(pending_branch)) {
			destroy_block(pending_branch);
		}
		pending_branch = null;
	}

	/**
	 * @param {any} error
	 * @returns {void}
	 */
	function handle_error(error) {
		pending_count = 0;
		active_requests.clear();

		// Reject all pending deferred promises so dependent deriveds' settle
		// handlers fire and clean up. The settle will see the request already
		// cleared and skip error routing, avoiding double-catch.
		if (pending_deferreds.size > 0) {
			for (var [, reject_fn] of pending_deferreds) {
				reject_fn(error);
			}
			pending_deferreds.clear();
		}

		if (mode === 'pending') {
			destroy_pending();
		} else if (mode === 'resolved') {
			move_resolved_offscreen();
		}

		mode = 'catch';

		var create_catch = () => {
			catch_branch = branch(() => {
				/** @type {CatchFunction} */ (catch_fn)(anchor, error, render_resolved);
			});
		};

		// with_block ensures the branch is parented under the TRY_BLOCK when called
		// from async contexts where active_block is null. During synchronous
		// execution (try_block not yet assigned), active_block is already the TRY_BLOCK.
		if (try_block !== null && !is_destroyed(try_block) && active_block !== try_block) {
			with_block(try_block, create_catch);
		} else {
			create_catch();
		}

		destroy_resolved();
	}

	function begin_request() {
		var request_id = ++request_version;
		active_requests.add(request_id);

		if (pending_count++ === 0 && pending_fn !== null) {
			queue_microtask(() => {
				if (
					try_block !== null &&
					!is_destroyed(try_block) &&
					pending_count > 0 &&
					mode !== 'pending'
				) {
					render_pending();
				}
			});
		}

		return request_id;
	}

	/**
	 * @param {number} old_request_id
	 * @returns {number}
	 */
	function replace_request(old_request_id) {
		active_requests.delete(old_request_id);
		pending_deferreds.delete(old_request_id);
		// pending_count unchanged — one out, one in
		var request_id = ++request_version;
		active_requests.add(request_id);
		return request_id;
	}

	/**
	 * @param {number} request_id
	 * @param {boolean} [show_resolved_branch=true]
	 * @returns {boolean}
	 */
	function complete_request(request_id, show_resolved_branch = true) {
		if (!active_requests.delete(request_id)) {
			return false;
		}

		pending_deferreds.delete(request_id);

		pending_count--;

		if (pending_count === 0) {
			// Async resolved before pending microtask fired
			if (mode !== 'pending') {
				has_resolved = true;
				return true;
			}

			// Transitioning from pending back
			if (try_block !== null && !is_destroyed(try_block)) {
				destroy_pending();

				if (show_resolved_branch) {
					// Move resolved DOM back
					if (offscreen_fragment !== null) {
						/** @type {ChildNode} */ (anchor).before(offscreen_fragment);
						offscreen_fragment = null;
					}

					has_resolved = true;
					mode = 'resolved';
				} else {
					// Rejection path — keep resolved content offscreen for handle_error
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
		/** @param {number} request_id @param {(reason: any) => void} reject_fn */
		rd: (request_id, reject_fn) => {
			pending_deferreds.set(request_id, reject_fn);
		},
		rp: replace_request,
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

		try_block = create_try_block(() => {
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

	try_block = create_try_block(() => {
		resolved_branch = branch(() => fn(anchor));
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
		if ((current.f & TRY_BLOCK) !== 0 && state.a) {
			return current;
		}
		current = current.p;
	}

	return null;
}

/**
 * @param {Block} block
 * @returns {Block | null}
 */
export function get_boundary_with_catch(block) {
	/** @type {Block | null} */
	var current = block;

	while (current !== null) {
		if ((current.f & TRY_BLOCK) !== 0 && current.s.c !== null) {
			return current;
		}
		current = current.p;
	}

	return null;
}

/**
 * @param {Block} boundary
 * @returns {number}
 */
export function begin_boundary_request(boundary) {
	return boundary.s.b();
}

/**
 * @param {Block} boundary
 * @param {number} old_request_id
 * @returns {number}
 */
export function replace_boundary_request(boundary, old_request_id) {
	return boundary.s.rp(old_request_id);
}

/**
 * @param {Block | null} boundary
 * @param {number} request_id
 * @param {boolean} [show_resolved_branch=true]
 * @returns {boolean}
 */
export function complete_boundary_request(boundary, request_id, show_resolved_branch = true) {
	return boundary !== null && !is_destroyed(boundary)
		? boundary.s.r(request_id, show_resolved_branch)
		: false;
}

/**
 * @param {Block | null} boundary
 * @param {number} request_id
 * @param {(reason: any) => void} reject_fn
 * @returns {void}
 */
export function register_boundary_deferred(boundary, request_id, reject_fn) {
	if (boundary !== null && !is_destroyed(boundary) && boundary.s?.rd) {
		boundary.s.rd(request_id, reject_fn);
	}
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
