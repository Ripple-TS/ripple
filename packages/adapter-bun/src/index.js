/** @typedef {typeof import('bun')} Bun */
/** @typedef {Bun.Server<undefined>} Server */

import {
	DEFAULT_HOSTNAME,
	DEFAULT_PORT,
	internal_server_error_response,
	run_next_middleware,
	serveStatic as create_static_handler,
} from '@ripple-ts/adapter';

/** @typedef {import('@ripple-ts/adapter').ServeStaticDirectoryOptions} StaticServeOptions */

/**
 * @typedef {{
 * 	port?: number,
 * 	hostname?: string,
 * 	middleware?: ((
 * 		request: Request,
 * 		server: Server,
 * 		next: () => Promise<Response>
 * 	) => Response | Promise<Response> | void) | null,
 * 	static?: StaticServeOptions | false,
 * }} ServeOptions
 */

/**
 * @param {(request: Request, platform?: any) => Response | Promise<Response>} fetch_handler
 * @param {ServeOptions} [options]
 * @returns {{ listen: (port?: number) => Server, close: () => void }}
 */
export function serve(fetch_handler, options = {}) {
	const {
		port = DEFAULT_PORT,
		hostname = DEFAULT_HOSTNAME,
		middleware = null,
		static: static_options = {},
	} = options;

	/** @type {ReturnType<typeof serveStatic> | null} */
	let static_middleware = null;
	if (static_options !== false) {
		const { dir = 'public', ...static_handler_options } = static_options;
		static_middleware = serveStatic(dir, static_handler_options);
	}

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
						const run_fetch_handler = async () => {
							return await fetch_handler(request, platform);
						};

						const run_app_middleware = async () => {
							if (middleware !== null) {
								return await run_next_middleware(middleware, request, server, run_fetch_handler);
							}

							return await run_fetch_handler();
						};

						if (static_middleware !== null) {
							return await run_next_middleware(static_middleware, request, server, async () => {
								return await run_app_middleware();
							});
						}

						return await run_app_middleware();
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

/**
 * Create a Bun middleware that serves static files from a directory
 *
 * @param {string} dir - Directory to serve files from (relative to cwd or absolute)
 * @param {import('@ripple-ts/adapter').ServeStaticOptions} [options]
 * @returns {(request: Request, server: Server, next: () => Promise<Response>) => Promise<Response>}
 */
export function serveStatic(dir, options = {}) {
	const serve_static_request = create_static_handler(dir, options);

	return async function static_middleware(request, server, next) {
		void server;

		const response = serve_static_request(request);
		if (response !== null) {
			return response;
		}

		return await next();
	};
}
