/**
 * @template T
 * @template U
 * @param {Iterable<T> | Iterator<T>} iterable
 * @param {(item: T, index: number, is_last: boolean) => U} fn
 * @param {() => U | U[]} [tail]
 * @param {() => U | U[]} [empty]
 * @returns {U[]}
 */
export function map_iterable(iterable, fn, tail, empty) {
	if (Array.isArray(iterable)) {
		return map_array(iterable, fn, tail, empty);
	}

	/** @type {Iterator<T>} */
	var iterator;
	var iterable_prop = /** @type {Iterable<T>} */ (iterable)[Symbol.iterator];

	if (typeof iterable_prop === 'function') {
		iterator = iterable_prop.call(iterable);
	} else if (typeof (/** @type {Iterator<T>} */ (iterable).next) === 'function') {
		iterator = Iterator.from(iterable);
	} else {
		throw new TypeError('The loop target has to be an Iterable');
	}

	var current = iterator.next();
	if (current.done) {
		if (!empty) {
			return [];
		}
		var empty_value = empty();
		if (Array.isArray(empty_value)) {
			return empty_value;
		}
		return [empty_value];
	}

	var index = 0;
	var result = [];
	while (true) {
		var next = iterator.next();
		var value = fn(current.value, index++, !!next.done);
		if (Array.isArray(value)) {
			for (var j = 0; j < value.length; j++) {
				result.push(value[j]);
			}
		} else {
			result.push(value);
		}
		if (next.done) {
			break;
		}
		current = next;
	}
	if (tail) {
		var tail_value = tail();
		if (Array.isArray(tail_value)) {
			for (var j = 0; j < tail_value.length; j++) {
				result.push(tail_value[j]);
			}
		} else {
			result.push(tail_value);
		}
	}
	return result;
}

/**
 * @template T
 * @template U
 * @param {Array<T>} array
 * @param {(item: T, index: number, is_last: boolean) => U} fn
 * @param {() => U | U[]} [tail]
 * @param {() => U | U[]} [empty]
 * @returns {U[]}
 */
function map_array(array, fn, tail, empty) {
	var length = array.length;
	if (length === 0) {
		if (!empty) {
			return [];
		}
		var empty_value = empty();
		if (Array.isArray(empty_value)) {
			return empty_value;
		}
		return [empty_value];
	}
	var result = [];
	for (var i = 0; i < length; i++) {
		var value = fn(array[i], i, i === length - 1);
		if (Array.isArray(value)) {
			for (var j = 0; j < value.length; j++) {
				result.push(value[j]);
			}
		} else {
			result.push(value);
		}
	}
	if (tail) {
		var tail_value = tail();
		if (Array.isArray(tail_value)) {
			for (var j = 0; j < tail_value.length; j++) {
				result.push(tail_value[j]);
			}
		} else {
			result.push(tail_value);
		}
	}
	return result;
}
