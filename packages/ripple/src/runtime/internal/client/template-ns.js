import { get_first_child } from './operations.js';
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
 * Makes namespaced template parsing available: called by every path that can
 * clone a template into the SVG or MathML namespace, so an app without one
 * never loads it.
 */
export function install_ns_templates() {
	set_ns_parser(from_namespace);
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
