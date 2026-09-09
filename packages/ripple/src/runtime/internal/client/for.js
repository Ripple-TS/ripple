/** @import { AppendIntoAnchor, Block, Tracked } from '#client' */

import { IS_CONTROLLED, IS_INDEXED, ROOT_CONTROLLED } from '../../../constants.js';
import {
	branch,
	destroy_block,
	destroy_block_children,
	get_first_node,
	get_last_node,
	own_anchor,
	render,
} from './blocks.js';
import { FOR_BLOCK, TRACKED_ARRAY } from './constants.js';
import { hydrate_next, hydrate_node, hydrating, set_hydrate_node } from './hydration.js';
import { get_first_child, get_last_child, next_sibling, resolve_anchor } from './operations.js';
import { append } from './template.js';
import { active_block, set, set_tracking, tracked } from './runtime.js';
import { array_from, is_array } from '@tsrx/core/runtime/language-helpers';

/**
 * @template V
 * @param {Node | AppendIntoAnchor} anchor
 * @param {V} value
 * @param {number} index
 * @param {(anchor: Node, value: V | Tracked, index?: any) => Block} render_fn
 * @param {boolean} is_indexed
 * @param {boolean} is_keyed
 * @returns {Block}
 */
function create_item(anchor, value, index, render_fn, is_indexed, is_keyed) {
	var block = /** @type {Block} */ (active_block);
	var tracked_index = is_indexed ? tracked(index, block) : undefined;
	var tracked_value = is_keyed ? tracked(value, block) : value;
	var state = {
		start: null,
		end: null,
		i: tracked_index,
		v: tracked_value,
	};

	// Passed through module state rather than a per-item closure; run_item
	// reads them before rendering, so nested loops cannot observe a stale pair.
	item_anchor = anchor;
	item_render_fn = render_fn;
	var b = branch(run_item, 0, state);

	// The item's tracked value and index are owned by the item block itself.
	if (is_keyed) {
		/** @type {Tracked} */ (tracked_value).b = b;
	}
	if (is_indexed) {
		/** @type {Tracked} */ (tracked_index).b = b;
	}
	return b;
}

/**
 * The insertion point of a list: a node the items go before, or, for a
 * controlled list (the sole content of its parent), an append-into sentinel so
 * items append to the parent with no anchor node in the DOM.
 * @typedef {Element | Text | AppendIntoAnchor} ListAnchor
 */

/**
 * @param {Element} parent
 * @returns {AppendIntoAnchor}
 */
function controlled_anchor(parent) {
	return { parent, into: true };
}

/** @type {Node | AppendIntoAnchor | null} */
var item_anchor = null;
/** @type {((anchor: Node, value: any, index?: any) => Block) | null} */
var item_render_fn = null;

/**
 * @param {{ i: Tracked | undefined, v: any }} state
 */
function run_item(state) {
	var render_fn = /** @type {(anchor: Node, value: any, index?: any) => Block} */ (item_render_fn);
	var anchor = /** @type {Node} */ (item_anchor);
	item_render_fn = null;
	item_anchor = null;
	render_fn(anchor, state.v, state.i);
}

/**
 * @param {ListAnchor} anchor
 * @param {(anchor: Node) => void} render_empty
 * @returns {Block}
 */
function create_empty(anchor, render_empty) {
	return branch(() => {
		render_empty(/** @type {Node} */ (anchor));
	});
}

/**
 * @param {Block} block
 * @param {ChildNode | AppendIntoAnchor} anchor
 * @returns {void}
 */
function move(block, anchor) {
	// Fast path: a normal item records its own range. Only an optimized single
	// control-flow / component root item (DOM rendered through a descendant
	// block, `s.start` null) needs the descent via `get_first_node`/`get_last_node`.
	var s = block.s;
	var node = s.start;
	var end;

	if (node === null) {
		node = get_first_node(block);
		if (node === null) {
			return;
		}
		end = get_last_node(block);
	} else {
		end = s.end;
	}

	// A controlled list appends into its parent (no anchor node); anything
	// else inserts before its anchor.
	/** @type {Node | null} */
	var parent = null;
	/** @type {ChildNode | null} */
	var before = null;
	if (/** @type {AppendIntoAnchor} */ (anchor).into === true) {
		parent = /** @type {AppendIntoAnchor} */ (anchor).parent;
	} else {
		before = /** @type {ChildNode} */ (anchor);
	}

	if (node === end) {
		insert_node(parent, before, node);
		return;
	}
	while (node !== null) {
		var next_node = /** @type {Node} */ (next_sibling(node));
		insert_node(parent, before, node);
		node = next_node;
		if (node === end) {
			insert_node(parent, before, /** @type {Node} */ (end));
			break;
		}
	}
}

/**
 * @param {Node | null} parent
 * @param {ChildNode | null} before
 * @param {Node} node
 */
function insert_node(parent, before, node) {
	if (parent !== null) {
		parent.appendChild(node);
	} else {
		/** @type {ChildNode} */ (before).before(node);
	}
}

/**
 * Resolve the insertion anchor for a block at `index`: the first real DOM node
 * at or after `index`, or `fallback` when every remaining block renders nothing.
 * Scanning forward keeps insertions correct even when an optimized item renders
 * no DOM (e.g. a single `@if` that is currently false), which previously relied
 * on a synthesized `<!>` wrapper as a stable position marker.
 * @param {Block[]} blocks
 * @param {number} index
 * @param {number} length
 * @param {ListAnchor} fallback
 * @returns {ChildNode | AppendIntoAnchor}
 */
function block_start(blocks, index, length, fallback) {
	if (index >= length) {
		return fallback;
	}
	// Fast path: a normal item records its own boundary, so this is the same
	// single property read the pre-#1307 code did — no descent, no scan.
	var first = blocks[index].s.start;
	if (first !== null) {
		return first;
	}
	for (var k = index; k < length; k++) {
		var node = get_first_node(blocks[k]);
		if (node !== null) {
			return /** @type {ChildNode} */ (node);
		}
	}
	return fallback;
}

/**
 * @template V
 * @param {V[] | Iterable<V>} collection
 * @returns {V[]}
 */
function collection_to_array(collection) {
	var array = is_array(collection) ? collection : collection == null ? [] : array_from(collection);

	// If we are working with a tracked array, then we need to get a copy of
	// the elements, as the array itself is proxied, and not useful in diffing
	if (TRACKED_ARRAY in array) {
		array = array_from(array);
	}

	return array;
}

/**
 * The state of a list block. The reconciled list (`array`, `blocks`, `keys`,
 * `empty`) and the inputs the list is re-run with both live here, so a list
 * allocates no closures.
 * @typedef {{
 *   array: any[];
 *   blocks: Block[];
 *   keys: any[] | null;
 *   empty: Block | null;
 *   a: ListAnchor;
 *   g: () => any;
 *   r: (anchor: Node, value: any, index?: any) => Block;
 *   c: boolean;
 *   x: boolean;
 *   k: ((item: any) => any) | undefined;
 *   e: ((anchor: Node) => void) | undefined;
 * }} ListState
 */

/**
 * @param {ListAnchor} anchor
 * @param {() => any} get_collection
 * @param {(anchor: Node, value: any, index?: any) => Block} render_fn
 * @param {boolean} is_controlled
 * @param {boolean} is_indexed
 * @param {((item: any) => any) | undefined} get_key
 * @param {((anchor: Node) => void) | undefined} render_empty
 * @returns {ListState}
 */
function list_state(
	anchor,
	get_collection,
	render_fn,
	is_controlled,
	is_indexed,
	get_key,
	render_empty,
) {
	return {
		array: [],
		blocks: [],
		// null until the first reconcile
		keys: null,
		empty: null,
		a: anchor,
		g: get_collection,
		r: render_fn,
		c: is_controlled,
		x: is_indexed,
		k: get_key,
		e: render_empty,
	};
}

/**
 * Re-anchors a hydrated list: the hydrated anchor is the block's start marker;
 * later inserts and end moves must go before the cursor, which now sits after
 * the hydrated items.
 * @param {ListState} state
 */
function rehydrate_anchor(state) {
	if (hydrating) {
		state.a = /** @type {Element | Text} */ (hydrate_node);
	}
}

/**
 * @param {ListState} state
 */
function run_for(state) {
	var block = /** @type {Block} */ (active_block);
	var array = collection_to_array(state.g());

	// Items render untracked, as in a branch; the list tracks only its collection.
	set_tracking(false);
	reconcile_by_ref(state.a, block, array, state.r, state.c, state.x, state.e);
	set_tracking(true);

	rehydrate_anchor(state);
}

/**
 * @param {ListState} state
 */
function run_for_keyed(state) {
	var block = /** @type {Block} */ (active_block);
	var array = collection_to_array(state.g());

	set_tracking(false);
	reconcile_by_key(state.a, block, array, state.r, state.c, state.x, state.k, state.e);
	set_tracking(true);

	rehydrate_anchor(state);
}

/**
 * @template V
 * @param {Element | AppendIntoAnchor} node
 * @param {() => V[] | Iterable<V>} get_collection
 * @param {(anchor: Node, value: V | Tracked, index?: any) => Block} render_fn
 * @param {number} flags
 * @param {(anchor: Node) => void} [render_empty]
 * @returns {void}
 */
export function for_block(node, get_collection, render_fn, flags, render_empty) {
	var is_controlled = (flags & IS_CONTROLLED) !== 0;
	var is_indexed = (flags & IS_INDEXED) !== 0;
	var root_controlled = (flags & ROOT_CONTROLLED) !== 0;
	// A root-controlled list receives the component's `__anchor`, which may be
	// an append-into sentinel; moves and end insertions need a real node.
	var anchor = /** @type {ListAnchor} */ (root_controlled ? resolve_anchor(node) : node);
	/** @type {Node | undefined} */
	var boundary;

	if (is_controlled) {
		if (hydrating) {
			var parent_node = /** @type {Element} */ (node);
			/** @type {Element | Text} */ (set_hydrate_node(get_first_child(parent_node)));
		} else {
			anchor = controlled_anchor(/** @type {Element} */ (node));
		}
	}

	if (hydrating) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}
		hydrate_next();
	}

	render(
		run_for,
		list_state(
			anchor,
			get_collection,
			render_fn,
			is_controlled,
			is_indexed,
			undefined,
			render_empty,
		),
		FOR_BLOCK,
	);

	if (!is_controlled) own_anchor(node, /** @type {Node} */ (anchor));

	if (hydrating && root_controlled) {
		// The original `node`: for a sentinel, `hydrate_append` performs the
		// cursor advance that stands in for the eliminated sibling navigation.
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}

/**
 * @template V
 * @template K
 * @param {Element | AppendIntoAnchor} node
 * @param {() => V[] | Iterable<V>} get_collection
 * @param {(anchor: Node, value: V | Tracked, index?: any) => Block} render_fn
 * @param {number} flags
 * @param {(item: V) => K} [get_key] omitted for identity keys (`key item`)
 * @param {(anchor: Node) => void} [render_empty]
 * @returns {void}
 */
export function for_block_keyed(node, get_collection, render_fn, flags, get_key, render_empty) {
	var is_controlled = (flags & IS_CONTROLLED) !== 0;
	var is_indexed = (flags & IS_INDEXED) !== 0;
	var root_controlled = (flags & ROOT_CONTROLLED) !== 0;
	var anchor = /** @type {ListAnchor} */ (root_controlled ? resolve_anchor(node) : node);
	/** @type {Node | undefined} */
	var boundary;

	if (is_controlled) {
		var parent_node = /** @type {Element} */ (node);

		if (hydrating) {
			/** @type {Element | Text} */ (set_hydrate_node(get_first_child(parent_node)));
			anchor = /** @type {Element | Text} */ (get_last_child(parent_node));
		} else {
			anchor = controlled_anchor(parent_node);
		}
	}

	if (hydrating) {
		if (root_controlled) {
			boundary = /** @type {Node} */ (hydrate_node);
		}
		hydrate_next();
	}

	render(
		run_for_keyed,
		list_state(anchor, get_collection, render_fn, is_controlled, is_indexed, get_key, render_empty),
		FOR_BLOCK,
	);

	if (!is_controlled) own_anchor(node, /** @type {Node} */ (anchor));

	if (hydrating && root_controlled) {
		// The original `node`: for a sentinel, `hydrate_append` performs the
		// cursor advance that stands in for the eliminated sibling navigation.
		append(/** @type {ChildNode} */ (node), /** @type {Node} */ (boundary));
	}
}

/**
 * @template V
 * @param {ListAnchor} anchor
 * @param {Block} block
 * @param {V[]} array
 * @returns {void}
 */
function reconcile_fast_clear(anchor, block, array) {
	var state = block.s;
	var into = /** @type {AppendIntoAnchor} */ (anchor).into === true;
	var parent_node = /** @type {Element} */ (
		into ? /** @type {AppendIntoAnchor} */ (anchor).parent : /** @type {Node} */ (anchor).parentNode
	);
	parent_node.textContent = '';
	destroy_block_children(block);
	if (!into) parent_node.append(/** @type {Node} */ (anchor));
	state.array = array;
	state.blocks = [];
	state.empty = null;
}

/**
 * @param {Block} block
 * @param {number} index
 * @returns {void}
 */
function update_index(block, index) {
	set(block.s.i, index);
}

/**
 * @param {Block} block
 * @param {any} value
 * @returns {void}
 */
function update_value(block, value) {
	var tracked_value = block.s.v;
	if (tracked_value.__v !== value) {
		set(tracked_value, value);
	}
}

/**
 * @template V
 * @template K
 * @param {ListAnchor} anchor
 * @param {Block} block
 * @param {V[]} b
 * @param {(anchor: Node, value: V | Tracked, index?: any) => Block} render_fn
 * @param {boolean} is_controlled
 * @param {boolean} is_indexed
 * @param {((item: V) => K) | undefined} get_key identity keys when omitted
 * @param {(anchor: Node) => void} [render_empty]
 * @returns {void}
 *
 * The first run only creates items, so it lives in this small function and
 * the diff below is compiled only once a list actually changes.
 */
function reconcile_by_key(
	anchor,
	block,
	b,
	render_fn,
	is_controlled,
	is_indexed,
	get_key,
	render_empty,
) {
	var b_length = b.length;
	var state = /** @type {ListState} */ (block.s);

	if (state.keys === null && b_length > 0) {
		var b_blocks = Array(b_length);
		// Identity keys (`key item`) are the items themselves; the list keeps a
		// copy, as the array it rendered may later be mutated in place.
		var b_keys = get_key === undefined ? b.slice() : Array(b_length);

		// One loop, no `map` callback machinery: most lists are short.
		for (var j = 0; j < b_length; j++) {
			var value = b[j];
			if (get_key !== undefined) {
				b_keys[j] = get_key(value);
			}
			b_blocks[j] = create_item(anchor, value, j, render_fn, is_indexed, true);
		}

		state.array = b;
		state.blocks = b_blocks;
		state.keys = b_keys;
		return;
	}

	reconcile_by_key_diff(
		anchor,
		block,
		b,
		render_fn,
		is_controlled,
		is_indexed,
		get_key,
		render_empty,
	);
}

/**
 * Keyed diff for every run after the first (or a first run with an empty
 * list). See {@link reconcile_by_key}.
 * @template V, K
 * @param {ListAnchor} anchor
 * @param {Block} block
 * @param {V[]} b
 * @param {(anchor: Node, value: V | Tracked, index?: any) => Block} render_fn
 * @param {boolean} is_controlled
 * @param {boolean} is_indexed
 * @param {((item: V) => K) | undefined} get_key
 * @param {(anchor: Node) => void} [render_empty]
 * @returns {void}
 */
function reconcile_by_key_diff(
	anchor,
	block,
	b,
	render_fn,
	is_controlled,
	is_indexed,
	get_key,
	render_empty,
) {
	var state = /** @type {ListState} */ (block.s);

	// Variables used in conditional branches - declare with initial values
	/** @type {number} */
	var a_left = 0;
	/** @type {number} */
	var b_left = 0;
	/** @type {Int32Array} */
	var sources = new Int32Array(0);
	/** @type {boolean} */
	var moved = false;
	/** @type {number} */
	var pos = 0;
	/** @type {number} */
	var patched = 0;
	/** @type {number} */
	var i = 0;

	var a_blocks = state.blocks;
	var a_length = a_blocks.length;
	var b_length = b.length;
	var j = 0;

	if (b_length === 0) {
		if (a_length > 0) {
			if (is_controlled) {
				reconcile_fast_clear(anchor, block, b);
			} else {
				for (; j < a_length; j++) {
					destroy_block(state.blocks[j]);
				}
				state.array = b;
				state.blocks = [];
				state.keys = [];
			}
		}
		if (render_empty && state.empty === null) {
			state.empty = create_empty(anchor, render_empty);
		}
		return;
	}

	if (state.empty !== null) {
		destroy_block(state.empty);
		state.empty = null;
	}

	// Fast-path for clear
	if (is_controlled && b_length === 0) {
		if (a_length > 0) {
			reconcile_fast_clear(anchor, block, b);
		}
		return;
	}
	// Identity keys are the items themselves (copied, as the rendered array
	// may later be mutated in place), so a matched key is also the item's
	// current tracked value: only computed keys need `update_value`.
	var b_keys = get_key === undefined ? b.slice() : b.map(get_key);
	// A same-length run rewrites the block array in place: matched ends are
	// already at their index, and the middle reads the old blocks from a copy
	// taken before its first write.
	var in_place = a_length === b_length;
	var b_blocks = in_place ? a_blocks : Array(b_length);

	// Fast-path for create
	if (a_length === 0) {
		for (; j < b_length; j++) {
			b_blocks[j] = create_item(anchor, b[j], j, render_fn, is_indexed, true);
		}
		state.array = b;
		state.blocks = b_blocks;
		state.keys = b_keys;
		return;
	}

	// Set by every run that leaves items behind.
	var a_keys = /** @type {any[]} */ (state.keys);
	var a_start = 0;
	var b_start = 0;
	var a_end = a_length - 1;
	var b_end = b_length - 1;
	var b_val;
	var b_block;

	if (get_key === undefined && !is_indexed) {
		// Identity keys without an index: a matched item needs no update, so
		// the unchanged prefix and suffix are skipped with plain compares.
		while (a_start <= a_end && b_start <= b_end && a_keys[a_start] === b_keys[b_start]) {
			if (!in_place) {
				b_blocks[b_start] = a_blocks[a_start];
			}
			a_start++;
			b_start++;
		}
		while (a_start <= a_end && b_start <= b_end && a_keys[a_end] === b_keys[b_end]) {
			if (!in_place) {
				b_blocks[b_end] = a_blocks[a_end];
			}
			a_end--;
			b_end--;
		}
	}

	// Match from both ends first, including the two end-crossing cases: an old
	// item that moved to the far end of the new list, and a run whose ends were
	// exchanged (a reversal, or a swap of two items). Those complete with plain
	// moves; only what is left afterwards needs the map and LIS below.
	while (a_start <= a_end && b_start <= b_end) {
		if (a_keys[a_start] === b_keys[b_start]) {
			b_val = b[b_start];
			b_block = b_blocks[b_start] = a_blocks[a_start];
			if (is_indexed) {
				update_index(b_block, b_start);
			}
			if (get_key !== undefined) {
				update_value(b_block, b_val);
			}
			a_start++;
			b_start++;
			continue;
		}
		if (a_keys[a_end] === b_keys[b_end]) {
			b_val = b[b_end];
			b_block = b_blocks[b_end] = a_blocks[a_end];
			if (is_indexed) {
				update_index(b_block, b_end);
			}
			if (get_key !== undefined) {
				update_value(b_block, b_val);
			}
			a_end--;
			b_end--;
			continue;
		}
		if (a_start === a_end || a_blocks[a_start].s.start === null) {
			break;
		}
		if (in_place) {
			// An end-crossing move overwrites an old block before it is read.
			a_blocks = a_blocks.slice();
			in_place = false;
		}
		if (a_keys[a_end] === b_keys[b_start]) {
			// Last old item is the next new one: move it in front of the old run.
			b_val = b[b_start];
			b_block = b_blocks[b_start] = a_blocks[a_end];
			if (is_indexed) {
				update_index(b_block, b_start);
			}
			if (get_key !== undefined) {
				update_value(b_block, b_val);
			}
			move(b_block, /** @type {ChildNode} */ (a_blocks[a_start].s.start));
			a_end--;
			b_start++;
			continue;
		}
		if (a_keys[a_start] === b_keys[b_end]) {
			// First old item is the last new one: move it behind the old run.
			b_val = b[b_end];
			b_block = b_blocks[b_end] = a_blocks[a_start];
			if (is_indexed) {
				update_index(b_block, b_end);
			}
			if (get_key !== undefined) {
				update_value(b_block, b_val);
			}
			move(b_block, block_start(b_blocks, b_end + 1, b_length, anchor));
			a_start++;
			b_end--;
			continue;
		}
		break;
	}

	var fast_path_removal = false;

	if (a_start > a_end) {
		if (b_start <= b_end) {
			var target_node = block_start(b_blocks, b_end + 1, b_length, anchor);
			while (b_start <= b_end) {
				b_blocks[b_start] = create_item(
					target_node,
					b[b_start],
					b_start,
					render_fn,
					is_indexed,
					true,
				);
				b_start++;
			}
		}
	} else if (b_start > b_end) {
		while (a_start <= a_end) {
			destroy_block(a_blocks[a_start++]);
		}
	} else {
		if (in_place) {
			a_blocks = a_blocks.slice();
			in_place = false;
		}
		a_left = a_end - a_start + 1;
		b_left = b_end - b_start + 1;
		sources = new Int32Array(b_left + 1);
		moved = false;
		pos = 0;
		patched = 0;
		i = 0;

		fast_path_removal = is_controlled && a_left === a_length;

		// When sizes are small, just loop them through
		if (b_length < 4 || (a_left | b_left) < 32) {
			for (i = a_start; i <= a_end; ++i) {
				if (patched < b_left) {
					for (j = b_start; j <= b_end; j++) {
						if (a_keys[i] === b_keys[j]) {
							sources[j - b_start] = i + 1;
							if (fast_path_removal) {
								fast_path_removal = false;
								while (a_start < i) {
									destroy_block(a_blocks[a_start++]);
								}
							}
							if (pos > j) {
								moved = true;
							} else {
								pos = j;
							}
							b_val = b[j];
							b_block = b_blocks[j] = a_blocks[i];
							if (is_indexed) {
								update_index(b_block, j);
							}
							if (get_key !== undefined) {
								update_value(b_block, b_val);
							}
							++patched;
							break;
						}
					}
					if (!fast_path_removal && j > b_end) {
						destroy_block(a_blocks[i]);
					}
				} else if (!fast_path_removal) {
					destroy_block(a_blocks[i]);
				}
			}
		} else {
			var map = new Map();

			for (i = b_start; i <= b_end; ++i) {
				map.set(b_keys[i], i);
			}

			for (i = a_start; i <= a_end; ++i) {
				if (patched < b_left) {
					j = map.get(a_keys[i]);

					if (j !== undefined) {
						if (fast_path_removal) {
							fast_path_removal = false;
							while (i > a_start) {
								destroy_block(a_blocks[a_start++]);
							}
						}
						sources[j - b_start] = i + 1;
						if (pos > j) {
							moved = true;
						} else {
							pos = j;
						}
						b_val = b[j];
						b_block = b_blocks[j] = a_blocks[i];
						if (is_indexed) {
							update_index(b_block, j);
						}
						if (get_key !== undefined) {
							update_value(b_block, b_val);
						}
						++patched;
					} else if (!fast_path_removal) {
						destroy_block(a_blocks[i]);
					}
				} else if (!fast_path_removal) {
					destroy_block(a_blocks[i]);
				}
			}
		}
	}

	if (fast_path_removal) {
		reconcile_fast_clear(anchor, block, []);
		reconcile_by_key(anchor, block, b, render_fn, is_controlled, is_indexed, get_key);
		return;
	} else if (moved) {
		var next_pos = 0;
		var seq = lis_algorithm(sources);
		j = seq.length - 1;

		// When most surviving items have to move anyway, re-lay the whole range
		// in order before a fixed target: inserting before the same node is
		// noticeably cheaper per item than moving into arbitrary positions.
		if ((patched - seq.length) * 3 > b_left * 2) {
			var relay_target = block_start(b_blocks, b_end + 1, b_length, anchor);
			for (i = 0; i < b_left; i++) {
				pos = i + b_start;
				if (sources[i] === 0) {
					b_blocks[pos] = create_item(relay_target, b[pos], pos, render_fn, is_indexed, true);
				} else {
					move(b_blocks[pos], relay_target);
				}
			}
			state.array = b;
			state.blocks = b_blocks;
			state.keys = b_keys;
			return;
		}

		for (i = b_left - 1; i >= 0; i--) {
			if (sources[i] === 0) {
				pos = i + b_start;
				b_val = b[pos];
				next_pos = pos + 1;

				var target = block_start(b_blocks, next_pos, b_length, anchor);
				b_blocks[pos] = create_item(target, b_val, pos, render_fn, is_indexed, true);
			} else if (j < 0 || i !== seq[j]) {
				pos = i + b_start;
				next_pos = pos + 1;

				var target = block_start(b_blocks, next_pos, b_length, anchor);
				move(b_blocks[pos], target);
			} else {
				j--;
			}
		}
	} else if (patched !== b_left) {
		for (i = b_left - 1; i >= 0; i--) {
			if (sources[i] === 0) {
				pos = i + b_start;
				b_val = b[pos];
				next_pos = pos + 1;

				var target = block_start(b_blocks, next_pos, b_length, anchor);
				b_blocks[pos] = create_item(target, b_val, pos, render_fn, is_indexed, true);
			}
		}
	}

	state.array = b;
	state.blocks = b_blocks;
	state.keys = b_keys;
}

/**
 * @template V
 * @param {ListAnchor} anchor
 * @param {Block} block
 * @param {V[]} b
 * @param {(anchor: Node, value: V | Tracked, index?: any) => Block} render_fn
 * @param {boolean} is_controlled
 * @param {boolean} is_indexed
 * @param {(anchor: Node) => void} [render_empty]
 * @returns {void}
 */
function reconcile_by_ref(anchor, block, b, render_fn, is_controlled, is_indexed, render_empty) {
	var state = /** @type {ListState} */ (block.s);

	// Variables used in conditional branches - declare with initial values
	/** @type {number} */
	var a_left = 0;
	/** @type {number} */
	var b_left = 0;
	/** @type {Int32Array} */
	var sources = new Int32Array(0);
	/** @type {boolean} */
	var moved = false;
	/** @type {number} */
	var pos = 0;
	/** @type {number} */
	var patched = 0;
	/** @type {number} */
	var i = 0;

	var a = state.array;
	var a_length = a.length;
	var b_length = b.length;
	var j = 0;

	if (b_length === 0) {
		if (a_length > 0) {
			if (is_controlled) {
				reconcile_fast_clear(anchor, block, b);
			} else {
				for (; j < a_length; j++) {
					destroy_block(state.blocks[j]);
				}
				state.array = b;
				state.blocks = [];
			}
		}
		if (render_empty && state.empty === null) {
			state.empty = create_empty(anchor, render_empty);
		}
		return;
	}

	if (state.empty !== null) {
		destroy_block(state.empty);
		state.empty = null;
	}

	// Fast-path for clear
	if (is_controlled && b_length === 0) {
		if (a_length > 0) {
			reconcile_fast_clear(anchor, block, b);
		}
		return;
	}
	var b_blocks = Array(b_length);

	// Fast-path for create
	if (a_length === 0) {
		for (; j < b_length; j++) {
			b_blocks[j] = create_item(anchor, b[j], j, render_fn, is_indexed, false);
		}
		state.array = b;
		state.blocks = b_blocks;
		return;
	}

	var a_blocks = state.blocks;
	var a_start = 0;
	var b_start = 0;
	var a_end = a_length - 1;
	var b_end = b_length - 1;
	var b_val;
	var b_block;

	// Match from both ends first, including the two end-crossing cases: an old
	// item that moved to the far end of the new list, and a run whose ends were
	// exchanged (a reversal, or a swap of two items). Those complete with plain
	// moves; only what is left afterwards needs the map and LIS below.
	while (a_start <= a_end && b_start <= b_end) {
		if (a[a_start] === b[b_start]) {
			b_val = b[b_start];
			b_block = b_blocks[b_start] = a_blocks[a_start];
			if (is_indexed) {
				update_index(b_block, b_start);
			}
			a_start++;
			b_start++;
			continue;
		}
		if (a[a_end] === b[b_end]) {
			b_val = b[b_end];
			b_block = b_blocks[b_end] = a_blocks[a_end];
			if (is_indexed) {
				update_index(b_block, b_end);
			}
			a_end--;
			b_end--;
			continue;
		}
		if (a_start === a_end || a_blocks[a_start].s.start === null) {
			break;
		}
		if (a[a_end] === b[b_start]) {
			// Last old item is the next new one: move it in front of the old run.
			b_val = b[b_start];
			b_block = b_blocks[b_start] = a_blocks[a_end];
			if (is_indexed) {
				update_index(b_block, b_start);
			}
			move(b_block, /** @type {ChildNode} */ (a_blocks[a_start].s.start));
			a_end--;
			b_start++;
			continue;
		}
		if (a[a_start] === b[b_end]) {
			// First old item is the last new one: move it behind the old run.
			b_val = b[b_end];
			b_block = b_blocks[b_end] = a_blocks[a_start];
			if (is_indexed) {
				update_index(b_block, b_end);
			}
			move(b_block, block_start(b_blocks, b_end + 1, b_length, anchor));
			a_start++;
			b_end--;
			continue;
		}
		break;
	}

	var fast_path_removal = false;

	if (a_start > a_end) {
		if (b_start <= b_end) {
			var target_node = block_start(b_blocks, b_end + 1, b_length, anchor);
			while (b_start <= b_end) {
				b_blocks[b_start] = create_item(
					target_node,
					b[b_start],
					b_start,
					render_fn,
					is_indexed,
					false,
				);
				b_start++;
			}
		}
	} else if (b_start > b_end) {
		while (a_start <= a_end) {
			destroy_block(a_blocks[a_start++]);
		}
	} else {
		a_left = a_end - a_start + 1;
		b_left = b_end - b_start + 1;
		sources = new Int32Array(b_left + 1);
		moved = false;
		pos = 0;
		patched = 0;
		i = 0;

		fast_path_removal = is_controlled && a_left === a_length;

		// When sizes are small, just loop them through
		if (b_length < 4 || (a_left | b_left) < 32) {
			for (i = a_start; i <= a_end; ++i) {
				if (patched < b_left) {
					for (j = b_start; j <= b_end; j++) {
						if (a[i] === b[j]) {
							sources[j - b_start] = i + 1;
							if (fast_path_removal) {
								fast_path_removal = false;
								while (a_start < i) {
									destroy_block(a_blocks[a_start++]);
								}
							}
							if (pos > j) {
								moved = true;
							} else {
								pos = j;
							}
							b_val = b[j];
							b_block = b_blocks[j] = a_blocks[i];
							if (is_indexed) {
								update_index(b_block, j);
							}
							++patched;
							break;
						}
					}
					if (!fast_path_removal && j > b_end) {
						destroy_block(a_blocks[i]);
					}
				} else if (!fast_path_removal) {
					destroy_block(a_blocks[i]);
				}
			}
		} else {
			var map = new Map();

			for (i = b_start; i <= b_end; ++i) {
				map.set(b[i], i);
			}

			for (i = a_start; i <= a_end; ++i) {
				if (patched < b_left) {
					j = map.get(a[i]);

					if (j !== undefined) {
						if (fast_path_removal) {
							fast_path_removal = false;
							while (i > a_start) {
								destroy_block(a_blocks[a_start++]);
							}
						}
						sources[j - b_start] = i + 1;
						if (pos > j) {
							moved = true;
						} else {
							pos = j;
						}
						b_val = b[j];
						b_block = b_blocks[j] = a_blocks[i];
						if (is_indexed) {
							update_index(b_block, j);
						}
						++patched;
					} else if (!fast_path_removal) {
						destroy_block(a_blocks[i]);
					}
				} else if (!fast_path_removal) {
					destroy_block(a_blocks[i]);
				}
			}
		}
	}

	if (fast_path_removal) {
		reconcile_fast_clear(anchor, block, []);
		reconcile_by_ref(anchor, block, b, render_fn, is_controlled, is_indexed);
		return;
	} else if (moved) {
		var next_pos = 0;
		var seq = lis_algorithm(sources);
		j = seq.length - 1;

		// When most surviving items have to move anyway, re-lay the whole range
		// in order before a fixed target: inserting before the same node is
		// noticeably cheaper per item than moving into arbitrary positions.
		if ((patched - seq.length) * 3 > b_left * 2) {
			var relay_target = block_start(b_blocks, b_end + 1, b_length, anchor);
			for (i = 0; i < b_left; i++) {
				pos = i + b_start;
				if (sources[i] === 0) {
					b_blocks[pos] = create_item(relay_target, b[pos], pos, render_fn, is_indexed, false);
				} else {
					move(b_blocks[pos], relay_target);
				}
			}
			state.array = b;
			state.blocks = b_blocks;
			return;
		}

		for (i = b_left - 1; i >= 0; i--) {
			if (sources[i] === 0) {
				pos = i + b_start;
				b_val = b[pos];
				next_pos = pos + 1;

				var target = block_start(b_blocks, next_pos, b_length, anchor);
				b_blocks[pos] = create_item(target, b_val, pos, render_fn, is_indexed, false);
			} else if (j < 0 || i !== seq[j]) {
				pos = i + b_start;
				next_pos = pos + 1;

				var target = block_start(b_blocks, next_pos, b_length, anchor);
				move(b_blocks[pos], target);
			} else {
				j--;
			}
		}
	} else if (patched !== b_left) {
		for (i = b_left - 1; i >= 0; i--) {
			if (sources[i] === 0) {
				pos = i + b_start;
				b_val = b[pos];
				next_pos = pos + 1;

				var target = block_start(b_blocks, next_pos, b_length, anchor);
				b_blocks[pos] = create_item(target, b_val, pos, render_fn, is_indexed, false);
			}
		}
	}

	state.array = b;
	state.blocks = b_blocks;
}

/** @type {Int32Array} */
let result;
/** @type {Int32Array} */
let p;
let max_len = 0;
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
/**
 * @param {Int32Array} arr
 * @returns {Int32Array}
 */
function lis_algorithm(arr) {
	let arrI = 0;
	let i = 0;
	let j = 0;
	let k = 0;
	let u = 0;
	let v = 0;
	let c = 0;
	var len = arr.length;

	if (len > max_len) {
		max_len = len;
		result = new Int32Array(len);
		p = new Int32Array(len);
	}

	for (; i < len; ++i) {
		arrI = arr[i];

		if (arrI !== 0) {
			j = result[k];
			if (arr[j] < arrI) {
				p[i] = j;
				result[++k] = i;
				continue;
			}

			u = 0;
			v = k;

			while (u < v) {
				c = (u + v) >> 1;
				if (arr[result[c]] < arrI) {
					u = c + 1;
				} else {
					v = c;
				}
			}

			if (arrI < arr[result[u]]) {
				if (u > 0) {
					p[i] = result[u - 1];
				}
				result[u] = i;
			}
		}
	}

	u = k + 1;
	var seq = new Int32Array(u);
	v = result[u - 1];

	while (u-- > 0) {
		seq[u] = v;
		v = p[v];
		result[u] = 0;
	}

	return seq;
}
