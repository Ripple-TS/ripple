/** @import { AppendIntoAnchor, RootBoundaryOptions } from '#client' */

import { destroy_block, root } from './internal/client/blocks.js';
import { handle_root_events, release_root_events } from './internal/client/events.js';
import { init_operations } from './internal/client/operations.js';
import { render_component } from './internal/client/component.js';
import { try_block } from './internal/client/try.js';
import { remove_styles } from './internal/client/css.js';
import { props_from } from './internal/client/props.js';
import { normalize_children } from './element.js';
import {
	hydrate_next,
	hydrate_node,
	hydrating,
	set_hydration,
	track_hash_reference,
} from './internal/client/hydration.js';
import { COMMENT_NODE, HYDRATION_START } from '../constants.js';

// Re-export JSX runtime functions for jsxImportSource: "ripple"
export { jsx, jsxs, Fragment } from '../jsx-runtime.js';
export { set_transport as setTransport } from './internal/client/transport.js';
export {
	UNINITIALIZED,
	TRACKED_UPDATED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
} from './internal/client/constants.js';

/**
 * @param {Node | AppendIntoAnchor} anchor
 * @param {(anchor: Node) => void} render_content
 * @param {RootBoundaryOptions | undefined} boundary
 * @returns {void}
 */
function render_root_boundary(anchor, render_content, boundary) {
	const Pending = boundary?.pending;
	const Catch = boundary?.catch;

	try_block(
		anchor,
		(component_anchor) => {
			render_content(component_anchor);
		},
		Catch
			? (catch_anchor, error, reset) => {
					render_component(Catch, catch_anchor, { error, reset: reset ?? (() => {}) });
				}
			: null,
		(pending_anchor) => {
			if (Pending) {
				render_component(Pending, pending_anchor, {});
			}
		},
		true,
	);
}

/**
 * Apply the same children normalization that compiled component call sites
 * get, so `mount`/`hydrate` accept a component function as the `children`
 * prop.
 *
 * @param {Record<string, any>} props
 * @returns {Record<string, any>}
 */
function normalize_props(props) {
	return { ...props, children: normalize_children(props.children) };
}

/**
 * `rootBoundary` configures the default `try`/`pending`/`catch` boundary the
 * app is rendered under; `false` renders without one. Without a root
 * boundary, `trackAsync()` must sit inside a user `@try` block, and errors
 * that escape one propagate out of the flush.
 * @param {Function} component
 * @param {{ props?: Record<string, any>, target: HTMLElement, rootBoundary?: RootBoundaryOptions | false }} options
 * @returns {() => void}
 */
export function mount(component, options) {
	init_operations();
	// Only a page with server-rendered inline styles has anything to remove.
	// Requesting a frame otherwise makes the browser attach layout to the
	// mounted tree before the app's next update, which slows a teardown that
	// would have preceded the first paint.
	if (document.querySelector('style[data-ripple-ssr]') !== null) {
		requestAnimationFrame(remove_styles);
	}

	let props = options.props ?? {};
	if (props.children != null) {
		props = normalize_props(props);
	}
	// The root component receives the same shape as every other: a `Props`
	// instance with the given values as static props.
	props = props_from(props);
	const target = options.target;

	// Clear target content in case of SSR
	if (target.firstChild) {
		target.textContent = '';
	}

	// The app appends into the emptied target; a root that keeps inserting
	// relative to its anchor materializes one (see `resolve_anchor`).
	/** @type {AppendIntoAnchor} */
	const anchor = { parent: target, into: true };

	/** @type {import('./internal/client/events.js').RootTargetRef | null} */
	let events_ref = handle_root_events(target);

	const root_boundary = options.rootBoundary;

	const _root = root(() => {
		if (root_boundary === false) {
			render_component(component, anchor, props);
			return;
		}
		render_root_boundary(
			anchor,
			(component_anchor) => {
				render_component(component, component_anchor, props);
			},
			root_boundary,
		);
	});

	return () => {
		// The disposer may be called again (a remount, HMR, a stale reference);
		// only the first call owns the target's delegated-listener ref.
		if (events_ref === null) return;
		release_root_events(events_ref);
		events_ref = null;
		destroy_block(_root);
	};
}

/**
 * `rootBoundary` works as in {@link mount}: the app hydrates under a default
 * `try` boundary, or with `false` directly under the root block. Server output
 * always carries the root boundary markers; without a boundary, `hydrate()`
 * steps over a plain `<!--[-->` itself. A streamed shell whose root suspended
 * starts with a `<!--[?N-->` / `<!--[!N-->` slot instead, and only a boundary
 * can adopt its fallback and activate the chunk, so that shell hydrates under
 * the default boundary regardless.
 * @param {Function} component
 * @param {{ props?: Record<string, any>, target: HTMLElement, rootBoundary?: RootBoundaryOptions | false }} options
 * @returns {() => void}
 */
export function hydrate(component, options) {
	init_operations();
	requestAnimationFrame(remove_styles);

	let props = options.props ?? {};
	if (props.children != null) {
		props = normalize_props(props);
	}
	// The root component receives the same shape as every other: a `Props`
	// instance with the given values as static props.
	props = props_from(props);
	const target = options.target;
	const was_hydrating = hydrating;
	const previous_hydrate_node = hydrate_node;
	let anchor = target.firstChild;

	/** @type {import('./internal/client/events.js').RootTargetRef | null} */
	let events_ref = handle_root_events(target);
	let _root;

	try {
		while (
			anchor &&
			(anchor.nodeType !== COMMENT_NODE ||
				// any `[`-prefixed marker anchors the root boundary — a streamed
				// shell whose root suspended starts with a `<!--[?N-->` slot
				// marker instead of a plain `<!--[-->`
				!(/** @type {Comment} */ (anchor).data.startsWith(HYDRATION_START)))
		) {
			anchor = anchor.nextSibling;
		}

		set_hydration(true, /** @type {Comment} */ (anchor));

		const root_boundary = options.rootBoundary;
		const marker = /** @type {Comment} */ (anchor);

		_root = root(() => {
			if (root_boundary === false && marker.data === HYDRATION_START) {
				// The root boundary's own hydration walk: consume the `<!--[-->`
				// marker and render against it, as `try_block` does for the root.
				hydrate_next();
				render_component(component, marker, props);
				return;
			}
			render_root_boundary(
				marker,
				(component_anchor) => {
					render_component(component, component_anchor, props);
				},
				root_boundary === false ? undefined : root_boundary,
			);
		});
	} catch (e) {
		throw e;
	} finally {
		set_hydration(was_hydrating, previous_hydrate_node);
		if (!was_hydrating) {
			track_hash_reference.clear();
		}
	}

	return () => {
		if (events_ref === null) return;
		release_root_events(events_ref);
		events_ref = null;
		destroy_block(_root);
	};
}

export { Context } from './internal/client/context.js';

export { PropsHelpers as Props } from './props.js';

export {
	flush_sync as flushSync,
	track,
	track_async as trackAsync,
	untrack,
	tick,
	is_tracked_pending as trackPending,
	peek_tracked as peek,
} from './internal/client/runtime.js';

export { snapshot } from './proxy.js';

export { RippleArray } from './array.js';

export { RippleObject } from './object.js';

export { RippleSet } from './set.js';

export { RippleMap } from './map.js';

export { RippleDate } from './date.js';

export { RippleURL } from './url.js';

export { RippleURLSearchParams } from './url-search-params.js';

export { createSubscriber } from './create-subscriber.js';

export { MediaQuery } from './media-query.js';

export { user_effect as effect } from './internal/client/blocks.js';

export { Portal } from './internal/client/portal.js';

export { ref_prop as createRefKey } from './internal/client/runtime.js';

export { isRefProp } from '@tsrx/core/runtime/ref';

export { on } from './internal/client/events.js';

export {
	bindValue,
	bindChecked,
	bindGroup,
	bindClientWidth,
	bindClientHeight,
	bindContentRect,
	bindContentBoxSize,
	bindBorderBoxSize,
	bindDevicePixelContentBoxSize,
	bindFiles,
	bindIndeterminate,
	bindInnerHTML,
	bindInnerText,
	bindTextContent,
	bindNode,
	bindOffsetWidth,
	bindOffsetHeight,
} from './internal/client/bindings.js';
