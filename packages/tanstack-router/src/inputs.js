import { isTracked } from 'ripple';

/** @template T @param {T | import('ripple').Derived<T>} value @returns {T} */
export function resolveInput(value) {
	return isTracked(value) ? /** @type {T} */ (value.value) : /** @type {T} */ (value);
}

/** Resolve only top-level tracked inputs. Functions remain TanStack callbacks. @param {Record<string, any>} options */
export function resolveInputs(options) {
	return Object.fromEntries(
		Object.entries(options).map(([key, value]) => [key, resolveInput(value)]),
	);
}
