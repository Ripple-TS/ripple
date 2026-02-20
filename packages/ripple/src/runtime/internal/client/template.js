/** @import { Block } from '#client' */

import {
	TEMPLATE_FRAGMENT,
	TEMPLATE_USE_IMPORT_NODE,
	TEMPLATE_SVG_NAMESPACE,
	TEMPLATE_MATHML_NAMESPACE,
	HYDRATION_START,
	HYDRATION_END,
} from '../../../constants.js';
import { hydrate_advance, hydrate_next, hydrate_node, hydrating, pop } from './hydration.js';
import { create_text, get_first_child, get_next_sibling, is_firefox } from './operations.js';
import { active_block, active_namespace } from './runtime.js';

/**
 * Assigns start and end nodes to the active block's state.
 * @param {Node} start - The start node.
 * @param {Node} end - The end node.
 */
export function assign_nodes(start, end) {
	var block = /** @type {Block} */ (active_block);
	var s = block.s;
	if (s === null) {
		block.s = {
			start,
			end,
		};
	} else if (s.start === null) {
		s.start = start;
		s.end = end;
	}
}

/**
 * Creates a DocumentFragment from an HTML string.
 * @param {string} html - The HTML string.
 * @param {boolean} use_svg_namespace - Whether to use SVG namespace.
 * @param {boolean} use_mathml_namespace - Whether to use MathML namespace.
 * @returns {DocumentFragment}
 */
export function create_fragment_from_html(
	html,
	use_svg_namespace = false,
	use_mathml_namespace = false,
) {
	if (use_svg_namespace) {
		return from_namespace(html, 'svg');
	}
	if (use_mathml_namespace) {
		return from_namespace(html, 'math');
	}
	var elem = document.createElement('template');
	elem.innerHTML = html;
	return elem.content;
}

/**
 * Creates a template node or fragment from content and flags.
 * @param {string} content - The template content.
 * @param {number} flags - Flags for template type.
 * @returns {() => Node}
 */
export function template(content, flags) {
	var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
	var use_import_node = (flags & TEMPLATE_USE_IMPORT_NODE) !== 0;
	var use_svg_namespace = (flags & TEMPLATE_SVG_NAMESPACE) !== 0;
	var use_mathml_namespace = (flags & TEMPLATE_MATHML_NAMESPACE) !== 0;
	/** @type {Node | DocumentFragment | undefined} */
	var node;
	var is_comment = content === '<!>';
	var has_start = !is_comment && !content.startsWith('<!>');

	// For fragments, eagerly create the node so we can walk its children
	// during hydration to find the correct end node. The eagerly-created
	// node is reused as the clone template in the non-hydrating path.
	if (is_fragment) {
		node = create_fragment_from_html(
			has_start ? content : '<!>' + content,
			use_svg_namespace,
			use_mathml_namespace,
		);
	}

	return () => {
		if (hydrating) {
			if (is_fragment) {
				// Walk the template fragment's children in lockstep with hydrated
				// DOM siblings. Comment nodes (<!>) are control flow anchors whose
				// hydration markers (<!--[-->...<!--]-->) are consumed by block
				// processing, so we skip them and only advance for element/text nodes.
				var start = /** @type {Node} */ (hydrate_node);
				var end = start;
				var children = /** @type {DocumentFragment} */ (node).childNodes;
				var is_first = true;

				for (var i = 0; i < children.length; i++) {
					if (children[i].nodeType === 8) continue;

					if (is_first) {
						is_first = false;
						continue;
					}

					// Advance past comment nodes in the hydrated DOM. Each <!>
					// anchor in the template expands to a <!--[-->...<!--]-->
					// region, and there may be consecutive ones. Track depth so
					// nested blocks are skipped, and stop at the first non-comment
					// node at depth 0.
					var next = get_next_sibling(end);
					var depth = 0;

					while (next !== null) {
						if (next.nodeType === 8) {
							var data = /** @type {Comment} */ (next).data;
							if (data === HYDRATION_START) {
								depth++;
							} else if (data === HYDRATION_END) {
								if (depth > 0) {
									depth--;
								} else {
									// Reached a close marker that belongs to a parent block
									next = null;
									break;
								}
							}
							next = get_next_sibling(next);
							continue;
						}

						if (depth === 0) {
							break;
						}
						next = get_next_sibling(next);
					}

					if (next === null) {
						break;
					}
					end = next;
				}

				assign_nodes(start, end);
				return start;
			} else {
				assign_nodes(/** @type {Node} */ (hydrate_node), /** @type {Node} */ (hydrate_node));
			}
			return /** @type {Node} */ (hydrate_node);
		}
		// If using runtime namespace, check active_namespace
		var svg = !is_comment && (use_svg_namespace || active_namespace === 'svg');
		var mathml = !is_comment && (use_mathml_namespace || active_namespace === 'mathml');

		if (node === undefined || use_svg_namespace !== svg || use_mathml_namespace !== mathml) {
			node = create_fragment_from_html(has_start ? content : '<!>' + content, svg, mathml);
			if (!is_fragment) node = /** @type {Node} */ (get_first_child(node));
		}

		/** @type {DocumentFragment | Node} */
		var clone =
			use_import_node || is_firefox
				? document.importNode(/** @type {Node} */ (node), true)
				: /** @type {Node} */ (node).cloneNode(true);

		if (is_fragment) {
			// we know for sure that children exist
			var start = /** @type {Node} */ (get_first_child(/** @type {DocumentFragment} */ (clone)));
			var end = /** @type {Node} */ (/** @type {DocumentFragment} */ (clone).lastChild);

			assign_nodes(start, end);
		} else {
			assign_nodes(clone, clone);
		}

		return clone;
	};
}

/**
 * Appends a DOM node before the anchor node.
 * @param {ChildNode} anchor - The anchor node.
 * @param {Node} dom - The DOM node to append.
 * @param {boolean} [skip_advance] - If true, don't advance hydrate_node (used when next() already positioned it).
 */
export function append(anchor, dom, skip_advance) {
	if (hydrating) {
		// When skip_advance is true, the caller (e.g., a fragment component) has already
		// used next() to position hydrate_node correctly. We must NOT reset it.
		if (skip_advance) {
			return;
		}

		// During hydration, if anchor === dom, we're hydrating a child component
		// where the "anchor" IS the content. Preserve the cursor on the
		// template's hydrated end node so sibling traversal in the parent is correct.
		if (anchor === dom) {
			pop(dom);
			return;
		}

		// If the hydration cursor has descended into dom's children (e.g. after
		// child()/sibling() traversal inside a single-node template), we need
		// pop() to reset back to dom's sibling level before advancing.
		// But if the cursor is already at dom's sibling level (e.g. because
		// nested control flow blocks advanced it past dom via sibling traversal),
		// pop() would incorrectly reset backwards — so we skip it.
		if (hydrate_node?.parentNode === dom) {
			pop(dom);
		} else if (hydrate_node !== dom) {
			// Cursor has advanced past dom via sibling traversal (due to nested
			// block processing). Update the branch block's end to reflect the
			// actual extent, which may be past the statically-assigned end from
			// the template's assign_nodes call.
			var block = /** @type {Block} */ (active_block);
			var s = block.s;
			if (s !== null) {
				s.end = /** @type {Node} */ (hydrate_node);
			}
		}

		// Only advance if there's a next sibling. At the end of a component's
		// content, there might not be more siblings, and that's fine.
		hydrate_advance();
		return;
	}
	anchor.before(/** @type {Node} */ (dom));
}

export function text(data = '') {
	if (hydrating) {
		assign_nodes(/** @type {Node} */ (hydrate_node), /** @type {Node} */ (hydrate_node));
		return /** @type {Node} */ (hydrate_node);
	}
	var node = create_text(data);
	assign_nodes(node, node);
	return node;
}

/**
 * Create fragment with proper namespace using Svelte's wrapping approach
 * @param {string} content
 * @param {'svg' | 'math'} ns
 * @returns {DocumentFragment}
 */
function from_namespace(content, ns = 'svg') {
	var wrapped = `<${ns}>${content}</${ns}>`;

	var elem = document.createElement('template');
	elem.innerHTML = wrapped;
	var fragment = elem.content;

	var root = /** @type {Element} */ (get_first_child(fragment));
	var result = document.createDocumentFragment();

	var first;
	while ((first = get_first_child(root))) {
		result.appendChild(/** @type {Node} */ (first));
	}

	return result;
}
