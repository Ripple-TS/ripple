/** @import { AppendIntoAnchor, Block } from '#client' */

import {
	branch,
	destroy_block,
	get_first_node,
	get_last_node,
	move_block_last,
	remove_block_dom,
	render,
} from './blocks.js';
import { DETACHED_BLOCK, IF_BLOCK, UNINITIALIZED } from './constants.js';
import { hydrate_next, hydrate_node, hydrating } from './hydration.js';
import { create_text, resolve_anchor } from './operations.js';
import { active_block, set_tracking } from './runtime.js';
import { append } from './template.js';

/**
 * The if block renders its branch directly: the block owns the branch's DOM
 * range and its children are the branch's blocks, so no branch block sits in
 * between. Its condition runs tracked; the branch renders untracked, like a
 * branch block would.
 * @typedef {{
 *   start: Node | null;
 *   end: Node | null;
 *   a: Node | AppendIntoAnchor;
 *   fn: (set_branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void;
 *   c: any;
 *   h: boolean;
 *   o: Block | null;
 * }} IfState
 */

/**
 * The state of a flat if: the compiler inlined every branch's setup and
 * updates into the block's function, which re-runs on any change and swaps
 * the branch only when the branch index changes (see `flat_swap`). The
 * compiler adds the fields its branches keep between runs.
 * @typedef {{
 *   start: Node | null;
 *   end: Node | null;
 *   a: Node | AppendIntoAnchor;
 *   c: number | typeof UNINITIALIZED;
 *   o: Block | null;
 * }} FlatIfState
 */

/** The if block currently evaluating its condition (see `run_if`). */
/** @type {IfState | null} */
var active_if = null;

function noop() {}

/**
 * The last DOM node rendered by the current branch through a child block,
 * for a branch that has no range of its own (its root is control flow).
 * @param {Block} block
 * @param {Block | null} skip
 * @returns {Node | null}
 */
function last_child_node(block, skip) {
	var child = block.last;
	while (child !== null) {
		if (child !== skip) {
			var node = get_last_node(child);
			if (node !== null) {
				return node;
			}
		}
		child = child.prev;
	}
	return null;
}

/**
 * @param {Block} block
 * @param {Block | null} skip
 * @returns {Node | null}
 */
function first_child_node(block, skip) {
	var child = block.first;
	while (child !== null) {
		if (child !== skip) {
			var node = get_first_node(child);
			if (node !== null) {
				return node;
			}
		}
		child = child.next;
	}
	return null;
}

/**
 * Destroys the current branch: its DOM range, then its blocks (all children
 * of the if block except the anchor's owner). `remove_dom` stays on for the
 * children when the branch renders through them and has no range itself.
 * @param {IfState | FlatIfState} state
 * @param {Block} block
 */
function destroy_branch(state, block) {
	var start = state.start;
	var remove_dom = start === null;

	if (!remove_dom) {
		remove_block_dom(start, /** @type {Node} */ (state.end));
		state.start = state.end = null;
	}

	var keep = state.o;
	var child = block.first;
	while (child !== null) {
		var next = child.next;
		if (child !== keep) {
			destroy_block(child, remove_dom);
		}
		child = next;
	}
}

/**
 * Turns the append-into sentinel of a root-controlled if into a text anchor
 * the if owns. The sentinel is only right for the first append, so the anchor
 * is materialized as late as possible: when a branch swap needs the position
 * of the branch being replaced (still rendered), or when the if renders
 * nothing and would otherwise have no position at all. Until then a list of
 * `@if` items keeps no anchor nodes in the DOM.
 * @param {IfState | FlatIfState} state
 * @param {Block} block
 */
function materialize_anchor(state, block) {
	var sentinel = /** @type {AppendIntoAnchor} */ (state.a);
	var parent = sentinel.parent;
	var text = create_text();
	var last = state.start !== null ? state.end : last_child_node(block, null);

	if (last === null || last.parentNode !== parent) {
		parent.appendChild(text);
	} else {
		/** @type {ChildNode} */ (last).after(text);
	}

	state.a = text;
	// Created after the current branch, so block order follows DOM order;
	// `update_branch` relinks it behind every later branch. The anchor sits
	// outside the if's own range (it is the if's last node, see
	// `get_last_node`), so the owner is detached: it removes the anchor even
	// when the if has already removed its range.
	state.o = branch(noop, DETACHED_BLOCK, { start: text, end: text });
}

/**
 * @param {IfState} state
 * @param {any} condition
 * @param {((anchor: Node) => void) | null} fn
 */
function update_branch(state, condition, fn) {
	var previous = state.c;
	if (previous === condition) return;
	state.c = condition;

	var block = /** @type {Block} */ (active_block);

	if (previous !== UNINITIALIZED) {
		if (/** @type {AppendIntoAnchor} */ (state.a).into === true) {
			materialize_anchor(state, block);
		}
		destroy_branch(state, block);
	}

	var o = state.o;

	if (fn !== null) {
		set_tracking(false);
		fn(/** @type {Node} */ (state.a));
		set_tracking(true);

		if (o !== null) {
			move_block_last(o);
		} else if (
			/** @type {AppendIntoAnchor} */ (state.a).into === true &&
			state.start === null &&
			first_child_node(block, null) === null
		) {
			materialize_anchor(state, block);
		}
	} else if (/** @type {AppendIntoAnchor} */ (state.a).into === true) {
		materialize_anchor(state, block);
	}
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
 *   append-into sentinel: branches then append into the parent until the if
 *   needs a position of its own (see `materialize_anchor`). During hydration
 *   the SSR boundary start marker sits at the cursor; we hand it to `append()`
 *   afterwards so it performs the same context-aware boundary advance the
 *   eliminated wrapper's `append()` used to do.
 * @returns {void}
 */
export function if_block(node, fn, root_controlled) {
	/** @type {Node | undefined} */
	var boundary;
	var anchor = node;

	if (hydrating) {
		if (root_controlled) {
			// A sentinel resolves to the cursor, the block's SSR boundary marker.
			anchor = resolve_anchor(node);
			boundary = /** @type {Node} */ (hydrate_node);
		}
		hydrate_next();
	}

	// State lives on the block instead of per-if closures.
	render(
		run_if,
		{
			// DOM range of the current branch
			start: null,
			end: null,
			a: anchor,
			fn,
			// last condition
			c: UNINITIALIZED,
			// whether a branch was selected during the current run
			h: false,
			// block owning the anchor materialized from a sentinel
			o: null,
		},
		IF_BLOCK,
	);

	if (hydrating && root_controlled) {
		// The original `node`: for a sentinel, `hydrate_append` performs the
		// cursor advance that stands in for the eliminated sibling navigation.
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}

/**
 * A flat if (see {@link FlatIfState}). `fn` is the compiled block function:
 * it evaluates the branch index, calls `flat_swap` when it changed, runs the
 * chosen branch's setup, then its updates.
 * @param {Node | AppendIntoAnchor} node
 * @param {(state: FlatIfState) => void} fn
 * @param {FlatIfState} state
 * @param {boolean} [root_controlled] See {@link if_block}.
 * @returns {void}
 */
export function if_flat(node, fn, state, root_controlled) {
	/** @type {Node | undefined} */
	var boundary;
	var anchor = node;

	if (hydrating) {
		if (root_controlled) {
			anchor = resolve_anchor(node);
			boundary = /** @type {Node} */ (hydrate_node);
		}
		hydrate_next();
	}

	state.a = anchor;
	render(fn, state, IF_BLOCK);

	if (hydrating && root_controlled) {
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}

/**
 * The branch index of a flat if changed: drop the current branch, before the
 * compiled setup of the new one runs. `-1` means no branch renders.
 * @param {FlatIfState} state
 * @param {number} index
 */
export function flat_swap(state, index) {
	var block = /** @type {Block} */ (active_block);

	if (state.c !== UNINITIALIZED) {
		if (/** @type {AppendIntoAnchor} */ (state.a).into === true) {
			materialize_anchor(state, block);
		}
		destroy_branch(state, block);
	}
	state.c = index;

	if (index === -1 && /** @type {AppendIntoAnchor} */ (state.a).into === true) {
		materialize_anchor(state, block);
	}
}
