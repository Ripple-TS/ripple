/** @import { Block } from '#client' */

import { branch, destroy_block, render, render_spread } from './blocks.js';
import { COMPOSITE_BLOCK, DEFAULT_NAMESPACE, NAMESPACE_URI } from './constants.js';
import { hydrate_next, hydrating } from './hydration.js';
import { active_block, active_namespace, get, with_block, with_ns } from './runtime.js';
import { top_element_to_ns } from './utils.js';
import { is_tsrx_element } from '../../element.js';
import { render_component } from './component.js';

/**
 * @param {Record<string, any>} props
 * @param {string} exclude_prop
 * @returns {Record<string, any>}
 */
function exclude_prop_from_object(props, exclude_prop) {
	return new Proxy(props, {
		get(target, property, receiver) {
			if (property === exclude_prop) return undefined;
			return Reflect.get(target, property, receiver);
		},
		has(target, property) {
			return property !== exclude_prop && Reflect.has(target, property);
		},
		ownKeys(target) {
			return Reflect.ownKeys(target).filter((property) => property !== exclude_prop);
		},
		getOwnPropertyDescriptor(target, property) {
			if (property === exclude_prop) return undefined;
			return Reflect.getOwnPropertyDescriptor(target, property);
		},
	});
}

/**
 * @typedef {((anchor: Node, props: Record<string, any>, block: Block | null) => void)} ComponentFunction
 * @param {() => ComponentFunction | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap | null | undefined | false} get_component
 * @param {Node} node
 * @param {Record<string, any>} props
 * @param {string} [exclude_prop]
 * @param {Block | null} [parent_block]
 * @returns {void}
 */
export function composite(get_component, node, props, exclude_prop, parent_block) {
	if (hydrating) {
		// During hydration, `node` may already point at the first real SSR node
		// (e.g. layout children). Only skip forward when we are on an empty
		// comment anchor from a client template placeholder.
		if (node.nodeType === 8 && /** @type {Comment} */ (node).data === '') {
			hydrate_next();
		}
	}

	var anchor = node;
	/** @type {Block | null} */
	var b = null;
	const component_props = exclude_prop ? exclude_prop_from_object(props, exclude_prop) : props;

	const render_composite = () =>
		render(
			() => {
				// @ts-ignore — get() handles non-tracked values via is_ripple_object() check
				var component = get(get_component());

				if (b !== null) {
					destroy_block(b);
					b = null;
				}

				if (typeof component === 'function') {
					// Handle as regular component
					b = branch(() => {
						render_component(component, anchor, component_props);
					});
				} else if (is_tsrx_element(component)) {
					throw new TypeError('Invalid component type: received a TSRXElement value.');
				} else if (component != null) {
					// Custom element - only create if component is not null/undefined
					const ns = top_element_to_ns(component, active_namespace);
					var run = () => {
						var block = /** @type {Block} */ (active_block);

						var element =
							ns !== DEFAULT_NAMESPACE
								? document.createElementNS(
										NAMESPACE_URI[ns],
										/** @type {keyof HTMLElementTagNameMap} */ (component),
									)
								: document.createElement(/** @type {keyof HTMLElementTagNameMap} */ (component));

						/** @type {ChildNode} */ (anchor).before(element);

						if (block.s === null) {
							block.s = {
								start: element,
								end: element,
							};
						}

						render_spread(element, () => props || {}, 0, exclude_prop);

						if (is_tsrx_element(props?.children)) {
							var child_anchor = document.createComment('');
							element.appendChild(child_anchor);

							if (ns !== DEFAULT_NAMESPACE) {
								with_ns(ns, () => props.children.render(child_anchor, block));
							} else {
								props.children.render(child_anchor, block);
							}
						}
					};

					if (ns !== active_namespace) {
						// support top-level dynamic element svg/math tags
						b = branch(() => with_ns(ns, run));
					} else {
						b = branch(run);
					}
				}
			},
			null,
			COMPOSITE_BLOCK,
		);

	if (parent_block !== undefined && parent_block !== null) {
		with_block(parent_block, render_composite);
	} else {
		render_composite();
	}
}
