/**
 * Shared RPC utilities for Ripple metaframework.
 *
 * These functions are platform-agnostic — they use only standard Web APIs
 * (Request, Response, Headers, URL) and receive platform-specific capabilities
 * (hashing, async context) from the adapter's runtime.
 *
 * Used by both the Vite dev server and production server runtime.
 */

const RPC_PATH_PREFIX = '/_$_ripple_rpc_$_/';

/**
 * @typedef {Object} AsyncContext
 * @property {<R>(store: any, fn: () => R | Promise<R>) => R | Promise<R>} run
 * @property {() => any} getStore
 */

/**
 * @typedef {Object} RuntimePrimitives
 * @property {(str: string) => string} hash - Hash a string for RPC function identification
 * @property {() => AsyncContext} createAsyncContext - Create a request-scoped async context
 */

/**
 * @typedef {Object} RpcEntry
 * @property {Record<string, Function>} serverObj - The _$_server_$_ object from the module
 * @property {string} funcName - The exported function name
 */

/**
 * @typedef {Object} HandleRpcOptions
 * @property {(hash: string) => Function | null | Promise<Function | null>} resolveFunction - Resolve hash → server function
 * @property {(fn: Function, body: string) => Promise<string>} executeServerFunction - Execute a server function
 * @property {AsyncContext} asyncContext - Request-scoped async context
 * @property {boolean} trustProxy - Whether to trust X-Forwarded-* headers
 */

// ============================================================================
// Origin derivation
// ============================================================================

/**
 * Derive the request origin (protocol + host) from a Web Request.
 * Only honours `X-Forwarded-Proto` and `X-Forwarded-Host` headers when
 * `trustProxy` is explicitly enabled; otherwise origin comes from the URL.
 *
 * Uses only standard Web APIs — no Node.js imports.
 *
 * @param {Request} request
 * @param {boolean} trust_proxy
 * @returns {string}
 */
export function derive_origin(request, trust_proxy) {
	const url = new URL(request.url);
	let protocol = url.protocol.replace(':', '');
	let host = url.host;

	if (trust_proxy) {
		const forwarded_proto = request.headers.get('x-forwarded-proto');
		if (forwarded_proto) {
			protocol = forwarded_proto.split(',')[0].trim();
		}

		const forwarded_host = request.headers.get('x-forwarded-host');
		if (forwarded_host) {
			host = forwarded_host.split(',')[0].trim();
		}
	}

	return `${protocol}://${host}`;
}

// ============================================================================
// Global fetch patching
// ============================================================================

/**
 * Quick check whether a string looks like it already has a URL scheme.
 * @param {string} url
 * @returns {boolean}
 */
function has_scheme(url) {
	return /^[a-z][a-z0-9+\-.]*:/i.test(url);
}

/**
 * Patch `globalThis.fetch` to resolve relative URLs based on the current
 * request context stored in the provided async context.
 *
 * This allows server functions in `#server` blocks to use relative URLs
 * (e.g., "/api/foo", "./data") that are resolved against the incoming
 * request's origin.
 *
 * Should be called once during server initialization.
 *
 * @param {AsyncContext} async_context
 * @returns {() => void} Cleanup function that restores the original fetch
 */
export function patch_global_fetch(async_context) {
	/** @type {typeof globalThis.fetch} */
	const original_fetch = globalThis.fetch;

	/**
	 * @param {string | Request | URL} input
	 * @param {RequestInit} [init]
	 * @returns {ReturnType<typeof globalThis.fetch>}
	 */
	const patched_fetch = function (input, init) {
		const context = async_context.getStore();

		if (context?.origin) {
			if (typeof input === 'string' && !has_scheme(input)) {
				input = new URL(input, context.origin).href;
			} else if (input instanceof Request) {
				const url = input.url;
				if (!has_scheme(url)) {
					input = new Request(new URL(url, context.origin).href, input);
				}
			} else if (input instanceof URL) {
				if (!input.protocol || input.protocol === '' || input.origin === 'null') {
					const relative = input.pathname + (input.search || '') + (input.hash || '');
					input = new URL(relative, context.origin);
				}
			}
		}

		return original_fetch(input, init);
	};

	// Copy static properties (e.g. fetch.preconnect) so the patched
	// function satisfies the full `typeof fetch` contract.
	Object.assign(patched_fetch, original_fetch);

	globalThis.fetch = /** @type {typeof globalThis.fetch} */ (patched_fetch);

	return () => {
		globalThis.fetch = original_fetch;
	};
}

// ============================================================================
// RPC lookup
// ============================================================================

/**
 * Build a hash → RpcEntry lookup from a map of rpcModules.
 *
 * The hash algorithm must match the compiler's ServerBlock transform.
 * The adapter's runtime provides the hash function.
 *
 * @param {Record<string, Record<string, Function>>} rpc_modules - Map of entry path → _$_server_$_ object
 * @param {(str: string) => string} hash_fn - Platform-specific hash function from adapter runtime
 * @returns {Map<string, RpcEntry>}
 */
export function build_rpc_lookup(rpc_modules, hash_fn) {
	/** @type {Map<string, RpcEntry>} */
	const lookup = new Map();

	for (const [entry_path, server_obj] of Object.entries(rpc_modules)) {
		for (const func_name of Object.keys(server_obj)) {
			const func_path = entry_path + '#' + func_name;
			const hash = hash_fn(func_path);
			lookup.set(hash, { serverObj: server_obj, funcName: func_name });
		}
	}

	return lookup;
}

// ============================================================================
// RPC request handler
// ============================================================================

/**
 * Check whether a URL pathname is an RPC request.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function is_rpc_request(pathname) {
	return pathname.startsWith(RPC_PATH_PREFIX);
}

/**
 * Handle an RPC request for a `#server` block function.
 *
 * Platform-agnostic — operates on Web Request/Response and receives
 * environment-specific behaviour via the `options` callbacks.
 *
 * In dev, `resolveFunction` uses Vite's `ssrLoadModule` to hot-load modules.
 * In production, it looks up a pre-built map.
 *
 * @param {Request} request
 * @param {HandleRpcOptions} options
 * @returns {Promise<Response>}
 */
export async function handle_rpc_request(request, options) {
	const { resolveFunction, executeServerFunction, asyncContext, trustProxy } = options;

	try {
		const url = new URL(request.url);
		const hash = url.pathname.slice(RPC_PATH_PREFIX.length);
		const body = await request.text();

		const fn = await resolveFunction(hash);
		if (!fn) {
			return new Response(`RPC function not found: ${hash}`, { status: 404 });
		}

		const origin = derive_origin(request, trustProxy);

		return await asyncContext.run({ origin }, async () => {
			const result = await executeServerFunction(fn, body);

			return new Response(result, {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});
	} catch (error) {
		console.error('[ripple] RPC error:', error);
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'RPC failed' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
}
