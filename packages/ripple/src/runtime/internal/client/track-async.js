/** @import { Block, DeferredTrackedEntry, Tracked } from '#client' */

import { is_destroyed, pause_block, pre_effect } from './blocks.js';
import {
	ASYNC_DERIVED_READ_THROWN,
	DIRECT_CHILD_BLOCK,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
	TRACKED,
	TRACKED_UPDATED,
	TRY_BLOCK,
} from './constants.js';
import { hydrating, hydration_context, track_hash_reference } from './hydration.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import {
	active_block,
	queue_microtask,
	run_block,
	active_component,
	active_dependency,
	get,
	get_tracked_status,
	is_mutating_allowed,
	is_block_dirty,
	set_mutating_allowed,
	set_pending_read_handler,
	set_tracking,
	set_async_status,
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
import { with_async_owner } from './async-owner.js';
import { get_async_track_result, is_async_iterable } from '../../../utils/async.js';
import { get_track_async_script_id } from '../../../utils/track-async-serialization.js';
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
	var stale_hydration_data = false;
	var hydration_value;
	var continuing = false;
	/** @type {string[] | undefined} */
	var hydration_deps;

	if (HYDRATION && hydrating) {
		var context = /** @type {import('./hydration.js').HydrationContext} */ (hydration_context);
		var script_id = get_track_async_script_id(hash, context.id);
		var selector = 'script[id="' + script_id + '"]';
		var script_el =
			context.target.querySelector(selector) ??
			context.target.ownerDocument.getElementById(script_id);
		if (script_el) {
			var envelope = JSON.parse(/** @type {string} */ (script_el.textContent));
			script_el.remove();

			if (envelope.ok) {
				had_hydration_data = true;
				hydration_value =
					envelope.payload === undefined ? envelope.value : context.revive(envelope.payload);
				hydration_deps = envelope.deps;
				continuing = envelope.c === 1;
				// Deferred children may initialize after an ancestor changed a serialized dependency.
				if (
					context.recover &&
					hydration_deps?.some((hash) => {
						const status = hash[0] === '?';
						const dep = context.hashes.get(status ? hash.slice(1) : hash);
						const source = /** @type {Tracked | undefined} */ (dep);
						return (dep?.c ?? 0) > 0 || (status && ((source?.s ?? 0) & 4) !== 0);
					})
				) {
					stale_hydration_data = true;
				}
			} else {
				// trigger the catch block
				throw new Error(envelope.error?.message ?? 'Unknown server error');
			}
		}
	}

	var t = tracked(had_hydration_data ? hydration_value : SUSPENSE_PENDING, target_block, hash);

	// Completion has its own signal: finishing an iterator never republishes data.
	t.s = had_hydration_data ? (continuing ? 1 : 2) : 0;
	if (HYDRATION && had_hydration_data && hydration_context !== null) {
		var snapshots = (hydration_context.v ??= new Map());
		snapshots.set(t, [hydration_value, t.s]);
	}
	var accepted = hydration_value;
	var has_value = had_hydration_data;
	var resume = false;
	var retries = 0;
	/** @type {typeof import('./async-iterator.js') | undefined} */
	var stream_runtime;
	/** RPC function IDs already identified as iterable reads. */
	/** @type {Set<string> | undefined} */
	var reads;

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

	var async_block = pre_effect(() => {
		if (had_hydration_data) {
			// First run after hydration: skip fn() entirely (the SSR already
			// produced the resolved value) and instead register the direct
			// dependencies from the serialized deps list so future dep changes
			// trigger a re-run via the normal async path.
			had_hydration_data = false;
			if (hydration_deps !== undefined) {
				for (var i = 0; i < hydration_deps.length; i++) {
					var hash = hydration_deps[i];
					var status = hash[0] === '?';
					var dep_ref = track_hash_reference.get(status ? hash.slice(1) : hash);
					if (dep_ref !== undefined) {
						if (status) get_tracked_status(dep_ref);
						else get(dep_ref);
					}
				}
			}
			if (stale_hydration_data || continuing) {
				// Claim the SSR nodes with their serialized value first, then
				// reconcile current inputs after leaving the hydration context.
				const hydration_version = version;
				queue_microtask(() => {
					if (!is_destroyed(async_block) && version === hydration_version) {
						// Inputs can change after adoption but before continuation starts.
						try {
							resume = !stale_hydration_data && !is_block_dirty(async_block);
						} catch {
							resume = false;
						}
						run_block(async_block);
					}
				});
			}
			return;
		}

		/** @type {AbortController | null} */
		var current_abort_controller = null;
		/** @type {(() => void) | undefined} */
		var close;
		var retired = false;
		/** @type {import('./async-owner.js').AsyncOwner | undefined} */
		var owner;
		function get_owner() {
			if (owner === undefined) {
				current_abort_controller ??= new AbortController();
				if (retired) current_abort_controller.abort(TRACKED_UPDATED);
				owner = { s: current_abort_controller.signal, r: (reads ??= new Set()) };
			}
			return owner;
		}
		function cleanup() {
			retired = true;
			close?.();
			if (current_abort_controller !== null && current_abort_controller.signal.aborted === false) {
				current_abort_controller.abort(TRACKED_UPDATED);
			}
			if (async_block && is_destroyed(async_block)) {
				// This also owns requests from computations that suspended while
				// reading a dependency, before they could return a promise.
				complete_deferred_boundaries(t);
				if (request_id > 0) complete_boundary_request(boundary, request_id);
				request_id = 0;
			}
		}

		var current_version = ++version;

		// Abort previous in-flight request
		if (abort_controller !== null && abort_controller.signal.aborted === false) {
			abort_controller.abort(TRACKED_UPDATED);
		}
		abort_controller = null;

		var recovering = resume;
		resume = false;
		if (!recovering) {
			has_value = false;
			retries = 0;
			stream_runtime = undefined;
			reads = undefined;
		}

		// Manage boundary request: replace if in-flight, or begin new if previous completed
		if (!recovering && request_id > 0 && boundary !== null) {
			request_id = replace_boundary_request(boundary, request_id);
		} else if (!recovering && boundary !== null) {
			request_id = begin_boundary_request(boundary);
		}

		// Set to pending before calling fn() in case it's sync.
		if (!recovering) set_async_status(t, 0);
		if (!recovering && t.__v !== SUSPENSE_PENDING) {
			update_tracked_value_clock(t, SUSPENSE_PENDING);
		}

		// Temporarily allow mutations so set() doesn't throw inside the pre-effect
		var previous_is_mutating_allowed = is_mutating_allowed;
		set_mutating_allowed(true);

		var result;
		try {
			result = with_async_owner(get_owner, fn, undefined, accepted);
		} catch (e) {
			set_mutating_allowed(previous_is_mutating_allowed);
			if (e === ASYNC_DERIVED_READ_THROWN) {
				// A dependency is still pending or rejected (e.g. chained trackAsync).
				// Check if any dependency is rejected — if so, propagate rejection.
				var dep = active_dependency;
				while (dep !== null) {
					if (dep.t.__v === SUSPENSE_REJECTED) {
						set_async_status(t, 3);
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
						set_async_status(t, 3);
						update_tracked_value_clock(t, SUSPENSE_REJECTED);
					});
				}
				return cleanup;
			}
			set_async_status(t, 3);
			update_tracked_value_clock(t, SUSPENSE_REJECTED);
			cleanup();
			throw e;
		}
		set_mutating_allowed(previous_is_mutating_allowed);

		// Check if the result is async
		var previous_tracking = tracking;
		set_tracking(false);
		var async_result;
		try {
			async_result = get_async_track_result(result);
		} catch (error) {
			set_async_status(t, 3);
			update_tracked_value_clock(t, SUSPENSE_REJECTED);
			cleanup();
			throw error;
		} finally {
			set_tracking(previous_tracking);
		}

		if (async_result === null) {
			// Sync result
			accepted = result;
			has_value = true;
			set_async_status(t, 2);
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
		if (async_result.abort_controller !== null) {
			const supplied = async_result.abort_controller;
			if (current_abort_controller === null) current_abort_controller = supplied;
			else {
				const controller = /** @type {AbortController} */ (current_abort_controller);
				controller.signal.addEventListener(
					'abort',
					() => supplied.abort(controller.signal.reason),
					{ once: true },
				);
				if (supplied.signal.aborted) controller.abort(supplied.signal.reason);
				else
					supplied.signal.addEventListener(
						'abort',
						() => controller.abort(supplied.signal.reason),
						{ once: true },
					);
			}
		}
		abort_controller = current_abort_controller;

		function current() {
			return !retired && current_version === version && !is_destroyed(async_block);
		}

		/** @param {any} value */
		function publish(value) {
			if (!current()) return;
			accepted = value;
			has_value = true;
			update_tracked_value_clock(t, value);
			complete_deferred_boundaries(t);
			if (request_id > 0 && boundary !== null) {
				complete_boundary_request(boundary, request_id);
				request_id = 0;
			}
		}

		/** @param {any} error */
		function reject(error) {
			if (!current()) return;
			if (error === TRACKED_UPDATED || current_abort_controller?.signal.reason === TRACKED_UPDATED)
				return;
			set_async_status(t, 3);
			update_tracked_value_clock(t, SUSPENSE_REJECTED);
			complete_deferred_boundaries(t, false);
			var boundary_with_catch = get_boundary_with_catch(call_site_block);
			if (boundary_with_catch !== null) handle_boundary_error(boundary_with_catch, error);
			if (request_id > 0 && boundary !== null) {
				complete_boundary_request(boundary, request_id, boundary_with_catch !== boundary);
				request_id = 0;
			}
		}

		/** @param {any} error */
		function fail(error) {
			if (!current()) return;
			const retry = stream_runtime?.retry(error, retries, () => {
				if (!current()) return;
				resume = true;
				run_block(async_block);
			});
			if (retry) {
				retries++;
				close = retry;
			} else reject(error);
		}

		Promise.resolve(async_result.promise)
			.then(async (resolved) => {
				if (is_async_iterable(resolved)) {
					// Keep iteration/recovery off the ordinary promise's execution path.
					const runtime = await import('./async-iterator.js');
					if (current()) stream_runtime = runtime;
					close = runtime.consume(
						resolved,
						current,
						(value) => {
							set_async_status(t, 1);
							publish(value);
						},
						() => {
							if (!has_value) {
								reject(new Error('trackAsync() source completed without a value'));
							} else {
								if (t.__v === SUSPENSE_PENDING) publish(accepted);
								set_async_status(t, 2);
							}
						},
						fail,
						get_owner,
					);
					if (!current()) close();
				} else if (current()) {
					set_async_status(t, 2);
					publish(resolved);
				}
			})
			.catch(fail);

		return cleanup;
	});

	return t;
}
