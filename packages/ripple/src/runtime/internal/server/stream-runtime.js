import {
	HYDRATION_START_PENDING,
	HYDRATION_START_ERRORED,
	HYDRATION_END,
	STREAM_CHUNK_ATTR,
	STREAM_HEAD_ATTR,
	COMMENT_NODE,
} from '../../../constants.js';

/**
 * Inline client runtime for streaming SSR, emitted once at the end of the
 * shell chunk (only when the shell contains unresolved flush-unit slots).
 *
 * Exposes two globals:
 * - `__RIPPLE_B__`: registry shared with the hydrating app. Before a unit's
 *   chunk arrives, the app may register `{ a(template, errored) }` for a slot
 *   it hydrated in the pending state; after a swap the runtime stores `1` to
 *   mark the slot done.
 * - `__RIPPLE_S__(id, errored)`: called by each streamed chunk. Moves streamed
 *   head content into the document head, then either hands the chunk template
 *   to the registered boundary (post-hydration arrival) or swaps the fallback
 *   DOM directly (pre-hydration arrival) and retires the slot markers so the
 *   result is byte-identical to non-streamed SSR output.
 *
 * Authored as a real function; the wire form is derived with
 * `Function.prototype.toString()`. The ripple package ships source, so dev
 * serves this body as written — and when an application's production server
 * bundle is minified (vite's `build.minify`), the minifier compresses this
 * function like any other code and `toString()` yields the minified form.
 * Marker shapes come in as arguments so `src/constants.js` stays the single
 * source of truth.
 *
 * Constraints on the body: it must be fully self-contained (no closure over
 * module scope — it is serialized), and its source must not contain the
 * character sequences that terminate or escape an inline script element
 * (a closing script tag, or HTML comment open/close sequences).
 *
 * @param {string} pending_prefix - comment data prefix of a pending slot ('[?')
 * @param {string} errored_prefix - comment data prefix of an errored slot ('[!')
 * @param {string} end_marker - comment data closing a marker pair (']')
 * @param {string} chunk_attr - template attribute carrying a unit's content
 * @param {string} head_attr - template attribute carrying a unit's head content
 * @param {number} comment_node - Node.COMMENT_NODE
 * @returns {void}
 */
function stream_runtime(
	pending_prefix,
	errored_prefix,
	end_marker,
	chunk_attr,
	head_attr,
	comment_node,
) {
	var doc = document;
	var registry = window.__RIPPLE_B__ || (window.__RIPPLE_B__ = {});

	/**
	 * @param {number} id
	 * @param {number} [errored]
	 */
	window.__RIPPLE_S__ = function (id, errored) {
		var head_template = doc.querySelector('template[' + head_attr + '="' + id + '"]');
		if (head_template) {
			doc.head.appendChild(/** @type {HTMLTemplateElement} */ (head_template).content);
			head_template.remove();
		}

		var template = /** @type {HTMLTemplateElement | null} */ (
			doc.querySelector('template[' + chunk_attr + '="' + id + '"]')
		);

		function done() {
			registry[id] = 1;
			if (template) {
				template.remove();
			}
		}

		// post-hydration arrival: the boundary hydrated this slot in the
		// pending state and registered an activator — hand the chunk over
		var boundary = registry[id];
		if (boundary && typeof boundary === 'object') {
			registry[id] = 1;
			boundary.a(template, errored);
			if (template) {
				template.remove();
			}
			return;
		}

		// pre-hydration arrival: find the slot's open comment ("[?" + id)
		var walker = doc.createTreeWalker(doc.body || doc.documentElement, 128 /* SHOW_COMMENT */);
		/** @type {Comment | null} */
		var open = null;
		var node;
		while ((node = /** @type {Comment | null} */ (walker.nextNode()))) {
			if (node.data === pending_prefix + id) {
				open = node;
				break;
			}
		}
		if (!open) {
			done();
			return;
		}

		// find the matching close comment, depth-aware: any "["-prefixed
		// comment opens a nested marker pair, end_marker closes one
		var depth = 0;
		/** @type {ChildNode | null} */
		var close = null;
		var current = open.nextSibling;
		while (current) {
			if (current.nodeType === comment_node) {
				var data = /** @type {Comment} */ (current).data;
				if (data === end_marker) {
					if (depth === 0) {
						close = current;
						break;
					}
					depth--;
				} else if (data.charCodeAt(0) === 91 /* '[' */) {
					depth++;
				}
			}
			current = current.nextSibling;
		}
		if (!close) {
			done();
			return;
		}

		// remove the fallback (and any leftover marker comments) in the slot
		current = open.nextSibling;
		while (current !== close) {
			var next = /** @type {ChildNode} */ (current).nextSibling;
			/** @type {ChildNode} */ (current).remove();
			current = next;
		}

		if (errored) {
			// leave the slot empty and mark it errored — the hydrating
			// boundary routes the error envelope from here
			open.data = errored_prefix + id;
		} else {
			// insert the streamed content and retire the slot markers, so the
			// DOM matches non-streamed SSR exactly
			if (template) {
				close.before(template.content);
			}
			open.remove();
			close.remove();
		}
		done();
	};
}

export const STREAM_RUNTIME_SCRIPT =
	'<script>(' +
	stream_runtime.toString() +
	')(' +
	JSON.stringify(HYDRATION_START_PENDING) +
	',' +
	JSON.stringify(HYDRATION_START_ERRORED) +
	',' +
	JSON.stringify(HYDRATION_END) +
	',' +
	JSON.stringify(STREAM_CHUNK_ATTR) +
	',' +
	JSON.stringify(STREAM_HEAD_ATTR) +
	',' +
	String(COMMENT_NODE) +
	')</script>';
