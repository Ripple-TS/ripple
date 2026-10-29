/**
 * @param {any} value
 * @returns {value is PromiseLike<any>}
 */
export function is_promise_like(value) {
	return (
		(typeof value === 'object' || typeof value === 'function') &&
		value !== null &&
		typeof value.then === 'function'
	);
}

/**
 * @param {any} value
 * @param {'deferred'} [type]
 * @returns {{ promise: PromiseLike<any>, abort_controller: AbortController | null, type?: 'deferred' } | null}
 */
export function get_async_track_result(value, type) {
	if (is_async_iterable(value)) {
		return { promise: Promise.resolve(value), abort_controller: null, type };
	}

	if (is_promise_like(value)) {
		return { promise: value, abort_controller: null, type: type };
	}

	if (typeof value === 'object' && value !== null && is_promise_like(value.promise)) {
		return {
			promise: value.promise,
			abort_controller:
				typeof value.abortController === 'object' && value.abortController !== null
					? value.abortController
					: null,
			type: type,
		};
	}

	return null;
}

/** @param {any} value @returns {value is AsyncIterable<any>} */
export function is_async_iterable(value) {
	return value != null && typeof value[Symbol.asyncIterator] === 'function';
}

/**
 * Record a local server-function result for this SSR source's continuation.
 * Ordinary promise/mutation functions never become retryable from this record.
 * @param {any} result
 * @param {string} hash
 * @param {import('./async-owner.js').AsyncOwner | undefined} owner
 */
export function record_async_source(result, hash, owner) {
	if (owner === undefined) return result;
	const reads = owner.r;
	/** @param {any} value */
	function record(value) {
		if (is_async_iterable(value)) reads.add(hash);
		return value;
	}
	return is_promise_like(result) ? Promise.resolve(result).then(record) : record(result);
}
