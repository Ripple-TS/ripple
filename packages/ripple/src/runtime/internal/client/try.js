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
	set_catch_router,
	with_block,
} from './runtime.js';

var installed = false;

/**
 * The runtime's catch routing: the nearest boundary above `block` with a
 * catch branch takes the error, or null leaves it to the caller.
 * @param {unknown} error
 * @param {Block} block
 * @returns {BlockWithTryBoundaryAndCatch | null}
 */
function route_error(error, block) {
	var boundary = get_boundary_with_catch(block);
	if (boundary !== null) {
		catch_error(boundary.s, error);
	}
	return boundary;
}

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
	state.z.clear();
}

/**
 * @param {TryState} state
 * @returns {boolean}
 */
function resume_paused_blocks(state) {
	if (state.z.size === 0) {
		return false;
	}

	var blocks = state.z;
	state.z = new Set();
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
	if (state.o !== null) {
		/** @type {ChildNode} */ (state.a).before(state.o);
		state.o = null;
	}

	state.h = true;
	state.m = 0;
}

/** @param {TryState} state */
export function render_resolved(state) {
	if (state.b !== null && !is_destroyed(state.b) && (state.rb === null || is_destroyed(state.rb))) {
		if (state.cb !== null) {
			destroy_block(state.cb);
			state.cb = null;
		}
		state.m = 0;
		if (active_block !== state.b) {
			with_block(state.b, () => {
				state.rb = boundary_branch(() => state.fn(state.a));
			});
		} else {
			state.rb = boundary_branch(() => state.fn(state.a));
		}
	}
}

/** @param {TryState} state */
function destroy_resolved(state) {
	if (state.rb !== null && !is_destroyed(state.rb)) {
		destroy_block(state.rb);
	}
	state.rb = null;
	state.o = null;
}

/** @param {TryState} state */
function move_resolved_offscreen(state) {
	if (state.rb !== null) {
		if (!state.o) {
			// if offcreen_fragment exists, it means the resolved_branch is already offscreen,
			// so we can skip moving it again
			state.o = document.createDocumentFragment();
			move_block(state.rb, state.o);
		}
	}
}

/** @param {TryState} state */
function render_pending(state) {
	if (state.p === null || state.m === 1) {
		return;
	}

	move_resolved_offscreen(state);

	state.m = 1;

	var create_pending = () => {
		state.pb = boundary_branch(() => {
			/** @type {TryPendingFunction} */ (state.p)(state.a);
		});
	};

	// with_block ensures the branch is parented under the TRY_BLOCK when called
	// from async contexts (microtasks) where active_block is null. During synchronous
	// execution (try_block not yet assigned), active_block is already the TRY_BLOCK.
	if (state.b !== null && !is_destroyed(state.b) && active_block !== state.b) {
		with_block(state.b, create_pending);
	} else {
		create_pending();
	}
}

/** @param {TryState} state */
export function destroy_pending(state) {
	if (state.pb !== null && !is_destroyed(state.pb)) {
		destroy_block(state.pb);
	}
	state.pb = null;
}

/**
 * Routes an error into a boundary: its catch branch renders in place of the
 * content, which is kept offscreen for `reset`.
 * @param {TryState} state
 * @param {any} error
 * @returns {void}
 */
export function catch_error(state, error) {
	if (state.m === 2) {
		// we don't want to do this again and render catch block again
		return;
	}
	state.n = 0;
	state.q.clear();
	clear_paused_blocks(state);

	// Reject all pending deferred promises so dependent async tracked settle
	// handlers fire and clean up. The settle will see the request already
	// cleared and skip error routing, avoiding double-catch.
	if (state.d.size > 0) {
		for (var [, reject_fn] of state.d) {
			reject_fn(error);
		}
		state.d.clear();
	}

	if (state.m === 1) {
		destroy_pending(state);
	} else if (state.m === 0) {
		move_resolved_offscreen(state);
	}

	state.m = 2;

	var create_catch = () => {
		state.cb = boundary_branch(() => {
			/** @type {TryCatchFunction} */ (state.c)(
				state.a,
				error,
				(state.r ??= () => render_resolved(state)),
			);
		});
	};

	// with_block ensures the branch is parented under the TRY_BLOCK when called
	// from async contexts where active_block is null. During synchronous
	// execution (try_block not yet assigned), active_block is already the TRY_BLOCK.
	if (state.b !== null && !is_destroyed(state.b) && active_block !== state.b) {
		with_block(state.b, create_catch);
	} else {
		create_catch();
	}

	destroy_resolved(state);
}

/** @param {TryState} state */
function begin_request(state) {
	var request_id = ++state.v;
	state.q.add(request_id);

	if (state.n++ === 0 && state.p !== null && !state.h) {
		queue_microtask(() => {
			if (state.b !== null && !is_destroyed(state.b) && state.n > 0 && !state.h) {
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
	state.q.delete(old_request_id);
	state.d.delete(old_request_id);
	// pending_count unchanged — one out, one in
	var request_id = ++state.v;
	state.q.add(request_id);
	return request_id;
}

/**
 * @param {TryState} state
 * @param {number} request_id
 * @param {boolean} [show_resolved_branch=true]
 * @returns {boolean}
 */
function complete_request(state, request_id, show_resolved_branch = true) {
	if (!state.q.delete(request_id)) {
		return false;
	}

	state.d.delete(request_id);

	state.n--;

	if (state.n === 0) {
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
			if (state.b === null || is_destroyed(state.b) || state.n > 0) {
				return;
			}

			if (state.m === 1) {
				destroy_pending(state);
				show_resolved_fragment(state);
			}

			state.h = true;
			state.m = 0;
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
	if (state.si !== null) {
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).f(state);
	} else {
		state.rb = boundary_branch(() => state.fn(state.a));
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
	if (!installed) {
		installed = true;
		set_catch_router(route_error);
	}
	/** @type {Node | undefined} */
	var boundary;
	/** @type {TryState} */
	var state = {
		a: root_controlled ? resolve_anchor(node) : /** @type {Node} */ (node),
		fn: try_fn,
		c: catch_fn,
		p: pending_fn,
		r: null,
		n: 0,
		v: 0,
		q: new Set(),
		b: null,
		rb: null,
		pb: null,
		cb: null,
		o: null,
		h: false,
		m: 0,
		d: new Map(),
		z: new Set(),
		si: null,
		se: false,
		sf: false,
		so: null,
		sc: null,
	};

	if (hydrating && (pending_fn !== null || catch_fn !== null)) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).m(state);
	}

	state.b = create_block(TRY_BLOCK, run_try, state);

	if (state.si !== null) {
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).s(state);
	}

	own_anchor(node, state.a);

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
		if ((current.f & TRY_BLOCK) !== 0 && state.p !== null) {
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
		boundary.s.d.set(request_id, reject_fn);
	}
}

/**
 * @param {BlockWithTryBoundary | null} boundary
 * @param {Block} block
 * @returns {void}
 */
export function register_boundary_paused_block(boundary, block) {
	if (boundary !== null && !is_destroyed(boundary)) {
		boundary.s.z.add(block);
	}
}
