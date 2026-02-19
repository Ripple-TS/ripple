/**
 * @typedef {import('@ripple-ts/vite-plugin').Route} Route
 * @typedef {import('@ripple-ts/vite-plugin').RenderRoute} RenderRoute
 * @typedef {import('@ripple-ts/vite-plugin').ServerRoute} ServerRoute
 */

/**
 * @typedef {Object} RouteMatch
 * @property {Route} route
 * @property {Record<string, string>} params
 */

/**
 * @typedef {Object} CompiledRoute
 * @property {Route} route
 * @property {RegExp} pattern
 * @property {string[]} paramNames
 * @property {number} specificity - Higher = more specific (static > param > catch-all)
 */

/**
 * Convert a route path pattern to a RegExp
 * Supports:
 * - Static segments: /about, /api/hello
 * - Named params: /posts/:id, /users/:userId/posts/:postId
 * - Catch-all: /docs/*slug
 *
 * @param {string} path
 * @returns {{ pattern: RegExp, paramNames: string[], specificity: number }}
 */
function compilePath(path) {
	/** @type {string[]} */
	const paramNames = [];
	let specificity = 0;

	// Escape special regex characters except our param syntax
	const regexString = path
		.split('/')
		.map((segment) => {
			if (!segment) return '';

			// Catch-all param: *slug
			if (segment.startsWith('*')) {
				const paramName = segment.slice(1);
				paramNames.push(paramName);
				specificity += 1; // Lowest specificity
				return '(.+)';
			}

			// Named param: :id
			if (segment.startsWith(':')) {
				const paramName = segment.slice(1);
				paramNames.push(paramName);
				specificity += 10; // Medium specificity
				return '([^/]+)';
			}

			// Static segment
			specificity += 100; // Highest specificity
			return escapeRegex(segment);
		})
		.join('/');

	const pattern = new RegExp(`^${regexString || '/'}$`);
	return { pattern, paramNames, specificity };
}

/**
 * Escape special regex characters
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a router from a list of routes
 * @param {Route[]} routes
 * @returns {{ match: (method: string, pathname: string) => RouteMatch | null }}
 */
export function createRouter(routes) {
	/** @type {CompiledRoute[]} */
	const compiledRoutes = routes.map((route) => {
		const { pattern, paramNames, specificity } = compilePath(route.path);
		return { route, pattern, paramNames, specificity };
	});

	// Sort by specificity (higher first) for correct matching order
	compiledRoutes.sort((a, b) => b.specificity - a.specificity);

	return {
		/**
		 * Match a request to a route
		 * @param {string} method
		 * @param {string} pathname
		 * @returns {RouteMatch | null}
		 */
		match(method, pathname) {
			for (const { route, pattern, paramNames } of compiledRoutes) {
				// Check method for ServerRoute
				if (route.type === 'server') {
					const methods = /** @type {ServerRoute} */ (route).methods;
					if (!methods.includes(method.toUpperCase())) {
						continue;
					}
				}

				const match = pathname.match(pattern);
				if (match) {
					/** @type {Record<string, string>} */
					const params = {};
					for (let i = 0; i < paramNames.length; i++) {
						params[paramNames[i]] = decodeURIComponent(match[i + 1]);
					}
					return { route, params };
				}
			}
			return null;
		},
	};
}
