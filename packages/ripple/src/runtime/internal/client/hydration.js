/** @import { AppendIntoAnchor, Block, Derived, Tracked } from '#client' */

import {
	COMMENT_NODE,
	HYDRATION_END,
	HYDRATION_ERROR,
	HYDRATION_START,
	TEXT_NODE,
} from '../../../constants.js';
import { create_text, first_child_getter, next_sibling_getter } from './operations.js';
import { active_block } from './runtime.js';

export let hydrating = false;

/** @type {Node | null} */
export let hydrate_node = null;

/**
 * Map of hash -> Tracked/Derived registered during hydration. Allows a
 * hydrating trackAsync to look up its serialized dependencies by hash and
 * wire up reactivity without re-running the user's async fn.
 * @type {Map<string, Tracked | Derived>}
 */
export const track_hash_reference = new Map();

/**
 * @param {boolean} value
 */
export function set_hydrating(value) {
	hydrating = value;
}

/**
 * @param {Node | null} node
 * @param {boolean} [mounting=false]
 */
export function set_hydrate_node(node, mounting = false) {
	if (node === null && !mounting) {
		throw HYDRATION_ERROR;
	}
	return (hydrate_node = node);
}

export function hydrate_next() {
	var node = next_sibling_getter.call(/** @type {Node} */ (hydrate_node));
	if (node === null) {
		throw HYDRATION_ERROR;
	}
	return (hydrate_node = node);
}

/**
 * Descends the cursor into the current node's first child, the way a
 * compiled `element.firstChild` read does while mounting.
 * @param {boolean} [is_text]
 * @returns {Node}
 */
export function hydrate_first_child(is_text) {
	var child = first_child_getter.call(/** @type {Node} */ (hydrate_node));

	if (child === null || (is_text === true && child.nodeType !== TEXT_NODE)) {
		child = repair_first_child(child);
	}

	return (hydrate_node = child);
}

/**
 * Adopts the text node that is an element's only child, leaving the cursor on
 * the element: nothing else inside it navigates, so the parent's sibling
 * traversal continues from the element with no pop().
 * @returns {Node}
 */
export function hydrate_text_child() {
	var child = first_child_getter.call(/** @type {Node} */ (hydrate_node));

	if (child === null || child.nodeType !== TEXT_NODE) {
		child = repair_first_child(child);
	}

	return child;
}

/**
 * Handles `<p>{text}</p>` where `text` rendered empty on the server: there is
 * no text node to adopt (or, with siblings, the next node is not one), so one
 * is created in its place.
 * @param {Node | null} child
 * @returns {Text}
 */
function repair_first_child(child) {
	var text = create_text();
	if (child === null) {
		/** @type {Node} */ (hydrate_node).appendChild(text);
	} else {
		/** @type {ChildNode} */ (child).before(text);
	}
	return text;
}

/**
 * Moves the cursor to the current node's next sibling, the way a compiled
 * `node.nextSibling` read does while mounting.
 * @param {boolean} [is_text]
 * @returns {Node}
 */
export function hydrate_next_sibling(is_text) {
	var next_sibling = /** @type {ChildNode | null} */ (
		next_sibling_getter.call(/** @type {Node} */ (hydrate_node))
	);

	if (next_sibling === null || (is_text === true && next_sibling.nodeType !== TEXT_NODE)) {
		if (is_text !== true) {
			throw HYDRATION_ERROR;
		}
		next_sibling = repair_next_sibling(next_sibling);
	}

	return (hydrate_node = next_sibling);
}

/**
 * A sibling `{expression}` that rendered empty on the server has no text node
 * to hydrate: create one after the current node (or before whatever follows).
 * @param {ChildNode | null} next_sibling
 * @returns {Text}
 */
function repair_next_sibling(next_sibling) {
	var text = create_text();
	if (next_sibling === null) {
		/** @type {ChildNode} */ (hydrate_node).after(text);
	} else {
		next_sibling.before(text);
	}
	return text;
}

/**
 * The hydration path of `append`: repositions the hydration cursor instead
 * of inserting. Kept out of the insert path so a client-only mount never
 * compiles it.
 *
 * Every hydrated node, block, and component leaves the cursor on its last
 * DOM node, and whoever owns the next node steps past it: a parent element
 * with its sibling traversal, a control-flow block by reaching its end
 * marker, an append-into sentinel by adopting the cursor as the next
 * component's first node.
 * @param {ChildNode | AppendIntoAnchor} anchor
 * @param {Node} dom
 */
export function hydrate_append(anchor, dom) {
	var node = /** @type {Node} */ (hydrate_node);

	// The cursor descended into dom's children (child()/sibling() traversal
	// inside a single-node template) without a compiler-emitted pop(): bring it
	// back up to dom before deciding where to leave it.
	if (node !== dom && dom.contains(node)) {
		node = dom;
	}

	// A child component renders into the anchor it was handed, which is its
	// own first node. Its content is hydrated, so leave the cursor on the
	// content's last node for the parent's sibling traversal.
	if (anchor === dom) {
		hydrate_node = node;
		return;
	}

	if (node !== dom) {
		// A fragment's cursor sits on its last top-level node, past the
		// template's first node: widen the block's end to cover the whole
		// fragment rather than only the node assign_nodes saw.
		var s = /** @type {Block} */ (active_block).s;
		if (s !== null) {
			s.end = node;
		}
	}

	// Step past the content: a branch lands on its block's end marker, the
	// root on the boundary's end marker, an append-into sentinel on the next
	// component's first node.
	hydrate_node = next_sibling_getter.call(node);
}

export function next(n = 1) {
	if (hydrating) {
		var node = hydrate_node;

		for (var i = 0; i < n; i++) {
			node = next_sibling_getter.call(/** @type {Node} */ (node));
		}

		hydrate_node = node;
	}
}

/** @param {Node} node */
export function pop(node) {
	if (!hydrating) return;
	hydrate_node = node;
}

/**
 * Scans forward from the current hydrate_node to find the matching HYDRATION_END
 * comment, handling nested blocks by tracking depth.
 * Should be called after hydrate_next() has consumed the opening HYDRATION_START.
 * Any `[`-prefixed comment opens a nested region — this includes the plain
 * `<!--[-->` markers as well as streaming slot markers (`<!--[?N-->`,
 * `<!--[!N-->`), which always pair with a `<!--]-->`.
 * @returns {Node} The HYDRATION_END comment node.
 */
export function skip_to_hydration_end() {
	var depth = 0;
	var node = /** @type {Node} */ (hydrate_node);
	while (true) {
		if (node.nodeType === COMMENT_NODE) {
			var data = /** @type {Comment} */ (node).data;
			if (data === HYDRATION_END) {
				if (depth === 0) return node;
				depth -= 1;
			} else if (data.startsWith(HYDRATION_START)) {
				depth += 1;
			}
		}
		node = /** @type {Node} */ (next_sibling_getter.call(node));
	}
}
