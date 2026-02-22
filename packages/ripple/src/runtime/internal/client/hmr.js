/** @import { Block, Tracked } from '#client' */

import { RENDER_BLOCK } from './constants.js';
import { HMR } from './constants.js';
import { hydrate_node, hydrating } from './hydration.js';
import { branch, destroy_block, render } from './blocks.js';
import { active_block, get, set, tracked } from './runtime.js';

/**
 * Wraps a component function for HMR (Hot Module Replacement).
 * Creates a reactive wrapper that can swap the underlying component
 * when a new version is received via import.meta.hot.accept().
 *
 * @template {(anchor: Node, props: any, block: Block | null) => any} Component
 * @param {Component} fn
 * @returns {Component}
 */
export function hmr(fn) {
	/**
	 * @type {Tracked | undefined}
	 */
	var current;

	/**
	 * @param {Node} anchor
	 * @param {any} props
	 * @param {Block | null} block
	 */
	function wrapper(anchor, props, block = active_block) {
		if (current === undefined) {
			current = wrapper[HMR].current;
		}

		if (current === undefined) {
			current = tracked(fn, /** @type {Block} */ (block));
			wrapper[HMR].current = current;
		}
		var component = {};

		/** @type {Block | null} */
		var effect = null;

		render(
			() => {
				var next_component = get(current);

				if (component === next_component) {
					return;
				}

				component = next_component;

				if (effect) {
					destroy_block(effect);
				}

				effect = branch(() => {
					/** @type {Function} */ (component)(anchor, props, block);
				});
			},
			null,
			RENDER_BLOCK,
		);

		if (hydrating) {
			anchor = hydrate_node;
		}

		return wrapper;
	}

	// @ts-ignore
	wrapper[HMR] = {
		fn,
		current,
		/**
		 * Called by import.meta.hot.accept() with the new module's component.
		 * Updates the tracked source so existing instances reactively re-render
		 * with the new component function, and bridges the incoming wrapper's
		 * source to the original one for future updates.
		 *
		 * @param {any} incoming
		 */
		update: (incoming) => {
			fn = incoming[HMR].fn;
			wrapper[HMR].fn = fn;

			// Prefer this wrapper's existing source. If this wrapper has never
			// mounted, it may not have one yet, so fall back to any bridged source
			// on the incoming wrapper.
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

			// Bridge the incoming wrapper's source to the original one,
			// so subsequent updates continue to use this same tracked source
			// rather than creating an ever-growing chain of wrappers.
			incoming[HMR].current = wrapper[HMR].current;
		},
	};

	return /** @type {Component} */ (wrapper);
}
