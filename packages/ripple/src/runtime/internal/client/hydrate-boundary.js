/** @import { AppendIntoAnchor, Block } from '#client' */
/** @import { HydrationStrategy } from '../../../../types/hydration.js' */
import { branch, render, destroy_block, is_destroyed } from './blocks.js';
import { DERIVED } from './constants.js';
import {
	active_block,
	get,
	is_tracked,
	handle_error,
	queue_microtask,
	untrack,
	with_block,
} from './runtime.js';
import { H, hydrating, hydrate_node, set_hydration } from './hydration.js';
import { retain_boundary, hydrate_boundary, dispose_boundary } from './deferred.js';
import { expression } from './expression.js';
import { listen_intent } from './hydration-intent.js';
import { subscribe_strategy } from './hydration-strategies.js';

/**
 * @param {unknown} value
 * @returns {HydrationStrategy}
 */
function strategy(value) {
	if (typeof value === 'function') value = value();
	if (
		value === null ||
		typeof value !== 'object' ||
		!('t' in value) ||
		!['l', 'i', 'v', 'e', 'm', 'c', 'n'].includes(/** @type {any} */ (value).t)
	) {
		throw new Error('Hydrate requires a synchronous when strategy or factory');
	}
	return /** @type {HydrationStrategy} */ (value);
}

/**
 * @param {HydrationStrategy} value
 */
function key(value) {
	return value.t === 'l' || value.t === 'n' || value.t === 'c'
		? value.t
		: value.t + ':' + value.v + (value.t === 'v' ? ':' + value.o : '');
}

/**
 * Read direct replacements without evaluating lazy computed children.
 * @param {import('#public').HydrateOptions} props
 */
function current_children(props) {
	var value = /** @type {any} */ (props.children);
	return is_tracked(value) && (value.f & DERIVED) !== 0 ? value : get(value);
}

/**
 * @param {ChildNode | AppendIntoAnchor} anchor
 * @param {import('#public').HydrateOptions} props
 */
export function hydrate_component(anchor, props) {
	branch(() => {
		var owner = /** @type {Block} */ (active_block);
		var boundary = retain_boundary(owner, () =>
			expression(boundary.start, () => get(/** @type {any} */ (props.children)), boundary.end),
		);
		owner.s = { start: boundary.start, end: boundary.end };
		/** @type {HydrationStrategy | null} */
		var current = null;
		/** @type {Block | null} */
		var watcher = null;
		/** @type {(() => void) | undefined} */
		var stop;
		/** @type {(() => void) | undefined} */
		var intent;
		var queued = false;
		var revision = 0;
		var previous_key = '';
		var children = untrack(() => current_children(props));
		var clear = () => {
			stop?.();
			stop = undefined;
			intent?.();
			intent = undefined;
		};
		var open = () => {
			if (boundary.status !== 'dehydrated' || current?.t === 'n') return;
			stop?.();
			stop = undefined;
			if (watcher !== null) destroy_block(watcher);
			try {
				hydrate_boundary(boundary);
			} finally {
				clear();
			}
			if (
				/** @type {import('./deferred.js').DeferredBoundary} */ (boundary).status === 'hydrated'
			) {
				boundary.start.data = '[';
				try {
					with_block(owner, () => untrack(() => props.onHydrated?.()));
				} catch (error) {
					handle_error(error, owner);
				}
			}
		};
		var request = () => {
			if (queued) return;
			queued = true;
			var version = revision;
			queue_microtask(() => {
				if (version !== revision) return;
				queued = false;
				open();
			});
		};
		// Trigger setup is client work, not a DOM adoption walk. In particular,
		// a thrown factory/getter must mount its catch rather than adopt SSR UI.
		var previous_hydrating = hydrating;
		var previous_node = hydrate_node;
		set_hydration(false, null);
		try {
			watcher = render(() => {
				current = strategy(get(/** @type {any} */ (props.when)));
				var satisfied =
					current.t === 'c' && (typeof current.v === 'function' ? current.v() : current.v);
				var next_key = key(current) + (current.t === 'c' ? ':' + satisfied : '');
				if (next_key !== previous_key) {
					clear();
					previous_key = next_key;
					queued = false;
					var version = ++revision;
					// Keep metadata current for intent aimed at unresolved descendants.
					boundary.start.data =
						'[h' +
						current.t +
						(current.t === 'e' ? ':' + encodeURIComponent(current.v).replace(/-/g, '%2D') : '');
					if (current.t !== 'n') {
						intent = listen_intent(boundary, open, () => queued);
						stop = subscribe_strategy(boundary, current, () => {
							if (version === revision) request();
						});
					}
				}
				if (satisfied) request();
				var next_children = current_children(props);
				// Ripple does not rerender component bodies on store writes. A new
				// children value is an external replacement and cannot retain old HTML.
				if (next_children !== children && current.t !== 'n') request();
				children = next_children;
			});
		} finally {
			set_hydration(previous_hydrating, previous_node);
		}
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).a(anchor, boundary.start);
		var dispose = () => {
			clear();
			dispose_boundary(boundary);
		};
		if (is_destroyed(owner)) dispose();
		return dispose;
	});
}
