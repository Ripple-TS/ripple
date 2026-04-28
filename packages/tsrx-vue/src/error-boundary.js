import * as Vue from 'vue';
import { getCurrentInstance, onErrorCaptured, shallowRef } from 'vue';

const boundary_states = new WeakMap();

/** @typedef {any} BoundaryValue */

/**
 * @param {BoundaryValue} nodes
 * @param {Node} [anchor]
 * @returns {BoundaryValue}
 */
function create_fragment(nodes, anchor = document.createTextNode('')) {
	const fragment = new /** @type {any} */ (Vue).VaporFragment(nodes);
	fragment.anchor = anchor;
	return fragment;
}

/**
 * @param {BoundaryValue} value
 * @returns {void}
 */
function track_dynamic_values(value) {
	if (!value || typeof value !== 'object') return;

	for (const key of Object.keys(value)) {
		const child = value[key];
		if (key === 'content' || key === 'fallback' || key === 'children' || key === 'default')
			continue;
		if (key === '$' || key.startsWith('on')) continue;
		if (typeof child === 'function') {
			child();
		}
	}
}

/**
 * @param {BoundaryValue} node
 * @param {Node | undefined} anchor
 * @returns {BoundaryValue}
 */
function normalize_block(node, anchor) {
	if (node instanceof Node || /** @type {any} */ (Vue).isFragment(node)) return node;
	if (/** @type {any} */ (Vue).isVaporComponent(node)) {
		if (!(node.rawProps && 'content' in node.rawProps && 'fallback' in node.rawProps)) {
			track_dynamic_values(node.rawProps);
		}
		return create_fragment(node, anchor);
	}
	if (Array.isArray(node))
		return create_fragment(
			node.map((item) => normalize_block(item, undefined)),
			anchor,
		);

	const result = node == null || typeof node === 'boolean' ? '' : String(node);
	if (anchor) {
		anchor.textContent = result;
		return anchor;
	}
	return document.createTextNode(result);
}

/**
 * @param {BoundaryValue} current
 * @param {BoundaryValue} value
 * @param {Node | undefined} anchor
 * @returns {BoundaryValue}
 */
function resolve_value(current, value, anchor) {
	anchor = anchor || (current instanceof Node && current.nodeType === 3 ? current : undefined);
	const node = normalize_block(value, anchor);

	if (current) {
		if (/** @type {any} */ (Vue).isFragment(current)) {
			if (current.anchor && current.anchor.parentNode) {
				/** @type {any} */ (Vue).remove(current.nodes, current.anchor.parentNode);
				/** @type {any} */ (Vue).insert(node, current.anchor.parentNode, current.anchor);
				if (current.scope) current.scope.stop();
			}
		} else if (current instanceof Node) {
			if (current.nodeType === 3 && (!(node instanceof Node) || node.nodeType !== 3)) {
				current.textContent = '';
			}
			if (/** @type {any} */ (Vue).isFragment(node) && current.parentNode) {
				/** @type {any} */ (Vue).insert(node, current.parentNode, current);
				if (current.nodeType !== 3) current.parentNode.removeChild(current);
			} else if (node instanceof Node) {
				if (current.nodeType === 3 && node.nodeType === 3) {
					current.textContent = node.textContent;
					return current;
				}
				if (current.parentNode) current.parentNode.replaceChild(node, current);
			}
		}
	}

	return node;
}

/**
 * @param {() => BoundaryValue} render
 * @returns {BoundaryValue[]}
 */
function create_boundary_nodes(render) {
	/** @type {BoundaryValue[]} */
	const nodes = [];
	/** @type {any} */
	let scope;

	/** @type {any} */ (Vue).renderEffect(() => {
		if (scope) scope.stop();
		scope = new /** @type {any} */ (Vue).EffectScope();
		nodes[0] = scope.run(() => resolve_value(nodes[0], render(), undefined));
	});

	return nodes;
}

/**
 * A reusable Vue error boundary component.
 *
 * Used by the `@tsrx/vue` compiler to implement `try/catch` blocks.
 * The `fallback` prop receives the caught error and a `reset` function
 * that clears the error state to re-render the children.
 */
/**
 * @param {{ content: () => any, fallback: (error: unknown, reset: () => void) => any }} props
 * @returns {any}
 */
export function TsrxErrorBoundary(props) {
	const instance = getCurrentInstance();
	const state = instance ? boundary_states.get(instance) : undefined;
	const error = state?.error ?? shallowRef(/** @type {unknown} */ (null));
	const reset =
		state?.reset ??
		(() => {
			error.value = null;
		});

	return create_boundary_nodes(() => {
		if (error.value !== null) {
			return props.fallback(error.value, reset);
		}

		try {
			return props.content();
		} catch (caught_error) {
			error.value = caught_error;
			return props.fallback(caught_error, reset);
		}
	});
}

/** @returns {void} */
TsrxErrorBoundary.__setup = function setup() {
	const instance = getCurrentInstance();
	if (!instance || boundary_states.has(instance)) {
		return;
	}

	const error = shallowRef(/** @type {unknown} */ (null));
	const reset = () => {
		error.value = null;
	};

	boundary_states.set(instance, { error, reset });

	onErrorCaptured((captured_error) => {
		error.value = captured_error;
		return false;
	});
};
