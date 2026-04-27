import type { Plugin, BuildEnvironmentOptions, ViteDevServer } from 'vite';
import type { RuntimePrimitives } from '@ripple-ts/adapter';

// ============================================================================
// Plugin exports
// ============================================================================

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

export interface CompatFactoryConfig {
	/** Module specifier that exports the compat factory */
	from: string;
	/** Named export to call. Omit to use the module's default export. */
	factory?: string;
}

export interface CompatFactory<T = unknown> {
	(): T;
	__ripple_compat__: CompatFactoryConfig;
}

export interface CompatEntryValue {
	__ripple_compat__: CompatFactoryConfig;
}

export type CompatConfigEntry = CompatFactoryConfig | CompatFactory | CompatEntryValue;

export type CompatConfig = Record<string, CompatConfigEntry>;

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
		 *
		 * These allow the server runtime to operate without depending
		 * on Node.js-specific APIs like `node:crypto` or `node:async_hooks`.
		 *
		 * Required for production builds. In development, the vite plugin
		 * falls back to Node.js defaults if not provided.
		 */
		runtime: RuntimePrimitives;
	};
	router?: {
		routes: Route[];
	};
	/** Global middlewares applied to all routes */
	middlewares?: Middleware[];
	/**
	 * Client-side TSX compat integrations keyed by kind, e.g. `react` for `<tsx:react>`.
	 *
	 * You can either pass a descriptor object or import a compat factory directly,
	 * as long as that factory export carries Ripple compat metadata.
	 *
	 * These are compiled into a browser-side compat registry by the Vite plugin,
	 * allowing `mount()` / `hydrate()` to pick them up automatically.
	 */
	compat?: CompatConfig;
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

/**
 * Resolved configuration with all defaults applied.
 * Returned by `resolveRippleConfig` and `loadRippleConfig`.
 * Consumers should use this type instead of applying ad-hoc defaults.
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
	/** @default [] */
	middlewares: Middleware[];
	/** @default {} */
	compat: Record<string, CompatFactoryConfig>;
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
