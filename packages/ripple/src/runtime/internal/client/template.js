/** @import { AppendIntoAnchor, Block } from '#client' */

import {
	TEMPLATE_FRAGMENT,
	TEMPLATE_USE_IMPORT_NODE,
	TEMPLATE_SVG_NAMESPACE,
	TEMPLATE_MATHML_NAMESPACE,
} from '../../../constants.js';
import { hydrate_append, hydrate_node, hydrating } from './hydration.js';
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
 * The hydration path of a {@link template} instance: adopts the server node(s)
 * at the cursor instead of cloning. Kept out of the clone path so a client-only
 * mount never compiles it.
 * @param {boolean} is_fragment
 * @param {number} count
 * @returns {Node}
 */
function hydrate_template(is_fragment, count) {
	var node = /** @type {Node} */ (hydrate_node);
	var end = is_fragment ? hydrate_fragment_end(node, count) : node;
	// assign_nodes, inline: the per-node hydration path stays free of helpers.
	var block = /** @type {Block} */ (active_block);
	var s = block.s;
	if (s === null) {
		block.s = { start: node, end };
	} else if (s.start === null) {
		s.start = node;
		s.end = end;
	}
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

		while (next !== null && next.nodeType === Node.COMMENT_NODE) {
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
 * A template's parsed content and the flags that shaped it, shared by every
 * clone of one `template()` instance.
 * @typedef {{
 *   content: string;
 *   is_fragment: boolean;
 *   use_import_node: boolean;
 *   use_svg_namespace: boolean;
 *   use_mathml_namespace: boolean;
 *   is_comment: boolean;
 *   has_start: boolean;
 *   node: Node | DocumentFragment | undefined;
 *   node_svg: boolean;
 *   node_mathml: boolean;
 * }} TemplateState
 */

/**
 * The clone path of a {@link template} instance. Kept out of the per-template
 * closure so a hydrating page never compiles it.
 * @param {TemplateState} t
 * @returns {Node}
 */
function clone_template(t) {
	var is_fragment = t.is_fragment;
	var is_comment = t.is_comment;
	var node = t.node;
	// If using runtime namespace, check active_namespace
	var svg = !is_comment && (t.use_svg_namespace || active_namespace === 'svg');
	var mathml = !is_comment && (t.use_mathml_namespace || active_namespace === 'mathml');

	if (node === undefined || t.node_svg !== svg || t.node_mathml !== mathml) {
		node = create_fragment_from_html(t.has_start ? t.content : '<!>' + t.content, svg, mathml);
		if (!is_fragment) node = /** @type {Node} */ (get_first_child(node));
		t.node = node;
		t.node_svg = svg;
		t.node_mathml = mathml;
	}

	/** @type {DocumentFragment | Node} */
	var clone =
		t.use_import_node || is_firefox
			? document.importNode(/** @type {Node} */ (node), true)
			: /** @type {Node} */ (node).cloneNode(true);

	var start = clone;
	var end = clone;
	if (is_fragment) {
		// we know for sure that children exist
		start = /** @type {Node} */ (get_first_child(/** @type {DocumentFragment} */ (clone)));
		end = /** @type {Node} */ (/** @type {DocumentFragment} */ (clone).lastChild);
	}

	// assign_nodes, inline: every template clone records its range.
	var block = /** @type {Block} */ (active_block);
	var s = block.s;
	if (s === null) {
		block.s = { start, end };
	} else if (s.start === null) {
		s.start = start;
		s.end = end;
	}

	return clone;
}

/**
 * Creates a template node or fragment from content and flags.
 * @param {string} content - The template content.
 * @param {number} flags - Flags for template type.
 * @param {number} [count] - Pre-calculated count of top-level nodes (for fragments). When provided, avoids runtime parsing.
 * @returns {() => Node}
 */
export function template(content, flags, count = 1) {
	var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
	var is_comment = content === '<!>';
	/** @type {TemplateState} */
	var t = {
		content,
		is_fragment,
		use_import_node: (flags & TEMPLATE_USE_IMPORT_NODE) !== 0,
		use_svg_namespace: (flags & TEMPLATE_SVG_NAMESPACE) !== 0,
		use_mathml_namespace: (flags & TEMPLATE_MATHML_NAMESPACE) !== 0,
		is_comment,
		has_start: !is_comment && !content.startsWith('<!>'),
		node: undefined,
		node_svg: false,
		node_mathml: false,
	};

	return () => (hydrating ? hydrate_template(is_fragment, count) : clone_template(t));
}

/**
 * Appends a DOM node before the anchor node.
 * @param {ChildNode | AppendIntoAnchor} anchor - The anchor node.
 * @param {Node} dom - The DOM node to append.
 */
export function append(anchor, dom) {
	if (hydrating) {
		hydrate_append(anchor, dom);
		return;
	}
	if (/** @type {AppendIntoAnchor} */ (anchor).into === true) {
		// Append-into-parent sentinel: an all-component-children element passes a
		// `{ parent }` object (no `nodeType`) so each component's root appends as
		// the host's last child instead of inserting before a placeholder comment.
		// The block still self-marks its range via assign_nodes, so teardown works.
		/** @type {AppendIntoAnchor} */ (anchor).parent.appendChild(dom);
		return;
	}
	/** @type {ChildNode} */ (anchor).before(/** @type {Node} */ (dom));
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
