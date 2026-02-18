/**
 * @typedef {import('@ripple-ts/vite-plugin').Context} Context
 * @typedef {import('@ripple-ts/vite-plugin').Middleware} Middleware
 * @typedef {import('@ripple-ts/vite-plugin').RenderRouteOptions} RenderRouteOptions
 * @typedef {import('@ripple-ts/vite-plugin').ServerRouteOptions} ServerRouteOptions
 */

/**
 * Route for rendering Ripple components with SSR
 */
export class RenderRoute {
	/** @type {'render'} */
	type = 'render';

	/** @type {string} */
	path;

	/** @type {string} */
	entry;

	/** @type {string | undefined} */
	layout;

	/** @type {Middleware[]} */
	before;

	/**
	 * @param {RenderRouteOptions} options
	 */
	constructor(options) {
		this.path = options.path;
		this.entry = options.entry;
		this.layout = options.layout;
		this.before = options.before ?? [];
	}
}

/**
 * Route for API endpoints (returns Response directly)
 */
export class ServerRoute {
	/** @type {'server'} */
	type = 'server';

	/** @type {string} */
	path;

	/** @type {string[]} */
	methods;

	/** @type {(context: Context) => Response | Promise<Response>} */
	handler;

	/** @type {Middleware[]} */
	before;

	/** @type {Middleware[]} */
	after;

	/**
	 * @param {ServerRouteOptions} options
	 */
	constructor(options) {
		this.path = options.path;
		this.methods = options.methods ?? ['GET'];
		this.handler = options.handler;
		this.before = options.before ?? [];
		this.after = options.after ?? [];
	}
}
