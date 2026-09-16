/** @import { Block } from '#client' */
import { safe_scope } from './internal/client/runtime.js';
import { array_proxy } from './proxy.js';

/**
 * @template T
 */
export class RippleArray {
	/**
	 * @param {...T} elements
	 */
	constructor(...elements) {
		var block = safe_scope();
		return /** @type {RippleArray<any>} */ (
			/** @type {unknown} */ (ripple_array(block, ...elements))
		);
	}

	/**
	 * @template U
	 * @param {ArrayLike<U> | Iterable<U>} arrayLike
	 * @param {(v: U, k: number) => any | undefined} [mapFn]
	 * @param {*} [thisArg]
	 * @returns {RippleArray<U>}
	 */
	static from(arrayLike, mapFn, thisArg) {
		return ripple_array_from(safe_scope(), arrayLike, mapFn, thisArg);
	}

	/**
	 * @template U
	 * @param {...U} items
	 * @returns {RippleArray<U>}
	 */
	static of(...items) {
		return ripple_array_of(safe_scope(), ...items);
	}

	/**
	 * @template U
	 * @param {ArrayLike<U> | Iterable<U>} arrayLike
	 * @param {(v: U, k: number) => any | undefined} [mapFn]
	 * @param {any} [thisArg]
	 * @returns {Promise<RippleArray<U>>}
	 */
	static async fromAsync(arrayLike, mapFn, thisArg) {
		return ripple_array_from_async(safe_scope(), arrayLike, mapFn, thisArg);
	}
}

/**
 * The compiled form of `new RippleArray(...)`. Each static below is its own
 * function so a bundle that never uses one drops it (and the proxy it would
 * create) instead of keeping a function that carries them all.
 * @template T
 * @param {Block} block
 * @param {...T} elements
 * @returns {RippleArray<T>}
 */
export function ripple_array(block, ...elements) {
	return array_proxy({ elements, block });
}

/**
 * `RippleArray.from(...)`
 * @template T
 * @param {Block} block
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {*} [thisArg]
 * @returns {RippleArray<T>}
 */
export function ripple_array_from(block, arrayLike, mapFn, thisArg) {
	var elements = mapFn ? Array.from(arrayLike, mapFn, thisArg) : Array.from(arrayLike);
	return array_proxy({ elements, block, from_static: true });
}

/**
 * `RippleArray.of(...)`
 * @template T
 * @param {Block} block
 * @param {...T} items
 * @returns {RippleArray<T>}
 */
export function ripple_array_of(block, ...items) {
	var elements = Array.of(...items);
	return array_proxy({ elements, block, from_static: true });
}

/**
 * `RippleArray.fromAsync(...)`
 * @template T
 * @param {Block} block
 * @param {ArrayLike<T> | Iterable<T>} arrayLike
 * @param {(v: T, k: number) => any | undefined} [mapFn]
 * @param {any} [thisArg]
 * @returns {Promise<RippleArray<T>>}
 */
export async function ripple_array_from_async(block, arrayLike, mapFn, thisArg) {
	var elements = mapFn
		? await Array.fromAsync(arrayLike, mapFn, thisArg)
		: await Array.fromAsync(arrayLike);
	return array_proxy({ elements, block, from_static: true });
}
