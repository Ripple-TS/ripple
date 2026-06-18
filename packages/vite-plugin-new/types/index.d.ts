import type { Plugin, BuildEnvironmentOptions, ViteDevServer } from 'vite';
import type { RuntimePrimitives } from '@ripple-ts/adapter';

// ============================================================================
// Plugin exports
// ============================================================================

export interface RipplePluginOptions {
	/** Override the client HMR default (on in serve mode, off for SSR). */
	hmr?: boolean;
}

/**
 * The ripple-new metaframework plugin. Returns an array:
 * `[rippleNew(), metaPlugin]` — the first compiles `.tsrx`, the second owns
 * config / routing / dev SSR / hydrate.
 */
export function ripple(options?: RipplePluginOptions): Plugin[];
export function defineConfig(options: RippleConfigOptions): RippleConfigOptions;
export function resolveRippleConfig(
	raw: RippleConfigOptions,
	options?: { requireAdapter?: boolean },
): ResolvedRippleConfig;
export function getRippleConfigPath(projectRoot: string): string;
export function rippleConfigExists(projectRoot: string): boolean;
export function loadRippleConfig(
	projectRoot: string,
	options?: { vite?: ViteDevServer; requireAdapter?: boolean },
): Promise<ResolvedRippleConfig>;

// ============================================================================
// Route classes
// ============================================================================

export class RenderRoute {
	readonly type: 'render';
	path: string;
	entry: RenderRouteEntry;
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
	/** Path to the component entry file, optionally with a preferred named export */
	entry: RenderRouteEntry;
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

export type Component<T = Record<string, any>> = (
	scope: any,
	props: T,
	extra?: any,
) => string | void;

export type RenderRouteEntry = string | readonly [exportName: string, path: string];

export interface RootBoundaryOptions {
	pending?: Component<Record<string, never>>;
	catch?: Component<{ error: unknown; reset: () => void }>;
}

export interface RippleConfigOptions {
	build?: {
		/** Output directory for the production build. @default 'dist' */
		outDir?: string;
		minify?: boolean;
		target?: BuildEnvironmentOptions['target'];
	};
	adapter?: {
		serve: AdapterServeFunction;
		/**
		 * Platform-specific runtime primitives provided by the adapter.
		 * Required for production builds; in development the plugin falls back
		 * to Node.js defaults if not provided.
		 */
		runtime: RuntimePrimitives;
	};
	router?: {
		routes: Route[];
	};
	/** Global root pending/catch UI used by client and SSR render roots */
	rootBoundary?: RootBoundaryOptions;
	/** Global middlewares applied to all routes */
	middlewares?: Middleware[];
	platform?: {
		env: Record<string, string>;
	};
	server?: {
		/**
		 * Trust `X-Forwarded-Proto` / `X-Forwarded-Host` when deriving the
		 * request origin. Enable only behind a trusted reverse proxy.
		 * @default false
		 */
		trustProxy?: boolean;
	};
}

/**
 * Resolved configuration with all defaults applied.
 */
export interface ResolvedRippleConfig {
	build: {
		/** @default 'dist' */
		outDir: string;
		minify?: boolean;
		target?: BuildEnvironmentOptions['target'];
	};
	adapter?: {
		serve: AdapterServeFunction;
		runtime: RuntimePrimitives;
	};
	router: {
		routes: Route[];
	};
	rootBoundary: RootBoundaryOptions;
	/** @default [] */
	middlewares: Middleware[];
	platform: {
		/** @default {} */
		env: Record<string, string>;
	};
	server: {
		/** @default false */
		trustProxy: boolean;
	};
}

export type AdapterServeFunction = (
	handler: (request: Request, platform?: unknown) => Response | Promise<Response>,
	options?: Record<string, unknown>,
) => { listen: (port?: number) => unknown; close: () => void };
