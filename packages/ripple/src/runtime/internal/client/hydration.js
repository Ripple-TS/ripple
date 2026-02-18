import {
	HYDRATION_END,
	HYDRATION_ERROR,
	HYDRATION_START,
	HYDRATION_START_ELSE,
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

/**
 * Finds the matching hydration end marker for a block start marker.
 * @param {Node} node
 * @returns {Node | null}
 */
export function find_hydration_end(node) {
	/** @type {Node | null} */
	var current = node;
	var depth = 0;

	while (current !== null) {
		if (current.nodeType === Node.COMMENT_NODE) {
			var data = /** @type {Comment} */ (current).data;
			if (data === HYDRATION_START || data === HYDRATION_START_ELSE) {
				depth += 1;
			} else if (data === HYDRATION_END) {
				depth -= 1;
				if (depth === 0) {
					return current;
				}
			}
		}
		current = get_next_sibling(/** @type {Node} */ (current));
	}

	return null;
}

/** @param {Node} node */
export function pop(node) {
	if (!hydrating) return;

	hydrate_node = node;
}
