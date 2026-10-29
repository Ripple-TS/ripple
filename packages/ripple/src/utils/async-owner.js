/** @typedef {{ s?: AbortSignal; r: Set<string> }} AsyncOwner */
/** @type {(() => AsyncOwner) | undefined} */
let owner;

/** Capture ownership synchronously; the returned owner can cross await boundaries. */
export function get_async_owner() {
	return owner?.();
}

/**
 * Never leave a global owner installed while a promise is pending.
 * @template T
 * @param {() => AsyncOwner} current
 * @param {(...args: any[]) => T} fn
 * @param {any} [receiver]
 * @param {any} [value]
 * @returns {T}
 */
export function with_async_owner(current, fn, receiver, value) {
	const previous = owner;
	owner = current;
	try {
		return fn.call(receiver, value);
	} finally {
		owner = previous;
	}
}
