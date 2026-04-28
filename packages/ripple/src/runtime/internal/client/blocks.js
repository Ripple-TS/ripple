/** @import { Block, Derived, CompatOptions, Component } from '#client' */

import {
	BLOCK_HAS_RUN,
	BRANCH_BLOCK,
	DERIVED,
	CONTAINS_TEARDOWN,
	DESTROYED,
	EFFECT_BLOCK,
	PAUSED,
	PRE_EFFECT_BLOCK,
	RENDER_BLOCK,
	ROOT_BLOCK,
	TRY_BLOCK,
	HEAD_BLOCK,
	DIRECT_CHILD_BLOCK,
	UNINITIALIZED,
} from './constants.js';
import { next_sibling } from './operations.js';
import { apply_element_spread } from './render.js';
import {
	active_block,
	active_component,
	active_reaction,
	create_component_ctx,
	is_block_dirty,
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
		var e = (component.e ??= []);
		e.push({
			b: active_block,
			fn,
			r: active_reaction,
		});

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
 */
export function render_spread(element, fn, flags = 0) {
	return block(RENDER_BLOCK | flags, apply_element_spread(element, fn));
}

/**
 * @param {Function} fn
 * @param {number} [flags]
 * @param {any} [state]
 */
export function branch(fn, flags = 0, state = null) {
	return block(BRANCH_BLOCK | flags, fn, state);
}

/**
 * Wire up a `{ref expr}` attribute. `expr` may be:
 *   - a callback function — invoked with the element on mount; if it returns
 *     a function, that function runs as the cleanup on unmount.
 *   - a `Tracked` (e.g. from `track()`) — `tracked.value` is set to the
 *     element on mount and reset to `null` on unmount.
 *   - a plain mutable var (`let foo;`) — the element is assigned to the
 *     variable. No teardown is run, released with the component.
 *
 * `get_fn` is invoked through `untrack` so the surrounding render block
 * doesn't subscribe to whatever the thunk happens to read. The supported
 * shape is to pass the ref slot itself (`{ref tracker}`); a foot-gun like
 * `{ref tracker.value}` would otherwise read the cell reactively and cause
 * spurious re-runs.
 *
 * @param {Element} element
 * @param {() => any} get_fn
 * @param {(value: any) => void} [set_fn]
 * @returns {Block}
 */
export function ref(element, get_fn, set_fn) {
	// make sure the first run always enters the dispatch branch,
	/** @type {any} */
	var ref_value = UNINITIALIZED;
	/** @type {Block | null} */
	var e;

	return block(RENDER_BLOCK, () => {
		// avoid any reactive reads
		var next = untrack(get_fn);
		if (ref_value !== (ref_value = next)) {
			if (e) {
				destroy_block(e);
				e = null;
			}

			if (typeof ref_value === 'function') {
				e = branch(() => {
					effect(() => ref_value(element));
				});
			} else if (is_ripple_object(ref_value)) {
				e = branch(() => {
					effect(() => {
						ref_value.value = element;
						return () => {
							ref_value.value = null;
						};
					});
				});
			} else if (set_fn !== undefined) {
				set_fn(element);
			}
		}
	});
}

/**
 * @param {() => (void | (() => void))} fn
 * @param {CompatOptions} [compat]
 * @returns {Block}
 */
export function root(fn, compat) {
	var target_fn = fn;

	if (compat != null) {
		/** @type {Array<void | (() => void)>} */
		var unmounts = [];
		for (var key in compat) {
			var api = compat[key];
			unmounts.push(api.createRoot());
		}
		target_fn = () => {
			var component_unmount = fn();

			return () => {
				component_unmount?.();
				for (var unmount of unmounts) {
					unmount?.();
				}
			};
		};
	}

	return block(ROOT_BLOCK, target_fn, { compat }, create_component_ctx());
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

	if (active_block !== null) {
		push_block(block, active_block);
	}

	if ((flags & EFFECT_BLOCK) !== 0) {
		schedule_update(block);
	} else {
		run_block(block);
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

	if ((parent.f & CONTAINS_TEARDOWN) !== 0) {
		while (block !== null) {
			var next = block.next;
			destroy_block(block, remove_dom);
			block = next;
		}
	}
}

/**
 * @param {Block} parent
 * @param {boolean} [remove_dom]
 */
export function destroy_non_branch_children(parent, remove_dom = false) {
	var block = parent.first;

	if (
		(parent.f & CONTAINS_TEARDOWN) === 0 &&
		parent.first !== null &&
		(parent.first.f & BRANCH_BLOCK) === 0
	) {
		parent.first = parent.last = null;
	} else {
		while (block !== null) {
			var next = block.next;
			if ((block.f & BRANCH_BLOCK) === 0) {
				destroy_block(block, remove_dom);
			}
			block = next;
		}
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

	// Only BRANCH_BLOCKs (excluding TRY_BLOCK) can have DOM state to move
	if ((f & BRANCH_BLOCK) !== 0 && (f & TRY_BLOCK) === 0) {
		var s = block.s;
		if (s !== null && s.start !== null) {
			var node = s.start;
			var end = s.end;

			while (node !== null) {
				var next = node === end ? null : next_sibling(node);
				target.append(node);
				node = next;
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
 * @param {Block} block
 * @param {boolean} [remove_dom]
 */
export function destroy_block(block, remove_dom = true) {
	block.f ^= DESTROYED;

	var removed = false;
	var f = block.f;

	if (
		(remove_dom && (f & (BRANCH_BLOCK | ROOT_BLOCK)) !== 0 && (f & TRY_BLOCK) === 0) ||
		(f & HEAD_BLOCK) !== 0
	) {
		var s = block.s;
		if (s !== null) {
			remove_block_dom(s.start, s.end);
			removed = true;
		}
	}

	destroy_block_children(block, remove_dom && !removed);

	run_teardown(block);

	var parent = block.p;

	// If the parent doesn't have any children, then skip this work altogether
	if (parent !== null && parent.first !== null) {
		unlink_block(block);
	}

	block.fn = block.s = block.d = block.p = block.co = block.t = null;
}
