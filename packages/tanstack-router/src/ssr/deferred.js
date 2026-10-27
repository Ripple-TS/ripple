/**
 * Ripple does not enter an unresolved streamed boundary until its DOM arrives.
 * Observe transported rejections in the meantime, including before the browser
 * entry loads. This leaves the original promises and their rejected values intact.
 * Keep this function self-contained: the server also emits it in the bootstrap.
 * @param {unknown} value
 */
export function observeDeferred(value) {
	const seen = new WeakSet();
	/** @param {unknown} current */
	function visit(current) {
		if (!current || typeof current !== 'object' || seen.has(current)) return;
		seen.add(current);
		if (current instanceof Promise) {
			void current.then(visit, () => {});
		} else if (current instanceof Map) {
			for (const [key, value] of current) {
				visit(key);
				visit(value);
			}
		} else if (current instanceof Set) {
			for (const value of current) visit(value);
		} else {
			for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(current))) {
				if ('value' in descriptor) visit(descriptor.value);
			}
		}
	}
	visit(value);
}
