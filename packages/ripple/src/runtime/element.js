export const TSRX_ELEMENT = Symbol.for('ripple.element');

/**
 * @typedef {{
 * 	render: Function;
 * 	p: any;
 * 	[TSRX_ELEMENT]: true;
 * }} TSRXElement
 */

/**
 * Elements share one constructor so every instance has the same shape and the
 * marker lives on the prototype instead of being defined per allocation.
 * @param {Function} render
 * @param {any} p
 * @this {TSRXElement}
 */
function TSRXElementImpl(render, p) {
	this.render = render;
	this.p = p;
}
/** @type {any} */ (TSRXElementImpl.prototype)[TSRX_ELEMENT] = true;

/**
 * @param {Function} render `(anchor, block, p) => …`
 * @param {any} [p] a value handed back to `render` as its third argument: a
 *   module-level component render function receives the component's props
 *   this way instead of closing over them, so instantiating the component
 *   allocates no closure
 * @returns {TSRXElement}
 */
export function tsrx_element(render, p = null) {
	return /** @type {TSRXElement} */ (
		/** @type {unknown} */ (new /** @type {any} */ (TSRXElementImpl)(render, p))
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
