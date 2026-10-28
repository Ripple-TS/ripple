/** @import { DeferredBoundary } from './deferred.js' */
/** @import { HydrationStrategy } from '../../../../types/hydration.js' */

/** @typedef {{ o: IntersectionObserver, e: Map<Element, Set<() => void>> }} Observer */
/** @type {Map<string, Observer>} */
var observers = new Map();

/**
 * Observe real root elements, never comment markers or layout placeholders.
 * @param {DeferredBoundary} boundary
 * @returns {Element[]}
 */
function targets(boundary) {
	var result = [];
	for (
		var node = boundary.start.nextSibling;
		node !== null && node !== boundary.end;
		node = node.nextSibling
	) {
		if (
			node.nodeType === 1 &&
			!/^(SCRIPT|STYLE|TEMPLATE)$/.test(/** @type {Element} */ (node).tagName)
		)
			result.push(/** @type {Element} */ (node));
	}
	return result;
}

/**
 * @param {DeferredBoundary} boundary
 * @param {HydrationStrategy} strategy
 * @param {() => void} resolve
 * @returns {(() => void) | undefined}
 */
export function subscribe_strategy(boundary, strategy, resolve) {
	switch (strategy.t) {
		case 'l':
			resolve();
			return;
		case 'i': {
			if (typeof requestIdleCallback === 'function') {
				var idle = requestIdleCallback(resolve, { timeout: strategy.v });
				return () => {
					if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
				};
			}
			var timer = setTimeout(resolve, strategy.v);
			return () => clearTimeout(timer);
		}
		case 'm': {
			if (!strategy.v) return;
			if (typeof matchMedia !== 'function') {
				resolve();
				return;
			}
			var media = matchMedia(strategy.v);
			var change = () => {
				if (media.matches) resolve();
			};
			media.addEventListener('change', change);
			change();
			return () => media.removeEventListener('change', change);
		}
		case 'v': {
			var elements = targets(boundary);
			// Empty/text-only output has no independently observable geometry.
			if (elements.length === 0 || typeof IntersectionObserver !== 'function') {
				resolve();
				return;
			}
			var key = strategy.v + '|' + strategy.o;
			var entry = observers.get(key);
			if (entry === undefined) {
				var callbacks = new Map();
				var observer = new IntersectionObserver(
					(entries) => {
						for (var item of entries)
							if (item.isIntersecting) {
								for (var callback of callbacks.get(item.target) ?? []) callback();
							}
					},
					{ rootMargin: strategy.v, threshold: /** @type {number | number[]} */ (strategy.o) },
				);
				entry = { o: observer, e: callbacks };
				observers.set(key, entry);
			}
			var { o, e } = entry;
			for (var element of elements) {
				var set = e.get(element);
				if (set === undefined) {
					e.set(element, (set = new Set()));
					o.observe(element);
				}
				set.add(resolve);
			}
			return () => {
				for (var element of elements) {
					var set = e.get(element);
					set?.delete(resolve);
					if (set?.size === 0) {
						e.delete(element);
						o.unobserve(element);
					}
				}
				if (e.size === 0) {
					o.disconnect();
					observers.delete(key);
				}
			};
		}
	}
}
