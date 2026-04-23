/** @import { Block, CompatOptions } from '#client' */

import { destroy_block, root } from './internal/client/blocks.js';
import { handle_root_events } from './internal/client/events.js';
import {
	get_first_child,
	get_next_sibling,
	init_operations,
} from './internal/client/operations.js';
import { active_block } from './internal/client/runtime.js';
import { create_anchor } from './internal/client/utils.js';
import { remove_ssr_css } from './internal/client/css.js';
import {
	clear_track_hash_reference,
	hydrate_next,
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
	DERIVED_UPDATED,
	SUSPENSE_PENDING,
	SUSPENSE_REJECTED,
} from './internal/client/constants.js';

/**
 * @returns {CompatOptions | undefined}
 */
function get_default_compat() {
	return /** @type {typeof globalThis & { __RIPPLE_COMPAT__?: CompatOptions }} */ (globalThis)
		.__RIPPLE_COMPAT__;
}

/**
 * @param {(anchor: Node, props: Record<string, any>, active_block: Block | null) => void} component
 * @param {{ props?: Record<string, any>, target: HTMLElement }} options
 * @returns {() => void}
 */
export function mount(component, options) {
	init_operations();
	remove_ssr_css();

	const compat = get_default_compat();
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
		component(anchor, props, active_block);
	}, compat);

	return () => {
		cleanup_events();
		destroy_block(_root);
	};
}

/**
 * @param {(anchor: Node, props: Record<string, any>, active_block: Block | null) => void} component
 * @param {{ props?: Record<string, any>, target: HTMLElement }} options
 * @returns {() => void}
 */
export function hydrate(component, options) {
	init_operations();
	remove_ssr_css();

	const compat = get_default_compat();
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
		hydrate_next();

		_root = root(() => {
			component(/** @type {Comment} */ (anchor), props, active_block);
		}, compat);
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

export { ref_prop as createRefKey, get, public_set as set } from './internal/client/runtime.js';

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
