/** @import { Block, Component, Dependency, Derived, Tracked } from '#client' */
/** @import { NAMESPACE_URI } from './constants.js' */

import { DEV } from 'esm-env';
import { destroy_block, destroy_non_branch_children, effect, is_destroyed } from './blocks.js';
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
	ROOT_BLOCK,
	TRACKED,
	TRY_BLOCK,
	UNINITIALIZED,
	REF_PROP,
	TRACKED_OBJECT,
	DEFAULT_NAMESPACE,
	DERIVED_UPDATED,
	SUSPENSE_PENDING,
	SUSPENSE_ERROR,
} from './constants.js';
import {
	begin_boundary_request,
	complete_boundary_request,
	get_pending_boundary,
	register_boundary_deferred,
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

/** @type {Map<Tracked, any>} */
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
/** @type {null | Block} */
let active_async_source_block = null;

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
 * @param {() => void} fn
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
 * @param {any} value
 * @returns {value is PromiseLike<any>}
 */
function is_promise_like(value) {
	return (
		(typeof value === 'object' || typeof value === 'function') &&
		value !== null &&
		typeof value.then === 'function'
	);
}

/**
 * @param {any} value
 * @param {'deferred'} [type]
 * @returns {{ promise: PromiseLike<any>, abort_controller: AbortController | null, type?: 'deferred' } | null}
 */
function get_async_track_result(value, type) {
	if (is_promise_like(value)) {
		return { promise: value, abort_controller: null, type: type };
	}

	if (typeof value === 'object' && value !== null && is_promise_like(value.promise)) {
		return {
			promise: value.promise,
			abort_controller:
				typeof value.abortController === 'object' && value.abortController !== null
					? value.abortController
					: null,
			type: type,
		};
	}

	return null;
}

/**
 * @param {Derived} computed
 * @returns {void}
 */
function clear_prev_async_request(computed) {
	abort_async_derived_request(computed);

	if (computed.aq) {
		complete_boundary_request(computed.at, computed.ai, false);
	}

	computed.aa = null;
	computed.ap = null;
	computed.aq = false;
	// Preserve computed.as so dirty-check re-evaluations can find the boundary
	computed.at = null;
	computed.ai = 0;
	// Do not clear dr/dj here — they are managed by the self-chain block
	// in normalize_derived_value and by settle_async_derived.
}

/**
 * @param {Derived} computed
 * @returns {boolean}
 */
function abort_async_derived_request(computed) {
	var abort_controller = computed.aa;
	if (abort_controller?.signal.aborted === false) {
		abort_controller.abort(DERIVED_UPDATED);
		return true;
	}
	return false;
}

/**
 * @param {Derived} computed
 * @param {number} version
 * @param {boolean} fulfilled
 * @param {any} value
 * @param {AbortController | null} abort_controller
 * @returns {void}
 */
function settle_async_derived(computed, version, fulfilled, value, abort_controller) {
	if (computed.av !== version) {
		return;
	}

	var source_block = computed.as;
	var boundary = computed.at;
	var request_id = computed.ai;
	var contributes_pending = computed.aq;
	var is_internal_abort =
		value === DERIVED_UPDATED || abort_controller?.signal?.reason === DERIVED_UPDATED;

	computed.aa = null;
	computed.ap = null;
	computed.aq = false;
	// Preserve computed.as so dirty-check re-evaluations can find the boundary
	computed.at = null;
	computed.ai = 0;
	computed.dr = null;
	computed.dj = null;

	if (
		source_block === null ||
		is_destroyed(source_block) ||
		(boundary !== null && is_destroyed(boundary))
	) {
		return;
	}

	if (fulfilled) {
		var has_changed = value !== computed.__v || !computed.ah;
		var should_schedule = has_changed && source_block !== null && !is_destroyed(source_block);

		if (has_changed) {
			computed.__v = value;
			computed.c = increment_clock();
		}
		computed.ah = true;

		if (contributes_pending) {
			if (should_schedule) {
				// Defer boundary completion until after the block flush so that
				// chained async deriveds evaluated during re-render can start new
				// requests, keeping the boundary in pending mode and avoiding
				// a visible pending → resolved → pending flicker.
				queue_post_block_flush_callback(() => {
					complete_boundary_request(boundary, request_id);
				});
			} else {
				complete_boundary_request(boundary, request_id);
			}
		}

		if (should_schedule) {
			schedule_update(source_block);
		}

		return;
	}

	if (is_internal_abort) {
		if (contributes_pending) {
			complete_boundary_request(boundary, request_id, false);
		}
		return;
	}

	// For rejection: mark the derived as errored so downstream reads don't
	// treat it as still pending. Don't increment clock — we don't want to
	// trigger re-runs of dependent deriveds or blocks.
	computed.__v = SUSPENSE_ERROR;

	// Complete the pending request first, then route the error.
	// If complete_boundary_request returns false, the request was already cleared
	// (e.g. by handle_error from a prior rejection) — skip error routing to
	// avoid double-catch.
	if (contributes_pending) {
		var completed = complete_boundary_request(boundary, request_id, false);
		if (!completed) {
			return;
		}
	}

	if (boundary !== null && !is_destroyed(boundary) && boundary.s && boundary.s.c) {
		boundary.s.c(value);
	} else if (!is_destroyed(source_block)) {
		handle_error(value, source_block);
	}
}

/**
 * @param {Derived} computed
 * @param {any} value
 * @param {Block | null} source_block
 * @param {'deferred' | undefined} type
 * @returns {any}
 */
function normalize_derived_value(computed, value, source_block, type) {
	// Temporarily disable tracking so that is_promise_like checks (which access .then
	// on potentially Proxy-wrapped values like RippleArray) don't register spurious
	// dependencies on the derived being evaluated.
	var previous_tracking = tracking;
	tracking = false;
	var async_result = get_async_track_result(value, type);
	tracking = previous_tracking;

	// If this derived has saved resolve/reject from a prior ASYNC_DERIVED_READ_THROWN,
	// chain the deferred  to the real result so when the real settles,
	// it will settle the synthetic deferred that was created to keep the pending state
	// until running the async derived succeeds without ASYNC_DERIVED_READ_THROWN and the
	// real promise is produced and settles.
	// The old settle will no-op on version mismatch once clear_prev_async_request bumps the
	// version below, so we just fall through to the normal machinery.
	if (computed.dr !== null && async_result?.type !== 'deferred') {
		// This is the real promise result vs the synthetic `deferred`
		if (async_result !== null) {
			// the function passed to track.async returned a promise
			async_result.promise.then(computed.dr, computed.dj);
		} else {
			// regular derived that previously threw ASYNC_DERIVED_READ_THROWN
			computed.dr(value);
		}
		computed.dr = null;
		computed.dj = null;
	}

	if (async_result === null) {
		clear_prev_async_request(computed);
		computed.ah = true;
		return value;
	}

	// When run_derived is called from dirty-checking (is_block_dirty → is_tracking_dirty →
	// update_derived), there is no active block context so source_block will be null.
	// Fall back to the previously stored source block from the last async request.
	if (source_block === null && computed.as !== null && !is_destroyed(computed.as)) {
		source_block = computed.as;
	}

	var boundary = source_block === null ? null : get_pending_boundary(source_block);

	if (source_block !== null && boundary === null) {
		throw new Error('Missing parent `try { ... } pending { ... }` statement');
	}

	var version = computed.av + 1;
	var contributes_pending = !computed.ah;
	var abort_controller = async_result.abort_controller;
	var should_begin_request = contributes_pending && boundary !== null;
	var has_pending_request = computed.aq;
	var request_id = 0;

	if (has_pending_request && should_begin_request) {
		// Replacing one async request with another on the same boundary.
		// e.g. deferred synthetic promise with the real one, or cancelling the previous and start new
		abort_async_derived_request(computed);
		request_id = replace_boundary_request(/** @type {Block} */ (boundary), computed.ai);
	} else {
		// No active request to replace — clear old state and maybe start fresh.
		clear_prev_async_request(computed);
		request_id = should_begin_request ? begin_boundary_request(/** @type {Block} */ (boundary)) : 0;
	}

	computed.av = version;
	computed.aa = abort_controller;
	computed.ap = async_result.promise;
	computed.aq = contributes_pending;
	computed.as = source_block;
	computed.at = boundary;
	computed.ai = request_id;

	/**
	 * @param {boolean} fulfilled
	 * @param {any} result
	 */
	const settle = (fulfilled, result) => {
		try {
			settle_async_derived(computed, version, fulfilled, result, abort_controller);
		} catch (error) {
			queue_microtask(() => {
				throw error;
			});
		}
	};

	// Register the deferred reject with the boundary so that if the
	// boundary enters catch mode (from another derived rejecting),
	// it can reject this deferred and trigger proper cleanup.
	// Must be after computed.at and computed.ai are populated
	if (
		async_result.type === 'deferred' &&
		computed.at !== null &&
		computed.ai !== 0 &&
		computed.dj !== null
	) {
		register_boundary_deferred(computed.at, computed.ai, computed.dj);
	}

	async_result.promise.then(
		(resolved) => {
			settle(true, resolved);
		},
		(error) => {
			settle(false, error);
		},
	);

	return contributes_pending ? SUSPENSE_PENDING : computed.__v;
}

/**
 * @param {Derived} computed
 */
function run_derived(computed) {
	var source_block = active_async_source_block ?? active_block;
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;
	var previous_is_mutating_allowed = is_mutating_allowed;
	var previous_async_source_block = active_async_source_block;

	try {
		active_block = computed.b;
		active_reaction = computed;
		tracking = true;
		active_dependency = null;
		active_component = computed.co;
		is_mutating_allowed = false;
		active_async_source_block = source_block;

		destroy_computed_children(computed);

		var value = computed.fn();

		computed.d = active_dependency;

		return normalize_derived_value(computed, value, source_block, undefined);
	} catch (error) {
		computed.d = active_dependency;
		if (error === ASYNC_DERIVED_READ_THROWN) {
			if (computed.ia && !computed.dr && !computed.dj) {
				// Only trackAsync deriveds need a deferred boundary request.
				// Only create the synthetic promise once in case
				// there are multiple async dependencies used in the derived
				var deferred_promise = new Promise((resolve, reject) => {
					computed.dr = resolve;
					computed.dj = reject;
				});

				return normalize_derived_value(computed, deferred_promise, source_block, 'deferred');
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
		active_async_source_block = previous_async_source_block;
	}
}

/**
 * @param {unknown} error
 * @param {Block} block
 */
export function handle_error(error, block) {
	/** @type {Block | null} */
	var current = block;

	while (current !== null) {
		var state = current.s;
		if ((current.f & TRY_BLOCK) !== 0) {
			if (state.c !== null) {
				state.c(error);
				return;
			}
		}
		current = current.p;
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
		block.d = active_dependency;
		// When a derived read throws ASYNC_DERIVED_READ_THROWN, it means the
		// derived is still SUSPENSE_PENDING. The dependency was already registered,
		// so we swallow the throw and let the parent continue processing. When
		// the derived settles, the block will be dirty and rerun automatically.
		if (error !== ASYNC_DERIVED_READ_THROWN) {
			handle_error(error, block);
		} else if (active_component?.b === block) {
			throw new Error(
				'Reads on pending tracked values directly inside component body are prohibited. Use #ripple.trackPending() test for safe access or create another derived instead.',
			);
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
 *
 * @param {any} v
 * @param {Block} block
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Tracked}
 */
export function tracked(v, block, get, set) {
	// TODO: now we expose tracked, we should likely block access in DEV somehow
	if (DEV) {
		return {
			DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY: true,
			a: get || set ? { get, set } : empty_get_set,
			b: block || active_block,
			c: 0,
			f: TRACKED,
			__v: v,
		};
	}

	return {
		a: get || set ? { get, set } : empty_get_set,
		b: block || active_block,
		c: 0,
		f: TRACKED,
		__v: v,
	};
}

/**
 * @param {any} fn
 * @param {any} block
 * @param {(value: any) => any} [get]
 * @param {(next: any, prev: any) => any} [set]
 * @returns {Derived}
 */
export function derived(fn, block, get, set) {
	if (DEV) {
		return {
			DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY: true,
			a: get || set ? { get, set } : empty_get_set,
			aa: null,
			ap: null,
			aq: false,
			as: null,
			at: null,
			ai: 0,
			av: 0,
			ah: false,
			dr: null,
			dj: null,
			ia: false,
			b: block || active_block,
			blocks: null,
			c: 0,
			co: active_component,
			d: null,
			f: TRACKED | DERIVED,
			fn,
			__v: UNINITIALIZED,
		};
	}

	return {
		a: get || set ? { get, set } : empty_get_set,
		aa: null,
		ap: null,
		aq: false,
		as: null,
		at: null,
		ai: 0,
		av: 0,
		ah: false,
		dr: null,
		dj: null,
		ia: false,
		b: block || active_block,
		blocks: null,
		c: 0,
		co: active_component,
		d: null,
		f: TRACKED | DERIVED,
		fn,
		__v: UNINITIALIZED,
	};
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

/** *
 * @param {any} v
 * @param {Block} b
 * @param {boolean} [is_eager]
 * @returns {Derived | void}
 */
export function track_async(v, b, is_eager = false) {
	if (is_ripple_object(v)) {
		return v;
	}

	var target_block = b || active_block;
	if (target_block === null) {
		throw new TypeError('trackAsync() requires a valid component context');
	}

	if (typeof v !== 'function') {
		throw new TypeError(
			'trackAsync() only accepts function arguments that return a promise or an object with a promise property',
		);
	}

	var d = derived(v, target_block, undefined, undefined);
	d.ia = true;
	if (is_eager) {
		// is_eager should only be true if there is no assignment
		// and the derived cannot be used anywhere else
		// so we have to run it immediately as otherwise it would never run
		update_derived(d);
		return;
	}
	return d;
}

/**
 * @param {(Derived | Tracked) | (() => any)} tracked
 * @returns {boolean}
 */
export function is_tracked_pending(tracked) {
	try {
		if (typeof tracked === 'function') {
			tracked();
			return false;
		} else {
			get(tracked);
			return false;
		}
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
 * @param {Record<string|symbol, any>} v
 * @param {(symbol | string)[]} l
 * @param {Block} b
 * @returns {Tracked[]}
 */
export function track_split(v, l, b) {
	var is_tracked = is_ripple_object(v);

	if (is_tracked || typeof v !== 'object' || v === null || is_array(v)) {
		throw new TypeError('Invalid value: expected a non-tracked object');
	}

	/** @type {Tracked[]} */
	var out = [];
	/** @type {Record<string|symbol, any>} */
	var rest = {};
	/** @type {Record<PropertyKey, 1>} */
	var done = {};
	var props = Reflect.ownKeys(v);

	for (let i = 0, key, t; i < l.length; i++) {
		key = l[i];

		if (props.includes(key)) {
			if (is_ripple_object(v[key])) {
				t = v[key];
			} else {
				t = tracked(undefined, b);
				t = define_property(t, '__v', /** @type {PropertyDescriptor} */ (get_descriptor(v, key)));
			}
		} else {
			t = tracked(undefined, b);
		}

		out[i] = t;
		done[key] = 1;
	}

	for (let i = 0, key; i < props.length; i++) {
		key = props[i];
		if (done[key]) {
			continue;
		}
		define_property(rest, key, /** @type {PropertyDescriptor} */ (get_descriptor(v, key)));
	}

	out.push(tracked(rest, b));

	return out;
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
			update_derived(/** @type {Derived} **/ (tracked));
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
			if ((flags & EFFECT_BLOCK) !== 0) {
				effects.push(current);
			} else {
				try {
					if (is_block_dirty(current)) {
						run_block(current);
					}
				} catch (error) {
					handle_error(error, current);
				}
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

	var length = effects.length;

	for (var i = 0; i < length; i++) {
		var effect = effects[i];
		var flags = effect.f;

		try {
			if ((flags & (PAUSED | DESTROYED)) === 0 && is_block_dirty(effect)) {
				run_block(effect);
			}
		} catch (error) {
			handle_error(error, effect);
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
		flush_count = 0;
		return;
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
function queue_post_block_flush_callback(fn) {
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
 * @param {Tracked} tracked
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

	// When an async-capable derived is read from a new block context (e.g. after a try
	// branch re-render), update the stored source block so that future async requests
	// from dirty-checking (where active_block is null) can find the correct boundary.
	if (computed.ah && active_block !== null) {
		var current_source = active_async_source_block ?? active_block;
		if (current_source !== null && current_source !== computed.as) {
			computed.as = current_source;
			computed.at = get_pending_boundary(current_source);
		}
	}

	if (tracking) {
		register_dependency(computed);
	}

	// When the derived is still pending or errored, throw to bail out of the
	// current block so the rest of the component tree can continue processing
	// (avoiding waterfalls). We check `__v === SUSPENSE_PENDING` rather than `aq`
	// because users can temporarily overwrite `__v` on a derived, in which case
	// the processing should continue without throwing since we assume that the values
	// are consistent with the code's logic.
	if (computed.__v === SUSPENSE_PENDING || computed.__v === SUSPENSE_ERROR) {
		throw ASYNC_DERIVED_READ_THROWN;
	}

	var value = computed.__v;
	var get = computed.a.get;
	if (get !== undefined) {
		value = trigger_track_get(get, value);
		computed.__v = value;
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
		: get_tracked(tracked);
}

/**
 * @param {Tracked} tracked
 */
export function get_tracked(tracked) {
	var value = tracked.__v;
	if (tracking) {
		register_dependency(tracked);
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
 * Returns the raw internal value of a tracked/derived without registering dependencies.
 * Used by compiled trackAsync guards to check for SUSPENSE_PENDING.
 * @param {Tracked | Derived} tracked
 * @returns {any}
 */
export function get_tracked_raw(tracked) {
	return tracked.__v;
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
			'Assignments or updates to tracked values are not allowed during computed "#ripple.track(() => ...)" evaluation',
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
