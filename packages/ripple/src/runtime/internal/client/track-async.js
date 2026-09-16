/** @import { Block, DeferredTrackedEntry, Tracked } from '#client' */

import { pause_block, pre_effect } from './blocks.js';
import {
	ASYNC_DERIVED_READ_THROWN,
	DIRECT_CHILD_BLOCK,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	TRACKED,
	TRACKED_UPDATED,
	TRY_BLOCK,
} from './constants.js';
import { hydrating, track_hash_reference } from './hydration.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import {
	active_block,
	active_component,
	active_dependency,
	get,
	is_mutating_allowed,
	set_mutating_allowed,
	set_pending_read_handler,
	set_tracking,
	tracked,
	tracking,
	update_tracked_value_clock,
} from './runtime.js';
import { is_ripple_object } from './utils.js';
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
import { get_async_track_result } from '../../../utils/async.js';
import { get_track_async_script_id } from '../../../utils/track-async-serialization.js';
import { revive } from './transport.js';
import {
	pending_read_direct,
	track_async_argument,
	track_async_boundary,
	track_async_orphan,
} from './errors.js';

/**
 * `trackAsync()` and everything a pending async read sets in motion: boundary
 * requests, paused blocks, deferred rejections. The runtime reaches it through
 * a handler the first `trackAsync()` installs, so an application without one
 * ships none of it.
 */

var installed = false;

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

/**
 * A block's run read a pending async value (it threw
 * `ASYNC_DERIVED_READ_THROWN`, and the read was registered as a dependency):
 * the block pauses under its pending boundary until the value settles, and
 * a read straight from a component or boundary body is an error.
 * @param {Block} block
 */
function handle_pending_read(block) {
	var is_component_direct = active_component?.b === block;
	var is_try_fn_block =
		block.p !== null && (block.p.f & TRY_BLOCK) !== 0 && (block.f & DIRECT_CHILD_BLOCK) !== 0;

	if (is_component_direct || is_try_fn_block) {
		pending_read_direct(is_component_direct);
	}

	var boundary = get_pending_boundary(block);
	if (boundary === null) {
		return;
	}
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

/**
 * @param {any} fn
 * @param {Block} b
 * @param {string} hash - Unique hash for SSR serialization/hydration
 * @returns {Tracked | void}
 */
export function track_async(fn, b, hash) {
	if (!installed) {
		installed = true;
		set_pending_read_handler(handle_pending_read);
	}

	if (is_ripple_object(fn)) {
		return fn;
	}

	var target_block = b || active_block;
	if (target_block === null) {
		track_async_orphan();
	}

	if (typeof fn !== 'function') {
		track_async_argument();
	}

	// During hydration, attempt to read serialized data from SSR
	var had_hydration_data = false;
	var hydration_value;
	/** @type {string[] | undefined} */
	var hydration_deps;

	if (HYDRATION && hydrating) {
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
		track_async_boundary();
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
		set_mutating_allowed(true);

		var result;
		try {
			result = fn();
		} catch (e) {
			set_mutating_allowed(previous_is_mutating_allowed);
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
		set_mutating_allowed(previous_is_mutating_allowed);

		// Check if the result is async
		var previous_tracking = tracking;
		set_tracking(false);
		var async_result = get_async_track_result(result);
		set_tracking(previous_tracking);

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
