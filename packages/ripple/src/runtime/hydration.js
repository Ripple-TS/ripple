/** @import { HydrationStrategy, IdleHydrationOptions, VisibleHydrationOptions, InteractionHydrationOptions } from '../../types/hydration.js' */

/** @type {HydrationStrategy} */
const load_strategy = { t: 'l' };
/** @type {HydrationStrategy} */
const never_strategy = { t: 'n' };

/**
 * Eligible during initial hydration.
 * @returns {HydrationStrategy}
 */
export function load() {
	return load_strategy;
}
/**
 * Keep initial server HTML static. Client-only mounts still render.
 * @returns {HydrationStrategy}
 */
export function never() {
	return never_strategy;
}
/**
 * @param {IdleHydrationOptions} [options]
 * @returns {HydrationStrategy}
 */
export function idle({ timeout = 2000 } = {}) {
	return { t: 'i', v: timeout };
}
/**
 * @param {VisibleHydrationOptions} [options]
 * @returns {HydrationStrategy}
 */
export function visible({ rootMargin = '600px', threshold = 0 } = {}) {
	return { t: 'v', v: rootMargin, o: Array.isArray(threshold) ? [...threshold] : threshold };
}
/**
 * @param {InteractionHydrationOptions} [options]
 * @returns {HydrationStrategy}
 */
export function interaction({ events = ['pointerenter', 'focusin', 'pointerdown', 'click'] } = {}) {
	return {
		t: 'e',
		v: [...new Set(typeof events === 'string' ? [events] : events)].filter(Boolean).join(' '),
	};
}
/**
 * @param {string} query
 * @returns {HydrationStrategy}
 */
export function media(query) {
	return { t: 'm', v: query };
}
/**
 * @param {boolean | (() => boolean)} value
 * @returns {HydrationStrategy}
 */
export function condition(value) {
	return { t: 'c', v: value };
}
