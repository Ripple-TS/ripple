/** @import { AppendIntoAnchor, Block, TryState, TryCatchFunction, TryPendingFunction, BlockWithTryBoundary, BlockWithTryBoundaryAndCatch } from '#client' */

import {
	block as create_block,
	destroy_block,
	is_destroyed,
	move_block,
	own_anchor,
	resume_block,
} from './blocks.js';
import { BRANCH_BLOCK, DIRECT_CHILD_BLOCK, TRY_BLOCK } from './constants.js';
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
	set_hydration,
	skip_to_hydration_end,
} from './hydration.js';
import { resolve_anchor } from './operations.js';
import { append } from './template.js';
import {
	active_block,
	queue_microtask,
	queue_post_block_flush_callback,
	with_block,
} from './runtime.js';

/**
 * A boundary's branches run as direct children of its try block (see
 * `TryState` in types.d.ts for the state they share).
 * @param {() => void} fn
 * @returns {Block}
 */
function boundary_branch(fn) {
	return create_block(BRANCH_BLOCK | DIRECT_CHILD_BLOCK, fn);
}

/** @param {TryState} state */
function clear_paused_blocks(state) {
	state.paused_blocks.clear();
}

/**
 * @param {TryState} state
 * @returns {boolean}
 */
function resume_paused_blocks(state) {
	if (state.paused_blocks.size === 0) {
		return false;
	}

	var blocks = state.paused_blocks;
	state.paused_blocks = new Set();
	var resumed = false;

	for (var block of blocks) {
		if (!is_destroyed(block)) {
			resume_block(block);
			resumed = true;
		}
	}

	return resumed;
}

/** @param {TryState} state */
function show_resolved_fragment(state) {
	if (state.offscreen_fragment !== null) {
		/** @type {ChildNode} */ (state.anchor).before(state.offscreen_fragment);
		state.offscreen_fragment = null;
	}

	state.has_resolved = true;
	state.mode = 'resolved';
}

/** @param {TryState} state */
function render_resolved(state) {
	if (
		state.try_block !== null &&
		!is_destroyed(state.try_block) &&
		(state.resolved_branch === null || is_destroyed(state.resolved_branch))
	) {
		if (state.catch_branch !== null) {
			destroy_block(state.catch_branch);
			state.catch_branch = null;
		}
		state.mode = 'resolved';
		if (active_block !== state.try_block) {
			with_block(state.try_block, () => {
				state.resolved_branch = boundary_branch(() => state.try_fn(state.anchor));
			});
		} else {
			state.resolved_branch = boundary_branch(() => state.try_fn(state.anchor));
		}
	}
}

/** @param {TryState} state */
function destroy_resolved(state) {
	if (state.resolved_branch !== null && !is_destroyed(state.resolved_branch)) {
		destroy_block(state.resolved_branch);
	}
	state.resolved_branch = null;
	state.offscreen_fragment = null;
}

/** @param {TryState} state */
function move_resolved_offscreen(state) {
	if (state.resolved_branch !== null) {
		if (!state.offscreen_fragment) {
			// if offcreen_fragment exists, it means the resolved_branch is already offscreen,
			// so we can skip moving it again
			state.offscreen_fragment = document.createDocumentFragment();
			move_block(state.resolved_branch, state.offscreen_fragment);
		}
	}
}

/** @param {TryState} state */
function render_pending(state) {
	if (state.pending_fn === null || state.mode === 'pending') {
		return;
	}

	move_resolved_offscreen(state);

	state.mode = 'pending';

	var create_pending = () => {
		state.pending_branch = boundary_branch(() => {
			/** @type {TryPendingFunction} */ (state.pending_fn)(state.anchor);
		});
	};

	// with_block ensures the branch is parented under the TRY_BLOCK when called
	// from async contexts (microtasks) where active_block is null. During synchronous
	// execution (try_block not yet assigned), active_block is already the TRY_BLOCK.
	if (
		state.try_block !== null &&
		!is_destroyed(state.try_block) &&
		active_block !== state.try_block
	) {
		with_block(state.try_block, create_pending);
	} else {
		create_pending();
	}
}

/** @param {TryState} state */
function destroy_pending(state) {
	if (state.pending_branch !== null && !is_destroyed(state.pending_branch)) {
		destroy_block(state.pending_branch);
	}
	state.pending_branch = null;
}

/**
 * @param {TryState} state
 * @param {any} error
 * @returns {void}
 */
function handle_error(state, error) {
	if (state.mode === 'catch') {
		// we don't want to do this again and render catch block again
		return;
	}
	state.pending_count = 0;
	state.active_requests.clear();
	clear_paused_blocks(state);

	// Reject all pending deferred promises so dependent async tracked settle
	// handlers fire and clean up. The settle will see the request already
	// cleared and skip error routing, avoiding double-catch.
	if (state.pending_deferreds.size > 0) {
		for (var [, reject_fn] of state.pending_deferreds) {
			reject_fn(error);
		}
		state.pending_deferreds.clear();
	}

	if (state.mode === 'pending') {
		destroy_pending(state);
	} else if (state.mode === 'resolved') {
		move_resolved_offscreen(state);
	}

	state.mode = 'catch';

	var create_catch = () => {
		state.catch_branch = boundary_branch(() => {
			/** @type {TryCatchFunction} */ (state.catch_fn)(
				state.anchor,
				error,
				(state.reset ??= () => render_resolved(state)),
			);
		});
	};

	// with_block ensures the branch is parented under the TRY_BLOCK when called
	// from async contexts where active_block is null. During synchronous
	// execution (try_block not yet assigned), active_block is already the TRY_BLOCK.
	if (
		state.try_block !== null &&
		!is_destroyed(state.try_block) &&
		active_block !== state.try_block
	) {
		with_block(state.try_block, create_catch);
	} else {
		create_catch();
	}

	destroy_resolved(state);
}

/**
 * Retires the slot wrapper markers once the slot's fate is decided: the
 * open comment loses its marker data (it may still serve as the boundary
 * anchor, so it must stay in the DOM) and the close comment is dropped —
 * keeping `[`/`]` depth balanced for scans over surrounding slots.
 * @param {TryState} state
 * @returns {void}
 */
function neutralize_slot_markers(state) {
	/** @type {Comment} */ (state.slot_open).data = '';
	/** @type {ChildNode} */ (state.slot_close).remove();
}

/**
 * Reads the streamed unit error envelope for this slot and routes the
 * error into this boundary, or the nearest catch boundary above it.
 * @param {TryState} state
 * @param {string} id
 * @returns {void}
 */
function route_streamed_error(state, id) {
	if (state.try_block === null || is_destroyed(state.try_block)) {
		return;
	}
	neutralize_slot_markers(state);
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
	if (state.catch_fn !== null) {
		handle_error(state, error);
		return;
	}
	var outer = get_boundary_with_catch(/** @type {Block} */ (state.try_block));
	if (outer === null) {
		throw error;
	}
	handle_error(outer.s, error);
}

/**
 * Empties the streamed slot: destroys the hydrated fallback branch and
 * sweeps whatever remains between the wrapper comments (leftover marker
 * comments included).
 * @param {TryState} state
 * @returns {void}
 */
function clear_streamed_slot(state) {
	destroy_pending(state);
	var node = /** @type {ChildNode} */ (state.slot_open).nextSibling;
	while (node !== null && node !== state.slot_close) {
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
 * @param {TryState} state
 * @param {HTMLTemplateElement | null} template
 * @param {number | undefined} [errored]
 * @returns {void}
 */
function activate_streamed_chunk(state, template, errored) {
	if (state.try_block === null || is_destroyed(state.try_block)) {
		return;
	}
	var id = /** @type {string} */ (state.streamed_id);
	state.streamed_id = null;
	if (errored) {
		clear_streamed_slot(state);
		route_streamed_error(state, id);
		return;
	}
	clear_streamed_slot(state);
	if (template !== null) {
		/** @type {ChildNode} */ (state.slot_close).before(template.content);
	}
	var first = /** @type {ChildNode} */ (state.slot_open).nextSibling;
	if (first === null || first === state.slot_close) {
		neutralize_slot_markers(state);
		return;
	}
	// adopt the streamed body's own <!--[--> as the boundary anchor (the
	// node the buffered-SSR hydration path would have used) and drop the
	// slot wrapper comments, so the resulting DOM matches buffered SSR
	// exactly like the pre-hydration swap path does
	if (state.anchor === state.slot_open) {
		state.anchor = first;
	}
	/** @type {ChildNode} */ (state.slot_open).remove();
	/** @type {ChildNode} */ (state.slot_close).remove();
	var previous_hydrating = hydrating;
	var previous_hydrate_node = hydrate_node;
	set_hydration(true, first);
	hydrate_next(); // consume the streamed body's <!--[-->
	try {
		state.has_resolved = true;
		render_resolved(state);
	} finally {
		set_hydration(previous_hydrating, previous_hydrate_node);
	}
}

/** @param {TryState} state */
function begin_request(state) {
	var request_id = ++state.request_version;
	state.active_requests.add(request_id);

	if (state.pending_count++ === 0 && state.pending_fn !== null && !state.has_resolved) {
		queue_microtask(() => {
			if (
				state.try_block !== null &&
				!is_destroyed(state.try_block) &&
				state.pending_count > 0 &&
				!state.has_resolved
			) {
				render_pending(state);
			}
		});
	}

	return request_id;
}

/**
 * @param {TryState} state
 * @param {number} old_request_id
 * @returns {number}
 */
function replace_request(state, old_request_id) {
	state.active_requests.delete(old_request_id);
	state.pending_deferreds.delete(old_request_id);
	// pending_count unchanged — one out, one in
	var request_id = ++state.request_version;
	state.active_requests.add(request_id);
	return request_id;
}

/**
 * @param {TryState} state
 * @param {number} request_id
 * @param {boolean} [show_resolved_branch=true]
 * @returns {boolean}
 */
function complete_request(state, request_id, show_resolved_branch = true) {
	if (!state.active_requests.delete(request_id)) {
		return false;
	}

	state.pending_deferreds.delete(request_id);

	state.pending_count--;

	if (state.pending_count === 0) {
		if (!show_resolved_branch) {
			clear_paused_blocks(state);
			return true;
		}

		resume_paused_blocks(state);

		queue_post_block_flush_callback(() => {
			// run this only after the blocks have a chance to run
			// and find more pending requests (and pause themselves) before we are
			// certain to render the resolved state.
			// Otherwise, we'll have multiple renders.
			if (state.try_block === null || is_destroyed(state.try_block) || state.pending_count > 0) {
				return;
			}

			if (state.mode === 'pending') {
				destroy_pending(state);
				show_resolved_fragment(state);
			}

			state.has_resolved = true;
			state.mode = 'resolved';
		});
		// this is more just in case here and shouldn't really cause anything to run
		// most likely the scheduling is already there
		// leaving it here in case there are some weird edge cases
		queue_microtask();
	}

	return true;
}

/**
 * @param {TryState} state
 * @param {Comment} marker
 * @param {string} data
 */
function hydrate_streamed_slot(state, marker, data) {
	// live streamed slot
	state.streamed_id = data.slice(HYDRATION_START_PENDING.length);
	state.streamed_errored = data.startsWith(HYDRATION_START_ERRORED);
	state.slot_open = marker;
	hydrate_next(); // consume the slot wrapper open
	state.slot_close = /** @type {Comment} */ (skip_to_hydration_end());
	var fallback_start = /** @type {Comment} */ (hydrate_node);
	state.streamed_fallback =
		!state.streamed_errored &&
		state.pending_fn !== null &&
		fallback_start.nodeType === COMMENT_NODE &&
		fallback_start.data === HYDRATION_START;
	if (state.streamed_fallback) {
		hydrate_next(); // consume the fallback's <!--[-->
	}
}

/** @param {TryState} state */
function register_streamed_slot(state) {
	// continue the outer hydration walk after the slot
	set_hydrate_node(state.slot_close);

	var registry = (window.__RIPPLE_B__ ??= {});
	var unit_id = /** @type {string} */ (state.streamed_id);
	if (state.streamed_errored) {
		// the inline runtime already emptied the slot and marked it errored
		// — route the error once the surrounding hydration has finished
		queue_microtask(() => route_streamed_error(state, unit_id));
	} else {
		registry[unit_id] = {
			a: (template, errored) => activate_streamed_chunk(state, template, errored),
		};
	}
}

/** @param {TryState} state */
function hydrate_streamed_fallback(state) {
	// The body has not arrived yet; hydrate its fallback until activation.
	if (state.streamed_fallback) {
		state.mode = 'pending';
		state.pending_branch = boundary_branch(() => {
			/** @type {TryPendingFunction} */ (state.pending_fn)(state.anchor);
		});
	}
}

/** @param {TryState} state */
function run_try(state) {
	if (state.streamed_id !== null) {
		hydrate_streamed_fallback(state);
	} else {
		state.resolved_branch = boundary_branch(() => state.try_fn(state.anchor));
	}
}

/**
 * @param {Node | AppendIntoAnchor} node
 * @param {(anchor: Node, block?: Block) => void} try_fn
 * @param {TryCatchFunction | null} catch_fn
 * @param {TryPendingFunction | null} [pending_fn=null]
 * @param {boolean} [root_controlled=false] When true the block renders before
 *   the component's `__anchor`, which may be an append-into sentinel (see
 *   `resolve_anchor`).
 * @returns {void}
 */
export function try_block(node, try_fn, catch_fn, pending_fn = null, root_controlled = false) {
	/** @type {Node | undefined} */
	var boundary;
	/** @type {TryState} */
	var state = {
		anchor: root_controlled ? resolve_anchor(node) : /** @type {Node} */ (node),
		try_fn,
		catch_fn,
		pending_fn,
		reset: null,
		pending_count: 0,
		request_version: 0,
		active_requests: new Set(),
		try_block: null,
		resolved_branch: null,
		pending_branch: null,
		catch_branch: null,
		offscreen_fragment: null,
		has_resolved: false,
		mode: 'resolved',
		pending_deferreds: new Map(),
		paused_blocks: new Set(),
		streamed_id: null,
		streamed_errored: false,
		streamed_fallback: false,
		slot_open: null,
		slot_close: null,
	};

	if (hydrating && (pending_fn !== null || catch_fn !== null)) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}

		var marker = /** @type {Comment} */ (hydrate_node);
		var data = marker.nodeType === COMMENT_NODE ? marker.data : '';

		// A slot at this anchor belongs to this boundary, including the root.
		if (data.startsWith(HYDRATION_START_PENDING) || data.startsWith(HYDRATION_START_ERRORED)) {
			hydrate_streamed_slot(state, marker, data);
		} else {
			// Settled SSR content must not transition back to pending.
			if (pending_fn !== null) {
				state.has_resolved = true;
			}
			hydrate_next(); // consume <!--[-->
		}
	}

	state.try_block = create_block(TRY_BLOCK, run_try, state);

	if (state.streamed_id !== null) {
		register_streamed_slot(state);
	}

	own_anchor(node, state.anchor);

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
		if ((current.f & TRY_BLOCK) !== 0 && state.pending_fn !== null) {
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
		if ((current.f & TRY_BLOCK) !== 0 && state.catch_fn !== null) {
			return /** @type {BlockWithTryBoundaryAndCatch} */ (current);
		}
		current = current.p;
	}

	return null;
}

/**
 * Routes an error into a boundary's catch branch.
 * @param {BlockWithTryBoundaryAndCatch} boundary
 * @param {any} error
 * @returns {void}
 */
export function handle_boundary_error(boundary, error) {
	handle_error(boundary.s, error);
}

/**
 * @param {BlockWithTryBoundary} boundary
 * @returns {number}
 */
export function begin_boundary_request(boundary) {
	return begin_request(boundary.s);
}

/**
 * @param {BlockWithTryBoundary} boundary
 * @param {number} old_request_id
 * @returns {number}
 */
export function replace_boundary_request(boundary, old_request_id) {
	return replace_request(boundary.s, old_request_id);
}

/**
 * @param {BlockWithTryBoundary | null} boundary
 * @param {number} request_id
 * @param {boolean} [show_resolved_branch=true]
 * @returns {boolean}
 */
export function complete_boundary_request(boundary, request_id, show_resolved_branch = true) {
	return boundary !== null && !is_destroyed(boundary)
		? complete_request(boundary.s, request_id, show_resolved_branch)
		: false;
}

/**
 * @param {BlockWithTryBoundary | null} boundary
 * @param {number} request_id
 * @param {(reason: any) => void} reject_fn
 * @returns {void}
 */
export function register_boundary_deferred(boundary, request_id, reject_fn) {
	if (boundary !== null && !is_destroyed(boundary)) {
		boundary.s.pending_deferreds.set(request_id, reject_fn);
	}
}

/**
 * @param {BlockWithTryBoundary | null} boundary
 * @param {Block} block
 * @returns {void}
 */
export function register_boundary_paused_block(boundary, block) {
	if (boundary !== null && !is_destroyed(boundary)) {
		boundary.s.paused_blocks.add(block);
	}
}
