/** @import { Block, TryBoundaryState, BlockWithTryBoundary, BlockWithTryBoundaryAndCatch } from '#client' */

import {
	boundary_fn_running_block,
	create_try_block,
	destroy_block,
	is_destroyed,
	move_block,
	resume_block,
} from './blocks.js';
import { TRY_BLOCK } from './constants.js';
import {
	COMMENT_NODE,
	HYDRATION_START,
	HYDRATION_START_PENDING,
	HYDRATION_START_ERRORED,
	STREAM_ERROR_SCRIPT_PREFIX,
} from '../../../constants.js';
import {
	hydrate_next,
	hydrate_node,
	hydrating,
	set_hydrate_node,
	set_hydrating,
	skip_to_hydration_end,
} from './hydration.js';
import { append } from './template.js';
import {
	active_block,
	queue_microtask,
	queue_post_block_flush_callback,
	with_block,
} from './runtime.js';

/**
	@typedef {(
		anchor: Node,
		error: any,
		reset?: () => void
	) => void} CatchFunction;

	@typedef {(anchor: Node) => void} PendingFunction
 */

/**
 * @param {Node} node
 * @param {(anchor: Node, block?: Block) => void} try_fn
 * @param {CatchFunction | null} catch_fn
 * @param {PendingFunction | null} [pending_fn=null]
 * @returns {void}
 */
export function try_block(node, try_fn, catch_fn, pending_fn = null, root_controlled = false) {
	var anchor = node;
	/** @type {Node | undefined} */
	var boundary;
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
	/** @type {Set<Block>} */
	var paused_blocks = new Set();
	/** @type {string | null} */
	var streamed_id = null;
	var streamed_errored = false;
	var streamed_fallback = false;
	/** @type {Comment | null} */
	var slot_open = null;
	/** @type {Comment | null} */
	var slot_close = null;

	function clear_paused_blocks() {
		paused_blocks.clear();
	}

	/**
	 * @returns {boolean}
	 */
	function resume_paused_blocks() {
		if (paused_blocks.size === 0) {
			return false;
		}

		var blocks = paused_blocks;
		paused_blocks = new Set();
		var resumed = false;

		for (var block of blocks) {
			if (!is_destroyed(block)) {
				resume_block(block);
				resumed = true;
			}
		}

		return resumed;
	}

	function show_resolved_fragment() {
		if (offscreen_fragment !== null) {
			/** @type {ChildNode} */ (anchor).before(offscreen_fragment);
			offscreen_fragment = null;
		}

		has_resolved = true;
		mode = 'resolved';
	}

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
					resolved_branch = boundary_fn_running_block(() => try_fn(anchor));
				});
			} else {
				resolved_branch = boundary_fn_running_block(() => try_fn(anchor));
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
			pending_branch = boundary_fn_running_block(() => {
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
		if (mode === 'catch') {
			// we don't want to do this again and render catch block again
			return;
		}
		pending_count = 0;
		active_requests.clear();
		clear_paused_blocks();

		// Reject all pending deferred promises so dependent async tracked settle
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
			catch_branch = boundary_fn_running_block(() => {
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

	/**
	 * Retires the slot wrapper markers once the slot's fate is decided: the
	 * open comment loses its marker data (it may still serve as the boundary
	 * anchor, so it must stay in the DOM) and the close comment is dropped —
	 * keeping `[`/`]` depth balanced for scans over surrounding slots.
	 * @returns {void}
	 */
	function neutralize_slot_markers() {
		/** @type {Comment} */ (slot_open).data = '';
		/** @type {ChildNode} */ (slot_close).remove();
	}

	/**
	 * Reads the streamed unit error envelope for this slot and routes the
	 * error into this boundary, or the nearest catch boundary above it.
	 * @param {string} id
	 * @returns {void}
	 */
	function route_streamed_error(id) {
		if (try_block === null || is_destroyed(try_block)) {
			return;
		}
		neutralize_slot_markers();
		var message = 'An error occurred during server rendering';
		var script = document.getElementById(STREAM_ERROR_SCRIPT_PREFIX + id);
		if (script !== null) {
			try {
				message = JSON.parse(/** @type {string} */ (script.textContent)).message ?? message;
			} catch {
				// keep the generic message
			}
			script.remove();
		}
		var error = new Error(message);
		if (catch_fn !== null) {
			handle_error(error);
			return;
		}
		var outer = get_boundary_with_catch(/** @type {Block} */ (try_block));
		if (outer === null) {
			throw error;
		}
		outer.s.c(error);
	}

	/**
	 * Empties the streamed slot: destroys the hydrated fallback branch and
	 * sweeps whatever remains between the wrapper comments (leftover marker
	 * comments included).
	 * @returns {void}
	 */
	function clear_streamed_slot() {
		destroy_pending();
		var node = /** @type {ChildNode} */ (slot_open).nextSibling;
		while (node !== null && node !== slot_close) {
			var next = node.nextSibling;
			/** @type {ChildNode} */ (node).remove();
			node = next;
		}
	}

	/**
	 * Called by the inline stream runtime when this slot's chunk arrives after
	 * hydration: swaps the fallback for the streamed content and claims the
	 * new DOM through a boundary-scoped hydration walk (trackAsync inside the
	 * body picks its serialized envelope up from the same chunk).
	 * @param {HTMLTemplateElement | null} template
	 * @param {number | undefined} [errored]
	 * @returns {void}
	 */
	function activate_streamed_chunk(template, errored) {
		if (try_block === null || is_destroyed(try_block)) {
			return;
		}
		var id = /** @type {string} */ (streamed_id);
		streamed_id = null;
		if (errored) {
			clear_streamed_slot();
			route_streamed_error(id);
			return;
		}
		clear_streamed_slot();
		if (template !== null) {
			/** @type {ChildNode} */ (slot_close).before(template.content);
		}
		var first = /** @type {ChildNode} */ (slot_open).nextSibling;
		if (first === null || first === slot_close) {
			neutralize_slot_markers();
			return;
		}
		// adopt the streamed body's own <!--[--> as the boundary anchor (the
		// node the buffered-SSR hydration path would have used) and drop the
		// slot wrapper comments, so the resulting DOM matches buffered SSR
		// exactly like the pre-hydration swap path does
		if (anchor === slot_open) {
			anchor = first;
		}
		/** @type {ChildNode} */ (slot_open).remove();
		/** @type {ChildNode} */ (slot_close).remove();
		var previous_hydrating = hydrating;
		var previous_hydrate_node = hydrate_node;
		set_hydrating(true);
		set_hydrate_node(first);
		hydrate_next(); // consume the streamed body's <!--[-->
		try {
			has_resolved = true;
			render_resolved();
		} finally {
			set_hydrating(previous_hydrating);
			set_hydrate_node(previous_hydrate_node, true);
		}
	}

	function begin_request() {
		var request_id = ++request_version;
		active_requests.add(request_id);

		if (pending_count++ === 0 && pending_fn !== null && !has_resolved) {
			queue_microtask(() => {
				if (try_block !== null && !is_destroyed(try_block) && pending_count > 0 && !has_resolved) {
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
			if (!show_resolved_branch) {
				clear_paused_blocks();
				return true;
			}

			resume_paused_blocks();

			queue_post_block_flush_callback(() => {
				// run this only after the blocks have a chance to run
				// and find more pending requests (and pause themselves) before we are
				// certain to render the resolved state.
				// Otherwise, we'll have multiple renders.
				if (try_block === null || is_destroyed(try_block) || pending_count > 0) {
					return;
				}

				if (mode === 'pending') {
					destroy_pending();
					show_resolved_fragment();
				}

				has_resolved = true;
				mode = 'resolved';
			});
			// this is more just in case here and shouldn't really cause anything to run
			// most likely the scheduling is already there
			// leaving it here in case there are some weird edge cases
			queue_microtask();
		}

		return true;
	}

	/** @type {TryBoundaryState} */
	var state = {
		p: pending_fn !== null,
		b: begin_request,
		r: complete_request,
		c: catch_fn !== null ? handle_error : null,
		/** @param {number} request_id @param {(reason: any) => void} reject_fn */
		rd: (request_id, reject_fn) => {
			pending_deferreds.set(request_id, reject_fn);
		},
		/** @param {Block} block */
		pb: (block) => {
			paused_blocks.add(block);
		},
		rp: replace_request,
	};

	if (hydrating && (pending_fn !== null || catch_fn !== null)) {
		// Server wraps a settled try body with <!--[-->...<!--]--> markers when
		// pending or catch is present, and the boundary hydrates as resolved.
		// Streaming SSR instead emits a slot wrapper around the fallback:
		// <!--[?N--> while unit N's content is still on its way, or
		// <!--[!N--> when the unit errored after its region was already sent.
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}

		var marker = /** @type {Comment} */ (hydrate_node);
		var data = marker.nodeType === COMMENT_NODE ? marker.data : '';

		// a slot marker at the boundary's own anchor always belongs to this
		// boundary — the root boundary included: when the root suspends, the
		// server emits its slot as the whole body, so the marker doubles as
		// the hydration anchor
		if (data.startsWith(HYDRATION_START_PENDING) || data.startsWith(HYDRATION_START_ERRORED)) {
			// live streamed slot
			streamed_id = data.slice(HYDRATION_START_PENDING.length);
			streamed_errored = data.startsWith(HYDRATION_START_ERRORED);
			slot_open = marker;
			hydrate_next(); // consume the slot wrapper open
			slot_close = /** @type {Comment} */ (skip_to_hydration_end());
			var fallback_start = /** @type {Comment} */ (hydrate_node);
			streamed_fallback =
				!streamed_errored &&
				pending_fn !== null &&
				fallback_start.nodeType === COMMENT_NODE &&
				fallback_start.data === HYDRATION_START;
			if (streamed_fallback) {
				hydrate_next(); // consume the fallback's <!--[-->
			}
		} else {
			// settled content: mark as already resolved so begin_request's
			// microtask won't transition to pending
			if (pending_fn !== null) {
				has_resolved = true;
			}
			hydrate_next(); // consume <!--[-->
		}
	}

	try_block = create_try_block(() => {
		if (streamed_id !== null) {
			// the streamed body hasn't arrived yet — hydrate the fallback (if
			// any) as the pending branch and wait for the chunk to activate us
			if (streamed_fallback) {
				mode = 'pending';
				pending_branch = boundary_fn_running_block(() => {
					/** @type {PendingFunction} */ (pending_fn)(anchor);
				});
			}
			return;
		}
		resolved_branch = boundary_fn_running_block(() => try_fn(anchor));
	}, state);

	if (streamed_id !== null) {
		// continue the outer hydration walk after the slot
		set_hydrate_node(slot_close);

		var registry = (window.__RIPPLE_B__ ??= {});
		var unit_id = streamed_id;
		if (streamed_errored) {
			// the inline runtime already emptied the slot and marked it errored
			// — route the error once the surrounding hydration has finished
			queue_microtask(() => route_streamed_error(unit_id));
		} else {
			registry[unit_id] = { a: activate_streamed_chunk };
		}
	}

	if (hydrating && root_controlled) {
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}

/**
 * @param {Block | null} block
 * @returns {BlockWithTryBoundary | null}
 */
export function get_pending_boundary(block) {
	var current = block;

	while (current !== null) {
		var state = /** @type {BlockWithTryBoundary} */ (current).s;
		if ((current.f & TRY_BLOCK) !== 0 && state.p) {
			return /** @type {BlockWithTryBoundary} */ (current);
		}
		current = current.p;
	}

	return null;
}

/**
 * @param {Block} block
 * @returns {BlockWithTryBoundaryAndCatch | null}
 */
export function get_boundary_with_catch(block) {
	/** @type {Block | null} */
	var current = block;

	while (current !== null) {
		var state = /** @type {BlockWithTryBoundary} */ (current).s;
		if ((current.f & TRY_BLOCK) !== 0 && state.c !== null) {
			return /** @type {BlockWithTryBoundaryAndCatch} */ (current);
		}
		current = current.p;
	}

	return null;
}

/**
 * @param {BlockWithTryBoundary} boundary
 * @returns {number}
 */
export function begin_boundary_request(boundary) {
	return boundary.s.b();
}

/**
 * @param {BlockWithTryBoundary} boundary
 * @param {number} old_request_id
 * @returns {number}
 */
export function replace_boundary_request(boundary, old_request_id) {
	return boundary.s.rp(old_request_id);
}

/**
 * @param {BlockWithTryBoundary | null} boundary
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
 * @param {BlockWithTryBoundary | null} boundary
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
 * @param {BlockWithTryBoundary | null} boundary
 * @param {Block} block
 * @returns {void}
 */
export function register_boundary_paused_block(boundary, block) {
	if (boundary !== null && !is_destroyed(boundary) && boundary.s?.pb) {
		boundary.s.pb(block);
	}
}
