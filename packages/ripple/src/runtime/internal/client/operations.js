/** @import { AppendIntoAnchor } from '#client' */

import {
	hydrate_first_child,
	hydrate_next_sibling,
	hydrate_node,
	hydrate_text_child,
	hydrating,
	set_hydrate_node,
} from './hydration.js';
import { get_descriptor } from '@tsrx/core/runtime/language-helpers';

export { hydrate_first_child, hydrate_next_sibling, hydrate_text_child };

/**
 * The `firstChild` / `nextSibling` getters, called directly so a traversal
 * site never becomes a megamorphic property read across node types.
 * @type {(() => Node | null)}
 */
export var first_child_getter;
/** @type {(() => Node | null)} */
export var next_sibling_getter;
/** @type {(() => Node | null)} */
var last_child_getter;

/** @type {Document} */
export var document;

/** @type {boolean} */
export var is_firefox;

export function init_operations() {
	var node_prototype = Node.prototype;
	var element_prototype = Element.prototype;
	var event_target_prototype = Event.prototype;

	is_firefox = /Firefox/.test(navigator.userAgent);
	document = window.document;

	first_child_getter = /** @type {(() => Node | null)} */ (
		get_descriptor(node_prototype, 'firstChild')?.get
	);
	next_sibling_getter = /** @type {(() => Node | null)} */ (
		get_descriptor(node_prototype, 'nextSibling')?.get
	);
	last_child_getter = /** @type {(() => Node | null)} */ (
		get_descriptor(node_prototype, 'lastChild')?.get
	);

	// the following assignments improve perf of lookups on DOM nodes
	element_prototype.__click = undefined;
	event_target_prototype.__root = undefined;
}

/**
 * @template {Node} N
 * @param {N} node
 * @returns {Node | null}
 */
export function get_first_child(node) {
	return first_child_getter.call(node);
}

/**
 * @template {Node} N
 * @param {N} node
 * @returns {Node | null}
 */
export function get_last_child(node) {
	return last_child_getter.call(node);
}

/**
 * @template {Node} N
 * @param {N} node
 * @param {boolean} [is_text]
 * @returns {Node | null}
 */
export function first_child(node, is_text) {
	if (!hydrating) {
		return node.firstChild;
	}
	return hydrate_first_child(is_text);
}

/**
 * Anchor sentinel for all-component children: components render directly into
 * `parent` instead of each inserting before a placeholder comment. `append()`
 * detects the sentinel (no `nodeType`) and appendChild()s into `parent`. During
 * hydration we descend the cursor into `parent` (mirroring first_child) so the
 * first appended component adopts the server's first child of `parent`.
 * @param {Node} parent
 * @returns {AppendIntoAnchor}
 */
export function append_into(parent) {
	if (hydrating) {
		var child = get_first_child(/** @type {Node} */ (hydrate_node));

		if (child === null) {
			child = /** @type {Node} */ (hydrate_node).appendChild(create_text());
		}

		set_hydrate_node(child);
	}

	return { parent, into: true };
}

/**
 * Resolves the anchor for a block that keeps inserting relative to it for its
 * whole life (root-controlled control flow). An append-into sentinel is only
 * valid for a one-shot append: a later branch swap or list move must land at
 * the block's own position, not after whatever siblings were appended since,
 * so the sentinel is materialized into a text anchor at the current end of
 * the parent. During hydration the cursor sits on the block's SSR boundary
 * marker, which is exactly the anchor a non-sentinel root-controlled block
 * receives, so it serves as the anchor there.
 * @param {Node | AppendIntoAnchor} node
 * @returns {Node}
 */
export function resolve_anchor(node) {
	if (/** @type {AppendIntoAnchor} */ (node).into !== true) {
		return /** @type {Node} */ (node);
	}
	if (hydrating) {
		return /** @type {Node} */ (hydrate_node);
	}
	return /** @type {AppendIntoAnchor} */ (node).parent.appendChild(create_text());
}

/**
 * @template {Node} N
 * @param {N} node
 * @param {boolean} [is_text]
 * @returns {Node | null}
 */
export function first_child_frag(node, is_text) {
	// During hydration, for fragment templates, hydrate_node is already
	// pointing to the first element of the fragment. Don't descend into it.
	if (hydrating) {
		return hydrate_node;
	}
	var child = /** @type {Text} */ (first_child(node, is_text));

	if (child.nodeType === Node.COMMENT_NODE && child.data === '') {
		return next_sibling(child);
	}
	return child;
}

/**
 * @template {Node} N
 * @param {N} node
 * @returns {Node | null}
 */
export function get_next_sibling(node) {
	return next_sibling_getter.call(node);
}

/**
 * @template {Node} N
 * @param {N} node
 * @param {boolean} [is_text]
 * @returns {Node | null}
 */
export function next_sibling(node, is_text) {
	if (!hydrating) {
		return node.nextSibling;
	}
	return hydrate_next_sibling(is_text);
}

export function create_text(value = '') {
	return document.createTextNode(value);
}
