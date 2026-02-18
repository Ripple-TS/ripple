import { createServer } from 'node:http';
import { Readable } from 'node:stream';

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
 * @returns {Request}
 */
function node_request_to_web_request(node_request, signal) {
	const forwarded_proto = normalize_forwarded_value(
		first_header_value(node_request.headers['x-forwarded-proto']),
	);
	const forwarded_host = normalize_forwarded_value(
		first_header_value(node_request.headers['x-forwarded-host']),
	);

	const proto = forwarded_proto ?? 'http';
	const host = forwarded_host ?? first_header_value(node_request.headers.host) ?? 'localhost';

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
 * @typedef {{
 * 	port?: number,
 * 	hostname?: string,
 * 	middleware?: ((
 * 		req: import('node:http').IncomingMessage,
 * 		res: import('node:http').ServerResponse,
 * 		next: (error?: any) => void
 * 	) => void) | null,
 * }} ServeOptions
 */

/**
 * @param {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: (error?: any) => void) => void} middleware
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {Promise<boolean>} true if response is handled (ended/headers sent)
 */
function run_middleware(middleware, req, res) {
	return new Promise((resolve, reject) => {
		if (res.writableEnded) return resolve(true);

		const done = (/** @type {Error} */ error) => {
			if (error) return reject(error);
			resolve(res.writableEnded || res.headersSent);
		};

		try {
			middleware(req, res, done);
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * @param {(request: Request, platform?: any) => Response | Promise<Response>} fetch_handler
 * @param {ServeOptions} [options]
 * @returns {{ listen: (port?: number) => import('node:http').Server, close: () => void }}
 */
export function serve(fetch_handler, options = {}) {
	const { port = 3000, hostname = 'localhost', middleware = null } = options;

	const server = createServer(async (node_request, node_response) => {
		const abort_controller = new AbortController();

		node_request.on('aborted', () => {
			abort_controller.abort();
		});
		node_response.on('close', () => {
			abort_controller.abort();
		});

		try {
			if (middleware) {
				const handled = await run_middleware(middleware, node_request, node_response);
				if (handled) return;
			}

			const request = node_request_to_web_request(node_request, abort_controller.signal);
			const response = await fetch_handler(request, { node_request, node_response });
			web_response_to_node_response(response, node_response, request.method);
		} catch {
			if (!node_response.headersSent) {
				node_response.statusCode = 500;
				node_response.setHeader('content-type', 'text/plain; charset=utf-8');
			}
			node_response.end('Internal Server Error');
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
