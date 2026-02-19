/// <reference types="ripple/compiler/internal/rpc" />
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @typedef {import('@ripple-ts/vite-plugin').Context} Context
 * @typedef {import('@ripple-ts/vite-plugin').RenderRoute} RenderRoute
 * @typedef {import('vite').ViteDevServer} ViteDevServer
 */

/**
 * @typedef {Object} RenderResult
 * @property {string} head
 * @property {string} body
 * @property {Set<string>} css
 */

/**
 * Handle SSR rendering for a RenderRoute
 *
 * @param {RenderRoute} route
 * @param {Context} context
 * @param {ViteDevServer} vite
 * @returns {Promise<Response>}
 */
export async function handleRenderRoute(route, context, vite) {
	try {
		// Initialize so the server can register
		// RPC functions from #server blocks during SSR module loading
		if (!globalThis.rpc_modules) {
			globalThis.rpc_modules = new Map();
		}

		// Load ripple server utilities
		const { render, get_css_for_hashes } = await vite.ssrLoadModule('ripple/server');

		// Load the page component
		const pageModule = await vite.ssrLoadModule(route.entry);
		const PageComponent = getDefaultExport(pageModule);

		if (!PageComponent) {
			throw new Error(`No default export found in ${route.entry}`);
		}

		// Build the component tree (with optional layout)
		let RootComponent;
		const pageProps = { params: context.params };

		if (route.layout) {
			// Load layout component
			const layoutModule = await vite.ssrLoadModule(route.layout);
			const LayoutComponent = getDefaultExport(layoutModule);

			if (!LayoutComponent) {
				throw new Error(`No default export found in ${route.layout}`);
			}

			// Create a wrapper that composes layout + page
			// Layout receives children as a component prop
			RootComponent = createLayoutWrapper(LayoutComponent, PageComponent, pageProps);
		} else {
			// No layout - render page directly with props
			RootComponent = createPropsWrapper(PageComponent, pageProps);
		}

		// Render to HTML
		/** @type {RenderResult} */
		const { head, body, css } = await render(RootComponent);

		// Generate CSS tags
		let cssContent = '';
		if (css.size > 0) {
			const cssString = get_css_for_hashes(css);
			if (cssString) {
				cssContent = `<style data-ripple-ssr>${cssString}</style>`;
			}
		}

		// Build head content with hydration data
		const routeData = JSON.stringify({
			entry: route.entry,
			params: context.params,
		});
		const headContent = [
			head,
			cssContent,
			`<script id="__ripple_data" type="application/json">${escapeScript(routeData)}</script>`,
		]
			.filter(Boolean)
			.join('\n');

		// Load and process index.html template
		const templatePath = join(vite.config.root, 'public', 'index.html');
		let template = await readFile(templatePath, 'utf-8');

		// Apply Vite's HTML transforms (HMR client, module resolution, etc.)
		template = await vite.transformIndexHtml(context.url.pathname, template);

		// Replace placeholders
		let html = template.replace('<!--ssr-head-->', headContent).replace('<!--ssr-body-->', body);

		// Inject hydration script before </body>
		const hydrationScript = `<script type="module" src="/@id/virtual:ripple-hydrate"></script>`;
		html = html.replace('</body>', `${hydrationScript}\n</body>`);

		return new Response(html, {
			status: 200,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
			},
		});
	} catch (error) {
		console.error('[ripple] SSR render error:', error);

		const errorHtml = generateErrorHtml(error, route);
		return new Response(errorHtml, {
			status: 500,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
			},
		});
	}
}

/**
 * Get the default export from a module
 * Handles both `export default` and `export { X as default }`
 *
 * @param {Record<string, unknown>} module
 * @returns {Function | null}
 */
function getDefaultExport(module) {
	if (typeof module.default === 'function') {
		return module.default;
	}
	// Look for a component-like export (capitalized function)
	for (const [key, value] of Object.entries(module)) {
		if (typeof value === 'function' && /^[A-Z]/.test(key)) {
			return value;
		}
	}
	return null;
}

/**
 * Create a wrapper component that injects props
 *
 * @param {Function} Component
 * @param {Record<string, unknown>} props
 * @returns {Function}
 */
function createPropsWrapper(Component, props) {
	/**
	 * @param {unknown} output
	 * @param {Record<string, unknown>} additionalProps
	 */
	return function WrappedComponent(output, additionalProps = {}) {
		return Component(output, { ...additionalProps, ...props });
	};
}

/**
 * Create a wrapper that composes a layout with a page component
 * The layout receives the page as its children prop
 *
 * @param {Function} Layout
 * @param {Function} Page
 * @param {Record<string, unknown>} pageProps
 * @returns {Function}
 */
function createLayoutWrapper(Layout, Page, pageProps) {
	/**
	 * @param {unknown} output
	 * @param {Record<string, unknown>} additionalProps
	 */
	return function LayoutWrapper(output, additionalProps = {}) {
		// Children is a component function that renders the page
		const children = (/** @type {unknown} */ childOutput) => {
			return Page(childOutput, { ...additionalProps, ...pageProps });
		};

		return Layout(output, { ...additionalProps, children });
	};
}

/**
 * Escape script content to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeScript(str) {
	return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Generate an error HTML page for development
 *
 * @param {unknown} error
 * @param {RenderRoute} route
 * @returns {string}
 */
function generateErrorHtml(error, route) {
	const message = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SSR Error</title>
<style>
body { font-family: system-ui, sans-serif; padding: 2rem; background: #1a1a1a; color: #fff; }
h1 { color: #ff6b6b; }
pre { background: #2d2d2d; padding: 1rem; border-radius: 4px; overflow-x: auto; }
.route { color: #888; }
</style>
</head>
<body>
<h1>SSR Render Error</h1>
<p class="route">Route: ${route.path} → ${route.entry}</p>
<pre>${escapeHtml(message)}</pre>
${stack ? `<pre>${escapeHtml(stack)}</pre>` : ''}
</body>
</html>`;
}

/**
 * Escape HTML entities
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
