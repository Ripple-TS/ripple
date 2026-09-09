/** @import { AppendIntoAnchor, Block } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { IF_BLOCK, UNINITIALIZED } from './constants.js';
import { hydrate_next, hydrate_node, hydrating } from './hydration.js';
import { resolve_anchor } from './operations.js';
import { append } from './template.js';

/**
 * @typedef {{
 *   a: Node;
 *   fn: (set_branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void;
 *   c: any;
 *   b: Block | null;
 *   h: boolean;
 * }} IfState
 */

/** The if block currently evaluating its condition (see `run_if`). */
/** @type {IfState | null} */
var active_if = null;

/**
 * @param {IfState} state
 * @param {any} condition
 * @param {((anchor: Node) => void) | null} fn
 */
function update_branch(state, condition, fn) {
	if (state.c === (state.c = condition)) return;

	if (state.b !== null) {
		destroy_block(state.b);
		state.b = null;
	}

	if (fn !== null) {
		state.b = branch(run_branch, 0, { start: null, end: null, a: state.a, fn });
	}
}

/**
 * @param {{ start: Node | null, end: Node | null, a: Node, fn: (anchor: Node) => void }} state
 */
function run_branch(state) {
	state.fn(state.a);
}

/**
 * @param {(anchor: Node) => void} fn
 * @param {boolean} [flag]
 */
function set_branch(fn, flag = true) {
	var state = /** @type {IfState} */ (active_if);
	state.h = true;
	update_branch(state, flag, fn);
}

/**
 * @param {IfState} state
 */
function run_if(state) {
	var previous_if = active_if;
	active_if = state;
	state.h = false;
	try {
		state.fn(set_branch);
	} finally {
		active_if = previous_if;
	}
	if (!state.h) {
		update_branch(state, null, null);
	}
}

/**
 * @param {Node | AppendIntoAnchor} node
 * @param {(set_branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void} fn
 * @param {boolean} [root_controlled] When true the block renders directly before
 *   the component's `__anchor` (no synthesized `<!>` wrapper), which may be an
 *   append-into sentinel (see `resolve_anchor`). During hydration
 *   the SSR boundary start marker sits at the cursor; we hand it to `append()`
 *   afterwards so it performs the same context-aware boundary advance the
 *   eliminated wrapper's `append()` used to do.
 * @returns {void}
 */
export function if_block(node, fn, root_controlled) {
	/** @type {Node | undefined} */
	var boundary;
	var anchor = root_controlled ? resolve_anchor(node) : /** @type {Node} */ (node);

	if (hydrating) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}
		hydrate_next();
	}

	// State lives on the render block instead of per-if closures.
	render(
		run_if,
		{
			a: anchor,
			fn,
			// last condition
			c: UNINITIALIZED,
			// current branch block
			b: null,
			// whether a branch was selected during the current run
			h: false,
		},
		IF_BLOCK,
	);

	if (hydrating && root_controlled) {
		// The original `node`: for a sentinel, `hydrate_append` performs the
		// cursor advance that stands in for the eliminated sibling navigation.
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}
