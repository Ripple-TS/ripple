/** @import { NAMESPACE_URI } from './constants.js' */
import { get_first_child } from './operations.js';
import { render_component, set_ns, with_ns as run_with_ns } from './runtime.js';
import { set_ns_parser, template } from './template.js';
import { createTrustedHTML } from '../../../csp.js';

/**
 * Parse in the namespace without concatenating wrappers around TrustedHTML.
 * @param {string | import('trusted-types/lib').TrustedHTML} content
 * @param {'svg' | 'math'} ns
 * @param {boolean} compiled
 * @returns {DocumentFragment}
 */
export function from_namespace(content, ns, compiled) {
	// Keep parsing inert, as it was with string wrappers inside a <template>:
	// foreignObject descendants must not upgrade or load resources in the master.
	var inert = document.createElement('template').content.ownerDocument;
	var root = inert.createElementNS(
		ns === 'svg' ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1998/Math/MathML',
		ns,
	);
	root.innerHTML = /** @type {string} */ (
		createTrustedHTML(content, compiled ? 'template' : 'html')
	);
	var result = document.createDocumentFragment();
	var first;
	while ((first = get_first_child(root))) result.appendChild(first);
	return result;
}

/**
 * Runs `fn` with `namespace` active: content rendered inside it (children
 * passed into an `<svg>`, a component rendered there, a dynamic element's
 * children) creates its DOM in that namespace, and every block created
 * inside records it (see `create_block`) so its reruns do too. Templates
 * cloned in the namespace parse through `from_namespace`, so it is installed
 * here: the compiler only emits this call for the SVG and MathML namespaces.
 * @template T
 * @param {keyof typeof NAMESPACE_URI} namespace
 * @param {() => T} fn
 * @returns {T}
 */
export function with_ns(namespace, fn) {
	set_ns_parser(from_namespace);
	return run_with_ns(namespace, fn);
}

/**
 * `template()` for content compiled in the SVG or MathML namespace.
 * @param {string} content
 * @param {number} [flags]
 * @param {number} [count]
 * @returns {() => Node}
 */
export function template_ns(content, flags, count) {
	set_ns_parser(from_namespace);
	return template(content, flags, count);
}

/**
 * Enters `namespace` for the rest of a setup function, as `with_ns` does for
 * a thunk: the compiler emits this where the content that follows is a
 * dynamic element or a component called inside an `<svg>` or `<math>`
 * template. Returns the namespace to restore with `set_ns`.
 * @param {keyof typeof NAMESPACE_URI} namespace
 * @returns {keyof typeof NAMESPACE_URI}
 */
export function push_ns(namespace) {
	set_ns_parser(from_namespace);
	return set_ns(namespace);
}

/**
 * `render_component` for a component called inside an `<svg>` or `<math>`
 * template: its content renders in that namespace.
 * @param {keyof typeof NAMESPACE_URI} namespace
 * @param {Function} fn
 * @param {Node | import('#client').AppendIntoAnchor} anchor
 * @param {Record<string, any>} props
 * @returns {void}
 */
export function render_component_ns(namespace, fn, anchor, props) {
	var previous = push_ns(namespace);
	try {
		render_component(fn, anchor, props);
	} finally {
		set_ns(previous);
	}
}
