import type {
	AdapterCoreOptions,
	NextMiddleware,
	RuntimePrimitives,
	ServeFunction,
	ServeStaticOptions as BaseServeStaticOptions,
	ServeStaticDirectoryOptions as BaseServeStaticDirectoryOptions,
} from '@ripple-ts/adapter';

/**
 * Bun runtime primitives for the Ripple adapter contract.
 *
 * - `hash`: SHA-256 (truncated to 8 hex chars) via `Bun.CryptoHasher`
 * - `createAsyncContext`: `AsyncLocalStorage` from `node:async_hooks` (Bun-compatible)
 */
export const runtime: RuntimePrimitives;

export type ServeOptions = AdapterCoreOptions & {
	middleware?: NextMiddleware<Request, any> | null;
	static?: BaseServeStaticDirectoryOptions | false;
};

export type ServeStaticOptions = BaseServeStaticOptions;

export const serve: ServeFunction<{ bun_server: any }, ServeOptions, any>;

export function serveStatic(
	dir: string,
	options?: ServeStaticOptions,
): NextMiddleware<Request, any, Response>;
