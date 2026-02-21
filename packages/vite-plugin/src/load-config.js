/**
 * Shared utility for loading and resolving ripple.config.ts.
 *
 * `resolveRippleConfig` is the single source of truth for all config
 * validation and default values. Every consumer should receive a
 * `ResolvedRippleConfig` rather than applying ad-hoc defaults.
 *
 * `loadRippleConfig` is the single entry point for loading the config
 * file.  It accepts an optional Vite dev server — when provided the
 * config is loaded via `ssrLoadModule` (no temp server overhead,
 * HMR-aware). Otherwise a temporary Vite server is spun up, used to
 * transpile the TypeScript config, and immediately shut down.
 *
 * Used by the Vite plugin (during dev + build), the preview CLI script,
 * and the generated production server entry.
 */

/** @import { RippleConfigOptions, ResolvedRippleConfig } from '@ripple-ts/vite-plugin' */

import path from 'node:path';
import fs from 'node:fs';
import { DEFAULT_OUTDIR } from './constants.js';

/**
 * Validate a raw ripple config and apply all defaults.
 *
 * After this function returns every optional field carries its default
 * value so callers never need to use `??` / `||` fallbacks.
 *
 * The function is idempotent — passing an already-resolved config
 * through it again is safe and produces the same result.
 *
 * @param {RippleConfigOptions} raw - The user-provided config (from ripple.config.ts)
 * @param {{ requireAdapter?: boolean }} [options]
 * @returns {ResolvedRippleConfig}
 */
export function resolveRippleConfig(raw, options = {}) {
	const { requireAdapter = false } = options;

	// ------------------------------------------------------------------
	// Validate
	// ------------------------------------------------------------------
	if (!raw) {
		throw new Error(
			'[@ripple-ts/vite-plugin] ripple.config.ts must export a default config object.',
		);
	}

	if (!raw.router?.routes) {
		throw new Error('[@ripple-ts/vite-plugin] ripple.config.ts must define `router.routes`.');
	}

	if (requireAdapter) {
		if (!raw.adapter) {
			throw new Error(
				'[@ripple-ts/vite-plugin] Production builds require an `adapter` in ripple.config.ts. ' +
					'Install an adapter package (e.g. @ripple-ts/adapter-node) and set the `adapter` property.',
			);
		}

		if (!raw.adapter.runtime) {
			throw new Error(
				'[@ripple-ts/vite-plugin] The adapter in ripple.config.ts is missing the `runtime` property. ' +
					'Make sure your adapter exports runtime primitives.',
			);
		}
	}

	// ------------------------------------------------------------------
	// Apply defaults
	// ------------------------------------------------------------------
	return {
		build: {
			outDir: raw.build?.outDir ?? DEFAULT_OUTDIR,
			minify: raw.build?.minify,
			target: raw.build?.target,
		},
		adapter: raw.adapter,
		router: {
			routes: raw.router.routes,
		},
		middlewares: raw.middlewares ?? [],
		platform: {
			env: raw.platform?.env ?? {},
		},
		server: {
			trustProxy: raw.server?.trustProxy ?? false,
		},
	};
}

/**
 * Return the absolute path to ripple.config.ts for the given project root.
 *
 * This is the single source of truth for the config file name / location.
 *
 * @param {string} projectRoot - Absolute path to the project root
 * @returns {string}
 */
export function getRippleConfigPath(projectRoot) {
	return path.join(projectRoot, 'ripple.config.ts');
}

/**
 * Check whether a ripple.config.ts file exists in the given root.
 *
 * Use this before calling `loadRippleConfig` when the absence of a
 * config is a valid state (e.g. the Vite plugin running in SPA mode).
 *
 * @param {string} projectRoot - Absolute path to the project root
 * @returns {boolean}
 */
export function rippleConfigExists(projectRoot) {
	return fs.existsSync(getRippleConfigPath(projectRoot));
}

/**
 * Load ripple.config.ts, validate, and apply defaults via `resolveRippleConfig`.
 *
 * When a Vite dev server is provided via `options.vite`, the config is loaded
 * through its `ssrLoadModule` — avoiding the cost of spinning up a temporary
 * server and enabling HMR-aware reloads.
 *
 * When no dev server is available (build / preview), a temporary Vite server
 * is created in middleware mode, used to transpile the config, then shut down.
 *
 * Throws if the config file does not exist or is invalid.
 *
 * @param {string} projectRoot - Absolute path to the project root
 * @param {{ vite?: import('vite').ViteDevServer, requireAdapter?: boolean }} [options]
 * @returns {Promise<ResolvedRippleConfig>}
 */
export async function loadRippleConfig(projectRoot, options = {}) {
	const { vite, requireAdapter } = options;
	const configPath = getRippleConfigPath(projectRoot);

	if (!fs.existsSync(configPath)) {
		throw new Error(`[@ripple-ts/vite-plugin] ripple.config.ts not found in ${projectRoot}`);
	}

	// When a running Vite dev server is available, use it directly.
	if (vite) {
		const configModule = await vite.ssrLoadModule(configPath);
		return resolveRippleConfig(configModule.default, { requireAdapter });
	}

	// Otherwise spin up a temporary Vite server (build / preview).
	// The temp server only transpiles ripple.config.ts (plain TypeScript) —
	// no .ripple compilation plugin is needed.
	const { createServer } = await import('vite');

	const tempVite = await createServer({
		root: projectRoot,
		configFile: false,
		appType: 'custom',
		server: { middlewareMode: true },
		// We don't need to load the ripple plugin for now
		// but if we start using references to components in router.routes
		// then we'll need to add the plugin here to handle the .ripple imports.
		// But this will cause a circular references warning
		// that we should resolve when we implement references to components.
		// plugins: [ripple({ excludeRippleExternalModules: true })],
		logLevel: 'silent',
	});

	try {
		const configModule = await tempVite.ssrLoadModule(configPath);
		return resolveRippleConfig(configModule.default, { requireAdapter });
	} finally {
		await tempVite.close();
	}
}
