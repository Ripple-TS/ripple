/** @import { AppendIntoAnchor, Block } from '#client' */

import {
	TEMPLATE_FRAGMENT,
	TEMPLATE_USE_IMPORT_NODE,
	TEMPLATE_SVG_NAMESPACE,
	TEMPLATE_MATHML_NAMESPACE,
} from '../../../constants.js';
import { H, hydrate_node, hydrating } from './hydration.js';
import { create_text, get_first_child, is_firefox } from './operations.js';
import { active_block, active_namespace } from './runtime.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';

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
 * @param {string} ns - `'svg'`, `'math'`, or `''` for HTML.
 * @returns {DocumentFragment}
 */
export function create_fragment_from_html(html, ns = '') {
	if (ns !== '') {
		return from_namespace(html, /** @type {'svg' | 'math'} */ (ns));
	}
	var elem = document.createElement('template');
	elem.innerHTML = html;
	return elem.content;
}

/**
 * A template's content and flags, shared by every clone of one `template()`
 * instance, with the parsed node cached for the namespace it was parsed in.
 * @typedef {{
 *   c: string;
 *   f: number;
 *   n: Node | DocumentFragment | undefined;
 *   ns: string | undefined;
 * }} TemplateState
 */

/**
 * The clone path of a {@link template} instance. Kept out of the per-template
 * closure so a hydrating page never compiles it.
 * @param {TemplateState} t
 * @returns {Node}
 */
function clone_template(t) {
	var flags = t.f;
	var content = t.c;
	var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
	// The namespace the content parses in: a static one from the flags, else
	// the active namespace (a comment placeholder needs none).
	var ns =
		content === '<!>'
			? ''
			: (flags & TEMPLATE_SVG_NAMESPACE) !== 0 || active_namespace === 'svg'
				? 'svg'
				: (flags & TEMPLATE_MATHML_NAMESPACE) !== 0 || active_namespace === 'mathml'
					? 'math'
					: '';
	var node = t.n;

	if (node === undefined || t.ns !== ns) {
		// Content that opens with a placeholder comment gets one more in
		// front, so the first child the compiler navigates to is the element.
		node = create_fragment_from_html(content.startsWith('<!>') ? '<!>' + content : content, ns);
		if (!is_fragment) node = /** @type {Node} */ (get_first_child(node));
		t.n = node;
		t.ns = ns;
	}

	/** @type {DocumentFragment | Node} */
	var clone =
		(flags & TEMPLATE_USE_IMPORT_NODE) !== 0 || is_firefox
			? document.importNode(/** @type {Node} */ (node), true)
			: /** @type {Node} */ (node).cloneNode(true);

	var start = clone;
	var end = clone;
	if (is_fragment) {
		// we know for sure that children exist
		start = /** @type {Node} */ (get_first_child(/** @type {DocumentFragment} */ (clone)));
		end = /** @type {Node} */ (/** @type {DocumentFragment} */ (clone).lastChild);
	}

	assign_nodes(start, end);

	return clone;
}

/**
 * Creates a template node or fragment from content and flags.
 * @param {string} content - The template content.
 * @param {number} flags - Flags for template type.
 * @param {number} [count] - Pre-calculated count of top-level nodes (for fragments). When provided, avoids runtime parsing.
 * @returns {() => Node}
 */
export function template(content, flags = 0, count = 1) {
	var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
	/** @type {TemplateState} */
	var t = { c: content, f: flags, n: undefined, ns: undefined };

	return () =>
		HYDRATION && hydrating
			? /** @type {import('./hydrate.js').HydrationRuntime} */ (H).t(is_fragment, count)
			: clone_template(t);
}

/**
 * Appends a DOM node before the anchor node.
 * @param {ChildNode | AppendIntoAnchor} anchor - The anchor node.
 * @param {Node} dom - The DOM node to append.
 */
export function append(anchor, dom) {
	if (HYDRATION && hydrating) {
		/** @type {import('./hydrate.js').HydrationRuntime} */ (H).a(anchor, dom);
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
	if (HYDRATION && hydrating) {
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
