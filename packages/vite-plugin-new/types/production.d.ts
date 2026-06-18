import type { RuntimePrimitives } from '@ripple-ts/adapter';
import type {
	Route,
	Middleware,
	ResolvedRippleConfig,
	RippleConfigOptions,
	RootBoundaryOptions,
} from '@ripple-ts/vite-plugin-new';

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
	/** Platform-specific runtime primitives from the adapter */
	runtime: RuntimePrimitives;
	/** Map of route entry paths to built client asset paths (preload tags). */
	clientAssets?: Record<string, ClientAssetEntry>;
}

/**
 * ripple-new RenderResult — `render()` is async; `css` is ALREADY a ready,
 * deduped `<style data-ripple-new="hash">…</style>` string (NOT a Set<string>
 * needing a `getCss` lookup like Ripple).
 */
export interface RenderResult {
	head: string;
	body: string;
	css: string;
}

export interface HandlerOptions {
	render: (component: Function, props?: unknown) => Promise<RenderResult>;
	htmlTemplate: string;
	executeServerFunction: (fn: Function, body: string) => Promise<string>;
}

/** Production fetch-handler factory. PHASE 2. */
export function createHandler(
	manifest: ServerManifest,
	options: HandlerOptions,
): (request: Request) => Promise<Response>;
