/** @import { AppendIntoAnchor, Block } from '#client' */
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import { branch, pause_block, render, resume_block } from './blocks.js';
import { active_block, queue_microtask, untrack, get } from './runtime.js';
import { H, hydrating, hydrate_node } from './hydration.js';
import { append } from './template.js';
import { expression } from './expression.js';
import { tsrx_element } from '../../element.js';
import {
	activity_hidden,
	observe_activity_updates,
	observe_activity_styles,
	set_activity_restorer,
} from './activity-state.js';
import {
	hide_activity,
	reveal_activity,
	restore_activity_html,
	update_activity_style,
} from './activity-dom.js';

/** @typedef {{ activity: true, start: Comment, end: Comment, hidden: boolean, nodes: Set<Node>, owner: Block, deferred: import('./deferred.js').DeferredBoundary | null }} ActivityState */
/** @param {Block} block @returns {ActivityState | undefined} */
function get_activity(block) {
	return block.s?.activity === true ? block.s : undefined;
}

/** @param {ActivityState} state */
function update_dom(state) {
	if (state.hidden) hide_activity(state.owner, state.start, state.end, state.nodes);
	else reveal_activity(state.nodes);
}

/** @param {Block} block */
function update_ancestors(block) {
	/** @type {Block | null} */
	var current = block;
	for (; current !== null; current = current.p) {
		var state = get_activity(current);
		if (state !== undefined) update_dom(state);
	}
}

/** @param {ActivityState} state */
function queue_activation(state) {
	const deferred = state.deferred;
	if (HYDRATION && deferred !== null) {
		queue_microtask(() => {
			if (!activity_hidden(state.owner))
				/** @type {import('./hydrate.js').HydrationRuntime} */ (H).y(deferred);
		});
	}
}

/** @param {Block} owner */
function promote_descendants(owner) {
	for (var child = owner.first; child !== null; child = child.next) {
		var state = get_activity(child);
		if (state?.hidden) continue;
		if (state !== undefined) queue_activation(state);
		promote_descendants(child);
	}
}

/** @param {import('#public').ActivityProps} props */
export function Activity(props) {
	return tsrx_element((/** @type {ChildNode | AppendIntoAnchor} */ anchor) => {
		branch(() => {
			var owner = /** @type {Block} */ (active_block);
			/** @type {ActivityState} */
			var state = {
				activity: true,
				start: /** @type {Comment} */ (/** @type {unknown} */ (null)),
				end: /** @type {Comment} */ (/** @type {unknown} */ (null)),
				hidden: untrack(() => get(/** @type {any} */ (props.mode)) === 'hidden'),
				nodes: new Set(),
				owner,
				deferred: null,
			};
			owner.s = state;
			observe_activity_updates(update_ancestors);
			observe_activity_styles(update_activity_style);
			set_activity_restorer(restore_activity_html);
			var init = () => {
				if (HYDRATION && hydrating) restore_activity_html(state.start, state.end);
				expression(
					HYDRATION && hydrating ? /** @type {Node} */ (hydrate_node) : state.end,
					() => props.children,
				);
			};
			if (HYDRATION && hydrating) {
				var runtime = /** @type {import('./hydrate.js').HydrationRuntime} */ (H);
				state.deferred = runtime.r(owner, init);
				state.start = state.deferred.start;
				state.end = state.deferred.end;
			} else {
				state.start = document.createComment('[a');
				state.end = document.createComment(']');
				append(anchor, state.start);
				append(anchor, state.end);
				branch(init);
			}
			render(() => {
				var hidden = get(/** @type {any} */ (props.mode)) === 'hidden';
				while (state.hidden !== hidden) {
					state.hidden = hidden;
					if (hidden) pause_block(owner, true);
					else {
						resume_block(owner, true);
						promote_descendants(owner);
					}
					// Cleanup can synchronously change mode (and even flush). Reconcile
					// that change here, after the cleanup's departing-value view ends.
					hidden = get(/** @type {any} */ (props.mode)) === 'hidden';
				}
				if (HYDRATION && state.deferred !== null) {
					var deferred = state.deferred;
					var runtime = /** @type {import('./hydrate.js').HydrationRuntime} */ (H);
					if (activity_hidden(owner)) runtime.q(deferred);
					else queue_activation(state);
				}
				update_dom(state);
			});
			if (HYDRATION && hydrating) {
				/** @type {import('./hydrate.js').HydrationRuntime} */ (H).a(anchor, state.start);
			}
			return () => {
				if (HYDRATION && state.deferred !== null) {
					/** @type {import('./hydrate.js').HydrationRuntime} */ (H).d(state.deferred);
				}
				reveal_activity(state.nodes);
			};
		});
	});
}
