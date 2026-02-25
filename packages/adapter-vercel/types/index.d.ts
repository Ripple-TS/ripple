import type {
	AdapterCoreOptions,
	NextMiddleware,
	RuntimePrimitives,
	ServeFunction,
	ServeStaticOptions as BaseServeStaticOptions,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
} from '@ripple-ts/adapter';

// ============================================================================
// Re-exports from adapter-node (Vercel serverless runs on Node.js)
// ============================================================================

/**
 * Node.js runtime primitives: SHA-256 hashing and AsyncLocalStorage.
 * Re-exported from @ripple-ts/adapter-node.
 */
export const runtime: RuntimePrimitives;

/**
 * Node.js HTTP server for local development and preview.
 * Re-exported from @ripple-ts/adapter-node.
 */
export const serve: ServeFunction<
	{
		node_request: import('node:http').IncomingMessage;
		node_response: import('node:http').ServerResponse;
	},
	import('@ripple-ts/adapter-node').ServeOptions,
	import('node:http').Server
>;

// ============================================================================
// Vercel Build Output API v3 types
// ============================================================================

/**
 * Serverless function configuration for Vercel.
 */
export interface ServerlessConfig {
	/**
	 * Node.js runtime version for the serverless function.
	 * @default Auto-detected from the build environment
	 */
	runtime?: string;

	/**
	 * Regions to deploy the serverless function to.
	 * @see https://vercel.com/docs/concepts/edge-network/regions
	 */
	regions?: string[];

	/**
	 * Maximum execution duration (in seconds) for the serverless function.
	 */
	maxDuration?: number;

	/**
	 * Memory (in MB) allocated to the serverless function.
	 */
	memory?: number;
}

/**
 * Incremental Static Regeneration configuration.
 */
export interface ISRConfig {
	/**
	 * Expiration time (in seconds) before the cached asset is re-generated.
	 * Set to `false` for never-expiring ISR.
	 */
	expiration: number | false;

	/**
	 * Token that can bypass the cache via `__prerender_bypass=<token>` cookie
	 * or `x-prerender-revalidate: <token>` header.
	 */
	bypassToken?: string;

	/**
	 * Query string parameters to include in the cache key.
	 * Empty array means query values are ignored.
	 * Undefined means each unique query is cached independently.
	 */
	allowQuery?: string[];
}

/**
 * Vercel Image Optimization configuration.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#images
 */
export interface ImagesConfig {
	sizes: number[];
	domains: string[];
	remotePatterns?: RemotePattern[];
	minimumCacheTTL?: number;
	formats?: ImageFormat[];
	dangerouslyAllowSVG?: boolean;
	contentSecurityPolicy?: string;
	contentDispositionType?: string;
}

export type ImageFormat = 'image/avif' | 'image/webp';

export interface RemotePattern {
	protocol?: 'http' | 'https';
	hostname: string;
	port?: string;
	pathname?: string;
}

/**
 * Custom header definition for Vercel config.
 */
export interface VercelHeader {
	source: string;
	headers: Array<{ key: string; value: string }>;
}

/**
 * Custom redirect definition for Vercel config.
 */
export interface VercelRedirect {
	source: string;
	destination: string;
	permanent?: boolean;
}

/**
 * Custom rewrite definition for Vercel config.
 */
export interface VercelRewrite {
	source: string;
	destination: string;
}

/**
 * A single route entry in the Build Output API v3 config.
 */
export interface VercelRoute {
	src?: string;
	dest?: string;
	headers?: Record<string, string>;
	status?: number;
	handle?: 'filesystem' | 'miss' | 'rewrite' | 'hit' | 'error';
	continue?: boolean;
}

/**
 * Build Output API v3 config.json structure.
 */
export interface VercelConfig {
	version: 3;
	routes: VercelRoute[];
	cleanUrls?: boolean;
	trailingSlash?: boolean;
	images?: ImagesConfig;
}

// ============================================================================
// Adapter options
// ============================================================================

/**
 * Options for the `adapt()` function.
 */
export interface AdaptOptions {
	/**
	 * Build output directory (from `vite build`).
	 * Should contain `client/` and `server/entry.js`.
	 * @default 'dist'
	 */
	outDir?: string;

	/**
	 * Serverless function configuration.
	 */
	serverless?: ServerlessConfig;

	/**
	 * Incremental Static Regeneration configuration.
	 * Set to `false` to disable ISR.
	 * @default false
	 */
	isr?: ISRConfig | false;

	/**
	 * Vercel Image Optimization configuration.
	 */
	images?: ImagesConfig;

	/**
	 * Custom response headers.
	 */
	headers?: VercelHeader[];

	/**
	 * Custom redirects.
	 */
	redirects?: VercelRedirect[];

	/**
	 * Additional rewrites (prepended before the catch-all rule).
	 */
	rewrites?: VercelRewrite[];

	/**
	 * Remove `.html` extensions from URLs.
	 * @default true
	 */
	cleanUrls?: boolean;

	/**
	 * Enforce trailing slash behavior.
	 */
	trailingSlash?: boolean;

	/**
	 * Print progress messages to stdout.
	 * @default true
	 */
	verbose?: boolean;
}

/**
 * Generate Vercel Build Output API v3 from a Ripple build.
 *
 * Transforms the standard Ripple build output (`outDir/client` + `outDir/server`)
 * into `.vercel/output/` with static files, a serverless function,
 * and routing configuration.
 *
 * @param options - Adapter configuration options
 */
export function adapt(options?: AdaptOptions): Promise<void>;
