import { RouterCore } from '@tanstack/router-core';
import { getStoreFactory } from './stores.js';

/** @extends {RouterCore<import('@tanstack/router-core').AnyRoute, import('@tanstack/router-core').TrailingSlashOption, boolean>} */
export class Router extends RouterCore {
	/** @param {ConstructorParameters<typeof RouterCore>[0]} options */
	constructor(options) {
		// RouterCore also installs scroll restoration from options. Its onRendered
		// listener runs after the provider acknowledges Ripple rendering.
		super(options, getStoreFactory);
	}
}

/** @param {ConstructorParameters<typeof RouterCore>[0]} options */
export function createRouter(options) {
	return new Router(options);
}
