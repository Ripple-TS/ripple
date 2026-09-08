const TSRX_ELEMENT = Symbol.for('ripple.element');

/**
 * @typedef {{
 * 	render: Function;
 * 	[TSRX_ELEMENT]: true;
 * }} TSRXElement
 */

/**
 * Elements share one constructor so every instance has the same shape and the
 * marker lives on the prototype instead of being defined per allocation.
 * @param {Function} render
 * @this {TSRXElement}
 */
function TSRXElementImpl(render) {
	this.render = render;
}
/** @type {any} */ (TSRXElementImpl.prototype)[TSRX_ELEMENT] = true;

/**
 * @param {Function} render
 * @returns {TSRXElement}
 */
export function tsrx_element(render) {
	return /** @type {TSRXElement} */ (
		/** @type {unknown} */ (new /** @type {any} */ (TSRXElementImpl)(render))
	);
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

	return tsrx_element(() => value({}));
}
