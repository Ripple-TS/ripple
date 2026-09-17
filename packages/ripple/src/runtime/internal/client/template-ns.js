/** @import { NAMESPACE_URI } from './constants.js' */
import { get_first_child } from './operations.js';
import { with_ns as run_with_ns } from './runtime.js';
import { set_ns_parser, template } from './template.js';

/**
 * Create fragment with proper namespace using Svelte's wrapping approach
 * @param {string} content
 * @param {'svg' | 'math'} ns
 * @returns {DocumentFragment}
 */
function from_namespace(content, ns) {
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
