/** @import { Block } from '#client' */
/** @import { RippleObject as RippleObjectT } from '#public' */
import { safe_scope } from './internal/client/runtime.js';
import { object_proxy } from './proxy.js';

/**
 * @template {object} T
 * @constructor
 * @param {T} obj
 * @returns {RippleObjectT<T>}
 */
export function RippleObject(obj) {
	if (!new.target) {
		throw new Error("RippleObject must be called with 'new'");
	}

	var block = safe_scope();

	return ripple_object(block, obj);
}

/**
 * @template {object} T
 * @param {T} obj
 * @param {Block} block
 * @returns {RippleObjectT<T>}
 */
export function ripple_object(block, obj) {
	return object_proxy(obj, block);
}
