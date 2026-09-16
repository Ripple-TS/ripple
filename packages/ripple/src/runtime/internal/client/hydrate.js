/** @import { AppendIntoAnchor, Block, TryPendingFunction, TryState } from '#client' */

import {
	COMMENT_NODE,
	HYDRATION_END,
	HYDRATION_START,
	HYDRATION_START_ERRORED,
	HYDRATION_START_PENDING,
	STREAM_ERROR_SCRIPT_PREFIX,
	TEXT_NODE,
} from '../../../constants.js';
import { is_destroyed } from './blocks.js';
import { clear_expression_range } from './expression.js';
import {
	hydrate_next,
	hydrate_node,
	hydrating,
	set_hydrate_node,
	set_hydration,
	set_hydration_runtime,
} from './hydration.js';
import { create_text, get_next_sibling, next_sibling_getter } from './operations.js';
import { active_block, queue_microtask } from './runtime.js';
import { assign_nodes } from './template.js';
import {
	boundary_branch,
	catch_error,
	destroy_pending,
	get_boundary_with_catch,
	render_resolved,
} from './try.js';

/**
 * The hydration paths of the DOM runtime. `hydrate()` installs them on the
 * hydration module (see `H` there); the runtime's insert, template, expression
 * and boundary code calls through that object only while hydrating, so a
 * client-only mount compiles and ships none of this.
 * @typedef {{
 *   a: typeof hydrate_append;
 *   t: typeof hydrate_template;
 *   x: typeof hydrate_text;
 *   e: typeof expression_end;
 *   h: typeof hydrated_text;
 *   m: typeof try_marker;
 *   s: typeof try_slot;
 *   f: typeof try_fallback;
 * }} HydrationRuntime
 */

/** @type {HydrationRuntime} */
var runtime = {
	a: hydrate_append,
	t: hydrate_template,
	x: hydrate_text,
	e: expression_end,
	h: hydrated_text,
	m: try_marker,
	s: try_slot,
	f: try_fallback,
};

export function install_hydration() {
	set_hydration_runtime(runtime);
}

/**
 * The hydration path of `append`: repositions the hydration cursor instead
 * of inserting.
 *
 * Every hydrated node, block, and component leaves the cursor on its last
 * DOM node, and whoever owns the next node steps past it: a parent element
 * with its sibling traversal, a control-flow block by reaching its end
 * marker, an append-into sentinel by adopting the cursor as the next
 * component's first node.
 * @param {ChildNode | AppendIntoAnchor} anchor
 * @param {Node} dom
 */
function hydrate_append(anchor, dom) {
	var node = /** @type {Node} */ (hydrate_node);

	// The cursor descended into dom's children (child()/sibling() traversal
	// inside a single-node template) without a compiler-emitted pop(): bring it
	// back up to dom before deciding where to leave it.
	if (node !== dom && dom.contains(node)) {
		node = dom;
	}

	// A child component renders into the anchor it was handed, which is its
	// own first node. Its content is hydrated, so leave the cursor on the
	// content's last node for the parent's sibling traversal.
	if (anchor === dom) {
		set_hydrate_node(node);
		return;
	}

	if (node !== dom) {
		// A fragment's cursor sits on its last top-level node, past the
		// template's first node: widen the block's end to cover the whole
		// fragment rather than only the node assign_nodes saw.
		var s = /** @type {Block} */ (active_block).s;
		if (s !== null) {
			s.end = node;
		}
	}

	// Step past the content: a branch lands on its block's end marker, the
	// root on the boundary's end marker, an append-into sentinel on the next
	// component's first node.
	set_hydrate_node(next_sibling_getter.call(node), true);
}

/**
 * Scans forward from the current hydrate_node to find the matching HYDRATION_END
 * comment, handling nested blocks by tracking depth.
 * Should be called after hydrate_next() has consumed the opening HYDRATION_START.
 * Any `[`-prefixed comment opens a nested region — this includes the plain
 * `<!--[-->` markers as well as streaming slot markers (`<!--[?N-->`,
 * `<!--[!N-->`), which always pair with a `<!--]-->`.
 * @returns {Node} The HYDRATION_END comment node.
 */
function skip_to_hydration_end() {
	var depth = 0;
	var node = /** @type {Node} */ (hydrate_node);
	while (true) {
		if (node.nodeType === COMMENT_NODE) {
			var data = /** @type {Comment} */ (node).data;
			if (data === HYDRATION_END) {
				if (depth === 0) return node;
				depth -= 1;
			} else if (data.startsWith(HYDRATION_START)) {
				depth += 1;
			}
		}
		node = /** @type {Node} */ (next_sibling_getter.call(node));
	}
}

/**
 * The hydration path of a `template()` instance: adopts the server node(s)
 * at the cursor instead of cloning.
 * @param {boolean} is_fragment
 * @param {number} count
 * @returns {Node}
 */
function hydrate_template(is_fragment, count) {
	var node = /** @type {Node} */ (hydrate_node);
	assign_nodes(node, is_fragment ? hydrate_fragment_end(node, count) : node);
	return node;
}

/**
 * The last top-level node of a hydrated fragment template. Walks using the
 * compiler-provided hop count so hydration never parses template HTML.
 * @param {Node} start
 * @param {number} count
 * @returns {Node}
 */
function hydrate_fragment_end(start, count) {
	var end = start;

	for (var i = 1; i < count; i++) {
		var next = get_next_sibling(end);

		while (next !== null && next.nodeType === COMMENT_NODE) {
			next = get_next_sibling(next);
		}

		if (next === null) {
			break;
		}

		end = next;
	}

	return end;
}

/**
 * The hydration path of an expression's text: adopts the server text node at
 * the cursor, splitting it when the server rendered adjacent text into one.
 * @param {string} value
 * @param {ChildNode} anchor
 * @param {boolean} assign
 * @returns {void}
 */
function hydrate_text(value, anchor, assign) {
	var node = hydrate_node;

	if (node?.nodeType === COMMENT_NODE && /** @type {Comment} */ (node).data === HYDRATION_START) {
		node = get_next_sibling(node);
	}

	if (node?.nodeType === TEXT_NODE) {
		var current_value = /** @type {Text} */ (node).nodeValue ?? '';

		if (current_value !== value) {
			/** @type {Text} */ (node).nodeValue = value;

			if (current_value.startsWith(value)) {
				var remaining = current_value.slice(value.length);

				if (remaining !== '') {
					var remaining_text = create_text(remaining);
					/** @type {ChildNode} */ (node).after(remaining_text);
					if (assign) {
						assign_nodes(node, node);
					}
					set_hydrate_node(remaining_text);
					return;
				}
			}
		}

		if (assign) {
			assign_nodes(node, node);
		}
		set_hydrate_node(get_next_sibling(node) ?? anchor);
		return;
	}

	var new_text = create_text(value);

	if (node !== null && node !== anchor) {
		/** @type {ChildNode} */ (node).before(new_text);
	} else {
		anchor.before(new_text);
	}

	if (assign) {
		assign_nodes(new_text, new_text);
	}
	set_hydrate_node(node ?? anchor);
}

/**
 * The end marker of a server-rendered expression: the `<!--]-->` that pairs
 * with the `<!--[-->` at `anchor`.
 * @param {Node} anchor
 * @returns {Comment}
 */
function expression_end(anchor) {
	/** @type {Node | null} */
	var current = get_next_sibling(anchor);
	var depth = 0;

	while (current !== null) {
		if (current.nodeType === COMMENT_NODE) {
			var data = /** @type {Comment} */ (current).data;

			if (data === HYDRATION_START) {
				depth += 1;
			} else if (data === HYDRATION_END) {
				if (depth === 0) {
					return /** @type {Comment} */ (current);
				}

				depth -= 1;
			}
		}

		current = get_next_sibling(current);
	}

	throw new Error('Hydration mismatch: expected end marker for expression block');
}

/**
 * The single text node a server-rendered expression holds between its
 * markers, or null once whatever else was there is cleared.
 * @param {Node} anchor
 * @param {Node} end
 * @returns {Text | null}
 */
function hydrated_text(anchor, end) {
	var first = get_next_sibling(anchor);

	if (first === end) {
		return null;
	}

	if (first?.nodeType === TEXT_NODE && get_next_sibling(first) === end) {
		return /** @type {Text} */ (first);
	}

	clear_expression_range(anchor, end);
	return null;
}

/**
 * A boundary's hydration walk begins: consumes its `<!--[-->` marker, or
 * adopts the streamed slot that stands in for it (see `try_slot`).
 * @param {TryState} state
 */
function try_marker(state) {
	var marker = /** @type {Comment} */ (hydrate_node);
	var data = marker.nodeType === COMMENT_NODE ? marker.data : '';

	// A slot at this anchor belongs to this boundary, including the root.
	if (data.startsWith(HYDRATION_START_PENDING) || data.startsWith(HYDRATION_START_ERRORED)) {
		hydrate_streamed_slot(state, marker, data);
	} else {
		// Settled SSR content must not transition back to pending.
		if (state.pending_fn !== null) {
			state.has_resolved = true;
		}
		hydrate_next(); // consume <!--[-->
	}
}

/**
 * @param {TryState} state
 * @param {Comment} marker
 * @param {string} data
 */
function hydrate_streamed_slot(state, marker, data) {
	// live streamed slot
	state.streamed_id = data.slice(HYDRATION_START_PENDING.length);
	state.streamed_errored = data.startsWith(HYDRATION_START_ERRORED);
	state.slot_open = marker;
	hydrate_next(); // consume the slot wrapper open
	state.slot_close = /** @type {Comment} */ (skip_to_hydration_end());
	var fallback_start = /** @type {Comment} */ (hydrate_node);
	state.streamed_fallback =
		!state.streamed_errored &&
		state.pending_fn !== null &&
		fallback_start.nodeType === COMMENT_NODE &&
		fallback_start.data === HYDRATION_START;
	if (state.streamed_fallback) {
		hydrate_next(); // consume the fallback's <!--[-->
	}
}

/**
 * A boundary that hydrated a still-pending streamed slot: the outer walk
 * continues after the slot, and the slot's chunk activates the boundary when
 * it arrives.
 * @param {TryState} state
 */
function try_slot(state) {
	// continue the outer hydration walk after the slot
	set_hydrate_node(state.slot_close);

	var registry = (window.__RIPPLE_B__ ??= {});
	var unit_id = /** @type {string} */ (state.streamed_id);
	if (state.streamed_errored) {
		// the inline runtime already emptied the slot and marked it errored
		// — route the error once the surrounding hydration has finished
		queue_microtask(() => route_streamed_error(state, unit_id));
	} else {
		registry[unit_id] = {
			a: (template, errored) => activate_streamed_chunk(state, template, errored),
		};
	}
}

/**
 * The first run of a boundary whose chunk has not arrived: hydrates its
 * fallback until activation.
 * @param {TryState} state
 */
function try_fallback(state) {
	if (state.streamed_fallback) {
		state.mode = 'pending';
		state.pending_branch = boundary_branch(() => {
			/** @type {TryPendingFunction} */ (state.pending_fn)(state.anchor);
		});
	}
}

/**
 * Retires the slot wrapper markers once the slot's fate is decided: the
 * open comment loses its marker data (it may still serve as the boundary
 * anchor, so it must stay in the DOM) and the close comment is dropped —
 * keeping `[`/`]` depth balanced for scans over surrounding slots.
 * @param {TryState} state
 * @returns {void}
 */
function neutralize_slot_markers(state) {
	/** @type {Comment} */ (state.slot_open).data = '';
	/** @type {ChildNode} */ (state.slot_close).remove();
}

/**
 * Reads the streamed unit error envelope for this slot and routes the
 * error into this boundary, or the nearest catch boundary above it.
 * @param {TryState} state
 * @param {string} id
 * @returns {void}
 */
function route_streamed_error(state, id) {
	if (state.try_block === null || is_destroyed(state.try_block)) {
		return;
	}
	neutralize_slot_markers(state);
	var message = 'An error occurred during server rendering';
	var script = document.getElementById(STREAM_ERROR_SCRIPT_PREFIX + id);
	if (script !== null) {
		try {
			message = JSON.parse(/** @type {string} */ (script.textContent)).message ?? message;
		} catch {
			// keep the generic message
		}
		script.remove();
	}
	var error = new Error(message);
	if (state.catch_fn !== null) {
		catch_error(state, error);
		return;
	}
	var outer = get_boundary_with_catch(/** @type {Block} */ (state.try_block));
	if (outer === null) {
		throw error;
	}
	catch_error(outer.s, error);
}

/**
 * Empties the streamed slot: destroys the hydrated fallback branch and
 * sweeps whatever remains between the wrapper comments (leftover marker
 * comments included).
 * @param {TryState} state
 * @returns {void}
 */
function clear_streamed_slot(state) {
	destroy_pending(state);
	var node = /** @type {ChildNode} */ (state.slot_open).nextSibling;
	while (node !== null && node !== state.slot_close) {
		var next = node.nextSibling;
		/** @type {ChildNode} */ (node).remove();
		node = next;
	}
}

/**
 * Called by the inline stream runtime when this slot's chunk arrives after
 * hydration: swaps the fallback for the streamed content and claims the
 * new DOM through a boundary-scoped hydration walk (trackAsync inside the
 * body picks its serialized envelope up from the same chunk).
 * @param {TryState} state
 * @param {HTMLTemplateElement | null} template
 * @param {number | undefined} [errored]
 * @returns {void}
 */
function activate_streamed_chunk(state, template, errored) {
	if (state.try_block === null || is_destroyed(state.try_block)) {
		return;
	}
	var id = /** @type {string} */ (state.streamed_id);
	state.streamed_id = null;
	if (errored) {
		clear_streamed_slot(state);
		route_streamed_error(state, id);
		return;
	}
	clear_streamed_slot(state);
	if (template !== null) {
		/** @type {ChildNode} */ (state.slot_close).before(template.content);
	}
	var first = /** @type {ChildNode} */ (state.slot_open).nextSibling;
	if (first === null || first === state.slot_close) {
		neutralize_slot_markers(state);
		return;
	}
	// adopt the streamed body's own <!--[--> as the boundary anchor (the
	// node the buffered-SSR hydration path would have used) and drop the
	// slot wrapper comments, so the resulting DOM matches buffered SSR
	// exactly like the pre-hydration swap path does
	if (state.anchor === state.slot_open) {
		state.anchor = first;
	}
	/** @type {ChildNode} */ (state.slot_open).remove();
	/** @type {ChildNode} */ (state.slot_close).remove();
	var previous_hydrating = hydrating;
	var previous_hydrate_node = hydrate_node;
	set_hydration(true, first);
	hydrate_next(); // consume the streamed body's <!--[-->
	try {
		state.has_resolved = true;
		render_resolved(state);
	} finally {
		set_hydration(previous_hydrating, previous_hydrate_node);
	}
}
