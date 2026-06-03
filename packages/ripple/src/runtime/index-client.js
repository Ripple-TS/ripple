/** @import { RootBoundaryOptions } from '#client' */

import { destroy_block, root } from './internal/client/blocks.js';
import { handle_root_events } from './internal/client/events.js';
import {
	get_first_child,
	get_next_sibling,
	init_operations,
} from './internal/client/operations.js';
import { render_component } from './internal/client/component.js';
import { create_anchor } from './internal/client/utils.js';
import { try_block } from './internal/client/try.js';
import { remove_ssr_css } from './internal/client/css.js';
import {
	clear_track_hash_reference,
	hydrate_node,
	hydrating,
	set_hydrate_node,
	set_hydrating,
} from './internal/client/hydration.js';
import { COMMENT_NODE, HYDRATION_START } from '../constants.js';

// Re-export JSX runtime functions for jsxImportSource: "ripple"
export { jsx, jsxs, Fragment } from '../jsx-runtime.js';
export {
	UNINITIALIZED,
	TRACKED_UPDATED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
} from './internal/client/constants.js';

/**
 * @param {Node} anchor
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
	);
}

/**
 * @param {Function} component
 * @param {{ props?: Record<string, any>, target: HTMLElement, rootBoundary?: RootBoundaryOptions }} options
 * @returns {() => void}
 */
export function mount(component, options) {
	init_operations();
	remove_ssr_css();

	const props = options.props || {};
	const target = options.target;
	const anchor = create_anchor();

	// Clear target content in case of SSR
	if (target.firstChild) {
		target.textContent = '';
	}

	target.append(anchor);

	const cleanup_events = handle_root_events(target);

	const _root = root(() => {
		render_root_boundary(
			anchor,
			(component_anchor) => {
				render_component(component, component_anchor, props);
			},
			options.rootBoundary,
		);
	});

	return () => {
		cleanup_events();
		destroy_block(_root);
	};
}

/**
 * @param {Function} component
 * @param {{ props?: Record<string, any>, target: HTMLElement, rootBoundary?: RootBoundaryOptions }} options
 * @returns {() => void}
 */
export function hydrate(component, options) {
	init_operations();
	remove_ssr_css();

	const props = options.props || {};
	const target = options.target;
	const was_hydrating = hydrating;
	const previous_hydrate_node = hydrate_node;
	let anchor = get_first_child(target);

	const cleanup_events = handle_root_events(target);
	let _root;

	try {
		while (
			anchor &&
			(anchor.nodeType !== COMMENT_NODE || /** @type {Comment} */ (anchor).data !== HYDRATION_START)
		) {
			anchor = get_next_sibling(anchor);
		}

		set_hydrating(true);
		set_hydrate_node(/** @type {Comment} */ (anchor));

		_root = root(() => {
			render_root_boundary(
				/** @type {Comment} */ (anchor),
				(component_anchor) => {
					render_component(component, component_anchor, props);
				},
				options.rootBoundary,
			);
		});
	} catch (e) {
		throw e;
	} finally {
		set_hydrating(was_hydrating);
		set_hydrate_node(previous_hydrate_node, true);
		if (!was_hydrating) {
			clear_track_hash_reference();
		}
	}

	return () => {
		cleanup_events();
		destroy_block(_root);
	};
}

export { Context } from './internal/client/context.js';

export {
	flush_sync as flushSync,
	track,
	track_async as trackAsync,
	untrack,
	tick,
	is_tracked_pending as trackPending,
	peek_tracked as peek,
} from './internal/client/runtime.js';

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
