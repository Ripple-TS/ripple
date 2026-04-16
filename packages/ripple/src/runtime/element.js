const RIPPLE_ELEMENT = Symbol.for('ripple.element');

/**
 * @typedef {{
 * 	render: Function;
 * 	[RIPPLE_ELEMENT]: true;
 * }} RippleElement
 */

/**
 * @param {Function} render
 * @returns {RippleElement}
 */
export function ripple_element(render) {
	return {
		render,
		[RIPPLE_ELEMENT]: true,
	};
}

/**
 * @param {any} value
 * @returns {value is RippleElement}
 */
export function is_ripple_element(value) {
	return value != null && value[RIPPLE_ELEMENT] === true;
}

/**
 * @param {any} value
 * @returns {any}
 */
export function normalize_children(value) {
	if (value == null || is_ripple_element(value) || typeof value !== 'function') {
		return value;
	}

	return ripple_element(value);
}
