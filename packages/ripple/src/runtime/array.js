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
	return ripple_array.from(safe_scope(), arrayLike, mapFn, thisArg);
};

/**
 * @template T
 * @param {...T} items
 * @returns {RippleArray<T>}
 */
RippleArray.of = function (...items) {
	return ripple_array.of(safe_scope(), ...items);
};

/**
 * @template T
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {any} [thisArg]
 * @returns {Promise<RippleArray<T>>}
 */
RippleArray.fromAsync = async function (arrayLike, mapFn, thisArg) {
	return ripple_array.fromAsync(safe_scope(), arrayLike, mapFn, thisArg);
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
 * @param {Block} block
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {*} [thisArg]
 * @returns {RippleArray<T>}
 */
ripple_array.from = function (block, arrayLike, mapFn, thisArg) {
	var elements = mapFn ? Array.from(arrayLike, mapFn, thisArg) : Array.from(arrayLike);
	return array_proxy({ elements, block, from_static: true });
};

/**
 * @template T
 * @param {Block} block
 * @param {...T} items
 * @returns {RippleArray<T>}
 */
ripple_array.of = function (block, ...items) {
	var elements = Array.of(...items);
	return array_proxy({ elements, block, from_static: true });
};

/**
 * @template T
 * @param {Block} block
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {any} [thisArg]
 * @returns {Promise<RippleArray<T>>}
 */
ripple_array.fromAsync = async function (block, arrayLike, mapFn, thisArg) {
	var elements = mapFn
		? await Array.fromAsync(arrayLike, mapFn, thisArg)
		: await Array.fromAsync(arrayLike);
	return array_proxy({ elements, block, from_static: true });
};
