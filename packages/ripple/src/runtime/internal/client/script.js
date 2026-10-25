/** @import { Block } from '#client' */

import { hydrating } from './hydration.js';
import { active_block } from './runtime.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';

/**
 * Prepare a template script to run when its enclosing fragment is inserted.
 * The compiler applies dynamic attributes and refs to the returned element
 * before insertion. Server scripts have already run and must be adopted.
 * @param {HTMLScriptElement} node
 * @returns {HTMLScriptElement}
 */
export function script(node) {
	if (HYDRATION && hydrating) return node;

	var script = document.createElement('script');
	// Newly created scripts are force-async. Clear that flag so external
	// scripts run in order unless a static or dynamic async attribute opts in.
	script.async = false;
	for (var attribute of node.attributes) {
		script.setAttribute(attribute.name, attribute.value);
	}
	script.textContent = node.textContent;
	node.replaceWith(script);

	// The template recorded its boundary nodes before this replacement. Keep
	// ownership on the live script so unmount removes it along with its siblings.
	var state = /** @type {Block} */ (active_block).s;
	if (state !== null) {
		if (state.start === node) state.start = script;
		if (state.end === node) state.end = script;
	}
	return script;
}
