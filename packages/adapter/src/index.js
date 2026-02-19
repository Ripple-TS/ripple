export const DEFAULT_HOSTNAME = 'localhost';
export const DEFAULT_PORT = 3000;

/**
 * @returns {Response}
 */
export function internal_server_error_response() {
	return new Response('Internal Server Error', {
		status: 500,
		headers: {
			'content-type': 'text/plain; charset=utf-8',
		},
	});
}

/**
 * @template RequestValue
 * @template Server
 * @template ResultValue
 * @param {(request: RequestValue, server: Server, next: () => Promise<ResultValue>) => ResultValue | Promise<ResultValue> | void} middleware
 * @param {RequestValue} request
 * @param {Server} server
 * @param {() => Promise<ResultValue>} next_handler
 * @returns {Promise<ResultValue>}
 */
export async function run_next_middleware(middleware, request, server, next_handler) {
	/** @type {Promise<ResultValue> | null} */
	let next_promise = null;

	const next = () => {
		if (next_promise === null) {
			next_promise = Promise.resolve().then(next_handler);
		}
		return next_promise;
	};

	const middleware_result = await middleware(request, server, next);
	if (middleware_result !== undefined) {
		return /** @type {ResultValue} */ (middleware_result);
	}
	if (next_promise !== null) {
		return next_promise;
	}
	return await next_handler();
}
