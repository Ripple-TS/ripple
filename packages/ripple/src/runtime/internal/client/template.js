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
import { DEFAULT_NAMESPACE, NAMESPACE_URI } from './constants.js';
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
 * Parses content that belongs in the SVG or MathML namespace. Installed by
 * `template-ns.js` when a template or a dynamic element needs it, so an app
 * with HTML templates only ships neither.
 * @type {((html: string, ns: 'svg' | 'math') => DocumentFragment) | null}
 */
var parse_ns = null;

/**
 * @param {(html: string, ns: 'svg' | 'math') => DocumentFragment} fn
 */
export function set_ns_parser(fn) {
	parse_ns = fn;
}

/**
 * Creates a DocumentFragment from an HTML string.
 * @param {string} html - The HTML string.
 * @param {string} ns - `'svg'`, `'math'`, or `''` for HTML.
 * @returns {DocumentFragment}
 */
export function create_fragment_from_html(html, ns = '') {
	if (ns !== '') {
		return /** @type {NonNullable<typeof parse_ns>} */ (parse_ns)(
			html,
			/** @type {'svg' | 'math'} */ (ns),
		);
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
 * A template that is one HTML element with static attributes and at most one
 * text child, built with DOM calls instead of parsed: a `<template>` parse
 * has a fixed cost that dwarfs the element itself, and an app's first render
 * pays it once per distinct template. The compiler decides which templates
 * qualify (`template_el` in the client transform); every other shape still
 * parses. The element is created in the active namespace, as a parsed
 * template would be.
 * @param {string} tag
 * @param {string[] | null} [attributes] - flat name/value pairs
 * @param {string} [text]
 * @returns {() => Node}
 */
export function template_el(tag, attributes = null, text = '') {
	/** @type {Element | undefined} */
	var node;
	/** @type {string | undefined} */
	var node_ns;

	return () => {
		if (HYDRATION && hydrating) {
			return /** @type {import('./hydrate.js').HydrationRuntime} */ (H).t(false, 1);
		}
		var ns = active_namespace;
		if (node === undefined || node_ns !== ns) {
			node =
				ns === DEFAULT_NAMESPACE
					? document.createElement(tag)
					: document.createElementNS(NAMESPACE_URI[ns], tag);
			if (attributes !== null) {
				for (var i = 0; i < attributes.length; i += 2) {
					node.setAttribute(attributes[i], attributes[i + 1]);
				}
			}
			if (text !== '') {
				node.textContent = text;
			}
			node_ns = ns;
		}
		var clone = node.cloneNode(true);
		assign_nodes(clone, clone);
		return clone;
	};
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
