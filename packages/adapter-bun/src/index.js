/** @typedef {typeof import('bun')} Bun */
/** @typedef {Bun.Server<undefined>} Server */

/**
 * @returns {Response}
 */
function internal_server_error_response() {
	return new Response('Internal Server Error', {
		status: 500,
		headers: {
			'content-type': 'text/plain; charset=utf-8',
		},
	});
}

/**
 * @param {(request: Request, server: Server, next: () => Promise<Response>) => Response | Promise<Response> | void} middleware
 * @param {Request} request
 * @param {Server} server
 * @param {() => Promise<Response>} next_handler
 * @returns {Promise<Response>}
 */
async function run_middleware(middleware, request, server, next_handler) {
	/** @type {Promise<Response> | null} */
	let next_promise = null;

	const next = () => {
		if (next_promise === null) {
			next_promise = Promise.resolve().then(next_handler);
		}
		return next_promise;
	};

	const middleware_result = await middleware(request, server, next);
	if (middleware_result instanceof Response) {
		return middleware_result;
	}
	if (next_promise !== null) {
		return next_promise;
	}
	return await next_handler();
}

/**
 * @typedef {{
 * 	port?: number,
 * 	hostname?: string,
 * 	middleware?: ((
 * 		request: Request,
 * 		server: Server,
 * 		next: () => Promise<Response>
 * 	) => Response | Promise<Response> | void) | null,
 * }} ServeOptions
 */

/**
 * @param {(request: Request, platform?: any) => Response | Promise<Response>} fetch_handler
 * @param {ServeOptions} [options]
 * @returns {{ listen: (port?: number) => Server, close: () => void }}
 */
export function serve(fetch_handler, options = {}) {
	const { port = 3000, hostname = 'localhost', middleware = null } = options;

	/** @type {Server | null} */
	let bun_server = null;

	return {
		listen(listen_port = port) {
			/** @type {typeof import('bun')} */
			const bun = globalThis.Bun;
			if (bun == null || typeof bun.serve !== 'function') {
				throw new Error('@ripple-ts/adapter-bun requires Bun runtime');
			}

			bun_server = bun.serve({
				port: listen_port,
				hostname,
				async fetch(request, server) {
					const platform = { bun_server: server };
					try {
						if (middleware) {
							return await run_middleware(middleware, request, server, async () => {
								return await fetch_handler(request, platform);
							});
						}

						return await fetch_handler(request, platform);
					} catch {
						return internal_server_error_response();
					}
				},
			});

			return bun_server;
		},
		close() {
			if (bun_server && typeof bun_server.stop === 'function') {
				bun_server.stop();
			}
		},
	};
}
