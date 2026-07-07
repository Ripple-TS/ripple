import type { RuntimePrimitives } from '@ripple-ts/adapter';
import type {
	Route,
	Middleware,
	ResolvedRippleConfig,
	RippleConfigOptions,
	RootBoundaryOptions,
} from '@ripple-ts/vite-plugin';

export function resolveRippleConfig(
	raw: RippleConfigOptions,
	options?: { requireAdapter?: boolean },
): ResolvedRippleConfig;

export interface ClientAssetEntry {
	/** Path to the built JS file (relative to client output dir) */
	js: string;
	/** Paths to the built CSS files (relative to client output dir) */
	css: string[];
}

export interface ServerManifest {
	routes: Route[];
	components: Record<string, Function>;
	layouts: Record<string, Function>;
	middlewares: Middleware[];
	/** Map of entry path → _$_server_$_ object for RPC support */
	rpcModules?: Record<string, Record<string, Function>>;
	/** Trust X-Forwarded-* headers when deriving origin for RPC fetch */
	trustProxy?: boolean;
	rootBoundary?: RootBoundaryOptions;
	/** Stream render-route responses (progressive SSR of async boundaries) */
	streaming?: boolean;
	/** Platform-specific runtime primitives from the adapter */
	runtime: RuntimePrimitives;
	/**
	 * Map of route entry paths to their built client asset paths.
	 * Used to emit `<link rel="stylesheet">` and `<link rel="modulepreload">`
	 * tags in the production HTML. Populated from Vite's client manifest
	 * during the build. The special key `__hydrate_js` holds the hydrate
	 * runtime entry.
	 */
	clientAssets?: Record<string, ClientAssetEntry>;
}

export interface RenderResult {
	head: string;
	body: string;
	css: Set<string>;
}

export interface StreamTemplate {
	before: string;
	between: string;
	after: string;
}

export interface StreamSink {
	push(chunk: string): void;
	close(): void;
	error(reason: unknown): void;
}

/**
 * Overloaded like ripple/server's `render`: without a `stream` sink it
 * resolves to the buffered {@link RenderResult}, with one it streams into the
 * sink and resolves to the stream handle.
 */
export interface RenderFunction {
	(
		component: Function,
		options?: {
			rootBoundary?: RootBoundaryOptions;
			stream?: undefined;
			streamTemplate?: StreamTemplate;
		},
	): Promise<RenderResult>;
	(
		component: Function,
		options: {
			rootBoundary?: RootBoundaryOptions;
			stream: StreamSink;
			streamTemplate?: StreamTemplate;
		},
	): Promise<{ stream: StreamSink }>;
}

export interface HandlerOptions {
	render: RenderFunction;
	getCss: (css: Set<string>) => string;
	htmlTemplate: string;
	executeServerFunction: (fn: Function, body: string) => Promise<string>;
	/** `create_ssr_stream` from 'ripple/server' — required when streaming is enabled */
	createSsrStream?: () => {
		stream: ReadableStream<Uint8Array>;
		sink: StreamSink;
	};
}

export function createHandler(
	manifest: ServerManifest,
	options: HandlerOptions,
): (request: Request) => Promise<Response>;
