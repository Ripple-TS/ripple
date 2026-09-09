/** @import { AppendIntoAnchor, Block, Derived, Component } from '#client' */

import {
	BLOCK_HAS_RUN,
	BRANCH_BLOCK,
	DERIVED,
	DESTROYED,
	EFFECT_BLOCK,
	PAUSED,
	PRE_EFFECT_BLOCK,
	RENDER_BLOCK,
	ROOT_BLOCK,
	TRY_BLOCK,
	DETACHED_BLOCK,
	HEAD_BLOCK,
	DIRECT_CHILD_BLOCK,
	IF_BLOCK,
} from './constants.js';
import { hydrating } from './hydration.js';
import { next_sibling } from './operations.js';
import { apply_element_spread } from './render.js';
import { is_array } from '@tsrx/core/runtime/language-helpers';
import {
	active_block,
	active_component,
	active_reaction,
	is_block_dirty,
	remove_dependencies,
	run_block,
	run_teardown,
	schedule_update,
	untrack,
} from './runtime.js';
import { is_ripple_object } from './utils.js';

/**
 * @param {Function} fn
 */
export function user_effect(fn) {
	if (active_block === null) {
		throw new Error(
			'effect() must be called within an active context, such as a component or effect',
		);
	}

	var component = active_component;
	if (component !== null && !component.m) {
		// Flat triples, created once the component has rendered (`pop_component`).
		var e = (component.e ??= []);
		e.push(fn, active_block, active_reaction);

		return;
	}

	return block(EFFECT_BLOCK, fn);
}

/**
 * @param {Function} fn
 */
export function effect(fn) {
	return block(EFFECT_BLOCK, fn);
}

/**
 * Creates a pre-effect block that runs eagerly before render blocks in the flush cycle.
 * @param {Function} fn
 */
export function pre_effect(fn) {
	return block(PRE_EFFECT_BLOCK, fn);
}

/**
 * @param {Function} fn
 * @param {any} [state]
 * @param {number} [flags]
 */
export function render(fn, state, flags = 0) {
	return block(RENDER_BLOCK | flags, fn, state);
}

/**
 * @param {any} element
 * @param {any} fn
 * @param {number} [flags]
 * @param {string} [exclude_prop]
 */
export function render_spread(element, fn, flags = 0, exclude_prop) {
	return block(RENDER_BLOCK | flags, apply_element_spread(element, fn, exclude_prop));
}

/**
 * @param {Function} fn
 * @param {number} [flags]
 * @param {any} [state]
 */
export function branch(fn, flags = 0, state = null) {
	return block(BRANCH_BLOCK | flags, fn, state);
}

function noop() {}

/**
 * Gives a text anchor materialized by `resolve_anchor` a branch block of its
 * own, so destroying the enclosing block removes the anchor along with the
 * content: a portal target outlives its content, and nothing else owns a node
 * appended there. Call it after creating the anchored block so block order
 * matches DOM order (the content is inserted before the anchor). A no-op when
 * `anchor` is the node as received (an ordinary anchor belongs to a template)
 * or the SSR marker the sentinel resolves to during hydration.
 * @param {Node | AppendIntoAnchor} node
 * @param {Node} anchor
 */
export function own_anchor(node, anchor) {
	if (anchor === node || hydrating) return;
	branch(noop, 0, { start: anchor, end: anchor });
}

/**
 * Wire up a `ref={expr}` attribute. `expr` may be:
 *   - a callback function — invoked with the element on mount; if it returns
 *     a function, that function runs as the cleanup on unmount.
 *   - a `Tracked` (e.g. from `track()`) — `tracked.value` is set to the
 *     element on mount and reset to `null` on unmount.
 *   - a plain mutable var (`let foo;`) — the element is assigned to the
 *     variable on mount and reset to `null` on unmount.
 *   - an array of any of the above.
 *
 * `get_fn` is invoked through `untrack` so the surrounding render block
 * doesn't subscribe to whatever the thunk happens to read. The supported
 * shape is to pass the ref slot itself (`ref={tracker}`); a foot-gun like
 * `ref={tracker.value}` would otherwise read the cell reactively and cause
 * spurious re-runs. Read untracked, the value is fixed for the life of the
 * enclosing block, so each ref is a single effect block keyed on its state
 * rather than a render block re-evaluating the thunk.
 *
 * @param {Element} element
 * @param {() => any} get_fn
 * @param {(value: any) => void} [set_fn]
 * @returns {void}
 */
export function ref(element, get_fn, set_fn) {
	apply_ref(element, untrack(get_fn), set_fn);
}

/**
 * @param {Element} element
 * @param {any} ref_value
 * @param {((value: any) => void) | undefined} set_fn
 * @returns {void}
 */
function apply_ref(element, ref_value, set_fn) {
	if (is_array(ref_value)) {
		for (var i = 0; i < ref_value.length; i++) {
			apply_ref(element, ref_value[i], undefined);
		}
	} else if (typeof ref_value === 'function') {
		block(EFFECT_BLOCK, run_function_ref, { e: element, f: ref_value });
	} else if (is_ripple_object(ref_value)) {
		block(EFFECT_BLOCK, run_tracked_ref, { e: element, t: ref_value });
	} else if (set_fn !== undefined) {
		block(EFFECT_BLOCK, run_set_ref, { e: element, f: set_fn });
	}
}

/**
 * The callback's return value is the effect's teardown.
 * @param {{ e: Element, f: (element: Element) => any }} s
 */
function run_function_ref(s) {
	return s.f(s.e);
}

/**
 * @param {{ e: Element, t: { value: any } }} s
 */
function run_tracked_ref(s) {
	s.t.value = s.e;
	return clear_tracked_ref;
}

/**
 * Teardowns keyed on block state receive it (see `run_teardown`).
 * @param {{ e: Element, t: { value: any } }} s
 */
function clear_tracked_ref(s) {
	s.t.value = null;
}

/**
 * @param {{ e: Element, f: (value: any) => void }} s
 */
function run_set_ref(s) {
	s.f(s.e);
	return clear_set_ref;
}

/**
 * @param {{ e: Element, f: (value: any) => void }} s
 */
function clear_set_ref(s) {
	s.f(null);
}

/**
 * @param {() => (void | (() => void))} fn
 * @returns {Block}
 */
export function root(fn) {
	// create_component_ctx, inline: the root is the first component context.
	return block(
		ROOT_BLOCK,
		fn,
		{ start: null, end: null },
		{ b: active_block, c: null, e: null, m: false, p: active_component },
	);
}

/**
 * @param {() => void} fn
 * @param {any} state
 * @returns {Block}
 */
export function create_try_block(fn, state) {
	return block(TRY_BLOCK, fn, state);
}

/**
 * @param {() => void} fn
 * @param {number} [flags]
 * @param {any} [state]
 */
export function boundary_fn_running_block(fn, flags = 0, state = null) {
	return branch(fn, DIRECT_CHILD_BLOCK | flags, state);
}

/** Creation counter: a parent always has a lower id than its descendants. */
var block_id = 0;

/**
 * @param {Block} block
 * @param {Block} parent_block
 */
function push_block(block, parent_block) {
	var parent_last = parent_block.last;
	if (parent_last === null) {
		parent_block.last = parent_block.first = block;
	} else {
		parent_last.next = block;
		block.prev = parent_last;
		parent_block.last = block;
	}
}

/**
 * @param {number} flags
 * @param {Function} fn
 * @param {any} [state]
 * @param {Component} [co]
 * @returns {Block}
 */
export function block(flags, fn, state = null, co) {
	/** @type {Block} */
	var block = {
		co: co || active_component,
		d: null,
		first: null,
		f: flags,
		fn,
		i: ++block_id,
		last: null,
		next: null,
		p: active_block,
		prev: null,
		s: state,
		t: null,
	};

	if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0) {
		/* prettier-ignore */
		(/** @type {Derived} */ (active_reaction).blocks ??= []).push(block);
	}

	var parent_block = active_block;
	if (parent_block !== null) {
		// push_block, inline: block creation is the hot path.
		var parent_last = parent_block.last;
		if (parent_last === null) {
			parent_block.last = parent_block.first = block;
		} else {
			parent_last.next = block;
			block.prev = parent_last;
			parent_block.last = block;
		}
	}

	if ((flags & EFFECT_BLOCK) !== 0) {
		schedule_update(block);
	} else {
		run_block(block, true);
		block.f ^= BLOCK_HAS_RUN;
	}

	return block;
}

/**
 * @param {Block} parent
 * @param {boolean} [remove_dom]
 */
export function destroy_block_children(parent, remove_dom = false) {
	var block = parent.first;
	parent.first = parent.last = null;

	while (block !== null) {
		var next = block.next;
		destroy_block(block, remove_dom);
		block = next;
	}
}

/**
 * @param {Block} parent
 * @param {boolean} [remove_dom]
 */
export function destroy_non_branch_children(parent, remove_dom = false) {
	var block = parent.first;

	while (block !== null) {
		var next = block.next;
		if ((block.f & BRANCH_BLOCK) === 0) {
			destroy_block(block, remove_dom);
		}
		block = next;
	}
}

/**
 * @param {Block} block
 */
export function unlink_block(block) {
	var parent = block.p;
	var prev = block.prev;
	var next = block.next;

	if (prev !== null) prev.next = next;
	if (next !== null) next.prev = prev;

	if (parent !== null) {
		if (parent.first === block) parent.first = next;
		if (parent.last === block) parent.last = prev;
	}
}

/**
 * Moves `block` to the end of its parent's child list. A block whose content
 * is inserted before an anchor the parent already owns is created after the
 * anchor's block; relinking keeps block order equal to DOM order, which the
 * first/last node descent in `get_first_node`/`get_last_node` relies on.
 * @param {Block} block
 */
export function move_block_last(block) {
	var parent = /** @type {Block} */ (block.p);
	if (parent.last === block) {
		return;
	}
	unlink_block(block);
	block.prev = block.next = null;
	push_block(block, parent);
}

/**
 * @param {Block} block
 */
export function pause_block(block) {
	if ((block.f & PAUSED) !== 0) {
		return;
	}
	block.f ^= PAUSED;

	var child = block.first;

	while (child !== null) {
		var next = child.next;
		pause_block(child);
		child = next;
	}

	run_teardown(block);
}

/**
 * @param {Block} block
 */
export function resume_block(block) {
	if ((block.f & PAUSED) === 0) {
		return;
	}
	block.f ^= PAUSED;

	if (is_block_dirty(block)) {
		schedule_update(block);
	}

	var child = block.first;

	while (child !== null) {
		var next = child.next;
		resume_block(child);
		child = next;
	}
}

/**
 * @param {Block} target_block
 * @returns {boolean}
 */
export function is_destroyed(target_block) {
	/** @type {Block | null} */
	var block = target_block;

	while (block !== null) {
		var flags = block.f;

		if ((flags & DESTROYED) !== 0) {
			return true;
		}
		if ((flags & ROOT_BLOCK) !== 0) {
			return false;
		}
		block = block.p;
	}
	return true;
}

/**
 * @param {Node | null} node
 * @param {Node} end
 */
export function remove_block_dom(node, end) {
	while (node !== null) {
		/** @type {Node | null} */
		var next = node === end ? null : next_sibling(node);

		/** @type {Element | Text | Comment} */ (node).remove();
		node = next;
	}
}

/**
 * Moves DOM nodes from a block to a target element (typically a DocumentFragment).
 * If the block has state (start/end), moves that range.
 * If not, recursively moves content from child branch blocks.
 * @param {Block} block - The block to move content from
 * @param {Element | DocumentFragment} target - Where to move the nodes
 * @returns {boolean} - True if content was moved
 */
export function move_block(block, target) {
	var f = block.f;

	// Only branch and if blocks (excluding TRY_BLOCK) can have DOM state to move
	if ((f & (BRANCH_BLOCK | IF_BLOCK)) !== 0 && (f & TRY_BLOCK) === 0) {
		var s = block.s;
		if (s !== null && s.start !== null) {
			var node = s.start;
			var end = s.end;

			while (node !== null) {
				var next = node === end ? null : next_sibling(node);
				target.append(node);
				node = next;
			}
			// An if's materialized anchor follows its range.
			if ((f & IF_BLOCK) !== 0 && s.o !== null) {
				move_block(s.o, target);
			}
			return true;
		}
	}

	// If this block has no DOM, try moving from child branch blocks
	var moved = false;
	var child = block.first;
	while (child !== null) {
		if (move_block(child, target)) {
			moved = true;
		}
		child = child.next;
	}
	return moved;
}

/**
 * Resolve the first DOM node owned by a block. A branch or if block normally
 * records its range in `s.start`/`s.end`, but an optimized single control-flow / component
 * root scope renders its content through a descendant block instead of a
 * synthesized `<!>` wrapper, so its own `s.start` is null. In that case we
 * descend into child blocks to find the real first node. Returns null when the
 * block currently renders no DOM.
 * @param {Block} block
 * @returns {Node | null}
 */
export function get_first_node(block) {
	var f = block.f;
	if ((f & (BRANCH_BLOCK | IF_BLOCK)) !== 0 && (f & TRY_BLOCK) === 0) {
		var s = block.s;
		if (s !== null && s.start !== null) {
			return s.start;
		}
	}
	var child = block.first;
	while (child !== null) {
		var node = get_first_node(child);
		if (node !== null) {
			return node;
		}
		child = child.next;
	}
	return null;
}

/**
 * Mirror of {@link get_first_node} for the last DOM node owned by a block.
 * @param {Block} block
 * @returns {Node | null}
 */
export function get_last_node(block) {
	var f = block.f;
	if ((f & (BRANCH_BLOCK | IF_BLOCK)) !== 0 && (f & TRY_BLOCK) === 0) {
		var s = block.s;
		if (s !== null && s.start !== null) {
			// An if's materialized anchor is its last node.
			return (f & IF_BLOCK) !== 0 && s.o !== null ? s.o.s.end : s.end;
		}
	}
	var child = block.last;
	while (child !== null) {
		var node = get_last_node(child);
		if (node !== null) {
			return node;
		}
		child = child.prev;
	}
	return null;
}

/**
 * @param {Block} block
 * @param {boolean} [remove_dom]
 */
export function destroy_block(block, remove_dom = true) {
	var f = (block.f |= DESTROYED);
	var removed = false;

	// An ancestor that removed its own range tells its subtree not to bother,
	// but detached content (a portal target, `<head>`) is not inside that
	// range and must still be removed, by this block or by its children.
	if ((f & DETACHED_BLOCK) !== 0) {
		remove_dom = true;
	}

	if (
		(remove_dom && (f & (BRANCH_BLOCK | ROOT_BLOCK | IF_BLOCK)) !== 0 && (f & TRY_BLOCK) === 0) ||
		(f & HEAD_BLOCK) !== 0
	) {
		var s = block.s;
		if (s !== null && s.start !== null) {
			remove_block_dom(s.start, s.end);
			removed = true;
		}
	}

	destroy_block_children(block, remove_dom && !removed);

	run_teardown(block);

	if (block.d !== null) {
		remove_dependencies(block);
	}

	var parent = block.p;

	// If the parent doesn't have any children, then skip this work altogether
	if (parent !== null && parent.first !== null) {
		unlink_block(block);
	}

	block.fn = block.s = block.d = block.p = block.co = block.t = null;
}
