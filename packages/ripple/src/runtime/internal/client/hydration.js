import { HYDRATION_ERROR } from '../../../constants';
import { get_next_sibling } from './operations';

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

/** @param {Node} node */
export function reset(node) {
	if (!hydrating) return;

	// If the node has remaining siblings, something has gone wrong
	if (get_next_sibling(/** @type {Node} */ (hydrate_node)) !== null) {
		throw HYDRATION_ERROR;
	}

	hydrate_node = node;
}
