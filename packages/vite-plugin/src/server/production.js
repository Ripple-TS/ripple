/**
 * Production server runtime for Ripple metaframework
 * This module is used in production builds to handle SSR + API routes
 */

import { createRouter } from './router.js';
import { createContext, runMiddlewareChain } from './middleware.js';

/**
 * @typedef {import('@ripple-ts/vite-plugin').Route} Route
 * @typedef {import('@ripple-ts/vite-plugin').Middleware} Middleware
 * @typedef {import('@ripple-ts/vite-plugin').RenderRoute} RenderRoute
 * @typedef {import('@ripple-ts/vite-plugin').ServerRoute} ServerRoute
 */

/**
 * @typedef {Object} ServerManifest
 * @property {Route[]} routes - Array of route definitions
 * @property {Record<string, Function>} components - Map of entry path to component function
 * @property {Record<string, Function>} layouts - Map of layout path to layout function
 * @property {Middleware[]} middlewares - Global middlewares
 */

/**
 * @typedef {Object} RenderResult
 * @property {string} head
 * @property {string} body
 * @property {Set<string>} css
 */

/**
 * @typedef {Object} ClientAssetEntry
 * @property {string} js - Path to the built JS file
 * @property {string[]} css - Paths to the built CSS files
 */

/**
 * Create a production request handler from a manifest
 *
 * @param {ServerManifest} manifest
 * @param {Object} options
 * @param {(component: Function) => Promise<RenderResult>} options.render - SSR render function
 * @param {(css: Set<string>) => string} options.getCss - Get CSS for hashes
 * @param {string} options.clientBase - Base path for client assets
 * @param {Record<string, ClientAssetEntry>} [options.clientAssets] - Map of entry paths to built asset paths
 * @param {string} [options.htmlTemplate] - HTML template with <!--ssr-head--> and <!--ssr-body--> placeholders
 * @returns {(request: Request) => Promise<Response>}
 */
export function createHandler(manifest, options) {
	const { render, getCss, clientBase = '/', clientAssets = {}, htmlTemplate = '' } = options;
	const router = createRouter(manifest.routes);
	const globalMiddlewares = manifest.middlewares || [];

	return async function handler(request) {
		const url = new URL(request.url);
		const method = request.method;

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
					clientBase,
					clientAssets,
					htmlTemplate,
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

/**
 * Handle a RenderRoute in production
 *
 * @param {RenderRoute} route
 * @param {import('@ripple-ts/vite-plugin').Context} context
 * @param {ServerManifest} manifest
 * @param {Middleware[]} globalMiddlewares
 * @param {(component: Function) => Promise<RenderResult>} render
 * @param {(css: Set<string>) => string} getCss
 * @param {string} clientBase
 * @param {Record<string, ClientAssetEntry>} clientAssets
 * @param {string} htmlTemplate
 * @returns {Promise<Response>}
 */
async function handleRenderRoute(
	route,
	context,
	manifest,
	globalMiddlewares,
	render,
	getCss,
	clientBase,
	clientAssets,
	htmlTemplate,
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

		// Generate CSS tags
		let cssContent = '';
		if (css.size > 0) {
			const cssString = getCss(css);
			if (cssString) {
				cssContent = `<style data-ripple-ssr>${cssString}</style>`;
			}
		}

		// Generate the full HTML document
		const html = generateHtml({
			head: head + cssContent,
			body,
			route,
			context,
			clientBase,
			clientAssets,
			htmlTemplate,
		});

		return new Response(html, {
			status: 200,
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
		});
	};

	return runMiddlewareChain(context, globalMiddlewares, route.before || [], renderHandler, []);
}

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

/**
 * Generate the full HTML document for production.
 * Uses the HTML template from public/index.html, replacing
 * <!--ssr-head--> and <!--ssr-body--> placeholders.
 *
 * @param {Object} options
 * @param {string} options.head - SSR-rendered head content
 * @param {string} options.body - SSR-rendered body content
 * @param {RenderRoute} options.route
 * @param {import('@ripple-ts/vite-plugin').Context} options.context
 * @param {string} options.clientBase - Base path for client assets
 * @param {Record<string, ClientAssetEntry>} options.clientAssets - Map of entry paths to built asset paths
 * @param {string} options.htmlTemplate - HTML template with <!--ssr-head--> and <!--ssr-body--> placeholders
 * @returns {string}
 */
function generateHtml({ head, body, route, context, clientBase, clientAssets, htmlTemplate }) {
	const routeData = JSON.stringify({
		entry: route.entry,
		params: context.params,
	});

	// Build asset tags for the current route entry
	const entryAssets = clientAssets[route.entry];
	/** @type {string[]} */
	const headParts = [];
	/** @type {string[]} */
	const bodyParts = [];

	// Add CSS links for the route's CSS files
	if (entryAssets?.css) {
		for (const cssFile of entryAssets.css) {
			headParts.push(`<link rel="stylesheet" href="${clientBase}${cssFile}">`);
		}
	}

	// Add SSR head content (component-rendered head + scoped styles)
	if (head) {
		headParts.push(head);
	}

	// Preload the route's JS module
	if (entryAssets?.js) {
		headParts.push(`<link rel="modulepreload" href="${clientBase}${entryAssets.js}">`);
	}

	// Preload the hydrate runtime
	const hydrateAsset = clientAssets.__hydrate_js?.js;
	if (hydrateAsset) {
		headParts.push(`<link rel="modulepreload" href="${clientBase}${hydrateAsset}">`);
	}

	// Body: SSR content only (injected into the root container)
	bodyParts.push(body);

	// Scripts: hydration data + bootstrap (injected before </body>, outside root)
	/** @type {string[]} */
	const scriptParts = [];
	scriptParts.push(
		`<script id="__ripple_data" type="application/json">${escapeScript(routeData)}</script>`,
	);

	// Inline hydration bootstrap script
	const hydrateJs = hydrateAsset ? `${clientBase}${hydrateAsset}` : null;
	const entryJs = entryAssets?.js ? `${clientBase}${entryAssets.js}` : null;

	if (hydrateJs && entryJs) {
		scriptParts.push(`<script type="module">
import { hydrate, mount } from '${hydrateJs}';
import Component from '${entryJs}';
const target = document.getElementById('root');
const data = JSON.parse(document.getElementById('__ripple_data').textContent);
try {
  hydrate(Component, { target, props: { params: data.params } });
} catch (e) {
  console.warn('[ripple] Hydration failed, falling back to mount.', e);
  mount(Component, { target, props: { params: data.params } });
}
</script>`);
	}

	// If we have an HTML template, use it with placeholder replacement
	if (htmlTemplate) {
		let html = htmlTemplate;
		html = html.replace('<!--ssr-head-->', headParts.join('\n'));
		html = html.replace('<!--ssr-body-->', bodyParts.join('\n'));
		// Inject scripts before </body> so they're outside the root container
		html = html.replace('</body>', scriptParts.join('\n') + '\n</body>');
		return html;
	}

	// Fallback: generate a minimal HTML document
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headParts.join('\n')}
</head>
<body>
<div id="root">${bodyParts.join('\n')}</div>
${scriptParts.join('\n')}
</body>
</html>`;
}

/**
 * Escape script content to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeScript(str) {
	return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
