/** @import { Block, Component, TryState } from '#client' */
import { branch, is_destroyed } from './internal/client/blocks.js';
import { activity_hidden } from './internal/client/activity-state.js';
import { TRY_BLOCK } from './internal/client/constants.js';
import {
	active_block,
	active_component,
	flush_sync,
	is_render_idle,
	set_render_observer,
} from './internal/client/runtime.js';

/** @type {Set<() => void>} */
var waiting = new Set();

function notify() {
	for (var check of waiting) check();
}

/** @param {() => void} check */
function stop_waiting(check) {
	waiting.delete(check);
	if (waiting.size === 0) set_render_observer(null);
}

/**
 * Components can share a block, so request origins are filtered by component
 * ancestry. A pending boundary can also live above the captured subtree.
 * @param {Block} owner
 * @param {Component} component
 * @returns {boolean}
 */
function has_pending_requests(owner, component) {
	/** @param {Block | null} origin */
	function relevant(origin) {
		if (origin === null || is_destroyed(origin) || activity_hidden(origin)) return false;
		for (var context = origin.co; context !== null; context = context.p) {
			if (context === component) return true;
		}
		return false;
	}
	/** @param {TryState} state */
	function contains_request(state) {
		if (state.si !== null && relevant(state.b)) return true;
		for (var origin of state.q.values()) {
			if (relevant(origin)) return true;
		}
		return false;
	}
	/** @param {Block} block @returns {boolean} */
	function visit(block) {
		if ((block.f & TRY_BLOCK) !== 0 && contains_request(block.s)) return true;
		for (var child = block.first; child !== null; child = child.next) {
			if (visit(child)) return true;
		}
		return false;
	}
	if (visit(owner)) return true;
	for (var block = owner.p; block !== null; block = block.p) {
		if ((block.f & TRY_BLOCK) !== 0 && contains_request(block.s)) return true;
	}
	return false;
}

/** @returns {import('#public').RenderObserver} */
export function createRenderObserver() {
	if (active_block === null || active_component === null)
		throw new Error('createRenderObserver() must be called during initialization.');
	var owner = active_block;
	var component = active_component;
	var disposed = false;
	/** @type {null | ((rendered: boolean) => void)} */
	var settle_current = null;
	var dispose = () => {
		disposed = true;
		settle_current?.(false);
	};
	// Register teardown immediately, even if no deferred user effect ever runs.
	branch(() => dispose);

	return {
		dispose,
		run(update) {
			settle_current?.(false);
			if (disposed || is_destroyed(owner)) return Promise.resolve(false);
			return new Promise((resolve, reject) => {
				var armed = false;
				var settle = (/** @type {boolean} */ rendered) => {
					stop_waiting(check);
					if (settle_current === settle) {
						settle_current = null;
					}
					resolve(rendered);
				};
				var check = () => {
					if (!armed || !is_render_idle()) return;
					if (disposed || is_destroyed(owner)) return settle(false);
					if (has_pending_requests(owner, component)) return;
					settle(true);
				};
				settle_current = settle;
				waiting.add(check);
				set_render_observer(notify);
				try {
					var failed = false;
					/** @type {unknown} */
					var failure;
					flush_sync(() => {
						try {
							update();
						} catch (error) {
							failed = true;
							failure = error;
						}
					});
					// Drain writes made before a failed updater so later runs do not
					// inherit abandoned scheduled blocks. Observation does not roll back.
					if (failed) throw failure;
					armed = true;
					check();
				} catch (error) {
					stop_waiting(check);
					if (settle_current === settle) {
						settle_current = null;
					}
					reject(error);
				}
			});
		},
	};
}
