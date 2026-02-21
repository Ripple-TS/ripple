import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
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

// ============================================================================
// Runtime primitives — platform-specific capabilities for Ripple's server runtime
// ============================================================================

/**
 * Node.js runtime primitives for the Ripple adapter contract.
 *
 * Provides:
 * - `hash`: SHA-256 hex digest truncated to 8 chars (matches compiler output)
 * - `createAsyncContext`: AsyncLocalStorage-backed request-scoped context
 *
 * @type {import('@ripple-ts/adapter').RuntimePrimitives}
 */
export const runtime = {
	hash(str) {
		return createHash('sha256').update(str).digest('hex').slice(0, 8);
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
 * @param {string | string[] | undefined} value
 * @returns {string | undefined}
 */
function first_header_value(value) {
	if (value == null) return undefined;
	if (Array.isArray(value)) return value[0];
	return value;
}

/**
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
function normalize_forwarded_value(value) {
	if (!value) return undefined;
	return value.split(',')[0].trim();
}

/**
 * @param {import('node:http').IncomingMessage} node_request
 * @param {AbortSignal} signal
 * @param {boolean} [trust_proxy=false]
 * @returns {Request}
 */
function node_request_to_web_request(node_request, signal, trust_proxy = false) {
	let proto = 'http';
	let host = first_header_value(node_request.headers.host) ?? 'localhost';

	if (trust_proxy) {
		const forwarded_proto = normalize_forwarded_value(
			first_header_value(node_request.headers['x-forwarded-proto']),
		);
		const forwarded_host = normalize_forwarded_value(
			first_header_value(node_request.headers['x-forwarded-host']),
		);

		if (forwarded_proto) proto = forwarded_proto;
		if (forwarded_host) host = forwarded_host;
	} else {
		// Derive protocol from the socket when not trusting proxy headers
		if (/** @type {import('node:tls').TLSSocket} */ (node_request.socket).encrypted) {
			proto = 'https';
		}
	}

	const raw_url = node_request.url ?? '/';
	const base = `${proto}://${host}`;
	const url = raw_url === '*' ? new URL(base) : new URL(raw_url, base);

	const headers = new Headers();
	for (const [key, value] of Object.entries(node_request.headers)) {
		if (value == null) continue;
		if (Array.isArray(value)) {
			for (const v of value) headers.append(key, v);
		} else {
			headers.set(key, value);
		}
	}

	const method = (node_request.method ?? 'GET').toUpperCase();
	/** @type {RequestInit & { duplex?: 'half' }} */
	const request_init = { method, headers, signal };

	if (method !== 'GET' && method !== 'HEAD') {
		request_init.body = /** @type {any} */ (Readable.toWeb(node_request));
		request_init.duplex = 'half';
	}

	return new Request(url, request_init);
}

/**
 * @param {Response} web_response
 * @param {import('node:http').ServerResponse} node_response
 * @param {string} request_method
 * @returns {void}
 */
function web_response_to_node_response(web_response, node_response, request_method) {
	node_response.statusCode = web_response.status;
	if (web_response.statusText) {
		node_response.statusMessage = web_response.statusText;
	}

	const get_set_cookie = /** @type {any} */ (web_response.headers).getSetCookie;
	let set_cookie_set = false;
	if (typeof get_set_cookie === 'function') {
		const cookies = get_set_cookie.call(web_response.headers);
		if (cookies.length > 0) {
			node_response.setHeader('set-cookie', cookies);
			set_cookie_set = true;
		}
	}
	if (!set_cookie_set) {
		const cookie = web_response.headers.get('set-cookie');
		if (cookie) {
			node_response.setHeader('set-cookie', cookie);
		}
	}

	web_response.headers.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') return;
		node_response.setHeader(key, value);
	});

	if (request_method === 'HEAD' || web_response.body == null) {
		node_response.end();
		return;
	}

	const node_stream = Readable.fromWeb(/** @type {any} */ (web_response.body));
	node_stream.on('error', (error) => {
		node_response.destroy(error);
	});
	node_stream.pipe(node_response);
}

/**
 * @param {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: (error?: any) => void) => void} middleware
 * @param {import('node:http').IncomingMessage} node_request
 * @param {import('node:http').ServerResponse} node_response
 * @returns {Promise<void>}
 */
function run_node_middleware(middleware, node_request, node_response) {
	return new Promise((resolve, reject) => {
		if (node_response.writableEnded) {
			resolve(undefined);
			return;
		}

		const done = (/** @type {Error} */ error) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(undefined);
		};

		try {
			middleware(node_request, node_response, done);
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * @type {typeof import('@ripple-ts/adapter-node').serve}
 */
export function serve(fetch_handler, options = {}) {
	const {
		port = DEFAULT_PORT,
		hostname = DEFAULT_HOSTNAME,
		middleware = null,
		static: static_options = {},
		trustProxy: trust_proxy = false,
	} = options;

	/** @type {ReturnType<typeof serveStatic> | null} */
	let static_middleware = null;
	if (static_options !== false) {
		const { dir = '.', ...static_handler_options } = static_options;
		static_middleware = serveStatic(dir, static_handler_options);
	}

	const server = createServer(async (node_request, node_response) => {
		const abort_controller = new AbortController();

		node_request.on('aborted', () => {
			abort_controller.abort();
		});
		node_response.on('close', () => {
			abort_controller.abort();
		});

		try {
			const run_fetch_handler = async () => {
				const request = node_request_to_web_request(
					node_request,
					abort_controller.signal,
					trust_proxy,
				);
				return await fetch_handler(request, { node_request, node_response });
			};

			let response;
			if (static_middleware !== null || middleware !== null) {
				response = await run_next_middleware(
					async (request, middleware_response, next) => {
						if (static_middleware !== null) {
							await run_node_middleware(static_middleware, request, middleware_response);
							if (middleware_response.writableEnded || middleware_response.headersSent) {
								return new Response(null, { status: 204 });
							}
						}

						if (middleware !== null) {
							await run_node_middleware(middleware, request, middleware_response);
							if (middleware_response.writableEnded || middleware_response.headersSent) {
								return new Response(null, { status: 204 });
							}
						}

						return await next();
					},
					node_request,
					node_response,
					run_fetch_handler,
				);
			} else {
				response = await run_fetch_handler();
			}

			if (node_response.writableEnded || node_response.headersSent) {
				return;
			}

			web_response_to_node_response(
				response,
				node_response,
				(node_request.method ?? 'GET').toUpperCase(),
			);
		} catch {
			if (node_response.headersSent) {
				node_response.end();
				return;
			}

			web_response_to_node_response(
				internal_server_error_response(),
				node_response,
				(node_request.method ?? 'GET').toUpperCase(),
			);
		}
	});

	return {
		listen(listen_port = port) {
			server.listen(listen_port, hostname);
			return server;
		},
		close() {
			server.close();
		},
	};
}

/**
 * @param {string} base_dir
 * @param {string} pathname
 * @returns {string | null}
 */
function resolve_static_file_path(base_dir, pathname) {
	const file_path = resolve(base_dir, `.${pathname}`);
	const is_within_base_dir = file_path === base_dir || file_path.startsWith(base_dir + sep);
	return is_within_base_dir ? file_path : null;
}

/**
 * Create a request-based static file handler.
 *
 * @param {string} dir - Directory to serve files from (relative to cwd or absolute)
 * @param {{ prefix?: string, maxAge?: number, immutable?: boolean }} [options]
 * @returns {(request: Request) => Response | null}
 */
function create_static_handler(dir, options = {}) {
	const {
		prefix = DEFAULT_STATIC_PREFIX,
		maxAge = DEFAULT_STATIC_MAX_AGE,
		immutable = false,
	} = options;

	const base_dir = resolve(dir);

	return function serve_static_request(request) {
		const request_method = (request.method || 'GET').toUpperCase();
		if (request_method !== 'GET' && request_method !== 'HEAD') {
			return null;
		}

		let pathname;
		try {
			pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
		} catch {
			return null;
		}

		if (!pathname.startsWith(prefix)) {
			return null;
		}

		pathname = pathname.slice(prefix.length) || '/';
		if (!pathname.startsWith('/')) {
			pathname = '/' + pathname;
		}

		const file_path = resolve_static_file_path(base_dir, pathname);
		if (file_path === null || !existsSync(file_path)) {
			return null;
		}

		let file_stats;
		try {
			file_stats = statSync(file_path);
		} catch {
			return null;
		}

		if (file_stats.isDirectory()) {
			return null;
		}

		const headers = new Headers();
		headers.set('Content-Type', get_mime_type(file_path));
		headers.set('Content-Length', String(file_stats.size));
		headers.set('Cache-Control', get_static_cache_control(pathname, maxAge, immutable));

		if (request_method === 'HEAD') {
			return new Response(null, { status: 200, headers });
		}

		/** @type {BodyInit} */
		const file_body = /** @type {any} */ (Readable.toWeb(createReadStream(file_path)));
		return new Response(file_body, { status: 200, headers });
	};
}

/**
 * Create a middleware that serves static files from a directory
 *
 * @param {string} dir - Directory to serve files from (relative to cwd or absolute)
 * @param {import('@ripple-ts/adapter').ServeStaticOptions} [options]
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: (error?: any) => void) => void}
 */
export function serveStatic(dir, options = {}) {
	const serve_static_request = create_static_handler(dir, options);

	return function staticMiddleware(req, res, next) {
		try {
			const request_method = (req.method ?? 'GET').toUpperCase();
			if (request_method !== 'GET' && request_method !== 'HEAD') {
				next();
				return;
			}

			const request = node_request_to_web_request(req, new AbortController().signal);
			const response = serve_static_request(request);
			if (response === null) {
				next();
				return;
			}

			web_response_to_node_response(response, res, request.method);
		} catch {
			next();
		}
	};
}
