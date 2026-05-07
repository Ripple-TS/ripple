/** @import { NAMESPACE_URI } from './constants.js' */

/**
 * Creates a text node that serves as an anchor point in the DOM.
 * @returns {Text}
 */
export function create_anchor() {
	var t = document.createTextNode('');
	t.__t = '';
	return t;
}

/**
 * Checks if an object is a tracked object (has a numeric 'f' property).
 * @param {any} v - The object to check.
 * @returns {boolean}
 */
export function is_ripple_object(v) {
	return typeof v === 'object' && v !== null && typeof (/** @type {any} */ (v).f) === 'number';
}

/**
 * Converts a tag name to its corresponding namespace.
 * @param {keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap | keyof HTMLElementTagNameMap} element
 * @param {keyof typeof NAMESPACE_URI} current_namespace
 * @returns {keyof typeof NAMESPACE_URI}
 */
export function top_element_to_ns(element, current_namespace) {
	if (element === 'svg') {
		return 'svg';
	} else if (element === 'math') {
		return 'mathml';
	} else {
		return current_namespace;
	}
}
