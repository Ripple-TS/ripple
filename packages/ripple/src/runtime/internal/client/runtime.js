/** @import { Block, Component, Dependency, Derived, Tracked, BlockWithTryBoundaryAndCatch, DeferredTrackedEntry } from '#client' */
/** @import { NAMESPACE_URI } from './constants.js' */

import { DEV } from 'esm-env';
import {
	destroy_block,
	destroy_non_branch_children,
	effect,
	pause_block,
	pre_effect,
} from './blocks.js';
import {
	ASYNC_DERIVED_READ_THROWN,
	BLOCK_HAS_RUN,
	BRANCH_BLOCK,
	DERIVED,
	COMPUTED_PROPERTY,
	CONTAINS_TEARDOWN,
	CONTAINS_UPDATE,
	DESTROYED,
	EFFECT_BLOCK,
	PAUSED,
	PRE_EFFECT_BLOCK,
	ROOT_BLOCK,
	TRACKED,
	UNINITIALIZED,
	REF_PROP,
	TRACKED_OBJECT,
	DEFAULT_NAMESPACE,
	DERIVED_UPDATED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	TRY_BLOCK,
	DIRECT_CHILD_BLOCK,
} from './constants.js';
import {
	begin_boundary_request,
	complete_boundary_request,
	get_boundary_with_catch,
	get_pending_boundary,
	register_boundary_deferred,
	register_boundary_paused_block,
	replace_boundary_request,
} from './try.js';
import {
	define_property,
	get_descriptor,
	get_own_property_symbols,
	is_array,
	is_ripple_object,
	object_keys,
} from './utils.js';
import { get_async_track_result } from '../../../utils/async.js';

const FLUSH_MICROTASK = 0;
const FLUSH_SYNC = 1;

/** @type {null | Block} */
export let active_block = null;
/** @type {null | Block | Derived} */
export let active_reaction = null;
/** @type {null | Block} */
export let active_scope = null;
/** @type {null | Component} */
export let active_component = null;
/** @type {keyof typeof NAMESPACE_URI} */
export let active_namespace = DEFAULT_NAMESPACE;
/** @type {boolean} */
export let is_mutating_allowed = true;

/** @type {Map<Tracked | Derived, any>} */
var old_values = new Map();

// Used for controlling the flush of blocks
/** @type {number} */
let scheduler_mode = FLUSH_MICROTASK;
// Used for handling scheduling
/** @type {boolean} */
let is_micro_task_queued = false;
/** @type {number} */
let clock = 0;
/** @type {Block[]} */
let queued_root_blocks = [];
/** @type {(() => void)[]} */
let queued_microtasks = [];
/** @type {number} */
let flush_count = 0;
/** @type {(() => void)[]} */
var queued_post_block_flush = [];
/** @type {null | Dependency} */
let active_dependency = null;

export let tracking = false;
export let teardown = false;

/**
 * @returns {number}
 */
function increment_clock() {
	return ++clock;
}

/**
 * @param {Block | null} block
 */
export function set_active_block(block) {
	active_block = block;
}

/**
 * @param {Block | Derived | null} reaction
 */
export function set_active_reaction(reaction) {
	active_reaction = reaction;
}

/**
 * @param {Component | null} component
 */
export function set_active_component(component) {
	active_component = component;
}

/**
 * @param {boolean} value
 */
export function set_tracking(value) {
	tracking = value;
}

/**
 * @param {Block} block
 */
export function run_teardown(block) {
	var fn = block.t;
	if (fn !== null) {
		var previous_block = active_block;
		var previous_reaction = active_reaction;
		var previous_tracking = tracking;
		var previous_teardown = teardown;

		try {
			active_block = null;
			active_reaction = null;
			tracking = false;
			teardown = true;
			fn.call(null);
		} finally {
			active_block = previous_block;
			active_reaction = previous_reaction;
			tracking = previous_tracking;
			teardown = previous_teardown;
		}
	}
}

/**
 * @param {Block} block
 * @param {() => any} fn
 */
export function with_block(block, fn) {
	var prev_block = active_block;
	var previous_component = active_component;
	active_block = block;
	active_component = block.co;
	try {
		return fn();
	} finally {
		active_component = previous_component;
		active_block = prev_block;
	}
}

/**
 * @param {Derived} computed
 */
function update_derived(computed) {
	var value = computed.__v;

	if (value === UNINITIALIZED || is_tracking_dirty(computed.d)) {
		value = run_derived(computed);

		if (value !== computed.__v) {
			computed.__v = value;
			computed.c = increment_clock();
		}
	}
}

/**
 * @param {Tracked} tracked
 * @param {any} value
 */
function update_tracked_value_clock(tracked, value) {
	tracked.__v = value;
	tracked.c = increment_clock();
}

/**
 * @param {Derived} computed
 */
function destroy_computed_children(computed) {
	var blocks = computed.blocks;

	if (blocks !== null) {
		computed.blocks = null;
		for (var i = 0; i < blocks.length; i++) {
			destroy_block(blocks[i]);
		}
	}
}

/**
 * @param {Derived} computed
 */
function run_derived(computed) {
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;
	var previous_is_mutating_allowed = is_mutating_allowed;

	try {
		active_block = computed.b;
		active_reaction = computed;
		tracking = true;
		active_dependency = null;
		active_component = computed.co;
		is_mutating_allowed = false;

		destroy_computed_children(computed);

		var value = computed.fn();

		computed.d = active_dependency;

		return value;
	} catch (error) {
		computed.d = active_dependency;
		if (error === ASYNC_DERIVED_READ_THROWN) {
			// Check if any dependency is rejected — if so, propagate rejection
			var dep = active_dependency;
			while (dep !== null) {
				if (dep.t.__v === SUSPENSE_REJECTED) {
					return SUSPENSE_REJECTED;
				}
				dep = dep.n;
			}
			return SUSPENSE_PENDING;
		}
		throw error;
	} finally {
		active_block = previous_block;
		active_reaction = previous_reaction;
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		active_component = previous_component;
		is_mutating_allowed = previous_is_mutating_allowed;
	}
}

/**
 * @param {unknown} error
 * @param {Block} block
 * @returns {BlockWithTryBoundaryAndCatch}
 */
export function handle_error(error, block) {
	var boundary_with_catch = get_boundary_with_catch(block);
	if (boundary_with_catch !== null) {
		boundary_with_catch.s.c(error);
		return boundary_with_catch;
	}

	throw error;
}

/**
 * @param {Block} block
 */
export function run_block(block) {
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;

	try {
		active_block = block;
		active_reaction = block;
		active_component = block.co;

		destroy_non_branch_children(block);
		run_teardown(block);

		tracking = (block.f & (ROOT_BLOCK | BRANCH_BLOCK)) === 0;
		active_dependency = null;
		var res = block.fn(block.s);

		if (typeof res === 'function') {
			block.t = res;
			/** @type {Block | null} */
			let current = block;

			while (current !== null && (current.f & CONTAINS_TEARDOWN) === 0) {
				current.f ^= CONTAINS_TEARDOWN;
				current = current.p;
			}
		}

		block.d = active_dependency;
	} catch (error) {
		var is_component_direct = false;
		var is_try_fn_block = false;
		block.d = active_dependency;
		// When a derived read throws ASYNC_DERIVED_READ_THROWN, it means the
		// derived is still SUSPENSE_PENDING. The dependency was already registered,
		// so we swallow the throw and let the parent continue processing. When
		// the derived settles, the block will be dirty and rerun automatically.
		if (error !== ASYNC_DERIVED_READ_THROWN) {
			handle_error(error, block);
		} else if (
			// pending async tracked was read outside allowed blocks
			(is_component_direct = active_component?.b === block) ||
			(is_try_fn_block =
				block.p !== null && (block.p.f & TRY_BLOCK) !== 0 && (block.f & DIRECT_CHILD_BLOCK) !== 0)
		) {
			throw new Error(
				`Reads on pending tracked values directly inside ${is_component_direct ? 'component' : 'try/pending/catch'} body are prohibited. Use trackPending() test or peek() for safe access or create another derived instead.`,
			);
		} else {
			// pending async tracked was read and threw ASYNC_DERIVED_READ_THROWN
			var boundary = get_pending_boundary(block);
			if (boundary !== null) {
				pause_block(block);
				register_boundary_paused_block(boundary, block);

				// Register deferred boundary completions for async tracked deps.
				// This handles the case where a child boundary reads a tracked value
				// whose resolution is managed by a different (parent) boundary.
				var dep = block.d;
				while (dep !== null) {
					var dep_tracked = /** @type {Tracked} */ (dep.t);
					if (
						(dep_tracked.__v === SUSPENSE_PENDING || dep_tracked.__v === SUSPENSE_REJECTED) &&
						(dep_tracked.f & TRACKED) !== 0
					) {
						var deferred_req = begin_boundary_request(boundary);
						var entry = /** @type {DeferredTrackedEntry} */ ({ b: boundary, r: deferred_req });
						if (dep_tracked.d === null) {
							dep_tracked.d = [entry];
						} else {
							dep_tracked.d.push(entry);
						}
					}
					dep = dep.n;
				}
			}
		}
	} finally {
		active_block = previous_block;
		active_reaction = previous_reaction;
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		active_component = previous_component;
	}
}

var empty_get_set = { get: undefined, set: undefined };

/**
 * Complete all deferred boundary requests registered on a tracked value.
 * @param {Tracked} t
 * @param {boolean} [show_resolved=true]
 */
function complete_deferred_boundaries(t, show_resolved = true) {
	if (t.d !== null) {
		for (var i = 0; i < t.d.length; i++) {
			var entry = t.d[i];
			complete_boundary_request(entry.b, entry.r, show_resolved);
		}
		t.d = null;
	}
}

/** @type {Tracked} */
class TrackedValue {
	/**
	 * @param {any} v
	 * @param {Block} block
	 * @param {{ get?: Function; set?: Function }} a
	 */
	constructor(v, block, a) {
		this.a = a;
		this.b = block;
		this.c = 0;
		this.d = null;
		this.f = TRACKED;
		this.__v = v;
	}
	get [0]() {
		return get_tracked(this);
	}
	set [0](v) {
		set(this, v);
	}
	get [1]() {
		return this;
	}
	get value() {
		return get_tracked(this);
	}
	/** @param {any} v */
	set value(v) {
		set(this, v);
	}
	/** @returns {2} */
	get length() {
		return 2;
	}
	*[Symbol.iterator]() {
		yield get_tracked(this);
		yield this;
	}
}

/** @type {Derived} */
class DerivedValue {
	/**
	 * @param {Function} fn
	 * @param {Block} block
	 * @param {{ get?: Function; set?: Function }} a
	 */
	constructor(fn, block, a) {
		this.a = a;
		this.b = block;
		/** @type {null | Block[]} */
		this.blocks = null;
		this.c = 0;
		this.co = active_component;
		/** @type {null | Dependency} */
		this.d = null;
		this.f = DERIVED;
		this.fn = fn;
		this.__v = UNINITIALIZED;
	}
	get [0]() {
		return get_derived(this);
	}
	set [0](v) {
		set(this, v);
	}
	get [1]() {
		return this;
	}
	get value() {
		return get_derived(this);
	}
	/** @param {any} v */
	set value(v) {
		set(this, v);
	}
	/** @returns {2} */
	get length() {
		return 2;
	}
	*[Symbol.iterator]() {
		yield get_derived(this);
		yield this;
	}
}

if (DEV) {
	define_property(TrackedValue.prototype, 'DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY', { value: true });
	define_property(DerivedValue.prototype, 'DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY', { value: true });
}

/**
 *
 * @param {any} v
 * @param {Block} block
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked}
 */
export function tracked(v, block, get, set) {
	return /** @type {Tracked} */ (
		new TrackedValue(v, block || active_block, get || set ? { get, set } : empty_get_set)
	);
}

/**
 * @param {any} fn
 * @param {any} block
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Derived}
 */
export function derived(fn, block, get, set) {
	return /** @type {Derived} */ (
		new DerivedValue(fn, block || active_block, get || set ? { get, set } : empty_get_set)
	);
}

/**
 * @param {any} v
 * @param {(value: any) => any | undefined} get
 * @param {(next: any, prev: any) => any | undefined} set
 * @param {Block} b
 * @returns {Tracked | Derived}
 */
export function track(v, get, set, b) {
	if (is_ripple_object(v)) {
		return v;
	}
	if (b === null) {
		throw new TypeError('track() requires a valid component context');
	}

	if (typeof v === 'function') {
		return derived(v, b, get, set);
	}
	return tracked(v, b, get, set);
}

/**
 * @param {any} fn
 * @param {Block} b
 * @returns {Tracked | void}
 */
export function track_async(fn, b) {
	if (is_ripple_object(fn)) {
		return fn;
	}

	var target_block = b || active_block;
	if (target_block === null) {
		throw new TypeError('trackAsync() requires a valid component context');
	}

	if (typeof fn !== 'function') {
		throw new TypeError(
			'trackAsync() only accepts function arguments that return a promise or an object with a promise property',
		);
	}

	var t = tracked(SUSPENSE_PENDING, target_block);

	// Capture the call-site block for boundary lookups. target_block is the
	// component's block (passed by compiler), but the actual try/pending/catch
	// boundary is an ancestor of active_block (the block executing trackAsync).
	var call_site_block = /** @type {Block} */ (active_block);

	var version = 0;
	/** @type {AbortController | null} */
	var abort_controller = null;
	var request_id = 0;
	/** @type {Block | null} */
	var boundary = null;

	// Find boundary from the call-site block.
	boundary = get_pending_boundary(active_block);
	if (boundary === null) {
		throw new Error('Missing parent `try { ... } pending { ... }` statement');
	}

	request_id = begin_boundary_request(boundary);

	pre_effect(() => {
		var current_version = ++version;

		// Abort previous in-flight request
		if (abort_controller !== null && abort_controller.signal.aborted === false) {
			abort_controller.abort(DERIVED_UPDATED);
		}
		abort_controller = null;

		// Manage boundary request: replace if in-flight, or begin new if previous completed
		if (request_id > 0 && boundary !== null) {
			request_id = replace_boundary_request(boundary, request_id);
		} else if (boundary !== null) {
			request_id = begin_boundary_request(boundary);
		}

		// Set to pending before calling fn() in case it's sync
		if (t.__v !== SUSPENSE_PENDING) {
			update_tracked_value_clock(t, SUSPENSE_PENDING);
			schedule_update(t.b);
		}

		// Temporarily allow mutations so set() doesn't throw inside the pre-effect
		var previous_is_mutating_allowed = is_mutating_allowed;
		is_mutating_allowed = true;

		var result;
		try {
			result = fn();
		} catch (e) {
			is_mutating_allowed = previous_is_mutating_allowed;
			if (e === ASYNC_DERIVED_READ_THROWN) {
				// A dependency is still pending or rejected (e.g. chained trackAsync).
				// Check if any dependency is rejected — if so, propagate rejection.
				var dep = active_dependency;
				while (dep !== null) {
					if (dep.t.__v === SUSPENSE_REJECTED) {
						update_tracked_value_clock(t, SUSPENSE_REJECTED);
						schedule_update(t.b);
						complete_deferred_boundaries(t, false);
						if (request_id > 0 && boundary !== null) {
							complete_boundary_request(boundary, request_id, false);
							request_id = 0;
						}
						return;
					}
					dep = dep.n;
				}
				// Dependencies are pending, not rejected — register deferred
				// rejection so that if the boundary goes to catch mode, this
				// tracked value is also set to REJECTED.
				if (request_id > 0 && boundary !== null) {
					register_boundary_deferred(boundary, request_id, () => {
						update_tracked_value_clock(t, SUSPENSE_REJECTED);
					});
				}
				return;
			}
			throw e;
		}
		is_mutating_allowed = previous_is_mutating_allowed;

		// Check if the result is async
		var previous_tracking = tracking;
		tracking = false;
		var async_result = get_async_track_result(result);
		tracking = previous_tracking;

		if (async_result === null) {
			// Sync result
			update_tracked_value_clock(t, result);
			schedule_update(t.b);
			if (request_id > 0 && boundary !== null) {
				complete_boundary_request(boundary, request_id);
				request_id = 0;
			}
			return;
		}

		// Capture per-invocation so async closures (rejection handler, teardown)
		// have a stable reference. The shared abort_controller is only read
		// synchronously at the top of the pre_effect to abort the previous request.
		var current_abort_controller = async_result.abort_controller;
		abort_controller = current_abort_controller;

		async_result.promise.then(
			(resolved) => {
				if (current_version !== version) {
					// stale
					return;
				}
				update_tracked_value_clock(t, resolved);
				schedule_update(t.b);
				complete_deferred_boundaries(t);
				if (request_id > 0 && boundary !== null) {
					complete_boundary_request(boundary, request_id);
					request_id = 0;
				}
			},
			(error) => {
				if (current_version !== version) return; // stale

				var is_internal_abort =
					error === DERIVED_UPDATED || current_abort_controller?.signal?.reason === DERIVED_UPDATED;
				if (is_internal_abort) {
					// Internal abort (superseded by a new request) — don't set rejected
					if (request_id > 0 && boundary !== null) {
						complete_boundary_request(boundary, request_id, false);
						request_id = 0;
					}
					complete_deferred_boundaries(t, false);
					return;
				}

				update_tracked_value_clock(t, SUSPENSE_REJECTED);
				schedule_update(t.b);
				complete_deferred_boundaries(t, false);

				// Route error to catch boundary
				var boundary_with_catch = get_boundary_with_catch(call_site_block);
				if (boundary_with_catch !== null) {
					boundary_with_catch.s.c(error);
				}

				if (request_id > 0 && boundary !== null) {
					var should_show_resolved =
						boundary_with_catch === boundary || boundary === null ? false : true;
					complete_boundary_request(boundary, request_id, should_show_resolved);
					request_id = 0;
				}
			},
		);

		return () => {
			// Teardown: abort in-flight request when block is destroyed
			if (current_abort_controller !== null && current_abort_controller.signal.aborted === false) {
				current_abort_controller.abort(DERIVED_UPDATED);
			}
		};
	});

	return t;
}

/**
 * @param {(Derived | Tracked) | (() => any)} tracked
 * @returns {boolean}
 */
export function is_tracked_pending(tracked) {
	try {
		if (typeof tracked === 'function') {
			tracked();
		} else {
			get(tracked);
		}
		return false;
	} catch (error) {
		if (error === ASYNC_DERIVED_READ_THROWN) {
			return true;
		}
		throw error;
	}
}

/**
 * @param {Tracked | Derived} tracked
 * @return {any}
 */
export function peek_tracked(tracked) {
	if (!is_ripple_object(tracked)) {
		return tracked;
	}

	return tracked.__v;
}

/**
 * @param {Tracked | Derived} tracked
 * @returns {Dependency}
 */
function create_dependency(tracked) {
	var reaction = /** @type {Derived | Block} **/ (active_reaction);
	var existing = reaction.d;

	// Recycle tracking entries
	if (existing !== null) {
		reaction.d = existing.n;
		existing.c = tracked.c;
		existing.t = tracked;
		existing.n = null;
		return existing;
	}

	return {
		c: tracked.c,
		t: tracked,
		n: null,
	};
}

/**
 * @param {Dependency | null} tracking
 */
function is_tracking_dirty(tracking) {
	if (tracking === null) {
		return false;
	}
	while (tracking !== null) {
		var tracked = tracking.t;

		if ((tracked.f & DERIVED) !== 0) {
			try {
				update_derived(/** @type {Derived} **/ (tracked));
			} catch (e) {
				if (e === ASYNC_DERIVED_READ_THROWN) {
					// The derived depends on a pending async value — treat as dirty
					return true;
				}
				throw e;
			}
		}

		if (tracked.c > tracking.c) {
			return true;
		}
		tracking = tracking.n;
	}

	return false;
}

/**
 * @param {Block} block
 */
export function is_block_dirty(block) {
	var flags = block.f;

	if ((flags & (ROOT_BLOCK | BRANCH_BLOCK)) !== 0) {
		return false;
	}
	if ((flags & BLOCK_HAS_RUN) === 0) {
		block.f ^= BLOCK_HAS_RUN;
		return true;
	}

	return is_tracking_dirty(block.d);
}

/**
 * @template V
 * @param {Function} fn
 * @param {V} v
 */
function trigger_track_get(fn, v) {
	var previous_is_mutating_allowed = is_mutating_allowed;
	try {
		is_mutating_allowed = false;
		return untrack(() => fn(v));
	} finally {
		is_mutating_allowed = previous_is_mutating_allowed;
	}
}

/**
 * @param {Block} root_block
 */
function flush_updates(root_block) {
	/** @type {Block | null} */
	var current = root_block;
	var containing_update = null;
	var pre_effects = [];
	var other_blocks = [];
	var effects = [];
	var containing_update_head = null;

	while (current !== null) {
		var flags = current.f;

		if ((flags & CONTAINS_UPDATE) !== 0) {
			current.f ^= CONTAINS_UPDATE;
			containing_update_head = { v: containing_update, n: containing_update_head };
			containing_update = current;
		}

		if ((flags & PAUSED) === 0 && containing_update !== null) {
			if ((flags & PRE_EFFECT_BLOCK) !== 0) {
				pre_effects.push(current);
			} else if ((flags & EFFECT_BLOCK) !== 0) {
				effects.push(current);
			} else {
				other_blocks.push(current);
			}
			/** @type {Block | null} */
			var child = current.first;

			if (child !== null) {
				current = child;
				continue;
			}
		}

		/** @type {Block | null} */
		var parent = current.p;
		current = current.next;

		while (current === null && parent !== null) {
			if (parent === containing_update) {
				var head = /** @type {{ v: Block | null, n: any }} */ (containing_update_head);
				containing_update = head.v;
				containing_update_head = head.n;
			}
			current = parent.next;
			parent = parent.p;
		}
	}

	var arr_length = 0;

	// Phase 1: pre-effects (e.g. update tracked values before render blocks read them)
	arr_length = pre_effects.length;
	for (var i = 0; i < arr_length; i++) {
		var block = pre_effects[i];

		try {
			if ((block.f & (PAUSED | DESTROYED)) === 0 && is_block_dirty(block)) {
				run_block(block);
			}
		} catch (error) {
			handle_error(error, block);
		}
	}

	// Phase 2: all other blocks except effects
	arr_length = other_blocks.length;
	for (var i = 0; i < arr_length; i++) {
		var block = other_blocks[i];

		try {
			if ((block.f & (PAUSED | DESTROYED)) === 0 && is_block_dirty(block)) {
				run_block(block);
			}
		} catch (error) {
			handle_error(error, block);
		}
	}

	// Phase 3: effects
	arr_length = effects.length;
	for (var i = 0; i < arr_length; i++) {
		var block = effects[i];

		try {
			if ((block.f & (PAUSED | DESTROYED)) === 0 && is_block_dirty(block)) {
				run_block(block);
			}
		} catch (error) {
			handle_error(error, block);
		}
	}
}

/**
 * @param {Block[]} root_blocks
 */
function flush_queued_root_blocks(root_blocks) {
	for (let i = 0; i < root_blocks.length; i++) {
		flush_updates(root_blocks[i]);
	}

	if (queued_post_block_flush.length > 0) {
		var callbacks = queued_post_block_flush;
		queued_post_block_flush = [];
		for (var j = 0; j < callbacks.length; j++) {
			callbacks[j]();
		}
	}
}

/**
 * @returns {Promise<void>}
 */
export async function tick() {
	return new Promise((f) => requestAnimationFrame(() => f()));
}

/**
 * @returns {void}
 */
function flush_microtasks() {
	is_micro_task_queued = false;

	if (queued_microtasks.length > 0) {
		var microtasks = queued_microtasks;
		queued_microtasks = [];
		for (var i = 0; i < microtasks.length; i++) {
			microtasks[i]();
		}
	}

	flush_count++;
	if (flush_count > 1001) {
		throw new Error(
			'Maximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state.',
		);
	}
	var previous_queued_root_blocks = queued_root_blocks;
	queued_root_blocks = [];
	flush_queued_root_blocks(previous_queued_root_blocks);

	if (!is_micro_task_queued) {
		flush_count = 0;
	}
	old_values.clear();
}

/**
 * @param { (() => void) } [fn]
 */
export function queue_microtask(fn) {
	if (!is_micro_task_queued) {
		is_micro_task_queued = true;
		queueMicrotask(flush_microtasks);
	}
	if (fn !== undefined) {
		queued_microtasks.push(fn);
	}
}

/**
 * Queue a callback to run after all root blocks are flushed.
 * Used to defer boundary completions so chained async deriveds evaluated during
 * the flush can start new requests before the boundary transitions out of pending.
 * @param {() => void} fn
 */
export function queue_post_block_flush_callback(fn) {
	queued_post_block_flush.push(fn);
}

/**
 * @param {Block} block
 */
export function schedule_update(block) {
	if (scheduler_mode === FLUSH_MICROTASK) {
		queue_microtask();
	}
	let current = block;

	while (current !== null) {
		var flags = current.f;
		if ((flags & CONTAINS_UPDATE) !== 0) return;
		current.f ^= CONTAINS_UPDATE;
		if ((flags & ROOT_BLOCK) !== 0) {
			break;
		}
		current = /** @type {Block} */ (current.p);
	}

	queued_root_blocks.push(current);
}

/**
 * @param {Tracked | Derived} tracked
 */
function register_dependency(tracked) {
	var dependency = active_dependency;

	if (dependency === null) {
		dependency = create_dependency(tracked);
		active_dependency = dependency;
	} else {
		var current = dependency;

		while (current !== null) {
			if (current.t === tracked) {
				current.c = tracked.c;
				return;
			}
			var next = current.n;
			if (next === null) {
				break;
			}
			current = next;
		}

		dependency = create_dependency(tracked);
		current.n = dependency;
	}
}

/**
 * @param {Derived} computed
 */
export function get_derived(computed) {
	update_derived(computed);
	if (tracking) {
		register_dependency(computed);
	}
	var value = computed.__v;
	var get = computed.a.get;
	if (get !== undefined) {
		value = trigger_track_get(get, value);
		computed.__v = value;
	}

	if (value === SUSPENSE_PENDING || value === SUSPENSE_REJECTED) {
		throw ASYNC_DERIVED_READ_THROWN;
	}

	return value;
}

/**
 * @param {Derived | Tracked} tracked
 */
export function get(tracked) {
	// reflect back the value if it's not boxed
	if (!is_ripple_object(tracked)) {
		return tracked;
	}

	return (tracked.f & DERIVED) !== 0
		? get_derived(/** @type {Derived} */ (tracked))
		: get_tracked(/** @type {Tracked} */ (tracked));
}

/**
 * @param {Tracked} tracked
 */
export function get_tracked(tracked) {
	var value = tracked.__v;
	if (tracking) {
		register_dependency(tracked);
	}

	if (value === SUSPENSE_PENDING || value === SUSPENSE_REJECTED) {
		throw ASYNC_DERIVED_READ_THROWN;
	}

	if (teardown && old_values.has(tracked)) {
		value = old_values.get(tracked);
	}
	var get = tracked.a.get;
	if (get !== undefined) {
		value = trigger_track_get(get, value);
	}
	return value;
}

/**
 * Exposed version of `set` to avoid internal bugs
 * since block is required on the internal `set`
 * @param {Derived | Tracked} tracked
 * @param {any} value
 */
export function public_set(tracked, value) {
	set(tracked, value);
}

/**
 * @param {Derived | Tracked} tracked
 * @param {any} value
 */
export function set(tracked, value) {
	if (!is_mutating_allowed) {
		throw new Error(
			'Assignments or updates to tracked values are not allowed during computed "track(() => ...)" evaluation',
		);
	}

	var old_value = tracked.__v;

	if (value !== old_value) {
		var tracked_block = tracked.b;

		if ((tracked_block.f & CONTAINS_TEARDOWN) !== 0) {
			if (teardown) {
				old_values.set(tracked, value);
			} else {
				old_values.set(tracked, old_value);
			}
		}

		let set = tracked.a.set;
		if (set !== undefined) {
			value = untrack(() => set(value, old_value));
		}

		tracked.__v = value;
		tracked.c = increment_clock();
		schedule_update(tracked_block);
	}
}

/**
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack(fn) {
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	tracking = false;
	active_dependency = null;
	try {
		return fn();
	} finally {
		tracking = previous_tracking;
		active_dependency = previous_dependency;
	}
}

/**
 * @template T
 * @param {() => T} [fn]
 * @returns {T}
 */
export function flush_sync(fn) {
	var previous_scheduler_mode = scheduler_mode;
	var previous_queued_root_blocks = queued_root_blocks;

	try {
		/** @type {Block[]} */
		var root_blocks = [];

		scheduler_mode = FLUSH_SYNC;
		queued_root_blocks = root_blocks;
		is_micro_task_queued = false;

		flush_queued_root_blocks(previous_queued_root_blocks);

		var result = fn?.();

		if (queued_root_blocks.length > 0 || root_blocks.length > 0) {
			flush_sync();
		}

		flush_count = 0;

		return /** @type {T} */ (result);
	} finally {
		scheduler_mode = previous_scheduler_mode;
		queued_root_blocks = previous_queued_root_blocks;
	}
}

/**
 * @param {() => Object} fn
 * @returns {Object}
 */
export function spread_props(fn) {
	return proxy_props(fn);
}

/**
 * @param {() => Object} fn
 * @returns {Object}
 */
export function proxy_props(fn) {
	const memo = derived(fn, active_block);

	return new Proxy(
		{},
		{
			get(_, property) {
				/** @type {Record<string | symbol, any> | Record<string | symbol, any>[]} */
				var obj = get_derived(memo);

				// Handle array of objects/spreads (for multiple props)
				if (is_array(obj)) {
					// Search in reverse order (right-to-left) since later props override earlier ones
					/** @type {Record<string | symbol, any>} */
					var item;
					for (var i = obj.length - 1; i >= 0; i--) {
						item = obj[i];
						if (property in item) {
							return item[property];
						}
					}
					return undefined;
				}

				// Single object case
				return obj[property];
			},
			has(_, property) {
				if (property === TRACKED_OBJECT) {
					return true;
				}
				/** @type {Record<string | symbol, any> | Record<string | symbol, any>[]} */
				var obj = get_derived(memo);

				// Handle array of objects/spreads
				if (is_array(obj)) {
					for (var i = obj.length - 1; i >= 0; i--) {
						if (property in obj[i]) {
							return true;
						}
					}
					return false;
				}

				return property in obj;
			},
			getOwnPropertyDescriptor(_, key) {
				/** @type {Record<string | symbol, any> | Record<string | symbol, any>[]} */
				var obj = get_derived(memo);

				// Handle array of objects/spreads
				if (is_array(obj)) {
					/** @type {Record<string | symbol, any>} */
					var item;
					for (var i = obj.length - 1; i >= 0; i--) {
						item = obj[i];
						if (key in item) {
							return get_descriptor(item, key);
						}
					}
					return undefined;
				}

				if (key in obj) {
					return get_descriptor(obj, key);
				}
			},
			ownKeys() {
				/** @type {Record<string | symbol, any> | Record<string | symbol, any>[]} */
				var obj = get_derived(memo);
				/** @type {Record<string | symbol, 1>} */
				var done = {};
				/** @type {(string | symbol)[]} */
				var keys = [];

				// Handle array of objects/spreads
				if (is_array(obj)) {
					// Collect all keys from all objects, order doesn't matter
					/** @type {Record<string | symbol, any>} */
					var item;
					for (var i = 0; i < obj.length; i++) {
						item = obj[i];
						for (const key of Reflect.ownKeys(item)) {
							if (done[key]) {
								continue;
							}
							done[key] = 1;
							keys.push(key);
						}
					}
					return keys;
				}

				return Reflect.ownKeys(obj);
			},
		},
	);
}

/**
 * @template T
 * @param {() => T} fn
 * @returns {() => T}
 */
export function computed_property(fn) {
	define_property(fn, COMPUTED_PROPERTY, {
		value: true,
		enumerable: false,
	});
	return fn;
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {boolean} chain_obj
 * @param {boolean} chain_prop
 * @param {...any} args
 * @returns {any}
 */
export function call_property(obj, property, chain_obj, chain_prop, ...args) {
	// don't swallow errors if either the object or property is nullish,
	// respect optional chaining as provided
	if (!chain_obj && !chain_prop) {
		return obj[property].call(obj, ...args);
	} else if (chain_obj && chain_prop) {
		return obj?.[property]?.call(obj, ...args);
	} else if (chain_obj) {
		return obj?.[property].call(obj, ...args);
	} else if (chain_prop) {
		return obj[property]?.call(obj, ...args);
	}
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {boolean} [chain=false]
 * @returns {any}
 */
export function get_property(obj, property, chain = false) {
	if (chain && obj == null) {
		return undefined;
	}
	var tracked = obj[property];
	if (tracked == null) {
		return tracked;
	}
	return get(tracked);
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {any} value
 * @returns {void}
 */
export function set_property(obj, property, value) {
	var tracked = obj[property];
	set(tracked, value);
}

/**
 * @param {Tracked} tracked
 * @param {number} [d]
 * @returns {number}
 */
export function update(tracked, d = 1) {
	var value = get(tracked);
	var result = d === 1 ? value++ : value--;
	set(tracked, value);
	return result;
}

/**
 * @param {Tracked} tracked
 * @returns {void}
 */
export function increment(tracked) {
	set(tracked, tracked.__v + 1);
}

/**
 * @param {Tracked} tracked
 * @returns {void}
 */
export function decrement(tracked) {
	set(tracked, tracked.__v - 1);
}

/**
 * @param {Tracked} tracked
 * @param {number} [d]
 * @returns {number}
 */
export function update_pre(tracked, d = 1) {
	var value = get(tracked);
	var new_value = d === 1 ? ++value : --value;
	set(tracked, new_value);
	return new_value;
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {number} [d=1]
 * @returns {number}
 */
export function update_property(obj, property, d = 1) {
	var tracked = obj[property];
	var value = get(tracked);
	var new_value = d === 1 ? value++ : value--;
	set(tracked, value);
	return new_value;
}

/**
 * @param {any} obj
 * @param {string | number | symbol} property
 * @param {number} [d=1]
 * @returns {number}
 */
export function update_pre_property(obj, property, d = 1) {
	var tracked = obj[property];
	var value = get(tracked);
	var new_value = d === 1 ? ++value : --value;
	set(tracked, new_value);
	return new_value;
}

/**
 * @template T
 * @param {Block} block
 * @param {() => T} fn
 * @returns {T}
 */
export function with_scope(block, fn) {
	var previous_scope = active_scope;
	try {
		active_scope = block;
		return fn();
	} finally {
		active_scope = previous_scope;
	}
}

/**
 * @returns {Block | null}
 */
export function scope() {
	return active_scope || active_block;
}

/**
 * @param {string} [err]
 * @returns {Block | never}
 */
export function safe_scope(err = 'Cannot access outside of a component context') {
	if (active_scope === null) {
		throw new Error(err);
	}

	return /** @type {Block} */ (active_scope);
}

export function create_component_ctx() {
	return {
		b: active_block,
		c: null,
		e: null,
		m: false,
		p: active_component,
	};
}

/**
 * @returns {void}
 */
export function push_component() {
	var component = create_component_ctx();
	active_component = component;
}

/**
 * @returns {void}
 */
export function pop_component() {
	var component = /** @type {Component} */ (active_component);
	component.m = true;
	var effects = component.e;
	if (effects !== null) {
		var length = effects.length;
		for (var i = 0; i < length; i++) {
			var { b: block, fn, r: reaction } = effects[i];
			var previous_block = active_block;
			var previous_reaction = active_reaction;

			try {
				active_block = block;
				active_reaction = reaction;
				effect(fn);
			} finally {
				active_block = previous_block;
				active_reaction = previous_reaction;
			}
		}
	}
	active_component = component.p;
}

/**
 * @template T
 * @param {() => T} fn
 * @param {keyof typeof NAMESPACE_URI} namespace
 * @returns {T}
 */
export function with_ns(namespace, fn) {
	var previous_namespace = active_namespace;
	active_namespace = namespace;
	try {
		return fn();
	} finally {
		active_namespace = previous_namespace;
	}
}

/**
 * @returns {symbol}
 */
export function ref_prop() {
	return Symbol(REF_PROP);
}

/**
 * @template T
 * @param {T | undefined} value
 * @param {T} fallback
 * @returns {T}
 */
export function fallback(value, fallback) {
	return value === undefined ? fallback : value;
}

/**
 * @param {Record<string | symbol, unknown>} obj
 * @param {string[]} exclude_keys
 * @returns {Record<string | symbol, unknown>}
 */
export function exclude_from_object(obj, exclude_keys) {
	var keys = object_keys(obj);
	/** @type {Record<string | symbol, unknown>} */
	var new_obj = {};

	for (const key of keys) {
		if (!exclude_keys.includes(key)) {
			new_obj[key] = obj[key];
		}
	}

	for (const symbol of get_own_property_symbols(obj)) {
		var ref_fn = obj[symbol];

		if (symbol.description === REF_PROP) {
			new_obj[symbol] = ref_fn;
		}
	}

	return new_obj;
}
