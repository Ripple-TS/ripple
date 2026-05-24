/** @type {typeof Object.getOwnPropertyDescriptor} */
export var get_descriptor = Object.getOwnPropertyDescriptor;
/** @type {typeof Object.getOwnPropertyDescriptors} */
export var get_descriptors = Object.getOwnPropertyDescriptors;
/** @type {typeof Array.from} */
export var array_from = Array.from;
/** @type {typeof Array.isArray} */
export var is_array = Array.isArray;
/** @type {typeof Object.defineProperty} */
export var define_property = Object.defineProperty;
/** @type {typeof Object.getPrototypeOf} */
export var get_prototype_of = Object.getPrototypeOf;
/** @type {typeof Object.values} */
export var object_values = Object.values;
/** @type {typeof Object.entries} */
export var object_entries = Object.entries;
/** @type {typeof Object.keys} */
export var object_keys = Object.keys;
/** @type {typeof Object.getOwnPropertySymbols} */
export var get_own_property_symbols = Object.getOwnPropertySymbols;
/** @type {typeof structuredClone} */
export var structured_clone = structuredClone;
/** @type {typeof Object.prototype} */
export var object_prototype = Object.prototype;
/** @type {typeof Array.prototype} */
export var array_prototype = Array.prototype;
/** @type {typeof Object.prototype.hasOwnProperty} */
export var has_own_property = object_prototype.hasOwnProperty;

/**
 * @param {object} value
 * @param {PropertyKey} key
 * @returns {boolean}
 */
export function has_prototype_accessor(value, key) {
	var proto = get_prototype_of(value);
	while (proto != null) {
		var descriptor = get_descriptor(proto, key);
		if (descriptor !== undefined) {
			return typeof descriptor.get === 'function' || typeof descriptor.set === 'function';
		}
		proto = get_prototype_of(proto);
	}
	return false;
}

/**
 * Slice helper for arrays and array-like values.
 * @param {ArrayLike<any>} array_like
 * @param {...number} args
 * @returns {any[]}
 */
export function array_slice(array_like, ...args) {
	return is_array(array_like)
		? array_like.slice(...args)
		: array_prototype.slice.call(array_like, ...args);
}

/**
 * Converts iterables, iterators, and array-like values to an array from an index.
 * @template T
 * @param {Iterable<T> | Iterator<T> | ArrayLike<T>} iterable
 * @param {number} [index]
 * @returns {T[]}
 */
export function iterable_array_from(iterable, index = 0) {
	/** @type {Iterator<T>} */
	var iterator;
	var iterable_prop = /** @type {Iterable<T>} */ (iterable)[Symbol.iterator];

	if (typeof iterable_prop === 'function') {
		iterator = iterable_prop.call(iterable);
	} else if (typeof (/** @type {Iterator<T>} */ (iterable).next) === 'function') {
		iterator = Iterator.from(/** @type {Iterator<T>} */ (iterable));
	} else {
		return array_from(/** @type {ArrayLike<T>} */ (iterable)).slice(index);
	}

	var result = [];
	var i = 0;
	var current = iterator.next();
	while (!current.done) {
		if (i++ < index) {
			current = iterator.next();
			continue;
		}
		result.push(current.value);
		current = iterator.next();
	}
	return result;
}
