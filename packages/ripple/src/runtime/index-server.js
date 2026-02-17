import { get, set, untrack, track, track_split } from './internal/server/index.js';

export { Context } from './internal/server/context.js';

export { get, set, untrack, track, track_split as trackSplit };

function noop() {}

export const effect = noop;
export const createRefKey = noop;
export const on = noop;
export const tick = noop;
export const flushSync = noop;

export const TrackedObject = globalThis.Object;
export const TrackedArray = globalThis.Array;
export const TrackedDate = globalThis.Date;
export const TrackedSet = globalThis.Set;
export const TrackedMap = globalThis.Map;
export const TrackedURL = globalThis.URL;
export const TrackedURLSearchParams = globalThis.URLSearchParams;

/**
 * @param {string} query A media query string
 * @param {boolean} [matches] Fallback value for the server
 */
export function MediaQuery(query, matches = false) {
	if (!new.target) {
		throw new TypeError('MediaQuery must be called with new');
	}

	return matches;
}

/**
 * @param {any} _
 */
export function createSubscriber(_) {
	return noop;
}

export const bindValue = noop;
export const bindChecked = noop;
export const bindGroup = noop;
export const bindClientWidth = noop;
export const bindClientHeight = noop;
export const bindContentRect = noop;
export const bindContentBoxSize = noop;
export const bindBorderBoxSize = noop;
export const bindDevicePixelContentBoxSize = noop;
export const bindFiles = noop;
export const bindIndeterminate = noop;
export const bindInnerHTML = noop;
export const bindInnerText = noop;
export const bindTextContent = noop;
export const bindNode = noop;
export const bindOffsetWidth = noop;
export const bindOffsetHeight = noop;

/**
 * Portal component noop for server-side rendering.
 * Portals are client-only and do not render on the server.
 * However, we need to output a marker comment so hydration can work correctly.
 * @param {any} output
 * @param {any} __
 */
export function Portal(output, __) {
	// Portals are client-only, but we need to output a marker for hydration
	// Output an empty HTML comment as a placeholder
	if (output && typeof output.push === 'function') {
		output.push('<!--portal-->');
	}
}
