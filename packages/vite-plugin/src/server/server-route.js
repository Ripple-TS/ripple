/**
 * @typedef {import('@ripple-ts/vite-plugin').Context} Context
 * @typedef {import('@ripple-ts/vite-plugin').ServerRoute} ServerRoute
 * @typedef {import('@ripple-ts/vite-plugin').Middleware} Middleware
 */

import { runMiddlewareChain } from './middleware.js';

/**
 * Handle a ServerRoute (API endpoint)
 *
 * @param {ServerRoute} route
 * @param {Context} context
 * @param {Middleware[]} globalMiddlewares
 * @returns {Promise<Response>}
 */
export async function handleServerRoute(route, context, globalMiddlewares) {
	try {
		// The handler wrapped as a function returning Promise<Response>
		const handler = async () => {
			return route.handler(context);
		};

		// Run the middleware chain: global → before → handler → after
		const response = await runMiddlewareChain(
			context,
			globalMiddlewares,
			route.before,
			handler,
			route.after,
		);

		return response;
	} catch (error) {
		console.error('[ripple] API route error:', error);

		// Return error response
		const message = error instanceof Error ? error.message : 'Internal Server Error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}
