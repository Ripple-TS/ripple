/** @import { Block } from '#client' */
import { component_invalid } from './errors.js';

import { branch, destroy_block, render } from './blocks.js';
import { render_spread } from './attributes.js';
import { COMPOSITE_BLOCK, DEFAULT_NAMESPACE, NAMESPACE_URI } from './constants.js';
import { hydrate_node, hydrate_next, hydrating, set_hydrate_node } from './hydration.js';
import { first_child } from './operations.js';
import { active_block, active_namespace, get, untrack, with_ns } from './runtime.js';
import { top_element_to_ns } from './utils.js';
import { install_ns_templates } from './template-ns.js';
import { is_tsrx_element } from '../../element.js';
import { render_component } from './component.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';

/**
 * @typedef {Function | string | null | undefined | false} CompositeTarget
 * @param {() => CompositeTarget} get_component
 * @param {Node} node
 * @param {() => Record<string, any>} get_props the props literal of the call
 *   site: read once per rendered component (props are plain values), and
 *   re-read as element attributes when the target is a tag
 * @returns {void}
 */
export function composite(get_component, node, get_props) {
	if (HYDRATION && hydrating) {
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
					var props = untrack(get_props);
					render_component(component, anchor, props);
				});
			} else if (is_tsrx_element(component)) {
				component_invalid(true);
			} else if (component != null) {
				// Custom element - only create if component is not null/undefined
				const ns = top_element_to_ns(component, active_namespace);
				if (ns !== DEFAULT_NAMESPACE) {
					// Templates cloned inside the element parse in its namespace.
					install_ns_templates();
				}
				var run = () => {
					var block = /** @type {Block} */ (active_block);

					/** @type {Element} */
					var element;
					if (HYDRATION && hydrating) {
						// Claim the SSR-rendered element instead of creating a new one.
						element = /** @type {Element} */ (hydrate_node);
					} else {
						element =
							ns !== DEFAULT_NAMESPACE
								? document.createElementNS(
										NAMESPACE_URI[ns],
										/** @type {keyof HTMLElementTagNameMap} */ (component),
									)
								: document.createElement(/** @type {keyof HTMLElementTagNameMap} */ (component));

						/** @type {ChildNode} */ (anchor).before(element);
					}

					if (block.s === null) {
						block.s = {
							start: element,
							end: element,
						};
					}

					render_spread(element, get_props, 0);

					var props = untrack(get_props);
					if (is_tsrx_element(props.children)) {
						/** @type {Node} */
						var child_anchor;
						if (HYDRATION && hydrating) {
							// The server renders children directly inside the element with no
							// extra markers; descend the cursor so they claim those nodes.
							child_anchor = /** @type {Node} */ (first_child(element));
						} else {
							child_anchor = document.createComment('');
							element.appendChild(child_anchor);
						}

						if (ns !== DEFAULT_NAMESPACE) {
							with_ns(ns, () => props.children.render(child_anchor, block, props.children.p));
						} else {
							props.children.render(child_anchor, block, props.children.p);
						}

						if (HYDRATION && hydrating) {
							// Reset the cursor to the claimed element so sibling traversal
							// continues after it.
							set_hydrate_node(element);
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
}
