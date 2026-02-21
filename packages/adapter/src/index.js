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
	const dot = pathname.lastIndexOf('.');
	const extension = dot !== -1 ? pathname.slice(dot).toLowerCase() : '';
	return MIME_TYPES[extension] || 'application/octet-stream';
}
