/**
 * @typedef {import('@ripple-ts/vite-plugin').Context} Context
 * @typedef {import('@ripple-ts/vite-plugin').Middleware} Middleware
 * @typedef {import('@ripple-ts/vite-plugin').NextFunction} NextFunction
 */

/**
 * Compose multiple middlewares into a single middleware
 * Follows Koa-style execution: request flows down, response flows back up
 *
 * @param {Middleware[]} middlewares
 * @returns {(context: Context, finalHandler: () => Promise<Response>) => Promise<Response>}
 */
export function compose(middlewares) {
	return function composed(context, finalHandler) {
		let index = -1;

		/**
		 * @param {number} i
		 * @returns {Promise<Response>}
		 */
		function dispatch(i) {
			if (i <= index) {
				return Promise.reject(new Error('next() called multiple times'));
			}
			index = i;

			/** @type {Middleware | (() => Promise<Response>) | undefined} */
			let fn;

			if (i < middlewares.length) {
				fn = middlewares[i];
			} else if (i === middlewares.length) {
				fn = finalHandler;
			}

			if (!fn) {
				return Promise.reject(new Error('No handler provided'));
			}

			try {
				// For the final handler, we don't pass next
				if (i === middlewares.length) {
					return Promise.resolve(/** @type {() => Promise<Response>} */ (fn)());
				}
				// For middlewares, pass context and next
				return Promise.resolve(/** @type {Middleware} */ (fn)(context, () => dispatch(i + 1)));
			} catch (err) {
				return Promise.reject(err);
			}
		}

		return dispatch(0);
	};
}

/**
 * Create a context object for the request
 * @param {Request} request
 * @param {Record<string, string>} params
 * @returns {Context}
 */
export function createContext(request, params) {
	return {
		request,
		params,
		url: new URL(request.url),
		state: new Map(),
	};
}

/**
 * Run middlewares with a final handler
 * Combines global middlewares, route-level before/after, and the handler
 *
 * @param {Context} context
 * @param {Middleware[]} globalMiddlewares
 * @param {Middleware[]} beforeMiddlewares
 * @param {() => Promise<Response>} handler
 * @param {Middleware[]} afterMiddlewares
 * @returns {Promise<Response>}
 */
export async function runMiddlewareChain(
	context,
	globalMiddlewares,
	beforeMiddlewares,
	handler,
	afterMiddlewares = [],
) {
	// Combine global + before middlewares
	const allMiddlewares = [...globalMiddlewares, ...beforeMiddlewares];

	// If there are after middlewares, wrap the handler to run them
	const wrappedHandler =
		afterMiddlewares.length > 0
			? async () => {
					const response = await handler();
					// After middlewares can inspect/modify the response
					// but have limited ability to change it in our model
					// We run them for side-effects (logging, etc.)
					return runAfterMiddlewares(context, afterMiddlewares, response);
				}
			: handler;

	const composed = compose(allMiddlewares);
	return composed(context, wrappedHandler);
}

/**
 * Run after middlewares with the response
 * After middlewares run in order and can intercept/modify the response
 *
 * @param {Context} context
 * @param {Middleware[]} middlewares
 * @param {Response} response
 * @returns {Promise<Response>}
 */
async function runAfterMiddlewares(context, middlewares, response) {
	let currentResponse = response;

	for (const middleware of middlewares) {
		currentResponse = await middleware(context, async () => currentResponse);
	}

	return currentResponse;
}
