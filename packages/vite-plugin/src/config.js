// @ts-check

/**
 * Lightweight entry for `ripple.config.ts`. Importing from
 * `@ripple-ts/vite-plugin/config` keeps the plugin, compiler, and dev server
 * out of a production server bundle that only needs to read the config.
 * Keep this module free of heavy imports.
 */

/** @import { RippleConfigOptions } from '@ripple-ts/vite-plugin' */

export { RenderRoute, ServerRoute } from './routes.js';

/**
 * @param {RippleConfigOptions} options
 * @returns {RippleConfigOptions}
 */
export function defineConfig(options) {
	return options;
}
