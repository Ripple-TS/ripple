/** @import { Block } from '#client' */
import { create_block, destroy_block, is_destroyed } from './blocks.js';
import { HYDRATION_ERROR } from '../../../constants.js';
import {
	hydrate_node,
	hydrating,
	hydration_context,
	set_hydration,
	set_hydration_context,
} from './hydration.js';
import { handle_error, with_block, with_ns, untrack, run_block } from './runtime.js';
import { BRANCH_BLOCK, DEFAULT_NAMESPACE, NAMESPACE_BLOCK, SVG_BLOCK } from './constants.js';

/**
 * Shared retained range. Trigger policy belongs to the caller (Activity or
 * Hydrate); discovery alone never makes a nested boundary eligible.
 * @typedef {{
 *   status: 'dehydrated' | 'queued' | 'hydrating' | 'hydrated' | 'destroyed';
 *   owner: Block; start: Comment; end: Comment; init: (() => void) | null;
 *   context: import('./hydration.js').HydrationContext | null;
 *   c?: () => void;
 * }} DeferredBoundary
 */
/**
 * Optional intent support, installed only when Hydrate is used.
 */
/** @type {((boundary: DeferredBoundary) => void) | null} */
var on_retain = null;
/**
 * @param {(boundary: DeferredBoundary) => void} observe
 */
export function observe_deferred(observe) {
	on_retain = observe;
}

/** @type {Set<DeferredBoundary>} */
var background = new Set();
/** @type {(() => void) | null} */
var cancel_task = null;

/**
 * @param {Block} owner
 * @param {() => void} init
 * @returns {DeferredBoundary}
 */
export function retain_boundary(owner, init) {
	var start = /** @type {Comment} */ (hydrate_node);
	var end = start;
	var depth = 0;
	while (end !== null) {
		if (end.nodeType === 8) {
			if (end.data.startsWith('[')) depth++;
			else if (end.data === ']' && --depth === 0) break;
		}
		end = /** @type {Comment} */ (end.nextSibling);
	}
	if (end === null) throw HYDRATION_ERROR;
	set_hydration(true, end);
	var boundary = /** @type {DeferredBoundary} */ ({
		status: 'dehydrated',
		owner,
		start,
		end,
		init,
		context: hydration_context,
	});
	on_retain?.(boundary);
	return boundary;
}

/**
 * @param {DeferredBoundary} boundary
 */
export function hydrate_boundary(boundary) {
	if (
		boundary.status === 'hydrating' ||
		boundary.status === 'hydrated' ||
		boundary.status === 'destroyed'
	)
		return;
	if (is_destroyed(boundary.owner)) return dispose_boundary(boundary);
	background.delete(boundary);
	if (background.size === 0) {
		cancel_task?.();
		cancel_task = null;
	}
	boundary.status = 'hydrating';
	var previous_hydrating = hydrating;
	var previous_node = hydrate_node;
	var previous_context = hydration_context;
	set_hydration(true, boundary.start.nextSibling ?? boundary.end);
	var context = boundary.context;
	set_hydration_context(context);
	var previous_recover = context?.recover;
	if (context !== null) context.recover = true;
	var ns = boundary.owner.f & NAMESPACE_BLOCK;
	try {
		with_ns(ns === 0 ? DEFAULT_NAMESPACE : ns === SVG_BLOCK ? 'svg' : 'mathml', () =>
			with_block(boundary.owner, () =>
				untrack(() => {
					var content = create_block(BRANCH_BLOCK, /** @type {() => void} */ (boundary.init));
					try {
						run_block(content, true);
					} catch (error) {
						if (is_destroyed(boundary.owner)) {
							destroy_block(content);
							return;
						}
						if (error !== HYDRATION_ERROR) throw error;
						// Discard only this boundary's partial client state and DOM.
						destroy_block(content, false);
						for (var node = boundary.start.nextSibling; node !== null && node !== boundary.end;) {
							var next = node.nextSibling;
							node.remove();
							node = next;
						}
						set_hydration(false, null);
						content = create_block(BRANCH_BLOCK, /** @type {() => void} */ (boundary.init));
						run_block(content, true);
					}
					// Setup can synchronously remove its own boundary. Dispose any
					// work created after that removal before queued effects run.
					if (is_destroyed(boundary.owner)) destroy_block(content);
				}),
			),
		);
		boundary.status = is_destroyed(boundary.owner) ? 'destroyed' : 'hydrated';
	} catch (error) {
		boundary.status = 'destroyed';
		handle_error(error, boundary.owner);
	} finally {
		if (context !== null) context.recover = previous_recover;
		boundary.init = null;
		boundary.context = null;
		boundary.c?.();
		boundary.c = undefined;
		set_hydration(previous_hydrating, previous_node);
		set_hydration_context(previous_context);
	}
}

/**
 * @param {DeferredBoundary} boundary
 */
export function dispose_boundary(boundary) {
	boundary.c?.();
	boundary.c = undefined;
	boundary.status = 'destroyed';
	boundary.init = null;
	boundary.context = null;
	background.delete(boundary);
	if (background.size === 0) {
		cancel_task?.();
		cancel_task = null;
	}
}

/**
 * @param {DeferredBoundary} boundary
 */
export function enqueue_boundary(boundary) {
	if (boundary.status !== 'dehydrated') return;
	boundary.status = 'queued';
	background.add(boundary);
	schedule_background();
}

function schedule_background() {
	if (cancel_task !== null || background.size === 0) return;
	var submitted_boundary = background.values().next().value;
	var cancelled = false;
	var started = false;
	var failed = false;
	/** @type {unknown} */
	var failure;
	var task = () => {
		if (cancelled || started) return;
		started = true;
		cancel_task = null;
		var boundary = failed ? submitted_boundary : background.values().next().value;
		try {
			// A submission error belongs to its original boundary. Promotion or
			// disposal can retire that work before this timer runs; never transfer
			// the stale error to a sibling that is still waiting.
			if (boundary === undefined || !background.delete(boundary)) return;
			if (failed) {
				dispose_boundary(boundary);
				if (!is_destroyed(boundary.owner)) handle_error(failure, boundary.owner);
			} else {
				hydrate_boundary(boundary);
			}
		} finally {
			schedule_background();
		}
	};
	var timer_task = () => {
		var timer = setTimeout(task, 0);
		cancel_task = () => {
			cancelled = true;
			clearTimeout(timer);
		};
	};
	/** @param {unknown} error */
	var rejected = (error) => {
		if (cancelled) return;
		if (started) {
			// The callback already routed this error and advanced the queue.
			// Report an uncaught error without consuming another boundary or
			// replacing the next task's cancellation handle.
			setTimeout(() => {
				throw error;
			});
			return;
		}
		// A rejected submission never enters the callback. Replace its handle
		// with a cancellable task that routes the error to the original owner
		// if still queued, then advances the queue without draining recursively.
		failed = true;
		failure = error;
		timer_task();
	};
	var scheduler =
		/** @type {{ scheduler?: { postTask: (fn: () => void, options: { priority: string, signal: AbortSignal }) => Promise<void> } }} */ (
			globalThis
		).scheduler;
	if (scheduler?.postTask) {
		var controller = new AbortController();
		cancel_task = () => {
			cancelled = true;
			controller.abort();
		};
		try {
			scheduler
				.postTask(task, { priority: 'background', signal: controller.signal })
				.catch(rejected);
		} catch (error) {
			rejected(error);
		}
	} else {
		timer_task();
	}
}
