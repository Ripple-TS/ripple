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
import { H, hydrate_node, hydrating } from './hydration.js';
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
export function boundary_branch(fn) {
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
export function render_resolved(state) {
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
export function destroy_pending(state) {
	if (state.pending_branch !== null && !is_destroyed(state.pending_branch)) {
		destroy_block(state.pending_branch);
	}
	state.pending_branch = null;
}

/**
 * Routes an error into a boundary: its catch branch renders in place of the
 * content, which is kept offscreen for `reset`.
 * @param {TryState} state
 * @param {any} error
 * @returns {void}
 */
export function catch_error(state, error) {
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

/** @param {TryState} state */
function run_try(state) {
	if (state.streamed_id !== null) {
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).f(state);
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
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).m(state);
	}

	state.try_block = create_block(TRY_BLOCK, run_try, state);

	if (state.streamed_id !== null) {
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).s(state);
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
	catch_error(boundary.s, error);
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
