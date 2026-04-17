/** @import { Derived } from '#client' */
/** @import { ReactiveValue as ReactiveValueT } from '#public' */
import { createSubscriber } from './create-subscriber.js';
import { safe_scope, derived } from './internal/client/runtime.js';

/**
 * @type {new <V>(fn: () => V, start: () => void | (() => void)) => ReactiveValueT<V>}
 */
export const ReactiveValue = /** @type {any} */ (
	function ReactiveValue(
		/** @type {() => any} */ fn,
		/** @type {() => void | (() => void)} */ start,
	) {
		if (!new.target) {
			throw new TypeError('`ReactiveValue` must be called with new');
		}

		const s = createSubscriber(start);
		const block = safe_scope();

		return derived(
			fn,
			block,
			() => {
				s();
				return fn();
			},
			(/** @type {any} */ _, /** @type {any} */ prev) => prev,
		);
	}
);
