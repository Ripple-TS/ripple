import { is_array } from '@tsrx/core/runtime/language-helpers';

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
 * @returns {boolean}
 */
export function is_tsrx_collection(value) {
	if (!is_array(value)) {
		return false;
	}

	for (var i = 0; i < value.length; i++) {
		var item = value[i];
		if (is_tsrx_element(item) || is_tsrx_collection(item)) {
			return true;
		}
	}

	return false;
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
