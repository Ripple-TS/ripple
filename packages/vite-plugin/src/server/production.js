/**
 * Production server runtime for Ripple metaframework.
 * This module is used in production builds to handle SSR + API routes + RPC.
 *
 * It is designed to be imported by the generated server entry and does NOT
 * depend on Vite at runtime.
 *
 * Platform-agnostic — no Node.js-specific imports. Platform capabilities
 * (hashing, async context) are provided via `manifest.runtime` from the adapter.
 */

import { createRouter } from './router.js';
import { createContext, runMiddlewareChain } from './middleware.js';
import {
	patch_global_fetch,
	build_rpc_lookup,
	is_rpc_request,
	handle_rpc_request,
} from '@ripple-ts/adapter/rpc';

export { resolveRippleConfig } from '../load-config.js';

/**
 * @typedef {import('@ripple-ts/vite-plugin').Route} Route
 * @typedef {import('@ripple-ts/vite-plugin').Middleware} Middleware
 * @typedef {import('@ripple-ts/vite-plugin').RenderRoute} RenderRoute
 * @typedef {import('@ripple-ts/vite-plugin').ServerRoute} ServerRoute
 */

/**
@import {
	ServerManifest,
	RenderResult,
	HandlerOptions,
	ClientAssetEntry,
} from '@ripple-ts/vite-plugin/production';
 */

/**
 * Create a production request handler from a manifest.
 *
 * The returned function is a standard Web `fetch`-style handler:
 *   `(request: Request) => Promise<Response>`
 *
 * @param {ServerManifest} manifest
 * @param {HandlerOptions} options
 * @returns {(request: Request) => Promise<Response>}
 */
export function createHandler(manifest, options) {
	const { render, getCss, htmlTemplate, executeServerFunction } = options;
	const router = createRouter(manifest.routes);
	const globalMiddlewares = manifest.middlewares;
	const trustProxy = manifest.trustProxy;
	const clientAssets = manifest.clientAssets || {};

	// Use adapter's runtime primitives for platform-agnostic operation
	const runtime = manifest.runtime;

	// Build the RPC lookup table using the adapter's hash function
	const rpcLookup = manifest.rpcModules
		? build_rpc_lookup(manifest.rpcModules, runtime.hash)
		: new Map();

	// Create async context and patch fetch for relative URL resolution in #server blocks
	const asyncContext = runtime.createAsyncContext();
	patch_global_fetch(asyncContext);

	return async function handler(request) {
		const url = new URL(request.url);
		const method = request.method;

		// Handle RPC requests for #server blocks
		if (is_rpc_request(url.pathname)) {
			return handle_rpc_request(request, {
				resolveFunction(hash) {
					const entry = rpcLookup.get(hash);
					if (!entry) return null;
					const fn = entry.serverObj[entry.funcName];
					return typeof fn === 'function' ? fn : null;
				},
				executeServerFunction,
				asyncContext,
				trustProxy,
			});
		}

		// Match route
		const match = router.match(method, url.pathname);

		if (!match) {
			return new Response('Not Found', { status: 404 });
		}

		// Create context
		const context = createContext(request, match.params);

		try {
			if (match.route.type === 'render') {
				return await handleRenderRoute(
					match.route,
					context,
					manifest,
					globalMiddlewares,
					render,
					getCss,
					htmlTemplate,
					clientAssets,
				);
			} else {
				return await handleServerRoute(match.route, context, globalMiddlewares);
			}
		} catch (error) {
			console.error('[ripple] Request error:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	};
}

// ============================================================================
// Render routes
// ============================================================================

/**
 * Handle a RenderRoute in production
 *
 * @param {RenderRoute} route
 * @param {import('@ripple-ts/vite-plugin').Context} context
 * @param {ServerManifest} manifest
 * @param {Middleware[]} globalMiddlewares
 * @param {(component: Function) => Promise<RenderResult>} render
 * @param {(css: Set<string>) => string} getCss
 * @param {string} htmlTemplate
 * @param {Record<string, ClientAssetEntry>} clientAssets
 * @returns {Promise<Response>}
 */
async function handleRenderRoute(
	route,
	context,
	manifest,
	globalMiddlewares,
	render,
	getCss,
	htmlTemplate,
	clientAssets,
) {
	const renderHandler = async () => {
		// Get the page component
		const PageComponent = manifest.components[route.entry];
		if (!PageComponent) {
			throw new Error(`Component not found: ${route.entry}`);
		}

		// Get layout if specified
		let RootComponent;
		const pageProps = { params: context.params };

		if (route.layout && manifest.layouts[route.layout]) {
			const LayoutComponent = manifest.layouts[route.layout];
			RootComponent = createLayoutWrapper(LayoutComponent, PageComponent, pageProps);
		} else {
			RootComponent = createPropsWrapper(PageComponent, pageProps);
		}

		// Render to HTML
		const { head, body, css } = await render(RootComponent);

		// Generate inline scoped CSS (from SSR-rendered component hashes)
		let cssContent = '';
		if (css.size > 0) {
			const cssString = getCss(css);
			if (cssString) {
				cssContent = `<style data-ripple-ssr>${cssString}</style>`;
			}
		}

		// Build asset preload tags from the client manifest.
		// These ensure the browser starts downloading page-specific JS/CSS
		// immediately, before the hydration script executes.
		/** @type {string[]} */
		const preloadTags = [];
		const entryAssets = clientAssets[route.entry];

		if (entryAssets?.css) {
			for (const cssFile of entryAssets.css) {
				preloadTags.push(`<link rel="stylesheet" href="/${cssFile}">`);
			}
		}
		if (entryAssets?.js) {
			preloadTags.push(`<link rel="modulepreload" href="/${entryAssets.js}">`);
		}

		// Preload the hydrate runtime so it starts downloading in parallel
		const hydrateAsset = clientAssets.__hydrate_js;
		if (hydrateAsset?.js) {
			preloadTags.push(`<link rel="modulepreload" href="/${hydrateAsset.js}">`);
		}

		// Build head content with hydration data
		const routeData = JSON.stringify({
			entry: route.entry,
			params: context.params,
		});
		const headContent = [
			head,
			cssContent,
			...preloadTags,
			`<script id="__ripple_data" type="application/json">${escapeScript(routeData)}</script>`,
		]
			.filter(Boolean)
			.join('\n');

		// Inject into the HTML template
		const html = htmlTemplate
			.replace('<!--ssr-head-->', headContent)
			.replace('<!--ssr-body-->', body);

		return new Response(html, {
			status: 200,
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
		});
	};

	return runMiddlewareChain(context, globalMiddlewares, route.before || [], renderHandler, []);
}

// ============================================================================
// Server routes
// ============================================================================

/**
 * Handle a ServerRoute in production
 *
 * @param {ServerRoute} route
 * @param {import('@ripple-ts/vite-plugin').Context} context
 * @param {Middleware[]} globalMiddlewares
 * @returns {Promise<Response>}
 */
async function handleServerRoute(route, context, globalMiddlewares) {
	const handler = async () => route.handler(context);
	return runMiddlewareChain(
		context,
		globalMiddlewares,
		route.before || [],
		handler,
		route.after || [],
	);
}

// ============================================================================
// Component wrappers
// ============================================================================

/**
 * Create a wrapper component that injects props
 * @param {Function} Component
 * @param {Record<string, unknown>} props
 * @returns {Function}
 */
function createPropsWrapper(Component, props) {
	return function WrappedComponent(/** @type {unknown} */ output, additionalProps = {}) {
		return Component(output, { ...additionalProps, ...props });
	};
}

/**
 * Create a wrapper that composes a layout with a page component
 * @param {Function} Layout
 * @param {Function} Page
 * @param {Record<string, unknown>} pageProps
 * @returns {Function}
 */
function createLayoutWrapper(Layout, Page, pageProps) {
	return function LayoutWrapper(/** @type {unknown} */ output, additionalProps = {}) {
		const children = (/** @type {unknown} */ childOutput) => {
			return Page(childOutput, { ...additionalProps, ...pageProps });
		};
		return Layout(output, { ...additionalProps, children });
	};
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape script content to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeScript(str) {
	return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
