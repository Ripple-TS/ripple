/** @import { AppendIntoAnchor, Block } from '#client' */

import {
	block,
	branch,
	destroy_block,
	get_first_node,
	get_last_node,
	move_block_last,
	remove_block_dom,
} from './blocks.js';
import { DETACHED_BLOCK, IF_BLOCK, RENDER_BLOCK, UNINITIALIZED } from './constants.js';
import { hydrate_next, hydrate_node, hydrating } from './hydration.js';
import { create_text, resolve_anchor } from './operations.js';
import { active_block, probe_if, run_untracked } from './runtime.js';
import { append } from './template.js';

/**
 * The if block renders its branch directly: the block owns the branch's DOM
 * range and its children are the branch's blocks, so no branch block sits in
 * between. Its condition runs tracked and returns the branch function to
 * render (or nothing); the branch renders untracked, like a branch block
 * would.
 * @typedef {{
 *   start: Node | null;
 *   end: Node | null;
 *   a: Node | AppendIntoAnchor;
 *   fn: (x: any) => Branch | undefined;
 *   x: any;
 *   b: Branch | undefined | typeof UNINITIALIZED;
 *   o: Block | null;
 * }} IfState
 * @typedef {(anchor: Node, x: any) => void} Branch
 */

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
 * @param {IfState} state
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
 * @param {IfState} state
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
 * Renders `fn` as the if's branch when it is not the current one. The
 * condition returns the branch function itself, so a branch is identified by
 * that function and no flag is needed.
 * @param {IfState} state
 * @param {Branch | undefined} fn
 */
function update_branch(state, fn) {
	var previous = state.b;
	if (previous === fn) return;
	state.b = fn;

	var block = /** @type {Block} */ (active_block);

	if (previous !== UNINITIALIZED) {
		if (/** @type {AppendIntoAnchor} */ (state.a).into === true) {
			materialize_anchor(state, block);
		}
		destroy_branch(state, block);
	}

	var o = state.o;

	if (fn !== undefined) {
		run_untracked(fn, /** @type {Node} */ (state.a), state.x);

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
 * @param {IfState} state
 */
function run_if(state) {
	update_branch(state, state.fn(state.x));
}

/**
 * State lives on the block instead of per-if closures.
 * @param {Node | AppendIntoAnchor} anchor
 * @param {IfState['fn']} fn
 * @param {any} x
 * @returns {IfState}
 */
function if_block_state(anchor, fn, x) {
	return {
		// DOM range of the current branch
		start: null,
		end: null,
		a: anchor,
		fn,
		// the captured local a hoisted condition and its branches receive
		x,
		// the current branch
		b: UNINITIALIZED,
		// block owning the anchor materialized from a sentinel
		o: null,
	};
}

/**
 * @param {Node | AppendIntoAnchor} node
 * @param {IfState['fn']} fn
 * @param {boolean} [root_controlled] When true the block renders directly before
 *   the component's `__anchor` (no synthesized `<!>` wrapper), which may be an
 *   append-into sentinel: branches then append into the parent until the if
 *   needs a position of its own (see `materialize_anchor`). During hydration
 *   the SSR boundary start marker sits at the cursor; we hand it to `append()`
 *   afterwards so it performs the same context-aware boundary advance the
 *   eliminated wrapper's `append()` used to do.
 * @param {any} [x] The one local a hoisted condition and its branches capture,
 *   passed to them as their second argument (see the compiler's if lowering).
 * @returns {void}
 */
export function if_block(node, fn, root_controlled, x) {
	/** @type {Node | undefined} */
	var boundary;
	var anchor = node;

	if (!hydrating) {
		// Evaluate the condition before deciding whether the if needs a block:
		// a condition that read no tracked state has its branch rendered by the
		// probe itself, directly under the current block, with no if block, no
		// state, and the branch's DOM and blocks belonging to the enclosing
		// block like any other content. A dynamic condition gets its block,
		// whose first run evaluates it again and subscribes it.
		var rendered;
		try {
			rendered = probe_if(fn, x, node);
		} catch {
			// A condition that throws (a pending async read) is the block's to
			// handle: create it and let its first run evaluate the condition.
			rendered = false;
		}
		if (!rendered) {
			block(RENDER_BLOCK | IF_BLOCK, run_if, if_block_state(anchor, fn, x));
		}
		return;
	}

	if (root_controlled) {
		// A sentinel resolves to the cursor, the block's SSR boundary marker.
		anchor = resolve_anchor(node);
		boundary = /** @type {Node} */ (hydrate_node);
	}
	hydrate_next();

	block(RENDER_BLOCK | IF_BLOCK, run_if, if_block_state(anchor, fn, x));

	if (root_controlled) {
		// The original `node`: for a sentinel, `hydrate_append` performs the
		// cursor advance that stands in for the eliminated sibling navigation.
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}
