/** @typedef {typeof import('bun')} Bun */
/** @typedef {Bun.Server<undefined>} Server */
import {
	DEFAULT_HOSTNAME,
	DEFAULT_PORT,
	internal_server_error_response,
	run_next_middleware,
} from '@ripple-ts/adapter';
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
	const { port = DEFAULT_PORT, hostname = DEFAULT_HOSTNAME, middleware = null } = options;

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
							return await run_next_middleware(middleware, request, server, async () => {
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
