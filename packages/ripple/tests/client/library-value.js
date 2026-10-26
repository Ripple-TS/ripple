import { track } from 'ripple';

/**
 * Simulate a library's store factory, including a literal function value.
 * @template T
 * @param {T} initial
 * @returns {import('ripple').Tracked<T>}
 */
export function create_library_value(initial) {
	if (typeof initial !== 'function') return track(initial);
	/** @type {import('ripple').Tracked<T>} */
	var value = track();
	value.value = initial;
	return value;
}
