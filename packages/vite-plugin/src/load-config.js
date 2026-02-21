/**
 * Shared utility for loading ripple.config.ts.
 *
 * Spins up a temporary Vite dev server in middleware mode to transpile and
 * evaluate the TypeScript config file, then shuts it down.
 *
 * Used by both the Vite plugin (during build) and the preview CLI script.
 */

/** @import { RippleConfigOptions } from '@ripple-ts/vite-plugin' */

import path from 'node:path';
import fs from 'node:fs';

/**
 * Load ripple.config.ts by spinning up a temporary Vite server.
 *
 * @param {string} projectRoot - Absolute path to the project root
 * @param {string} [configFileName='ripple.config.ts'] - Config file name (relative to root)
 * @returns {Promise<RippleConfigOptions>}
 */
export async function loadRippleConfig(projectRoot, configFileName = 'ripple.config.ts') {
	const configPath = path.join(projectRoot, configFileName);

	if (!fs.existsSync(configPath)) {
		throw new Error(`[@ripple-ts/vite-plugin] ${configFileName} not found in ${projectRoot}`);
	}

	const { createServer } = await import('vite');
	const { ripple } = await import('./index.js');

	const tempVite = await createServer({
		root: projectRoot,
		configFile: false,
		appType: 'custom',
		server: { middlewareMode: true },
		plugins: [ripple({ excludeRippleExternalModules: true })],
		logLevel: 'silent',
	});

	try {
		const configModule = await tempVite.ssrLoadModule(configPath);
		return configModule.default;
	} finally {
		await tempVite.close();
	}
}
