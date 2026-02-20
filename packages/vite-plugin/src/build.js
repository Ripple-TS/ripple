/**
 * Build orchestrator for Ripple metaframework production builds.
 *
 * Runs two sequential Vite builds:
 * 1. Client build — produces browser JS/CSS/assets + processed index.html
 * 2. Server build — produces a self-contained SSR server entry
 *
 * The output structure:
 *   dist/
 *   ├── client/          # Client assets (JS, CSS, HTML template)
 *   └── server/          # Server bundle
 *       └── entry.js     # Self-contained server entry
 */

/** @import { RippleConfigOptions, Route } from '@ripple-ts/vite-plugin' */
/** @import { InlineConfig, ResolvedConfig } from 'vite' */

import { build as viteBuild } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { generateServerEntry } from './server/virtual-entry.js';
import { ripple } from './index.js';

const VIRTUAL_SERVER_ENTRY_ID = 'virtual:ripple-server-entry';
const RESOLVED_VIRTUAL_SERVER_ENTRY_ID = '\0' + VIRTUAL_SERVER_ENTRY_ID;

/**
 * Run the full production build for a Ripple metaframework app.
 *
 * @param {Object} options
 * @param {string} options.root - Project root directory
 * @param {RippleConfigOptions} options.rippleConfig - The resolved ripple config
 * @param {InlineConfig} [options.viteConfig] - Base Vite config overrides
 * @returns {Promise<void>}
 */
export async function buildApp(options) {
	const { root, rippleConfig, viteConfig = {} } = options;
	const outDir = path.resolve(root, 'dist');
	const clientOutDir = path.join(outDir, 'client');
	const serverOutDir = path.join(outDir, 'server');

	console.log('[@ripple-ts/vite-plugin] Starting production build...');

	// =========================================================================
	// Step 1: Client build
	// =========================================================================
	console.log('[@ripple-ts/vite-plugin] Building client...');

	// Determine the HTML input
	const htmlInput = path.join(root, 'public', 'index.html');
	if (!fs.existsSync(htmlInput)) {
		throw new Error(
			`[@ripple-ts/vite-plugin] No public/index.html found at ${htmlInput}. ` +
				`A template HTML file with <!--ssr-head--> and <!--ssr-body--> placeholders is required.`,
		);
	}

	await viteBuild({
		...viteConfig,
		root,
		appType: 'custom',
		plugins: [ripple()],
		build: {
			...viteConfig.build,
			outDir: clientOutDir,
			emptyOutDir: true,
			manifest: true,
			ssrManifest: true,
			rollupOptions: {
				...viteConfig.build?.rollupOptions,
				input: htmlInput,
			},
		},
	});

	console.log('[@ripple-ts/vite-plugin] Client build complete.');

	// =========================================================================
	// Step 2: Server build
	// =========================================================================
	console.log('[@ripple-ts/vite-plugin] Building server...');

	const routes = rippleConfig.router.routes;

	// Generate the virtual server entry source code
	const serverEntryCode = generateServerEntry({
		routes,
		rippleConfigPath: path.join(root, 'ripple.config.ts'),
		htmlTemplatePath: '../client/index.html',
	});

	// Create a Vite plugin to resolve the virtual server entry
	/** @type {import('vite').Plugin} */
	const virtualEntryPlugin = {
		name: 'ripple-virtual-server-entry',
		resolveId(id) {
			if (id === VIRTUAL_SERVER_ENTRY_ID) {
				return RESOLVED_VIRTUAL_SERVER_ENTRY_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_SERVER_ENTRY_ID) {
				return serverEntryCode;
			}
		},
	};

	await viteBuild({
		...viteConfig,
		root,
		appType: 'custom',
		plugins: [virtualEntryPlugin, ripple()],
		build: {
			...viteConfig.build,
			outDir: serverOutDir,
			emptyOutDir: true,
			ssr: true,
			target: 'node18',
			rollupOptions: {
				...viteConfig.build?.rollupOptions,
				input: VIRTUAL_SERVER_ENTRY_ID,
				output: {
					entryFileNames: 'entry.js',
					format: 'esm',
				},
			},
		},
		// Mark adapter packages and ripple as external for SSR
		ssr: {
			external: ['@ripple-ts/adapter', '@ripple-ts/adapter-node', '@ripple-ts/adapter-bun'],
			noExternal: [],
		},
	});

	console.log('[@ripple-ts/vite-plugin] Server build complete.');
	console.log(`[@ripple-ts/vite-plugin] Output: ${outDir}`);
	console.log(`[@ripple-ts/vite-plugin] Start with: node dist/server/entry.js`);
}
