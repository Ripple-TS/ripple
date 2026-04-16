/** @import { Block } from '#client' */

import { branch, destroy_block, render, render_spread } from './blocks.js';
import { COMPOSITE_BLOCK, DEFAULT_NAMESPACE, NAMESPACE_URI } from './constants.js';
import { hydrate_next, hydrating } from './hydration.js';
import { active_block, active_namespace, get, with_ns } from './runtime.js';
import { top_element_to_ns } from './utils.js';
import { is_ripple_element } from '../../element.js';

/**
 * @typedef {((anchor: Node, props: Record<string, any>, block: Block | null) => void)} ComponentFunction
 * @param {() => ComponentFunction | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap} get_component
 * @param {Node} node
 * @param {Record<string, any>} props
 * @returns {void}
 */
export function composite(get_component, node, props) {
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
					var block = active_block;
					/** @type {ComponentFunction} */ (component)(anchor, props, block);
				});
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

					render_spread(element, () => props || {});

					if (is_ripple_element(props?.children)) {
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
					// support top-level dynamic element svg/math <@tag />
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
