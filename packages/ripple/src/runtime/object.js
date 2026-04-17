/** @import { Block } from '#client' */
import { safe_scope } from './internal/client/runtime.js';
import { object_proxy } from './proxy.js';

/**
 * @template {object} T
 */
export class RippleObject {
	/**
	 * @param {T} obj
	 */
	constructor(obj) {
		var block = safe_scope();
		return /** @type {RippleObject<any>} */ (/** @type {unknown} */ (ripple_object(block, obj)));
	}
}

/**
 * @template {object} T
 * @param {T} obj
 * @param {Block} block
 * @returns {RippleObject<T>}
 */
export function ripple_object(block, obj) {
	return object_proxy(obj, block);
}
