/**
 * Shared RPC utilities for Ripple metaframework.
 *
 * These functions are platform-agnostic — they use only standard Web APIs
 * (Request, Response, Headers, URL) and receive platform-specific capabilities
 * (hashing, async context) from the adapter's runtime.
 *
 * Used by both the Vite dev server and production server runtime.
 */

/**
@import {
	RipplePatchedFetch,
	RpcEntry,
	handle_rpc_request,
	is_rpc_request,
	build_rpc_lookup,
	patch_global_fetch,
} from '@ripple-ts/adapter/rpc';
 */

const RPC_PATH_PREFIX = '/_$_ripple_rpc_$_/';

// ============================================================================
// Origin derivation
// ============================================================================

/** @type {import('@ripple-ts/adapter/rpc').derive_origin} */
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

/** @type {patch_global_fetch} */
export function patch_global_fetch(async_context) {
	// Guard: if fetch is already patched by Ripple, don't wrap it again.
	// This prevents layered wrapping when createHandler() or getDevAsyncContext()
	// is called more than once in the same process (tests, hot reload, etc.).
	if (/** @type {RipplePatchedFetch} */ (globalThis.fetch).__ripple_patched) {
		return { restore() {}, set_handler(/** @type {any} */ _h) {} };
	}

	/** @type {typeof globalThis.fetch} */
	const original_fetch = globalThis.fetch;

	/** @type {((request: Request) => Promise<Response>) | null} */
	let internal_handler = null;

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

			// Short-circuit same-origin requests: route them directly through
			// the handler in-process instead of making a real network request.
			// This avoids issues on serverless platforms (e.g. Vercel Deployment
			// Protection blocking server-to-server calls) and eliminates the
			// latency of a redundant network round-trip + cold start.
			if (internal_handler !== null) {
				const resolved_url =
					typeof input === 'string' ? input : input instanceof Request ? input.url : input.href;

				try {
					const resolved_origin = new URL(resolved_url).origin;
					if (resolved_origin === context.origin) {
						const request = input instanceof Request ? input : new Request(input, init);
						return internal_handler(request);
					}
				} catch {
					// Not a valid URL — fall through to real fetch
				}
			}
		}

		return original_fetch(input, init);
	};

	// Copy static properties (e.g. fetch.preconnect) so the patched
	// function satisfies the full `typeof fetch` contract.
	Object.assign(patched_fetch, original_fetch);

	// Mark as patched so subsequent calls are idempotent
	/** @type {RipplePatchedFetch} */ (patched_fetch).__ripple_patched = true;

	globalThis.fetch = /** @type {typeof globalThis.fetch} */ (patched_fetch);

	return {
		/** Restore the original fetch. */
		restore() {
			globalThis.fetch = original_fetch;
		},
		/**
		 * Set the handler used for same-origin short-circuit.
		 * Called by createHandler() after the handler function is created.
		 *
		 * @param {(request: Request) => Promise<Response>} handler
		 */
		set_handler(handler) {
			internal_handler = handler;
		},
	};
}

// ============================================================================
// RPC lookup
// ============================================================================

/** @type {build_rpc_lookup} */
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

/** @type {is_rpc_request} */
export function is_rpc_request(pathname) {
	return pathname.startsWith(RPC_PATH_PREFIX);
}

/** @type {handle_rpc_request} */
export async function handle_rpc_request(request, options) {
	const { resolveFunction, executeServerFunction, asyncContext, trustProxy } = options;

	try {
		const url = new URL(request.url);
		const hash = url.pathname.slice(RPC_PATH_PREFIX.length);

		// Validate hash format — compiler always generates 8 lowercase hex chars
		if (!hash || !/^[a-f0-9]{8}$/.test(hash)) {
			return new Response('Invalid RPC request', { status: 400 });
		}

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
