/** @import { DeferredBoundary } from './deferred.js' */
import { observe_deferred, hydrate_boundary } from './deferred.js';

/**
 * Activity may retain an unresolved Hydrate before any Hydrate function runs.
 * Register only ranges, never evaluate children to discover their policies.
 */
export function enable_hydration_intent() {
	observe_deferred((boundary) => {
		if (boundary.start.data === '[a')
			boundary.c = listen_intent(boundary, () => hydrate_boundary(boundary));
	});
}

const events = [
	'auxclick',
	'click',
	'contextmenu',
	'dblclick',
	'focusin',
	'keydown',
	'keyup',
	'mousedown',
	'mouseenter',
	'mouseover',
	'mouseup',
	'pointerdown',
	'pointerenter',
	'pointerover',
	'pointerup',
];
/** @typedef {{ b: Map<Comment, { o: () => void, q?: () => boolean }>, h: EventListener }} IntentRoot */
/** @type {Map<HTMLElement, IntentRoot>} */
var roots = new Map();

/**
 * Find only the comment ranges enclosing the target. Unrelated subtrees are
 * never traversed, and unresolved descendants need no runtime objects.
 * @param {Node} target
 * @param {HTMLElement} root
 * @returns {Comment[]}
 */
function path(target, root) {
	var result = [];
	for (var node = target; node !== root && node.parentNode !== null; node = node.parentNode) {
		var depth = 0;
		for (var sibling = node.previousSibling; sibling !== null; sibling = sibling.previousSibling) {
			if (sibling.nodeType !== 8) continue;
			var comment = /** @type {Comment} */ (sibling);
			if (comment.data === ']') depth++;
			else if (comment.data.startsWith('[')) {
				if (depth > 0) depth--;
				else if (comment.data.startsWith('[h') || comment.data === '[a') result.push(comment);
			}
		}
	}
	return result.reverse();
}

/**
 * @param {Comment} marker
 * @param {string} type
 */
function matches(marker, type) {
	return (
		marker.data === '[hd' ||
		(marker.data.startsWith('[he:') &&
			decodeURIComponent(marker.data.slice(4)).split(' ').includes(type))
	);
}

/**
 * @param {DeferredBoundary} boundary
 * @param {() => void} open
 * @param {() => boolean} [pending]
 */
export function listen_intent(boundary, open, pending) {
	var target = /** @type {NonNullable<DeferredBoundary['context']>} */ (boundary.context).target;
	var entry = roots.get(target);
	if (entry === undefined) {
		/** @type {Map<Comment, { o: () => void, q?: () => boolean }>} */
		var boundaries = new Map();
		/** @type {EventListener} */
		var handle = (event) => {
			if (!(event.target instanceof Node)) return;
			var markers = path(event.target, target);
			if (markers.some((marker) => marker.data === '[hn')) return;
			var last = -1;
			for (var i = 0; i < markers.length; i++) if (matches(markers[i], event.type)) last = i;
			for (var i = 0; last !== -1 && i < markers.length; i++) {
				var marker = markers[i];
				if (!target.contains(marker) || marker.data === '[hn') break;
				// Opening an ancestor registers its children in this same map.
				// A client-only factory may replace its server 'dynamic' policy.
				var entry = boundaries.get(marker);
				// Also prepare descendant Activities and gates that became eligible
				// as their parents opened, before native dispatch reaches the target.
				// An unresolved Hydrate policy still stops this continuation.
				if (
					i >= last &&
					marker.data !== '[' &&
					!(i > last && marker.data === '[a') &&
					!matches(marker, event.type) &&
					!entry?.q?.()
				)
					break;
				entry?.o();
			}
			if (!target.contains(event.target)) {
				// Recovery/removal invalidated the original target. Do not run its
				// stale default action or deliver it to a replacement element.
				event.preventDefault();
				event.stopImmediatePropagation();
			}
			// Hydration is synchronous in capture, before the event reaches the
			// target. Native dispatch delivers it once, including default actions,
			// focus, keyboard payload and non-bubbling enter events. No replay.
		};
		entry = { b: boundaries, h: handle };
		roots.set(target, entry);
		for (var event of events) target.addEventListener(event, handle, true);
	}
	const current = entry;
	current.b.set(boundary.start, { o: open, q: pending });
	return () => {
		current.b.delete(boundary.start);
		if (current.b.size === 0) {
			for (var event of events) target.removeEventListener(event, current.h, true);
			roots.delete(target);
		}
	};
}
