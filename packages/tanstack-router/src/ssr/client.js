import { hydrate as hydrateState } from '@tanstack/router-core/ssr/client';
import { hydrate as hydrateRoot } from 'ripple';
import { routerComponent } from './Root.tsrx';
import { observeDeferred } from './deferred.js';

/** @type {WeakMap<import('@tanstack/router-core').AnyRouter, Promise<void>>} */
const hydrations = new WeakMap();

/** Restore state before mounting a provider. Cleanup belongs to this bootstrap, even on failure.
 * @param {import('@tanstack/router-core').AnyRouter} router
 */
export function hydrate(router) {
	let pending = hydrations.get(router);
	if (!pending) {
		const bootstrap = window.$_TSR;
		pending = hydrateState(router).finally(() => bootstrap?.h());
		// Custom serialization adapters may materialize the snapshot synchronously
		// inside hydrateState, after the server bootstrap's first observation.
		observeDeferred(bootstrap?.router);
		hydrations.set(router, pending);
	}
	return pending;
}

/** @param {import('../../types/ssr/client.js').HydrateRouterOptions} options */
export async function hydrateRouter({ router, target, children = routerComponent(router) }) {
	await hydrate(router);
	return hydrateRoot(children, { target });
}
