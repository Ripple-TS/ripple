/**
 * @typedef {import('@ripple-ts/vite-plugin').Context} Context
 * @typedef {import('@ripple-ts/vite-plugin').Middleware} Middleware
 * @typedef {import('@ripple-ts/vite-plugin').RenderRouteOptions} RenderRouteOptions
 * @typedef {import('@ripple-ts/vite-plugin').ServerRouteOptions} ServerRouteOptions
 */

/**
 * @typedef {string | readonly [string, string]} RenderRouteEntry
 */

/**
 * @param {RenderRouteEntry | undefined} entry
 * @returns {string | undefined}
 */
export function get_route_entry_path(entry) {
	return typeof entry === 'string' ? entry : entry?.[1];
}

/**
 * @param {RenderRouteEntry | undefined} entry
 * @returns {string | undefined}
 */
export function get_route_entry_export_name(entry) {
	return typeof entry === 'string' ? undefined : entry?.[0];
}

/**
 * @param {RenderRouteEntry | undefined} entry
 * @returns {string | undefined}
 */
export function get_route_entry_id(entry) {
	const path = get_route_entry_path(entry);
	const export_name = get_route_entry_export_name(entry);
	return path && export_name ? `${path}#${export_name}` : path;
}

/**
 * @param {Record<string, unknown>} module
 * @param {string | undefined} export_name
 * @returns {Function | null}
 */
export function get_component_export(module, export_name) {
	if (export_name && typeof module[export_name] === 'function') {
		return module[export_name];
	}
	if (typeof module.default === 'function') {
		return module.default;
	}
	for (const [key, value] of Object.entries(module)) {
		if (typeof value === 'function' && /^[A-Z]/.test(key)) {
			return value;
		}
	}
	return null;
}

/**
 * Route for rendering Ripple components with SSR
 */
export class RenderRoute {
	/** @type {'render'} */
	type = 'render';

	/** @type {string} */
	path;

	/** @type {RenderRouteEntry | undefined} */
	entry;

	/** @type {string | undefined} */
	layout;

	/** @type {Middleware[]} */
	before;

	/**
	 * @param {RenderRouteOptions} options
	 */
	constructor(options) {
		if (!options.entry) {
			throw new Error('RenderRoute requires an `entry`.');
		}

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
