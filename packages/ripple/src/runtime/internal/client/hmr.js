/** @import { Block, Tracked } from '#client' */

import { RENDER_BLOCK } from './constants.js';
import { HMR } from './constants.js';
import { hydrate_node, hydrating } from './hydration.js';
import { branch, destroy_block, render } from './blocks.js';
import { active_block, get, set, tracked } from './runtime.js';

/**
@typedef {
	(anchor: Node, props: any, block: Block | null) => void
} Component

@typedef {
	Component & {
		[HMR]: {
			fn: Component;
			current: Tracked | undefined;
			update: (incoming: ComponentWrapper) => void;
		}
	}
} ComponentWrapper
 */

/**
 * Wraps a component function for HMR (Hot Module Replacement).
 * Creates a reactive wrapper that can swap the underlying component
 * when a new version is received via import.meta.hot.accept().
 *
 * @param {Component} fn
 * @returns {ComponentWrapper}
 */
export function hmr(fn) {
	/** @type {Tracked<Component> | undefined} */
	var current;

	/**
	 * @type {ComponentWrapper}
	 * @param {Node} anchor
	 * @param {any} props
	 * @param {Block | null} block
	 */
	function wrapper(anchor, props, block = active_block) {
		if (current === undefined) {
			current = wrapper[HMR].current;
		}
		/** @type {Node} */
		var target = anchor;

		if (current === undefined) {
			current = tracked(fn, /** @type {Block} */ (block));
			wrapper[HMR].current = current;
		}
		var component = {};

		/** @type {Block | null} */
		var effect = null;

		render(
			() => {
				var next_component = get(/** @type {Tracked} */ (current));

				if (component === next_component) {
					return;
				}

				component = next_component;

				if (effect) {
					destroy_block(effect);
				}

				effect = branch(() => {
					/** @type {Function} */ (component)(target, props, active_block);
				});
			},
			null,
			RENDER_BLOCK,
		);

		if (hydrating) {
			target = /** @type {Node} */ (hydrate_node);
		}

		return wrapper;
	}

	wrapper[HMR] = {
		fn,
		current,
		update: (incoming) => {
			fn = incoming[HMR].fn;
			wrapper[HMR].fn = fn;

			var source = wrapper[HMR].current;
			if (source === undefined) {
				source = incoming[HMR].current;
			}

			if (source !== undefined) {
				current = source;
				wrapper[HMR].current = source;
				// Update the shared tracked source so mounted instances re-render.
				set(source, fn);
			}

			incoming[HMR].current = wrapper[HMR].current;
		},
	};

	return wrapper;
}
