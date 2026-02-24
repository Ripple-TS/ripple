import {
	COMMENT_NODE,
	HYDRATION_END,
	HYDRATION_ERROR,
	HYDRATION_START,
} from '../../../constants.js';
import { get_next_sibling } from './operations.js';

export let hydrating = false;

/** @type {Node | null} */
export let hydrate_node = null;

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
	return set_hydrate_node(get_next_sibling(/** @type {Node} */ (hydrate_node)));
}

export function hydrate_advance() {
	hydrate_node = get_next_sibling(/** @type {Node} */ (hydrate_node));
}

export function next(n = 1) {
	if (hydrating) {
		var node = hydrate_node;

		for (var i = 0; i < n; i++) {
			node = get_next_sibling(/** @type {Node} */ (node));
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
			} else if (data === HYDRATION_START) {
				depth += 1;
			}
		}
		node = /** @type {Node} */ (get_next_sibling(node));
	}
}
