const TSRX_ELEMENT = Symbol.for('ripple.element');

/**
 * @typedef {{
 * 	render: Function;
 * 	[TSRX_ELEMENT]: true;
 * }} TSRXElement
 */

/**
 * @param {Function} render
 * @returns {TSRXElement}
 */
export function tsrx_element(render) {
	return {
		render,
		[TSRX_ELEMENT]: true,
	};
}

/**
 * @param {any} value
 * @returns {value is TSRXElement}
 */
export function is_tsrx_element(value) {
	return value != null && value[TSRX_ELEMENT] === true;
}

/**
 * @param {any} value
 * @returns {any}
 */
export function normalize_children(value) {
	if (value == null || is_tsrx_element(value) || typeof value !== 'function') {
		return value;
	}

	return tsrx_element(value);
}
