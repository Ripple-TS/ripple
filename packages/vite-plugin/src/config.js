// Config files are also imported by the browser's generated hydration entry.
// Keep these helpers free of the plugin's Node.js and compiler dependencies.
export { RenderRoute, ServerRoute } from './routes.js';

/**
 * @param {import('@ripple-ts/vite-plugin').RippleConfigOptions} options
 * @returns {import('@ripple-ts/vite-plugin').RippleConfigOptions}
 */
export function defineConfig(options) {
	return options;
}
