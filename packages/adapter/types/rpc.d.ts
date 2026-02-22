/**
 * Async context abstraction — wraps platform-specific implementations
 * (e.g., Node.js AsyncLocalStorage, Bun AsyncLocalStorage).
 */
export type AsyncContext<T = any> = {
	/** Run a function with the given store value visible to getStore() */
	run: <R>(store: T, fn: () => R | Promise<R>) => R | Promise<R>;
	/** Get the current store value (undefined if outside a run() call) */
	getStore: () => T | undefined;
};

/**
 * Platform-specific runtime primitives provided by each adapter.
 *
 * These allow the shared server runtime to operate without depending
 * on Node.js-specific APIs like `node:crypto` or `node:async_hooks`.
 */
export type RuntimePrimitives = {
	/**
	 * Hash a string for RPC function identification.
	 *
	 * Must produce the same output as the compiler's ServerBlock transform:
	 * SHA-256 hex digest truncated to 8 characters.
	 *
	 * @param str - The string to hash (typically "filePath#funcName")
	 * @returns The hash string (8 hex chars)
	 */
	hash: (str: string) => string;

	/**
	 * Create a request-scoped async context.
	 *
	 * Used to propagate the request origin through async call stacks
	 * so that the patched `fetch` can resolve relative URLs.
	 */
	createAsyncContext: <T = any>() => AsyncContext<T>;
};

/**
 * Entry in the RPC lookup table.
 */
export type RpcEntry = {
	serverObj: Record<string, Function>;
	funcName: string;
};

/**
 * Options for handle_rpc_request.
 */
export type HandleRpcOptions = {
	/** Resolve a hash to the server function to call */
	resolveFunction: (hash: string) => Function | null | Promise<Function | null>;
	/** Execute a resolved server function with the request body */
	executeServerFunction: (fn: Function, body: string) => Promise<string>;
	/** Request-scoped async context for fetch patching */
	asyncContext: AsyncContext;
	/** Whether to trust X-Forwarded-* headers */
	trustProxy: boolean;
};

/**
 * Derive the request origin (protocol + host) from a Web Request.
 * Honors proxy headers only when trustProxy is true.
 */
export function derive_origin(request: Request, trust_proxy: boolean): string;

/**
 * Return value of patch_global_fetch with methods to control the patched fetch.
 */
export type PatchedFetchHandle = {
	/** Restore the original fetch. */
	restore: () => void;
	/**
	 * Set the handler used for same-origin short-circuit.
	 * When set, same-origin requests are routed directly through the handler
	 * in-process instead of making a real network request.
	 */
	set_handler: (handler: (request: Request) => Promise<Response>) => void;
};

/**
 * Patch globalThis.fetch to resolve relative URLs using the async context.
 * Returns a handle with `restore()` and `set_handler()` methods.
 *
 * When `set_handler()` is called with a request handler, same-origin fetch
 * calls (matching the async context's origin) are routed directly through
 * the handler in-process, avoiding network round-trips and issues with
 * serverless platforms (e.g. Vercel Deployment Protection).
 */
export function patch_global_fetch(async_context: AsyncContext): PatchedFetchHandle;

/**
 * Build a hash → RpcEntry lookup from rpcModules.
 */
export function build_rpc_lookup(
	rpc_modules: Record<string, Record<string, Function>>,
	hash_fn: (str: string) => string,
): Map<string, RpcEntry>;

/**
 * Check whether a URL pathname is an RPC request.
 */
export function is_rpc_request(pathname: string): boolean;

/**
 * Handle an RPC request. Platform-agnostic (Web Request/Response).
 */
export function handle_rpc_request(request: Request, options: HandleRpcOptions): Promise<Response>;

export type RipplePatchedFetch = typeof globalThis.fetch & {
	__ripple_patched?: boolean;
};
