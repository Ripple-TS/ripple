// NOTE: For now we'd not have it fully runtime-agnostic
// When we'd like to move away from Node.js modules or explore other runtime options.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';

export const DEFAULT_HOSTNAME = 'localhost';
export const DEFAULT_PORT = 3000;
export const DEFAULT_STATIC_PREFIX = '/';
export const DEFAULT_STATIC_MAX_AGE = 86400;

/**
 * Common MIME types for static files
 * @type {Readonly<Record<string, string>>}
 */
export const MIME_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject',
	'.otf': 'font/otf',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.pdf': 'application/pdf',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml',
	'.wasm': 'application/wasm',
};

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

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function is_hashed_asset(pathname) {
	return pathname.includes('.') && /[a-f0-9]{8,}/.test(pathname);
}

/**
 * @param {string} pathname
 * @param {number} [max_age]
 * @param {boolean} [immutable]
 * @returns {string}
 */
export function get_static_cache_control(
	pathname,
	max_age = DEFAULT_STATIC_MAX_AGE,
	immutable = false,
) {
	if (immutable || is_hashed_asset(pathname)) {
		return 'public, max-age=31536000, immutable';
	}

	return `public, max-age=${max_age}`;
}

/**
 * @param {string} pathname
 * @returns {string}
 */
export function get_mime_type(pathname) {
	const extension = extname(pathname).toLowerCase();
	return MIME_TYPES[extension] || 'application/octet-stream';
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
 * Create a request-based static file handler that can be used by adapters.
 *
 * @param {string} dir - Directory to serve files from (relative to cwd or absolute)
 * @param {{ prefix?: string, maxAge?: number, immutable?: boolean }} [options]
 * @returns {(request: Request) => Response | null}
 */
export function serveStatic(dir, options = {}) {
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

		// `Readable.toWeb()` can be typed differently across Node/Bun/libdom contexts.
		/** @type {BodyInit} */
		const file_body = /** @type {any} */ (Readable.toWeb(createReadStream(file_path)));
		return new Response(file_body, { status: 200, headers });
	};
}
