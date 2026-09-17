/** @import { AppendIntoAnchor, Block, Component, Dependency, BlockWithTryBoundaryAndCatch, DeferredTrackedEntry } from '#client' */
/** @import { NAMESPACE_URI } from './constants.js' */
/** @typedef {TrackedValue} Tracked */
/** @typedef {DerivedValue} Derived */

import { DEV } from 'esm-env';
import { block, destroy_block, destroy_non_branch_children } from './blocks.js';
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
	DEFAULT_NAMESPACE,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	SCHEDULED,
	SELECTOR,
	IF_BLOCK,
	COMPOSITE_BLOCK,
	ITEM_BLOCK,
	RELEASED,
	RENDER_ENTRY,
	CREATES_DERIVEDS,
	NAMESPACE_BLOCK,
	SVG_BLOCK,
} from './constants.js';
import { is_ripple_object } from './utils.js';
import { scope_orphan, set_in_derived, track_orphan, update_depth_exceeded } from './errors.js';
import { render_value } from './expression.js';
import { throw_invalid_component_type } from './component.js';

import {
	define_property,
	get_descriptor,
	is_array,
	object_keys,
} from '@tsrx/core/runtime/language-helpers';
import { hydrating, track_hash_reference } from './hydration.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
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
export let active_dependency = null;

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
 * @param {boolean} value
 */
export function set_mutating_allowed(value) {
	is_mutating_allowed = value;
}

/**
 * Handles a block whose run read a pending async value (see
 * `track-async.js`). Installed by the first `trackAsync()`, so an application
 * without one carries none of the boundary request machinery.
 * @type {((block: Block) => void) | null}
 */
let pending_read = null;

/**
 * @param {(block: Block) => void} fn
 */
export function set_pending_read_handler(fn) {
	pending_read = fn;
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
export function update_tracked_value_clock(tracked, value) {
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
 * Routes an error thrown by a block into the nearest boundary with a catch
 * branch (see `try.js`). Installed by the first `try_block`, so a bundle whose
 * mount and components create no boundary carries no catch machinery.
 * @type {((error: unknown, block: Block) => BlockWithTryBoundaryAndCatch | null) | null}
 */
let catch_router = null;

/**
 * @param {(error: unknown, block: Block) => BlockWithTryBoundaryAndCatch | null} fn
 */
export function set_catch_router(fn) {
	catch_router = fn;
}

/**
 * @param {unknown} error
 * @param {Block} block
 * @returns {BlockWithTryBoundaryAndCatch}
 */
export function handle_error(error, block) {
	var boundary_with_catch = catch_router === null ? null : catch_router(error, block);
	if (boundary_with_catch === null) {
		throw error;
	}
	return boundary_with_catch;
}

/**
 * The error path of {@link run_block}, kept out of that hot function so a
 * healthy mount never compiles it: routes real errors to the nearest catch
 * boundary, and a read of a pending async value to the handler `trackAsync`
 * installs (the read is registered as a dependency, so the block re-runs once
 * the value settles).
 * @param {unknown} error
 * @param {Block} block
 */
function handle_run_error(error, block) {
	finish_dependencies(block, active_dependency);
	if (error !== ASYNC_DERIVED_READ_THROWN) {
		handle_error(error, block);
	} else if (pending_read !== null) {
		pending_read(block);
	} else {
		throw error;
	}
}

/**
 * Clears what a block's previous run left behind before it runs again. A
 * list's children are all item branches, so there is nothing to sweep; an if
 * block's children are its branch, which it replaces itself only when the
 * condition changes. Returns the deriveds the previous run created, to be
 * released once the new run has destroyed whatever read them (an if block
 * swaps its branch inside its own run).
 * @param {Block} block
 * @returns {Derived[] | null}
 */
function prepare_rerun(block) {
	// A list, an if, a composite and a list item re-run only their own logic;
	// their child blocks (items, the branch's blocks, a dynamic element's
	// children, an item body's nested blocks) stay.
	if ((block.f & (FOR_BLOCK | IF_BLOCK | ITEM_BLOCK | COMPOSITE_BLOCK)) === 0) {
		destroy_non_branch_children(block);
	}
	run_teardown(block);
	return (block.f & CREATES_DERIVEDS) !== 0 ? take_created_deriveds(block) : null;
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
 * Runs the body of a branch block that was just created, in place of a first
 * `run_block`: a branch renders untracked, so the only bookkeeping its first
 * run needs is the globals the body reads and the dependencies a nested
 * `item` records on it (a list item re-runs through `run_block`, see
 * `run_item`). Errors are handled as `run_block` handles them.
 * @param {Block} block
 * @param {(anchor: any, value: any, index?: any, key?: any) => void} fn
 * @param {any} anchor
 * @param {any} value a list item's value, or its tracked
 * @param {any} [index] a list item's tracked index (see `create_item`)
 * @param {any} [key] a keyed list item's key
 */
export function run_branch(block, fn, anchor, value, index, key) {
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	var previous_component = active_component;

	try {
		active_block = block;
		active_reaction = block;
		active_component = block.co;
		tracking = false;
		active_dependency = null;
		fn(anchor, value, index, key);
		if (active_dependency !== null) {
			block.d = active_dependency;
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

/**
 * Runs `fn(block.s, arg)` as a rerun of `block` driven from outside it: an if
 * whose condition the enclosing render function evaluates renders its branch
 * this way. The function runs under the block, in the block's namespace, and
 * the deriveds the block's previous run created are released afterwards
 * unless still read, as `run_block` does for a rerun. An error propagates to
 * the caller's block.
 * @template S, A
 * @param {Block} block
 * @param {(state: S, arg: A) => void} fn
 * @param {A} arg
 */
export function run_in_block(block, fn, arg) {
	var previous_block = active_block;
	var previous_reaction = active_reaction;
	var previous_component = active_component;
	var previous_namespace = active_namespace;
	var previous_deriveds = (block.f & CREATES_DERIVEDS) !== 0 ? take_created_deriveds(block) : null;

	try {
		active_block = block;
		active_reaction = block;
		active_component = block.co;
		var ns = block.f & NAMESPACE_BLOCK;
		active_namespace = ns === 0 ? DEFAULT_NAMESPACE : ns === SVG_BLOCK ? 'svg' : 'mathml';
		fn(/** @type {S} */ (block.s), arg);
	} finally {
		active_block = previous_block;
		active_reaction = previous_reaction;
		active_component = previous_component;
		active_namespace = previous_namespace;
		if (previous_deriveds !== null) {
			keep_deriveds(block, release_deriveds(previous_deriveds));
		}
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
	var previous_namespace = active_namespace;
	/** @type {Derived[] | null} */
	var previous_deriveds = null;

	try {
		active_block = block;
		active_reaction = block;
		active_component = block.co;
		// The namespace the block was created in (see `create_block`): a rerun
		// from a flush is outside the `with_ns()` call that established it.
		var ns = block.f & NAMESPACE_BLOCK;
		active_namespace = ns === 0 ? DEFAULT_NAMESPACE : ns === SVG_BLOCK ? 'svg' : 'mathml';

		if (!first_run) {
			previous_deriveds = prepare_rerun(block);
		}

		tracking = (block.f & (ROOT_BLOCK | BRANCH_BLOCK)) === 0;
		active_dependency = null;
		var res = block.fn(block.s);

		if (typeof res === 'function') {
			register_teardown(block, res);
		}

		if (block.d === null) {
			// First run (or no dependencies so far): nothing stale to unlink.
			if (active_dependency !== null) {
				block.d = active_dependency;
			}
		} else {
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
		active_namespace = previous_namespace;

		// The previous run's deriveds, whether this run finished or threw, and
		// after this run's dependencies replaced the old ones (so a derived the
		// old run read is not kept alive by that stale link). Those still read
		// stay recorded under the block for its next rerun or destruction: a
		// rerun that keeps the same branch must not lose them.
		if (previous_deriveds !== null) {
			keep_deriveds(block, release_deriveds(previous_deriveds));
		}
	}
}

var empty_get_set = { get: undefined, set: undefined };

class TrackedValue {
	/**
	 * @param {any} v
	 * @param {Block} block
	 * @param {{ get?: Function; set?: Function | true }} a
	 * @param {string} [hash]
	 */
	constructor(v, block, a, hash) {
		/** @type {{ get?: Function; set?: Function | true }} */
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
	get value() {
		return get_tracked(this);
	}
	/** @param {any} v */
	set value(v) {
		set(this, v);
	}
}

class DerivedValue {
	/**
	 * @param {Function} fn
	 * @param {Block} block
	 * @param {{ get?: Function; set?: Function | true }} a
	 * @param {string} [hash]
	 */
	constructor(fn, block, a, hash) {
		/** @type {{ get?: Function; set?: Function | true }} */
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
	get value() {
		return get_derived(this);
	}
	/** @param {any} v */
	set value(v) {
		set(this, v);
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
 * @param {((next: any, prev: any) => any) | true} [set]
 * @returns {Tracked}
 */
export function tracked(v, block, hash, get, set) {
	var t = /** @type {Tracked} */ (
		new TrackedValue(v, block || active_block, get || set ? { get, set } : empty_get_set, hash)
	);
	if (HYDRATION && hydrating && hash !== undefined) {
		track_hash_reference.set(hash, t);
	}
	return t;
}

/**
 * @param {any} fn
 * @param {Block} block
 * @param {string} [hash]
 * @param {(value: any) => any} [get]
 * @param {((next: any, prev: any) => any) | true} [set]
 * @returns {Derived}
 */
export function derived(fn, block, hash, get, set) {
	var d = /** @type {Derived} */ (
		new DerivedValue(fn, block || active_block, get || set ? { get, set } : empty_get_set, hash)
	);
	// The run that creates a derived owns its release: when that block reruns
	// or is destroyed, the derived is unsubscribed from its sources unless a
	// reader that is still alive holds it (see `release_deriveds`).
	var creator = active_block;
	if (creator !== null) {
		var created = created_deriveds.get(creator);
		if (created === undefined) {
			created_deriveds.set(creator, [d]);
			creator.f |= CREATES_DERIVEDS;
		} else {
			created.push(d);
		}
	}
	if (HYDRATION && hydrating && hash !== undefined) {
		track_hash_reference.set(hash, d);
	}
	return d;
}

/**
 * The deriveds each block's latest run created, keyed by the block. A side
 * table rather than a block field: most blocks never create a derived, and
 * block creation is the hot path, so blocks keep their shape. A block with an
 * entry carries `CREATES_DERIVEDS` in its flags, so a rerun or destroy of any
 * other block never looks here.
 * @type {Map<Block, Derived[]>}
 */
var created_deriveds = new Map();

/**
 * Removes and returns the deriveds `block`'s latest run created, or null.
 * @param {Block} block
 * @returns {Derived[] | null}
 */
export function take_created_deriveds(block) {
	var deriveds = created_deriveds.get(block);
	block.f &= ~CREATES_DERIVEDS;
	if (deriveds === undefined) {
		return null;
	}
	created_deriveds.delete(block);
	return deriveds;
}

/**
 * Releases the deriveds a block run created, once that run's readers are
 * gone: the block reran (its previous run's readers were destroyed by the
 * rerun) or was destroyed. A derived that a live reader still holds (the
 * branch is still showing, or it was handed to a longer-lived scope) is
 * kept. Walked newest first, so a derived read by a later one of the same
 * run sees that reader unlinked before it is examined; the survivors are
 * packed into the tail of the same array as they are met, which leaves them
 * in creation order for the next pass, and slid to the front at the end.
 * @param {Derived[]} deriveds in creation order; reused for the result
 * @returns {Derived[] | null} the deriveds kept, in creation order, if any
 */
export function release_deriveds(deriveds) {
	var length = deriveds.length;
	var kept = length;
	for (var i = length - 1; i >= 0; i--) {
		var derived = deriveds[i];
		var alive = false;
		for (var sub = derived.sb; sub !== null; sub = sub.sn) {
			if ((sub.r.f & DESTROYED) === 0) {
				alive = true;
				break;
			}
		}
		if (alive) {
			// `kept` never drops below `i`, so this only overwrites visited slots.
			deriveds[--kept] = derived;
		} else {
			finish_dependencies(derived, null);
			destroy_computed_children(derived);
		}
	}
	if (kept === length) {
		return null;
	}
	if (kept !== 0) {
		deriveds.copyWithin(0, kept);
		deriveds.length = length - kept;
	}
	return deriveds;
}

/**
 * Records deriveds under `block` again after a rerun kept them, ahead of
 * whatever the new run created: the kept ones are older, and the release
 * order (newest first) relies on the list being in creation order.
 * @param {Block} block
 * @param {Derived[] | null} kept
 */
function keep_deriveds(block, kept) {
	if (kept === null) {
		return;
	}
	var created = created_deriveds.get(block);
	if (created !== undefined) {
		for (var i = 0; i < created.length; i++) {
			kept.push(created[i]);
		}
	}
	created_deriveds.set(block, kept);
	block.f |= CREATES_DERIVEDS;
}

/**
 * A read-only view of a tracked or derived value, for a receiver that should
 * read but not write it: a derived over a tracked (or a writable derived),
 * equivalent to `track(() => value.value)`; a read-only derived as it is; a
 * plain value as it is, like `get`. The view is owned by the block that
 * creates it, not by the value's block, so a view made in a component is
 * released with that component even when the value outlives it.
 * @param {any} value
 * @param {Block} [block]
 * @returns {any}
 */
export function track_read_only(value, block) {
	if (!is_ripple_object(value)) {
		return value;
	}
	var owner = block || /** @type {Block} */ (active_block);
	if ((value.f & DERIVED) !== 0) {
		var d = /** @type {Derived} */ (value);
		return d.a.set === undefined ? d : derived(() => get_derived(d), owner);
	}
	var t = /** @type {Tracked} */ (value);
	return derived(() => get_tracked(t), owner);
}

/**
 * @param {any} v
 * @param {Block} b
 * @param {string} [hash]
 * @param {(value: any) => any} [get]
 * @param {((next: any, prev: any) => any) | true} [set]
 * @returns {Tracked | Derived}
 */
export function track(v, b, hash, get, set) {
	// is_ripple_object(), inline: track() is on every component's cold path
	// (kept identical by tests/utils/inline-drift.test.js).
	if (typeof v === 'object' && v !== null && typeof v.f === 'number') {
		return v;
	}
	if (b === null) {
		track_orphan();
	}

	if (typeof v === 'function') {
		return derived(v, b, hash, get, set);
	}
	return tracked(v, b, hash, get, set);
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
			// Marking the derived's own subscribers first prunes its destroyed
			// readers, so a derived whose owner is gone and that nothing reads any
			// more is dropped on this write; one still read elsewhere keeps
			// forwarding notifications.
			mark_subscribers(derived);
			var derived_owner = derived.b;
			if (derived_owner !== null && (derived_owner.f & DESTROYED) !== 0 && derived.sb === null) {
				unlink_subscriber(dependency);
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

	// A branch never re-runs, except a list item that carries its render block.
	if ((flags & ITEM_BLOCK) === 0 && (flags & (ROOT_BLOCK | BRANCH_BLOCK)) !== 0) {
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

		var effect_kinds = 0;
		var has_render_blocks = false;

		for (var i = 0; i < length; i++) {
			var block = blocks[i];
			var flags = block.f;
			block.f = flags & ~SCHEDULED;
			var kind = flags & (PRE_EFFECT_BLOCK | EFFECT_BLOCK);
			if (kind !== 0) {
				effect_kinds |= kind;
			} else {
				has_render_blocks = true;
			}
		}

		// New schedules land in the queue that replaced `pending`, so the array
		// can be run in place. A queue mixing kinds needs the three-phase
		// ordering; one of a single kind (the common flush of render blocks,
		// the first flush of a mounted app's effects) runs straight through.
		if (
			effect_kinds === (PRE_EFFECT_BLOCK | EFFECT_BLOCK) ||
			(effect_kinds !== 0 && has_render_blocks)
		) {
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
		update_depth_exceeded();
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
 * @param {Derived | Tracked} tracked
 * @param {any} value
 */
export function set(tracked, value) {
	if (!is_mutating_allowed) {
		set_in_derived();
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
		if (typeof set === 'function') {
			value = untrack(() => set(value, old_value));
		} else if (DEV && set === undefined && (tracked.f & DERIVED) !== 0) {
			warn_readonly_derived_write(/** @type {Derived} */ (tracked));
		}

		tracked.__v = value;
		tracked.c = increment_clock();
		mark_subscribers(tracked);
	}
}

/** @type {WeakSet<object>} */
var warned_derived = new WeakSet();

/**
 * A derived created without a setter is read-only by contract (`Derived<V>`);
 * a write still lands as a temporary value until the next recompute, so in
 * development it is reported once per derived.
 * @param {Derived} derived
 */
function warn_readonly_derived_write(derived) {
	if (warned_derived.has(derived)) return;
	warned_derived.add(derived);
	console.warn(
		'Writing to a read-only derived. Create it with a setter, `track(fn, undefined, true)` or `track(fn, get, set)`, when it is meant to be written.',
	);
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
export function safe_scope(err) {
	if (active_scope === null) {
		scope_orphan(err);
	}

	return /** @type {Block} */ (active_scope);
}

export function create_component_ctx() {
	return {
		b: active_block,
		c: active_component === null ? null : active_component.c,
		e: null,
		m: false,
		p: active_component,
	};
}

/**
 * @returns {void}
 */
export function push_component() {
	active_component = create_component_ctx();
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
	// An optional component (an undefined prop, an import that resolved to
	// nothing) renders nothing; any other non-function is a programming error.
	if (fn == null) {
		return;
	}
	if (typeof fn !== 'function') {
		throw_invalid_component_type(fn);
	}

	// push_component, inline: one component per call is the common case.
	var parent = active_component;
	/** @type {Component} */
	var component = (active_component = {
		b: active_block,
		c: parent === null ? null : parent.c,
		e: null,
		m: false,
		p: parent,
	});

	// A module-level component carries its render function under a symbol
	// (see the compiler): calling it directly skips the element the component
	// would return only to be rendered here.
	var render = /** @type {any} */ (fn)[RENDER_ENTRY];
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
 * `probe_if`). Flagged destroyed so a write during the probe prunes
 * its subscription instead of scheduling it.
 * @type {any}
 */
var probe_reaction = { f: DESTROYED, d: null, blocks: null };

/**
 * Evaluates an if condition once, tracked, against a scratch reaction that is
 * never scheduled. When the evaluation recorded no dependency the condition
 * can never re-run (a block with no dependencies is never scheduled), so the
 * selected branch is rendered straight away, untracked, and true is returned:
 * the if needs no block. Otherwise the recorded links are unlinked again and
 * false is returned: the caller creates the block, whose own first run
 * evaluates the condition and subscribes it. The links are never handed to
 * the block, because a write during the block's first run (a child's setup,
 * a nested if) would prune links that still point at this destroyed reaction
 * before the block could take them over. A throwing condition (a pending
 * async read) unlinks what it recorded and rethrows.
 * @param {(x: any) => any} fn
 * @param {any} x
 * @param {Node | import('#client').AppendIntoAnchor} node
 * @returns {boolean} whether the branch was rendered without a block
 */
export function probe_if(fn, x, node) {
	var previous_reaction = active_reaction;
	var previous_tracking = tracking;
	var previous_dependency = active_dependency;
	active_reaction = probe_reaction;
	tracking = true;
	active_dependency = null;
	/** @type {Dependency | null} */
	var recorded;
	/** @type {any} */
	var branch;
	try {
		branch = fn(x);
		recorded = active_dependency;
	} catch (error) {
		unlink_dependencies(active_dependency);
		active_reaction = previous_reaction;
		tracking = previous_tracking;
		active_dependency = previous_dependency;
		throw error;
	}
	active_reaction = previous_reaction;
	active_dependency = previous_dependency;
	if (recorded !== null) {
		unlink_dependencies(recorded);
		tracking = previous_tracking;
		return false;
	}
	// The branch renders untracked, like a branch block would; `tracking` is
	// restored by the enclosing `run_block` if the branch throws.
	if (branch !== undefined) {
		tracking = false;
		branch(node, x);
	}
	tracking = previous_tracking;
	return true;
}

/**
 * @param {Dependency | null} dependency the head of a recorded chain
 */
function unlink_dependencies(dependency) {
	while (dependency !== null) {
		unlink_subscriber(dependency);
		dependency = dependency.n;
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
		// effect(), inline: one function less on every component's cold path
		// (kept identical by tests/utils/inline-drift.test.js).
		block(EFFECT_BLOCK, /** @type {Function} */ (effects[i]));
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
 * Sets the active namespace and returns the previous one, for setup code that
 * switches namespace part-way through a render function (the children of a
 * `foreignObject`), where a `with_ns()` thunk would hide its declarations.
 * `run_block` restores the namespace after the render function either way.
 * @param {keyof typeof NAMESPACE_URI} namespace
 * @returns {keyof typeof NAMESPACE_URI}
 */
export function set_ns(namespace) {
	var previous_namespace = active_namespace;
	active_namespace = namespace;
	return previous_namespace;
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
