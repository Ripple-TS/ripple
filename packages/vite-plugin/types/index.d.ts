import type { Plugin } from 'vite';

declare module '@ripple-ts/vite-plugin' {
	// ============================================================================
	// Plugin exports
	// ============================================================================

	export function ripple(options?: RipplePluginOptions): Plugin[];
	export function defineConfig(options: RippleConfigOptions): RippleConfigOptions;

	// ============================================================================
	// Route classes
	// ============================================================================

	export class RenderRoute {
		readonly type: 'render';
		path: string;
		entry: string;
		layout?: string;
		before: Middleware[];
		constructor(options: RenderRouteOptions);
	}

	export class ServerRoute {
		readonly type: 'server';
		path: string;
		methods: string[];
		handler: RouteHandler;
		before: Middleware[];
		after: Middleware[];
		constructor(options: ServerRouteOptions);
	}

	export type Route = RenderRoute | ServerRoute;

	// ============================================================================
	// Route options
	// ============================================================================

	export interface RenderRouteOptions {
		/** URL path pattern (e.g., '/', '/posts/:id', '/docs/*slug') */
		path: string;
		/** Path to the Ripple component entry file */
		entry: string;
		/** Path to the layout component (wraps the entry) */
		layout?: string;
		/** Middleware to run before rendering */
		before?: Middleware[];
	}

	export interface ServerRouteOptions {
		/** URL path pattern (e.g., '/api/hello', '/api/posts/:id') */
		path: string;
		/** HTTP methods to handle (default: ['GET']) */
		methods?: string[];
		/** Request handler that returns a Response */
		handler: RouteHandler;
		/** Middleware to run before the handler */
		before?: Middleware[];
		/** Middleware to run after the handler */
		after?: Middleware[];
	}

	// ============================================================================
	// Context and middleware
	// ============================================================================

	export interface Context {
		/** The incoming Request object */
		request: Request;
		/** URL parameters extracted from the route pattern */
		params: Record<string, string>;
		/** Parsed URL object */
		url: URL;
		/** Shared state for passing data between middlewares */
		state: Map<string, unknown>;
	}

	export type NextFunction = () => Promise<Response>;
	export type Middleware = (context: Context, next: NextFunction) => Response | Promise<Response>;
	export type RouteHandler = (context: Context) => Response | Promise<Response>;

	// ============================================================================
	// Configuration
	// ============================================================================

	export interface RipplePluginOptions {
		excludeRippleExternalModules?: boolean;
	}

	export interface RippleConfigOptions {
		build?: {
			minify?: boolean;
		};
		adapter?: {
			serve: AdapterServeFunction;
		};
		router: {
			routes: Route[];
		};
		/** Global middlewares applied to all routes */
		middlewares?: Middleware[];
		platform?: {
			env: Record<string, string>;
		};
		server?: {
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
	}

	export type AdapterServeFunction = (
		handler: (request: Request, platform?: unknown) => Response | Promise<Response>,
		options?: Record<string, unknown>,
	) => { listen: (port?: number) => unknown; close: () => void };
}
