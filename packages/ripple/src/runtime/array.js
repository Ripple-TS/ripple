/** @import { Block } from '#client' */
import { safe_scope } from './internal/client/runtime.js';
import { array_proxy } from './proxy.js';

/**
 * @template T
 * @constructor
 * @param {...T} elements
 * @returns {RippleArray<T>}
 */
export function RippleArray(...elements) {
	if (!new.target) {
		throw new Error("RippleArray must be called with 'new'");
	}

	var block = safe_scope();
	return ripple_array(block, ...elements);
}

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {*} [thisArg]
 * @returns {RippleArray<T>}
 */
RippleArray.from = function (arrayLike, mapFn, thisArg) {
	return ripple_array.from(arrayLike, mapFn, thisArg);
};

/**
 * @template T
 * @param {...T} items
 * @returns {RippleArray<T>}
 */
RippleArray.of = function (...items) {
	return ripple_array.of(...items);
};

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {any} [thisArg]
 * @returns {Promise<RippleArray<T>>}
 */
RippleArray.fromAsync = async function (arrayLike, mapFn, thisArg) {
	return ripple_array.fromAsync(arrayLike, mapFn, thisArg);
};

/**
 * @template T
 * @param {Block} block
 * @param {...T} elements
 * @returns {RippleArray<T>}
 */
export function ripple_array(block, ...elements) {
	return array_proxy({ elements, block });
}

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {*} [thisArg]
 * @returns {RippleArray<T>}
 */
ripple_array.from = function (arrayLike, mapFn, thisArg) {
	var block = safe_scope();
	var elements = mapFn ? Array.from(arrayLike, mapFn, thisArg) : Array.from(arrayLike);
	return array_proxy({ elements, block, from_static: true });
};

/**
 * @template T
 * @param {...T} items
 * @returns {RippleArray<T>}
 */
ripple_array.of = function (...items) {
	var block = safe_scope();
	var elements = Array.of(...items);
	return array_proxy({ elements, block, from_static: true });
};

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {any} [thisArg]
 * @returns {Promise<RippleArray<T>>}
 */
ripple_array.fromAsync = async function (arrayLike, mapFn, thisArg) {
	var block = safe_scope();
	var elements = mapFn
		? await Array.fromAsync(arrayLike, mapFn, thisArg)
		: await Array.fromAsync(arrayLike);
	return array_proxy({ elements, block, from_static: true });
};
