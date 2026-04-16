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
