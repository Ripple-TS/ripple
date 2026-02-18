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
 * Create a production request handler from a manifest
 *
 * @param {ServerManifest} manifest
 * @param {Object} options
 * @param {(component: Function) => Promise<RenderResult>} options.render - SSR render function
 * @param {(css: Set<string>) => string} options.getCss - Get CSS for hashes
 * @param {string} options.clientBase - Base path for client assets
 * @returns {(request: Request) => Promise<Response>}
 */
export function createHandler(manifest, options) {
	const { render, getCss, clientBase = '/' } = options;
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
 * Generate the full HTML document for production
 * @param {Object} options
 * @param {string} options.head
 * @param {string} options.body
 * @param {RenderRoute} options.route
 * @param {import('@ripple-ts/vite-plugin').Context} options.context
 * @param {string} options.clientBase
 * @returns {string}
 */
function generateHtml({ head, body, route, context, clientBase }) {
	const routeData = JSON.stringify({
		entry: route.entry,
		params: context.params,
	});

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${head}
</head>
<body>
<div id="app">${body}</div>
<script id="__ripple_data" type="application/json">${escapeScript(routeData)}</script>
<script type="module">
import { hydrate, mount } from '${clientBase}ripple.js';

const data = JSON.parse(document.getElementById('__ripple_data').textContent);
const target = document.getElementById('app');

try {
  const module = await import('${clientBase}' + data.entry.replace(/^\\//, '').replace(/\\.ripple$/, '.js'));
  const Component =
    module.default ||
    Object.entries(module).find(([key, value]) => typeof value === 'function' && /^[A-Z]/.test(key))?.[1];

  if (!Component || !target) {
    console.error('[ripple] Unable to hydrate route: missing component export or #app target.');
  } else {
    try {
      hydrate(Component, {
        target,
        props: { params: data.params }
      });
    } catch (error) {
      console.warn('[ripple] Hydration failed, falling back to mount.', error);
      mount(Component, {
        target,
        props: { params: data.params }
      });
    }
  }
} catch (error) {
  console.error('[ripple] Failed to bootstrap client hydration.', error);
}
</script>
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
