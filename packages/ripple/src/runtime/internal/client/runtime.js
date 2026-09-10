/** @import { AppendIntoAnchor, Block, Component, Dependency, BlockWithTryBoundaryAndCatch, DeferredTrackedEntry } from '#client' */
/** @import { NAMESPACE_URI } from './constants.js' */
/** @typedef {TrackedValue} Tracked */
/** @typedef {DerivedValue} Derived */

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
	DESTROYED,
	EFFECT_BLOCK,
	FOR_BLOCK,
	PAUSED,
	PRE_EFFECT_BLOCK,
	ROOT_BLOCK,
	TRACKED,
	UNINITIALIZED,
	REF_PROP,
	TRACKED_OBJECT,
	DEFAULT_NAMESPACE,
	TRACKED_UPDATED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	TRY_BLOCK,
	DIRECT_CHILD_BLOCK,
	SCHEDULED,
	SELECTOR,
	IF_BLOCK,
	RELEASED,
} from './constants.js';
import {
	begin_boundary_request,
	complete_boundary_request,
	get_boundary_with_catch,
	get_pending_boundary,
	handle_boundary_error,
	register_boundary_deferred,
	register_boundary_paused_block,
	replace_boundary_request,
} from './try.js';
import { is_ripple_object } from './utils.js';
import { forwarding_descriptor, is_props, own_keys } from './props.js';
import { render_value } from './expression.js';
import { throw_invalid_component_type } from './component.js';

import {
	iterable_array_from,
	define_property,
	get_descriptor,
	get_own_property_symbols,
	is_array,
	object_keys,
} from '@tsrx/core/runtime/language-helpers';
import { get_async_track_result } from '../../../utils/async.js';
import {
	throw_tracked_index_reference_error,
	throw_tracked_index_value_error,
} from '../../../utils/errors.js';
import { get_track_async_script_id } from '../../../utils/track-async-serialization.js';
import { revive } from './transport.js';
import { hydrating, track_hash_reference } from './hydration.js';
import { create_ref_prop as create_core_ref_prop } from '@tsrx/core/runtime/ref';

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

/**
 * Tracked values written during the current flush that hold their previous
 * value in `o`, for teardowns that read them; released when the flush ends.
 * @type {(Tracked | Derived)[]}
 */
var old_value_holders = [];
/** Nesting depth of running flushes; old values are released at depth zero. */
var flush_depth = 0;

/** @returns {void} */
function release_old_values() {
	var holders = old_value_holders;
	var length = holders.length;
	if (length === 0) return;
	for (var i = 0; i < length; i++) {
		holders[i].o = UNINITIALIZED;
	}
	holders.length = 0;
}

// Used for controlling the flush of blocks
/** @type {number} */
let scheduler_mode = FLUSH_MICROTASK;
// Used for handling scheduling
/** @type {boolean} */
let is_micro_task_queued = false;
/** @type {number} */
let clock = 0;
/**
 * Blocks scheduled for the next flush. `sorted` tracks whether they were
 * pushed in creation order, so the common case avoids a sort.
 * @typedef {{ blocks: Block[]; sorted: boolean; last: number }} Queue
 */
/** @type {Queue} */
let queue = create_queue();

/** @returns {Queue} */
function create_queue() {
	return { blocks: [], sorted: true, last: 0 };
}
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
			// Runtime-internal teardowns keyed on block state get it as their
			// argument, so they need no per-block closure; user effects have
			// null state.
			fn.call(null, block.s);
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
	mark_subscribers(tracked);
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

		finish_dependencies(computed, active_dependency);

		return value;
	} catch (error) {
		finish_dependencies(computed, active_dependency);
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
		handle_boundary_error(boundary_with_catch, error);
		return boundary_with_catch;
	}

	throw error;
}

/**
 * The error path of {@link run_block}, kept out of that hot function so a
 * healthy mount never compiles it: routes real errors to the nearest catch
 * boundary and pauses a block that read a pending async value under its
 * pending boundary.
 * @param {unknown} error
 * @param {Block} block
 */
function handle_run_error(error, block) {
	var is_component_direct = false;
	var is_try_fn_block = false;
	finish_dependencies(block, active_dependency);
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
}

/**
 * Clears what a block's previous run left behind before it runs again. A
 * list's children are all item branches, so there is nothing to sweep; an if
 * block's children are its branch, which it replaces itself only when the
 * condition changes.
 * @param {Block} block
 */
function prepare_rerun(block) {
	if ((block.f & (FOR_BLOCK | IF_BLOCK)) === 0) {
		destroy_non_branch_children(block);
	}
	run_teardown(block);
}

/**
 * @param {Block} block
 * @param {(state?: any) => void} teardown
 */
function register_teardown(block, teardown) {
	block.t = teardown;
	/** @type {Block | null} */
	var current = block;

	while (current !== null && (current.f & CONTAINS_TEARDOWN) === 0) {
		current.f ^= CONTAINS_TEARDOWN;
		current = current.p;
	}
}

/**
 * @param {Block} block
 * @param {boolean} [first_run] true when the block has no children, teardown,
 * or dependencies yet, so that cleanup can be skipped
 */
export function run_block(block, first_run = false) {
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;

	try {
		active_block = block;
		active_reaction = block;
		active_component = block.co;

		if (!first_run) {
			prepare_rerun(block);
		}

		tracking = (block.f & (ROOT_BLOCK | BRANCH_BLOCK)) === 0;
		active_dependency = null;
		var res = block.fn(block.s);

		if (typeof res === 'function') {
			register_teardown(block, res);
		}

		if (active_dependency !== null || block.d !== null) {
			finish_dependencies(block, active_dependency);
		}
	} catch (error) {
		handle_run_error(error, block);
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
 * Counts every read of a tracked or derived value, whether or not a reaction
 * is tracking. A compiled props getter compares it before and after its first
 * evaluation: an unchanged count proves the expression read no reactive state
 * and its value can be kept (see `props.js`).
 */
export let reads = 0;

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

class TrackedValue {
	/**
	 * @param {any} v
	 * @param {Block} block
	 * @param {{ get?: Function; set?: Function }} a
	 * @param {string} [hash]
	 */
	constructor(v, block, a, hash) {
		/** @type {{ get?: Function; set?: Function }} */
		this.a = a;
		/** @type {Block} */
		this.b = block;
		/** @type {number} */
		this.c = 0;
		/** @type {DeferredTrackedEntry[] | null} */
		this.d = null;
		/** @type {number} */
		this.f = TRACKED;
		/** @type {any} hydration hash, or the key of a selector match flag */
		this.h = hash;
		/** @type {Dependency | null} */
		this.sb = null;
		/** @type {any} */
		this.__v = v;
		/** @type {any} previous value while a flush with teardowns is running */
		this.o = UNINITIALIZED;
	}
	/** @returns {any} */
	get [0]() {
		return throw_tracked_index_value_error();
	}
	/** @param {any} v */
	set [0](v) {
		throw_tracked_index_value_error();
	}
	/** @returns {Tracked} */
	get [1]() {
		return throw_tracked_index_reference_error();
	}
	/** @returns {any} */
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
	/** @returns {Iterator<any | Tracked>} */
	*[Symbol.iterator]() {
		yield get_tracked(this);
		yield this;
	}
}

class DerivedValue {
	/**
	 * @param {Function} fn
	 * @param {Block} block
	 * @param {{ get?: Function; set?: Function }} a
	 * @param {string} [hash]
	 */
	constructor(fn, block, a, hash) {
		/** @type {{ get?: Function; set?: Function }} */
		this.a = a;
		/** @type {Block} */
		this.b = block;
		/** @type {Block[] | null} */
		this.blocks = null;
		/** @type {number} */
		this.c = 0;
		/** @type {Component | null} */
		this.co = active_component;
		/** @type {Dependency | null} */
		this.d = null;
		/** @type {number} */
		this.f = DERIVED;
		/** @type {Function} */
		this.fn = fn;
		/** @type {string | undefined} */
		this.h = hash;
		/** @type {Dependency | null} */
		this.sb = null;
		/** @type {any} */
		this.__v = UNINITIALIZED;
		/** @type {any} previous value while a flush with teardowns is running */
		this.o = UNINITIALIZED;
	}
	/** @returns {any} */
	get [0]() {
		return throw_tracked_index_value_error();
	}
	/** @param {any} v */
	set [0](v) {
		throw_tracked_index_value_error();
	}
	/** @returns {Derived} */
	get [1]() {
		return throw_tracked_index_reference_error();
	}
	/** @returns {any} */
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
	/** @returns {Iterator<any | Derived>} */
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
 * @param {string} [hash]
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked}
 */
export function tracked(v, block, hash, get, set) {
	var t = /** @type {Tracked} */ (
		new TrackedValue(v, block || active_block, get || set ? { get, set } : empty_get_set, hash)
	);
	if (hydrating && hash !== undefined) {
		track_hash_reference.set(hash, t);
	}
	return t;
}

/**
 * @param {any} fn
 * @param {Block} block
 * @param {string} [hash]
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Derived}
 */
export function derived(fn, block, hash, get, set) {
	var d = /** @type {Derived} */ (
		new DerivedValue(fn, block || active_block, get || set ? { get, set } : empty_get_set, hash)
	);
	if (hydrating && hash !== undefined) {
		track_hash_reference.set(hash, d);
	}
	return d;
}

/**
 * @param {any} v
 * @param {Block} b
 * @param {string} [hash]
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked | Derived}
 */
export function track(v, b, hash, get, set) {
	if (is_ripple_object(v)) {
		return v;
	}
	if (b === null) {
		throw new TypeError('track() requires a valid component context');
	}

	if (typeof v === 'function') {
		return derived(v, b, hash, get, set);
	}
	return tracked(v, b, hash, get, set);
}

/**
 * @param {any} fn
 * @param {Block} b
 * @param {string} hash - Unique hash for SSR serialization/hydration
 * @returns {Tracked | void}
 */
export function track_async(fn, b, hash) {
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

	// During hydration, attempt to read serialized data from SSR
	var had_hydration_data = false;
	var hydration_value;
	/** @type {string[] | undefined} */
	var hydration_deps;

	if (hydrating) {
		var script_id = get_track_async_script_id(hash);
		var script_el = document.getElementById(script_id);
		if (script_el) {
			var envelope = JSON.parse(/** @type {string} */ (script_el.textContent));
			script_el.remove();

			if (envelope.ok) {
				had_hydration_data = true;
				hydration_value =
					envelope.payload === undefined ? envelope.value : revive(envelope.payload);
				hydration_deps = envelope.deps;
			} else {
				// trigger the catch block
				throw new Error(envelope.error?.message ?? 'Unknown server error');
			}
		}
	}

	var t = tracked(had_hydration_data ? hydration_value : SUSPENSE_PENDING, target_block, hash);

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

	// TODO: decide if instead of insisting on pending, we create our own boundary
	// we currently require a pending block upstream but we could also
	// create a try/pending/catch boundary at mount and hydration like
	// we do on the server so that there is always a boundary present.
	// It can handle global pending when none were provided.
	// Not sure about the catch boundary because if none were provided,
	// the whole app for any error will be unmounted with the catch block rendered

	// Find boundary from the call-site block.
	boundary = get_pending_boundary(active_block);
	if (boundary === null) {
		throw new Error('Missing parent `try { ... } pending { ... }` statement');
	}

	// If we hydrated with resolved data, the SSR already completed this request.
	// Otherwise mark a pending request on the boundary for the client-side run.
	if (!had_hydration_data) {
		request_id = begin_boundary_request(boundary);
	}

	pre_effect(() => {
		if (had_hydration_data) {
			// First run after hydration: skip fn() entirely (the SSR already
			// produced the resolved value) and instead register the direct
			// dependencies from the serialized deps list so future dep changes
			// trigger a re-run via the normal async path.
			had_hydration_data = false;
			if (hydration_deps !== undefined) {
				for (var i = 0; i < hydration_deps.length; i++) {
					var dep_ref = track_hash_reference.get(hydration_deps[i]);
					if (dep_ref !== undefined) {
						get(dep_ref);
					}
				}
			}
			return;
		}

		var current_version = ++version;

		// Abort previous in-flight request
		if (abort_controller !== null && abort_controller.signal.aborted === false) {
			abort_controller.abort(TRACKED_UPDATED);
		}
		abort_controller = null;

		// Manage boundary request: replace if in-flight, or begin new if previous completed
		if (request_id > 0 && boundary !== null) {
			request_id = replace_boundary_request(boundary, request_id);
		} else if (boundary !== null) {
			request_id = begin_boundary_request(boundary);
		}

		// Set to pending before calling fn() in case it's sync.
		if (t.__v !== SUSPENSE_PENDING) {
			update_tracked_value_clock(t, SUSPENSE_PENDING);
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
				complete_deferred_boundaries(t);
				if (request_id > 0 && boundary !== null) {
					complete_boundary_request(boundary, request_id);
					request_id = 0;
				}
			},
			(error) => {
				if (current_version !== version) return; // stale

				var is_internal_abort =
					error === TRACKED_UPDATED || current_abort_controller?.signal?.reason === TRACKED_UPDATED;
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
				complete_deferred_boundaries(t, false);

				// Route error to catch boundary
				var boundary_with_catch = get_boundary_with_catch(call_site_block);
				if (boundary_with_catch !== null) {
					handle_boundary_error(boundary_with_catch, error);
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
				current_abort_controller.abort(TRACKED_UPDATED);
			}
		};
	});

	return t;
}

/**
 * @param {(Derived | Tracked) | (() => any)} t
 * @returns {boolean}
 */
export function is_tracked_pending(t) {
	try {
		if (typeof t === 'function') {
			t();
		} else {
			get(t);
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

	reads++;
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
		existing.n = null;
		if (existing.t !== tracked) {
			unlink_subscriber(existing);
			existing.t = tracked;
			link_subscriber(existing, tracked);
		}
		return existing;
	}

	// link_subscriber, inline: the first read of every block run lands here.
	var head = tracked.sb;
	/** @type {Dependency} */
	var dependency = {
		c: tracked.c,
		t: tracked,
		n: null,
		r: reaction,
		sp: null,
		sn: head,
	};
	if (head !== null) {
		head.sp = dependency;
	}
	tracked.sb = dependency;
	return dependency;
}

/**
 * @param {Dependency} dependency
 * @param {Tracked | Derived} tracked
 */
function link_subscriber(dependency, tracked) {
	var head = tracked.sb;
	dependency.sn = head;
	if (head !== null) {
		head.sp = dependency;
	}
	tracked.sb = dependency;
}

/**
 * @param {Dependency} dependency
 */
export function unlink_subscriber(dependency) {
	var prev = dependency.sp;
	var next = dependency.sn;
	if (prev !== null) {
		prev.sn = next;
	} else {
		var tracked = dependency.t;
		// Already unlinked (a destroyed block's dependency can be pruned by a
		// write during its own teardown, then unlinked again by
		// remove_dependencies); it must not be mistaken for the list head.
		if (tracked.sb !== dependency) {
			return;
		}
		tracked.sb = next;
		if (next === null && (tracked.f & SELECTOR) !== 0) {
			release_selector_key(/** @type {Tracked} */ (tracked));
		}
	}
	if (next !== null) {
		next.sp = prev;
	}
	dependency.sp = dependency.sn = null;
}

/**
 * `n` counts released keys still in the map.
 * @typedef {{ get: undefined; set: undefined; m: Map<any, Tracked>; n: number }} SelectorAccessors
 */

/** Released selector keys kept for reuse before the map is swept. */
var SELECTOR_SWEEP_THRESHOLD = 1024;

/**
 * The last subscriber of a selector key left. The entry stays in the map so
 * a key that comes back (a list re-rendering the same items) reuses it
 * instead of allocating and inserting again; once enough released keys pile
 * up they are swept out, so the map stays bounded.
 * @param {Tracked} tracked
 */
function release_selector_key(tracked) {
	var accessors = /** @type {SelectorAccessors} */ (tracked.a);
	tracked.f |= RELEASED;
	if (++accessors.n > SELECTOR_SWEEP_THRESHOLD) {
		var m = accessors.m;
		for (var [key, t] of m) {
			if ((t.f & RELEASED) !== 0) {
				m.delete(key);
			}
		}
		accessors.n = 0;
	}
}

/**
 * A key found in the map again after its subscribers had all left.
 * @param {Tracked} tracked
 */
export function revive_selector_key(tracked) {
	tracked.f ^= RELEASED;
	/** @type {SelectorAccessors} */ (tracked.a).n--;
}

/**
 * A tracked match flag for one selector key. The selector's shared accessor
 * object carries the map and the key rides in the hash slot, so the entry can
 * be released from `unlink_subscriber` without an object per key.
 * @param {boolean} value
 * @param {Block} block
 * @param {SelectorAccessors} accessors
 * @param {any} key
 * @returns {Tracked}
 */
export function selector_tracked(value, block, accessors, key) {
	var t = /** @type {Tracked} */ (new TrackedValue(value, block, accessors, key));
	t.f |= SELECTOR;
	return t;
}

/**
 * Install the dependency chain produced by a run, unsubscribing from any
 * previous dependencies that were not read again.
 * @param {Block | Derived} reaction
 * @param {Dependency | null} dependencies
 */
function finish_dependencies(reaction, dependencies) {
	var stale = reaction.d;
	while (stale !== null) {
		unlink_subscriber(stale);
		stale = stale.n;
	}
	reaction.d = dependencies;
}

/**
 * Unsubscribe a block from every tracked value it read. Dependencies on
 * values owned by an already-destroyed block are dropped without unlinking,
 * since the owner's subscriber list dies with it.
 * @param {Block} block
 */
export function remove_dependencies(block) {
	var dependency = block.d;
	while (dependency !== null) {
		var owner = dependency.t.b;
		if (owner === null || (owner.f & DESTROYED) === 0) {
			unlink_subscriber(dependency);
		}
		dependency = dependency.n;
	}
	block.d = null;
}

/**
 * Schedule every reaction subscribed to `tracked`. Deriveds are lazy, so their
 * own subscribers are marked instead; subscribers that were destroyed without
 * unlinking are pruned here.
 * @param {Tracked | Derived} tracked
 */
function mark_subscribers(tracked) {
	var dependency = tracked.sb;
	while (dependency !== null) {
		var next = dependency.sn;
		var reaction = dependency.r;
		var flags = reaction.f;
		if ((flags & DERIVED) !== 0) {
			var derived = /** @type {Derived} */ (reaction);
			var derived_owner = derived.b;
			// A derived whose owner is gone and that nothing reads any more is
			// pruned; one still read elsewhere keeps forwarding notifications.
			if (derived_owner !== null && (derived_owner.f & DESTROYED) !== 0 && derived.sb === null) {
				unlink_subscriber(dependency);
			} else {
				mark_subscribers(derived);
			}
		} else if ((flags & DESTROYED) !== 0) {
			unlink_subscriber(dependency);
		} else {
			schedule_update(/** @type {Block} */ (reaction));
		}
		dependency = next;
	}
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
 * @param {Block} a
 * @param {Block} b
 * @returns {number}
 */
function by_block_id(a, b) {
	return a.i - b.i;
}

/**
 * Run every scheduled block, in creation order (so a parent runs before its
 * descendants), in three phases: pre-effects, render blocks, then effects.
 * @param {Queue} pending
 */
function flush_queue(pending) {
	var blocks = pending.blocks;
	var length = blocks.length;

	if (length > 0) {
		if (!pending.sorted) {
			blocks.sort(by_block_id);
		}

		var has_effects = false;

		for (var i = 0; i < length; i++) {
			var block = blocks[i];
			var flags = block.f;
			block.f = flags & ~SCHEDULED;
			if ((flags & (PRE_EFFECT_BLOCK | EFFECT_BLOCK)) !== 0) {
				has_effects = true;
			}
		}

		// New schedules land in the queue that replaced `pending`, so the array
		// can be run in place. Effects need the three-phase ordering; a queue of
		// only render blocks (the common flush) runs straight through.
		if (has_effects) {
			run_phases(blocks, length);
		} else {
			run_phase(blocks);
		}

		blocks.length = 0;
		pending.sorted = true;
		pending.last = 0;
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
 * Runs a queue that contains effects in three phases: pre-effects, render
 * blocks, then effects. Kept out of {@link flush_queue} so a render-only flush
 * never compiles it.
 * @param {Block[]} blocks
 * @param {number} length
 */
function run_phases(blocks, length) {
	/** @type {Block[]} */
	var pre_effects = [];
	/** @type {Block[]} */
	var other_blocks = [];
	/** @type {Block[]} */
	var effects = [];

	for (var i = 0; i < length; i++) {
		var block = blocks[i];
		var flags = block.f;

		// A paused block is re-checked when it resumes; a destroyed one is gone.
		if ((flags & (PAUSED | DESTROYED)) !== 0) {
			continue;
		}
		if ((flags & PRE_EFFECT_BLOCK) !== 0) {
			pre_effects.push(block);
		} else if ((flags & EFFECT_BLOCK) !== 0) {
			effects.push(block);
		} else {
			other_blocks.push(block);
		}
	}

	run_phase(pre_effects);
	run_phase(other_blocks);
	run_phase(effects);
}

/**
 * @param {Block[]} blocks
 */
function run_phase(blocks) {
	for (var i = 0; i < blocks.length; i++) {
		var block = blocks[i];
		var flags = block.f;

		try {
			if ((flags & (PAUSED | DESTROYED)) === 0 && is_block_dirty(block)) {
				// A block that has never run has no children or teardown to clear.
				run_block(block, (flags & BLOCK_HAS_RUN) === 0);
			}
		} catch (error) {
			handle_error(error, block);
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
	var pending = queue;
	queue = create_queue();
	flush_depth++;
	try {
		flush_queue(pending);
	} finally {
		flush_depth--;
	}

	if (!is_micro_task_queued) {
		flush_count = 0;
	}
	if (flush_depth === 0) {
		release_old_values();
	}
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
	if ((block.f & SCHEDULED) !== 0) {
		return;
	}
	block.f |= SCHEDULED;

	if (scheduler_mode === FLUSH_MICROTASK) {
		queue_microtask();
	}

	var id = block.i;
	if (id < queue.last) {
		queue.sorted = false;
	}
	queue.last = id;
	queue.blocks.push(block);
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
	reads++;
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
 * @param {any} lazy
 * @param {number} [index]
 * @returns {any}
 */
export function lazy_array_get(lazy, index = 0) {
	if (is_array(lazy)) {
		return lazy[index];
	}
	var flags = lazy.f;
	if (flags === TRACKED) {
		return index === 0
			? get_tracked(/** @type {Tracked} */ (lazy))
			: index === 1
				? lazy
				: undefined;
	}
	if (flags === DERIVED) {
		return index === 0
			? get_derived(/** @type {Derived} */ (lazy))
			: index === 1
				? lazy
				: undefined;
	}
	return iterable_array_from(lazy, index)[0];
}

/**
 * @param {any} lazy
 * @param {number} [index]
 * @returns {any[]}
 */
export function lazy_array_rest(lazy, index = 0) {
	if (is_array(lazy)) {
		return lazy.slice(index);
	}
	var flags = lazy.f;
	if (flags === TRACKED) {
		return index === 0
			? [get_tracked(/** @type {Tracked} */ (lazy)), lazy]
			: index === 1
				? [lazy]
				: [];
	}
	if (flags === DERIVED) {
		return index === 0
			? [get_derived(/** @type {Derived} */ (lazy)), lazy]
			: index === 1
				? [lazy]
				: [];
	}
	return iterable_array_from(lazy, index);
}

/**
 * @param {Tracked} tracked
 */
export function get_tracked(tracked) {
	reads++;
	var value = tracked.__v;
	if (tracking) {
		// register_dependency, inline for the first read of a run.
		if (active_dependency === null) {
			active_dependency = create_dependency(tracked);
		} else {
			register_dependency(tracked);
		}
	}

	if (value === SUSPENSE_PENDING || value === SUSPENSE_REJECTED) {
		throw ASYNC_DERIVED_READ_THROWN;
	}

	if (teardown && tracked.o !== UNINITIALIZED) {
		value = tracked.o;
	}
	var get = tracked.a.get;
	if (get !== undefined) {
		value = trigger_track_get(get, value);
	}
	return value;
}

/**
 * @param {any} lazy
 * @param {any} value
 * @param {number} [index]
 * @returns {void}
 */
export function lazy_array_set(lazy, value, index = 0) {
	if (is_array(lazy)) {
		lazy[index] = value;
		return;
	}
	var flags = lazy.f;
	if (flags === TRACKED || flags === DERIVED) {
		if (index === 0) {
			set(/** @type {Derived | Tracked} */ (lazy), value);
			return;
		}
		if (index === 1) {
			throw_tracked_index_reference_error();
		}
		return;
	}
	lazy[index] = value;
}

/**
 * @param {any} lazy
 * @param {number} [index]
 * @param {number} [d]
 * @returns {number}
 */
export function lazy_array_update(lazy, index = 0, d = 1) {
	var value = lazy_array_get(lazy, index);
	var result = d === 1 ? value++ : value--;
	lazy_array_set(lazy, value, index);
	return result;
}

/**
 * @param {any} lazy
 * @param {number} [index]
 * @param {number} [d]
 * @returns {number}
 */
export function lazy_array_update_pre(lazy, index = 0, d = 1) {
	var value = lazy_array_get(lazy, index);
	var new_value = d === 1 ? ++value : --value;
	lazy_array_set(lazy, new_value, index);
	return new_value;
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
			if (tracked.o === UNINITIALIZED) {
				old_value_holders.push(tracked);
			}
			tracked.o = teardown ? value : old_value;
		}

		let set = tracked.a.set;
		if (set !== undefined) {
			value = untrack(() => set(value, old_value));
		}

		tracked.__v = value;
		tracked.c = increment_clock();
		mark_subscribers(tracked);
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
	var previous_queue = queue;

	flush_depth++;
	try {
		scheduler_mode = FLUSH_SYNC;
		queue = create_queue();
		is_micro_task_queued = false;

		// Drains previous_queue, which then stays empty for the restore below.
		flush_queue(previous_queue);

		var result = fn?.();

		// Each pass runs the blocks scheduled by the previous one.
		while (queue.blocks.length > 0) {
			var pending = queue;
			queue = create_queue();
			flush_queue(pending);
		}

		flush_count = 0;

		// Old values only matter to teardowns run by the flush in progress; a
		// sync flush nested in another flush (an effect calling `flushSync`)
		// leaves them for the outer flush's remaining teardowns.
		if (flush_depth === 1) {
			release_old_values();
		}

		return /** @type {T} */ (result);
	} finally {
		flush_depth--;
		scheduler_mode = previous_scheduler_mode;
		queue = previous_queue;
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
 * `Reflect.ownKeys` that includes the prototype getters of a props instance.
 * @param {Record<string | symbol, any>} obj
 * @returns {(string | symbol)[]}
 */
function reflect_own_keys(obj) {
	return is_props(obj) ? own_keys(obj) : Reflect.ownKeys(obj);
}

/**
 * The descriptor a spread proxy reports for `key` of `obj`: a props instance
 * has no own descriptor, so its props are described as forwarding accessors.
 * @param {Record<string | symbol, any>} obj
 * @param {string | symbol} key
 * @returns {PropertyDescriptor | undefined}
 */
function describe(obj, key) {
	if (is_props(obj)) {
		return forwarding_descriptor(obj, /** @type {string} */ (key));
	}
	return get_descriptor(obj, key);
}

/**
 * @param {() => Object} fn
 * @returns {Object}
 */
export function proxy_props(fn) {
	const memo = derived(fn, /** @type {Block} */ (active_block));

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
							return describe(item, key);
						}
					}
					return undefined;
				}

				if (key in obj) {
					return describe(obj, key);
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
						for (const key of reflect_own_keys(item)) {
							if (done[key]) {
								continue;
							}
							done[key] = 1;
							keys.push(key);
						}
					}
					return keys;
				}

				return reflect_own_keys(obj);
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
	// create_component_ctx, inline: one component per call is the common case.
	active_component = {
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
export function pop_component() {
	var component = /** @type {Component} */ (active_component);
	component.m = true;
	if (component.e !== null) {
		create_deferred_effects(component.e);
	}
	active_component = component.p;
}

/**
 * Renders a component: `fn(props)` runs under a fresh component context (the
 * owner of the component's context values and deferred effects), and the
 * element it returns renders before `anchor`.
 * @param {Function} fn
 * @param {Node | AppendIntoAnchor} anchor
 * @param {Record<string, any>} props
 * @param {Block | null} [block=active_block]
 * @returns {void}
 */
export function render_component(fn, anchor, props, block = active_block) {
	if (typeof fn !== 'function') {
		throw_invalid_component_type(fn);
	}

	// push_component, inline: one component per call is the common case.
	/** @type {Component} */
	var component = (active_component = {
		b: active_block,
		c: null,
		e: null,
		m: false,
		p: active_component,
	});

	// A module-level component carries its render function (`$r`, see the
	// compiler): calling it directly skips the element the component would
	// return only to be rendered here.
	var render = /** @type {any} */ (fn).$r;
	if (render !== undefined) {
		render(anchor, block, props);
	} else {
		render_value(fn(props), /** @type {ChildNode} */ (anchor), block);
	}

	// pop_component, inline.
	component.m = true;
	if (component.e !== null) {
		create_deferred_effects(component.e);
	}
	active_component = component.p;
}

/**
 * A reaction that stands in for a block whose creation is being decided (see
 * `probe_dependencies`). Flagged destroyed so a write during the probe prunes
 * its subscription instead of scheduling it.
 * @type {any}
 */
var probe_reaction = { f: DESTROYED, d: null, blocks: null };

/**
 * Runs `fn(arg)` tracked against a scratch reaction and returns the head of
 * the dependency chain it recorded, or null when it read no tracked state. A
 * chain must be handed to a block with `adopt_dependencies`.
 * @param {(arg: any, context: any) => void} fn
 * @param {any} arg
 * @param {any} [context] a second argument for `fn` (a hoisted branch's captured local)
 * @returns {Dependency | null}
 */
export function probe_dependencies(fn, arg, context) {
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	active_reaction = probe_reaction;
	tracking = true;
	active_dependency = null;
	try {
		fn(arg, context);
		return active_dependency;
	} catch (error) {
		// The caller creates its block and runs it normally, which throws again
		// where the block's own error handling sees it; the probe's
		// subscriptions must not outlive it.
		var recorded = /** @type {Dependency | null} */ (/** @type {unknown} */ (active_dependency));
		while (recorded !== null) {
			unlink_subscriber(recorded);
			recorded = recorded.n;
		}
		throw error;
	} finally {
		active_reaction = previous_reaction;
		tracking = previous_tracking;
		active_dependency = previous_dependency;
	}
}

/**
 * Makes `block` the reaction of a dependency chain recorded by a probe.
 * @param {Block} block
 * @param {Dependency} head
 */
export function adopt_dependencies(block, head) {
	block.d = head;
	for (
		var dependency = /** @type {Dependency | null} */ (head);
		dependency !== null;
		dependency = dependency.n
	) {
		dependency.r = block;
	}
}

/**
 * Calls `fn(arg)` with tracking off, so reads inside it subscribe nothing.
 * `tracking` is restored by the enclosing `run_block` if `fn` throws.
 * @param {(arg: any, context: any) => void} fn
 * @param {any} arg
 * @param {any} [context]
 */
export function run_untracked(fn, arg, context) {
	var previous_tracking = tracking;
	tracking = false;
	fn(arg, context);
	tracking = previous_tracking;
}

/**
 * Creates the effects a component registered while rendering, each under the
 * block and reaction that were active at its `effect()` call.
 * @param {any[]} effects flat triples: fn, block, reaction (see `user_effect`)
 */
function create_deferred_effects(effects) {
	// Creating an effect block only links and schedules it, so nothing here
	// can throw between saving and restoring the active block.
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var length = effects.length;
	for (var i = 0; i < length; i += 3) {
		active_block = /** @type {Block} */ (effects[i + 1]);
		active_reaction = /** @type {Block | Derived | null} */ (effects[i + 2]);
		effect(/** @type {Function} */ (effects[i]));
	}
	active_block = previous_block;
	active_reaction = previous_reaction;
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
 * @param {() => any} get_ref_value
 * @param {(value: any) => void} [set_ref_value]
 * @returns {(node: any) => void | (() => void)}
 */
export function create_ref_prop(get_ref_value, set_ref_value) {
	return create_core_ref_prop(() => untrack(get_ref_value), set_ref_value);
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
	var keys = own_keys(obj);
	/** @type {Record<string | symbol, unknown>} */
	var new_obj = {};

	for (const key of keys) {
		if (!exclude_keys.includes(key)) {
			new_obj[key] = obj[key];
		}
	}

	if (is_props(obj)) {
		return new_obj;
	}

	for (const symbol of get_own_property_symbols(obj)) {
		var ref_fn = obj[symbol];

		if (symbol.description === REF_PROP) {
			new_obj[symbol] = ref_fn;
		}
	}

	return new_obj;
}
