export type FetchHandler<Platform = any, ResultValue = Response> = (
	request: Request,
	platform?: Platform,
) => ResultValue | Promise<ResultValue>;

// Re-export runtime primitive types from rpc module for adapter authors
export type { RuntimePrimitives, AsyncContext } from './rpc.js';

export type AdapterCoreOptions = {
	port?: number;
	hostname?: string;
	/**
	 * Whether to trust `X-Forwarded-Proto` and `X-Forwarded-Host` headers
	 * when deriving the request origin (protocol + host).
	 *
	 * Enable this only when the application is behind a trusted reverse proxy
	 * (e.g., nginx, Cloudflare, AWS ALB). When `false` (the default), the
	 * protocol is inferred from the socket and the host from the `Host` header.
	 *
	 * @default false
	 */
	trustProxy?: boolean;
};

export type ServeStaticOptions = {
	prefix?: string;
	maxAge?: number;
	immutable?: boolean;
};

export type ServeStaticDirectoryOptions = ServeStaticOptions & {
	dir?: string;
};

export type NextMiddleware<RequestValue = Request, Server = any, ResultValue = Response> = (
	request: RequestValue,
	server: Server,
	next: () => Promise<ResultValue>,
) => ResultValue | Promise<ResultValue> | void;

export type ServeResult<Server = any> = {
	listen: (port?: number) => Server;
	close: () => void;
};

export type ServeFunction<
	Platform = any,
	Options extends AdapterCoreOptions = AdapterCoreOptions,
	Server = any,
> = (fetch_handler: FetchHandler<Platform>, options?: Options) => ServeResult<Server>;

export const DEFAULT_HOSTNAME: 'localhost';
export const DEFAULT_PORT: 3000;
export const DEFAULT_STATIC_PREFIX: '/';
export const DEFAULT_STATIC_MAX_AGE: 86400;
export const MIME_TYPES: Readonly<Record<string, string>>;

export function internal_server_error_response(): Response;

export function run_next_middleware<RequestValue, Server, ResultValue = Response>(
	middleware: NextMiddleware<RequestValue, Server, ResultValue>,
	request: RequestValue,
	server: Server,
	next_handler: () => Promise<ResultValue>,
): Promise<ResultValue>;

export function is_hashed_asset(pathname: string): boolean;

export function get_static_cache_control(
	pathname: string,
	max_age?: number,
	immutable?: boolean,
): string;

export function get_mime_type(pathname: string): string;
