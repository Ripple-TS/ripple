/** @typedef {typeof import('bun')} Bun */
/** @typedef {Bun.Server<undefined>} Server */

import {
	DEFAULT_HOSTNAME,
	DEFAULT_PORT,
	DEFAULT_STATIC_PREFIX,
	DEFAULT_STATIC_MAX_AGE,
	get_mime_type,
	get_static_cache_control,
	internal_server_error_response,
	run_next_middleware,
} from '@ripple-ts/adapter';
import { AsyncLocalStorage } from 'node:async_hooks';
import { resolve, sep } from 'node:path';

/** @typedef {import('@ripple-ts/adapter').ServeStaticDirectoryOptions} StaticServeOptions */

// ============================================================================
// Runtime primitives — platform-specific capabilities for Ripple's server runtime
// ============================================================================

/**
 * Bun runtime primitives for the Ripple adapter contract.
 *
 * Provides:
 * - `hash`: SHA-256 hex digest truncated to 8 chars via Bun.CryptoHasher
 * - `createAsyncContext`: AsyncLocalStorage-backed request-scoped context
 *
 * @type {import('@ripple-ts/adapter').RuntimePrimitives}
 */
export const runtime = {
	hash(str) {
		const hasher = new globalThis.Bun.CryptoHasher('sha256');
		hasher.update(str);
		return hasher.digest('hex').slice(0, 8);
	},
	createAsyncContext() {
		const als = new AsyncLocalStorage();
		return {
			run: (store, fn) => als.run(store, fn),
			getStore: () => als.getStore(),
		};
	},
};

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
		const { dir = '.', ...static_handler_options } = static_options;
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
	const {
		prefix = DEFAULT_STATIC_PREFIX,
		maxAge = DEFAULT_STATIC_MAX_AGE,
		immutable = false,
	} = options;

	const base_dir = resolve(dir);

	return async function static_middleware(request, server, next) {
		void server;

		const request_method = (request.method || 'GET').toUpperCase();
		if (request_method !== 'GET' && request_method !== 'HEAD') {
			return await next();
		}

		let pathname;
		try {
			pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
		} catch {
			return await next();
		}

		if (!pathname.startsWith(prefix)) {
			return await next();
		}

		pathname = pathname.slice(prefix.length) || '/';
		if (!pathname.startsWith('/')) {
			pathname = '/' + pathname;
		}

		const file_path = resolve(base_dir, `.${pathname}`);
		const is_within_base_dir = file_path === base_dir || file_path.startsWith(base_dir + sep);
		if (!is_within_base_dir) {
			return await next();
		}

		const bun_file = globalThis.Bun.file(file_path);
		if (!(await bun_file.exists())) {
			return await next();
		}

		// Bun.file().size is 0 for directories; skip them
		if (bun_file.size === 0) {
			return await next();
		}

		const headers = new Headers();
		headers.set('Content-Type', get_mime_type(file_path));
		headers.set('Content-Length', String(bun_file.size));
		headers.set('Cache-Control', get_static_cache_control(pathname, maxAge, immutable));

		if (request_method === 'HEAD') {
			return new Response(null, { status: 200, headers });
		}

		return new Response(bun_file, { status: 200, headers });
	};
}
