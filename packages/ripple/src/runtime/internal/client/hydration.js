/** @import { AppendIntoAnchor, Block, Derived, Tracked } from '#client' */

import { HYDRATION_ERROR, TEXT_NODE } from '../../../constants.js';
import { create_text, first_child_getter, next_sibling_getter } from './operations.js';

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
 * The hydration paths of the DOM runtime (see `hydrate.js`), installed by
 * `hydrate()`: the runtime reaches them through this object, so a client-only
 * mount never loads them.
 * @type {import('./hydrate.js').HydrationRuntime | null}
 */
export let H = null;

/**
 * @param {import('./hydrate.js').HydrationRuntime} runtime
 */
export function set_hydration_runtime(runtime) {
	H = runtime;
}

/**
 * @param {boolean} value
 */
export function set_hydrating(value) {
	hydrating = value;
}

/**
 * Enters or leaves a hydration walk: both the flag and the cursor, which is
 * allowed to be null when restoring the state of a client-only mount.
 * @param {boolean} value
 * @param {Node | null} node
 */
export function set_hydration(value, node) {
	hydrating = value;
	hydrate_node = node;
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
