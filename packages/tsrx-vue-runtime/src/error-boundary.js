/** @import { ComponentInternalInstance, ShallowRef } from 'vue' */
/** @import { TsrxErrorBoundaryProps } from '../types/error-boundary' */
/** @import { VaporBlock, VaporFragment, VaporRenderedBlock, VaporRuntime } from '../types/vapor-runtime' */

import * as Vue from 'vue';
import { EffectScope, getCurrentInstance, onErrorCaptured, shallowRef } from 'vue';

/**
 * The Vapor renderer's fragment/component helpers are runtime-internal, so
 * `vue`'s published types don't describe them and there is no upstream
 * declaration to widen. Narrow the namespace object once here; every use below
 * is checked against {@link VaporRuntime}.
 */
const vapor = /** @type {VaporRuntime} */ (/** @type {unknown} */ (Vue));

/** @typedef {{ error: ShallowRef<unknown>, reset: () => void }} BoundaryState */

/** @type {WeakMap<ComponentInternalInstance, BoundaryState>} */
const boundary_states = new WeakMap();

/**
 * @param {VaporBlock} nodes
 * @param {Node} [anchor]
 * @returns {VaporFragment}
 */
function create_fragment(nodes, anchor = document.createTextNode('')) {
	const fragment = new vapor.VaporFragment(nodes);
	fragment.anchor = anchor;
	return fragment;
}

/**
 * @param {Record<string, unknown> | null | undefined} value
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
 * @param {unknown} node
 * @param {Node | undefined} anchor
 * @returns {VaporRenderedBlock}
 */
function normalize_block(node, anchor) {
	if (node instanceof Node || vapor.isFragment(node)) return node;
	if (vapor.isVaporComponent(node)) {
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
 * @param {VaporRenderedBlock | undefined} current
 * @param {unknown} value
 * @param {Node | undefined} anchor
 * @returns {VaporRenderedBlock}
 */
function resolve_value(current, value, anchor) {
	anchor = anchor || (current instanceof Node && current.nodeType === 3 ? current : undefined);
	const node = normalize_block(value, anchor);

	if (current) {
		if (vapor.isFragment(current)) {
			if (current.anchor && current.anchor.parentNode) {
				vapor.remove(current.nodes, current.anchor.parentNode);
				vapor.insert(node, current.anchor.parentNode, current.anchor);
				if (current.scope) current.scope.stop();
			}
		} else if (current instanceof Node) {
			if (current.nodeType === 3 && (!(node instanceof Node) || node.nodeType !== 3)) {
				current.textContent = '';
			}
			if (vapor.isFragment(node) && current.parentNode) {
				vapor.insert(node, current.parentNode, current);
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
 * @param {() => unknown} render
 * @returns {Array<VaporRenderedBlock | undefined>}
 */
function create_boundary_nodes(render) {
	/** @type {Array<VaporRenderedBlock | undefined>} */
	const nodes = [];
	/** @type {EffectScope | undefined} */
	let scope;

	vapor.renderEffect(() => {
		if (scope) scope.stop();
		scope = new EffectScope();
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
 *
 * @param {TsrxErrorBoundaryProps} props
 * @returns {Array<VaporRenderedBlock | undefined>}
 */
export function TsrxErrorBoundary(props) {
	const instance = getCurrentInstance();
	if (instance) {
		initialize_boundary_state(instance);
	}
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
	if (instance) {
		initialize_boundary_state(instance);
	}
};

/**
 * @param {ComponentInternalInstance} instance
 * @returns {void}
 */
function initialize_boundary_state(instance) {
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
}
