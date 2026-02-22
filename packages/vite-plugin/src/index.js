/** @import {PackageJson} from 'type-fest' */
/** @import {Plugin, ResolvedConfig, ViteDevServer} from 'vite' */
/** @import {RipplePluginOptions, RippleConfigOptions, ResolvedRippleConfig, Route, Middleware, RenderRoute} from '@ripple-ts/vite-plugin' */

/// <reference types="ripple/compiler/internal/rpc" />

import { compile } from 'ripple/compiler';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';

import { createRouter } from './server/router.js';
import { createContext, runMiddlewareChain } from './server/middleware.js';
import { handleRenderRoute } from './server/render-route.js';
import { handleServerRoute } from './server/server-route.js';
import { generateServerEntry } from './server/virtual-entry.js';
import {
	getRippleConfigPath,
	loadRippleConfig,
	resolveRippleConfig,
	rippleConfigExists,
} from './load-config.js';
import { ENTRY_FILENAME } from './constants.js';

import { patch_global_fetch, is_rpc_request, handle_rpc_request } from '@ripple-ts/adapter/rpc';

// Re-export route classes
export { RenderRoute, ServerRoute } from './routes.js';

const VITE_FS_PREFIX = '/@fs/';
const IS_WINDOWS = process.platform === 'win32';

// Dev server always runs in Node — use node:async_hooks as default runtime
// If the user provides adapter.runtime in their config, that will be used instead.
import { AsyncLocalStorage } from 'node:async_hooks';

/** @type {import('@ripple-ts/adapter/rpc').AsyncContext | null} */
let devAsyncContext = null;

/**
 * Get (or lazily create) the dev server's async context.
 * Uses adapter.runtime.createAsyncContext() if available, otherwise
 * falls back to Node.js AsyncLocalStorage (always available in dev).
 *
 * @param {RippleConfigOptions | null} config
 * @returns {import('@ripple-ts/adapter/rpc').AsyncContext}
 */
function getDevAsyncContext(config) {
	if (devAsyncContext) return devAsyncContext;

	const adapterRuntime = config?.adapter?.runtime;
	if (adapterRuntime?.createAsyncContext) {
		devAsyncContext = adapterRuntime.createAsyncContext();
	} else {
		// Fallback: dev always runs in Node
		const als = new AsyncLocalStorage();
		devAsyncContext = {
			run: (store, fn) => als.run(store, fn),
			getStore: () => als.getStore(),
		};
	}

	// Patch fetch once using the async context
	patch_global_fetch(devAsyncContext);

	return devAsyncContext;
}

/**
 * @param {string} filename
 * @param {ResolvedConfig['root']} root
 * @returns {boolean}
 */
function existsInRoot(filename, root) {
	if (filename.startsWith(VITE_FS_PREFIX)) {
		return false; // vite already tagged it as out of root
	}
	return fs.existsSync(root + filename);
}

/**
 * @param {string} filename
 * @param {ResolvedConfig['root']} root
 * @param {'style'} type
 * @returns {string}
 */
function createVirtualImportId(filename, root, type) {
	const parts = ['ripple', `type=${type}`];
	if (type === 'style') {
		parts.push('lang.css');
	}
	if (existsInRoot(filename, root)) {
		filename = root + filename;
	} else if (filename.startsWith(VITE_FS_PREFIX)) {
		filename = IS_WINDOWS
			? filename.slice(VITE_FS_PREFIX.length) // remove /@fs/ from /@fs/C:/...
			: filename.slice(VITE_FS_PREFIX.length - 1); // remove /@fs from /@fs/home/user
	}
	// return same virtual id format as vite-plugin-vue eg ...App.ripple?ripple&type=style&lang.css
	return `${filename}?${parts.join('&')}`;
}

/**
 * Check if a package contains Ripple source files by examining its package.json
 * @param {string} packageJsonPath
 * @param {string} subpath - The subpath being imported (e.g., '.' or './foo')
 * @returns {boolean}
 */
function hasRippleSource(packageJsonPath, subpath = '.') {
	try {
		/** @type {PackageJson} */
		const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

		// Check if main/module/exports point to .ripple files
		/** @param {string | undefined} p */
		const checkPath = (p) => p && typeof p === 'string' && p.endsWith('.ripple');

		// Handle exports field (modern)
		if (pkgJson.exports) {
			/**
			 * @param {PackageJson.Exports} exports
			 * @returns {string | null}
			 */
			const resolveExport = (exports) => {
				if (typeof exports === 'string') {
					return exports;
				}
				if (typeof exports === 'object' && exports !== null) {
					// Try import condition first, then default
					const exp = /** @type {Record<string, PackageJson.Exports>} */ (exports);
					if (typeof exp.import === 'string') {
						return exp.import;
					}
					if (typeof exp.default === 'string') {
						return exp.default;
					}
					// Recursively check nested conditions
					for (const value of Object.values(exp)) {
						const resolved = resolveExport(value);
						if (resolved) return resolved;
					}
				}
				return null;
			};

			// Get the exports value for the subpath
			/** @type {PackageJson.Exports | undefined} */
			const exportsValue =
				typeof pkgJson.exports === 'string'
					? pkgJson.exports
					: typeof pkgJson.exports === 'object' && pkgJson.exports !== null
						? /** @type {Record<string, PackageJson.Exports>} */ (pkgJson.exports)[subpath]
						: undefined;

			if (exportsValue) {
				const resolved = resolveExport(exportsValue);
				if (resolved && checkPath(resolved)) {
					return true;
				}
			}
		}

		// Fallback to main/module for root imports
		if (subpath === '.') {
			if (checkPath(pkgJson.main) || checkPath(pkgJson.module)) {
				return true;
			}
		}

		// Last resort: scan the package directory for .ripple files
		const packageDir = packageJsonPath.replace('/package.json', '');
		return hasRippleFilesInDirectory(packageDir);
	} catch (e) {
		return false;
	}
}

/**
 * Recursively check if a directory contains any .ripple files
 * @param {string} dir
 * @param {number} [maxDepth=3]
 * @returns {boolean}
 */
function hasRippleFilesInDirectory(dir, maxDepth = 3) {
	if (maxDepth <= 0) return false;

	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			// Skip node_modules and hidden directories
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
				continue;
			}

			if (entry.isFile() && entry.name.endsWith('.ripple')) {
				return true;
			}

			if (entry.isDirectory()) {
				const subDir = dir + '/' + entry.name;
				if (hasRippleFilesInDirectory(subDir, maxDepth - 1)) {
					return true;
				}
			}
		}
	} catch (e) {
		// Ignore errors
	}

	return false;
}

/**
 * Try to resolve a package's package.json from node_modules
 * @param {string} packageName
 * @param {string} fromDir
 * @returns {string | null}
 */
function resolvePackageJson(packageName, fromDir) {
	try {
		const require = createRequire(fromDir + '/package.json');
		const packagePath = require.resolve(packageName + '/package.json');
		return packagePath;
	} catch (e) {
		return null;
	}
}

/**
 * Scan node_modules for packages containing Ripple source files
 * @param {string} rootDir
 * @returns {string[]}
 */
function scanForRipplePackages(rootDir) {
	/** @type {string[]} */
	const ripplePackages = [];
	const nodeModulesPath = rootDir + '/node_modules';

	if (!fs.existsSync(nodeModulesPath)) {
		return ripplePackages;
	}

	try {
		// Read all directories in node_modules
		const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });

		for (const entry of entries) {
			// Skip .pnpm and other hidden directories
			if (entry.name.startsWith('.')) continue;

			// Handle scoped packages (@org/package)
			if (entry.name.startsWith('@')) {
				const scopePath = nodeModulesPath + '/' + entry.name;
				try {
					const scopedEntries = fs.readdirSync(scopePath, { withFileTypes: true });

					for (const scopedEntry of scopedEntries) {
						if (scopedEntry.name.startsWith('.')) continue;
						const packageName = entry.name + '/' + scopedEntry.name;
						const pkgPath = scopePath + '/' + scopedEntry.name;

						// Follow symlinks to get the real path
						const realPath = fs.realpathSync(pkgPath);
						const pkgJsonPath = realPath + '/package.json';

						if (fs.existsSync(pkgJsonPath) && hasRippleSource(pkgJsonPath, '.')) {
							ripplePackages.push(packageName);
						}
					}
				} catch (e) {
					// Skip if can't read scoped directory
				}
			} else {
				// Regular package
				const pkgPath = nodeModulesPath + '/' + entry.name;

				try {
					// Follow symlinks to get the real path
					const realPath = fs.realpathSync(pkgPath);
					const pkgJsonPath = realPath + '/package.json';

					if (fs.existsSync(pkgJsonPath) && hasRippleSource(pkgJsonPath, '.')) {
						ripplePackages.push(entry.name);
					}
				} catch (e) {
					// Skip if can't resolve symlink
				}
			}
		}
	} catch (e) {
		// Ignore errors during scanning
	}

	return ripplePackages;
}

/**
 * @param {RipplePluginOptions} [inlineOptions]
 * @returns {Plugin[]}
 */
export function ripple(inlineOptions = {}) {
	const { excludeRippleExternalModules = false } = inlineOptions;
	const api = {};
	/** @type {ResolvedConfig['root']} */
	let root;
	/** @type {ResolvedConfig} */
	let config;
	const ripplePackages = new Set();
	const cssCache = new Map();

	/** @type {ResolvedRippleConfig | null} */
	let rippleConfig = null;
	/** @type {ReturnType<typeof createRouter> | null} */
	let router = null;

	/** @type {boolean} */
	let isBuild = false;
	/** @type {boolean} */
	let isSSRBuild = false;

	/** @type {string[]} Render route entry paths for client hydration import map */
	let renderRouteEntries = [];
	/** @type {ResolvedRippleConfig | null} Cached config from buildStart (reused in closeBundle) */
	let loadedRippleConfig = null;
	/** @type {Set<string>} File paths (relative to root) of .ripple modules with #server blocks */
	const serverBlockModules = new Set();

	/** @type {Plugin[]} */
	const plugins = [
		{
			name: 'vite-plugin-ripple',
			// make sure our resolver runs before vite internal resolver to resolve ripple field correctly
			enforce: 'pre',
			api,

			async config(userConfig, { command }) {
				isBuild = command === 'build';
				isSSRBuild = !!userConfig.build?.ssr;

				// In build mode (client build, not the SSR sub-build), configure for production
				if (isBuild && !isSSRBuild) {
					const projectRoot = userConfig.root || process.cwd();

					if (rippleConfigExists(projectRoot)) {
						const htmlInput = path.join(projectRoot, 'index.html');
						if (!fs.existsSync(htmlInput)) {
							throw new Error(
								'[@ripple-ts/vite-plugin] index.html not found. ' +
									'Required for SSR builds with ripple.config.ts.',
							);
						}

						console.log(
							'[@ripple-ts/vite-plugin] Detected ripple.config.ts — configuring client build',
						);

						// Load ripple.config.ts early so build options (e.g. minify) can
						// influence the client build config returned from this hook.
						// The loaded config is cached and reused by
						// buildStart and closeBundle.
						loadedRippleConfig = await loadRippleConfig(projectRoot);

						const outDir = loadedRippleConfig.build.outDir;

						// Build Rollup inputs: HTML template + each page entry as a
						// separate input. This gives Vite proper per-page code splitting
						// and produces manifest entries for each page chunk.
						/** @type {Record<string, string>} */
						const rollupInput = { main: htmlInput };

						const renderRoutes = loadedRippleConfig.router.routes.filter(
							(/** @type {Route} */ r) => r.type === 'render',
						);
						const uniqueEntries = [
							...new Set(renderRoutes.map((/** @type {RenderRoute} */ r) => r.entry)),
						];
						for (const entry of uniqueEntries) {
							const sourcePath = entry.startsWith('/') ? entry.slice(1) : entry;
							rollupInput[sourcePath] = path.join(projectRoot, sourcePath);
						}
						console.log(
							`[@ripple-ts/vite-plugin] Adding ${uniqueEntries.length} page entry/entries as Rollup inputs`,
						);

						/** @type {import('vite').UserConfig['build']} */
						const buildConfig = {
							outDir: `${outDir}/client`,
							emptyOutDir: true,
							manifest: true,
							rollupOptions: {
								input: rollupInput,
							},
						};

						// Only override minify when explicitly set in ripple.config.ts;
						// otherwise let Vite's default (esbuild) apply.
						if (loadedRippleConfig.build.minify !== undefined) {
							buildConfig.minify = loadedRippleConfig.build.minify;
						}

						return {
							appType: 'custom',
							build: buildConfig,
						};
					}
				}

				if (excludeRippleExternalModules) {
					return {
						optimizeDeps: {
							exclude: userConfig.optimizeDeps?.exclude || [],
						},
					};
				}

				// Scan node_modules for Ripple packages early
				console.log('[@ripple-ts/vite-plugin] Scanning for Ripple packages...');
				const detectedPackages = scanForRipplePackages(userConfig.root || process.cwd());
				detectedPackages.forEach((pkg) => {
					ripplePackages.add(pkg);
				});
				const existingExclude = userConfig.optimizeDeps?.exclude || [];
				console.log('[@ripple-ts/vite-plugin] Scan complete. Found:', detectedPackages);
				console.log(
					`[@ripple-ts/vite-plugin] Original vite.config 'optimizeDeps.exclude':`,
					existingExclude,
				);
				// Merge with existing exclude list
				const allExclude = [...new Set([...existingExclude, ...ripplePackages])];

				console.log(`[@ripple-ts/vite-plugin] Merged 'optimizeDeps.exclude':`, allExclude);
				console.log(
					'[@ripple-ts/vite-plugin] Pass',
					{ excludeRippleExternalModules: true },
					`option to the 'ripple' plugin to skip this scan.`,
				);

				// Return a config hook that will merge with user's config
				return {
					optimizeDeps: {
						exclude: allExclude,
					},
				};
			},

			async configResolved(resolvedConfig) {
				root = resolvedConfig.root;
				config = resolvedConfig;
			},

			/**
			 * Load render route entries before the client build so virtual:ripple-hydrate
			 * can generate static import() calls that Vite will bundle.
			 */
			async buildStart() {
				if (!isBuild || isSSRBuild) return;

				// Reuse config loaded in the config hook if available;
				// otherwise load it now as a fallback.
				if (!loadedRippleConfig) {
					if (!rippleConfigExists(root)) return;
					loadedRippleConfig = await loadRippleConfig(root);
				}

				renderRouteEntries = loadedRippleConfig.router.routes
					.filter((/** @type {Route} */ r) => r.type === 'render')
					.map((/** @type {RenderRoute} */ r) => r.entry);

				// Deduplicate entries (multiple routes can share the same component)
				renderRouteEntries = [...new Set(renderRouteEntries)];

				console.log(
					`[@ripple-ts/vite-plugin] Found ${renderRouteEntries.length} render route(s) for client hydration`,
				);
			},

			/**
			 * Configure the dev server with SSR middleware
			 * @param {ViteDevServer} vite
			 */
			configureServer(vite) {
				// Return a function to be called after Vite's internal middlewares
				return async () => {
					if (!rippleConfigExists(root)) return;

					try {
						rippleConfig = await loadRippleConfig(root, { vite });

						// Create router from config
						router = createRouter(rippleConfig.router.routes);
						console.log(
							`[@ripple-ts/vite-plugin] Loaded ${rippleConfig.router.routes.length} routes from ripple.config.ts`,
						);
					} catch (error) {
						console.error('[@ripple-ts/vite-plugin] Failed to load ripple.config.ts:', error);
						return;
					}

					// Add SSR middleware
					vite.middlewares.use((req, res, next) => {
						// Handle async logic in an IIFE
						(async () => {
							// Skip if no router
							if (!router || !rippleConfig) {
								next();
								return;
							}

							const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
							const method = req.method || 'GET';

							// Handle RPC requests for #server blocks
							if (is_rpc_request(url.pathname)) {
								await handleRpcRequest(
									req,
									res,
									vite,
									rippleConfig.server.trustProxy,
									rippleConfig,
								);
								return;
							}

							// Match route
							const match = router.match(method, url.pathname);

							if (!match) {
								next();
								return;
							}

							try {
								// Reload config to get fresh routes (for HMR)
								const previousRoutes = rippleConfig.router.routes;
								const freshConfig = await loadRippleConfig(root, { vite });
								if (freshConfig) {
									rippleConfig = freshConfig;
								}

								// Check if routes have changed
								if (JSON.stringify(previousRoutes) !== JSON.stringify(rippleConfig.router.routes)) {
									console.log(
										`[@ripple-ts/vite-plugin] Detected route changes. Re-loading ${rippleConfig.router.routes.length} routes from ripple.config.ts`,
									);
								}

								router = createRouter(rippleConfig.router.routes);

								// Re-match with fresh router
								const freshMatch = router.match(method, url.pathname);
								if (!freshMatch) {
									next();
									return;
								}

								// Create context
								const request = nodeRequestToWebRequest(req);
								const context = createContext(request, freshMatch.params);

								const globalMiddlewares = rippleConfig.middlewares;

								let response;

								if (freshMatch.route.type === 'render') {
									// Handle RenderRoute with global middlewares
									response = await runMiddlewareChain(
										context,
										globalMiddlewares,
										freshMatch.route.before || [],
										async () =>
											handleRenderRoute(
												/** @type {RenderRoute} */ (freshMatch.route),
												context,
												vite,
											),
										[],
									);
								} else {
									// Handle ServerRoute
									response = await handleServerRoute(freshMatch.route, context, globalMiddlewares);
								}

								// Send response
								await sendWebResponse(res, response);
							} catch (/** @type {any} */ error) {
								console.error('[@ripple-ts/vite-plugin] Request error:', error);
								vite.ssrFixStacktrace(error);

								res.statusCode = 500;
								res.setHeader('Content-Type', 'text/html');
								res.end(
									`<pre style="color: red; background: #1a1a1a; padding: 2rem; margin: 0;">${escapeHtml(
										error instanceof Error ? error.stack || error.message : String(error),
									)}</pre>`,
								);
							}
						})().catch((err) => {
							console.error('[@ripple-ts/vite-plugin] Unhandled middleware error:', err);
							if (!res.headersSent) {
								res.statusCode = 500;
								res.end('Internal Server Error');
							}
						});
					});
				};
			},

			/**
			 * Inject the hydration script into the HTML template during build.
			 * In dev mode, this is handled by render-route.js instead.
			 */
			transformIndexHtml: {
				order: 'pre',
				handler(html) {
					if (!isBuild || isSSRBuild) return html;

					// Inject the hydration client entry script before </body>
					const hydrationScript = `<script type="module" src="virtual:ripple-hydrate"></script>`;
					return html.replace('</body>', `${hydrationScript}\n</body>`);
				},
			},

			/**
			 * After the client build completes, trigger the SSR server build.
			 * This only runs for the primary (non-SSR) build.
			 */
			async closeBundle() {
				if (!isBuild || isSSRBuild) return;

				// Reuse config loaded in buildStart, or load it now as fallback
				if (!loadedRippleConfig) {
					if (!rippleConfigExists(root)) return;
					loadedRippleConfig = await loadRippleConfig(root);
				}

				console.log('[@ripple-ts/vite-plugin] Client build done. Starting server build...');

				// Re-resolve with adapter validation for production builds.
				// loadRippleConfig already resolved the config, but the adapter
				// is only required for production server builds.
				loadedRippleConfig = resolveRippleConfig(loadedRippleConfig, { requireAdapter: true });

				const outDir = loadedRippleConfig.build.outDir;

				// ------------------------------------------------------------------
				// Read Vite's client manifest and build a per-route asset map.
				// This lets the production server emit <link rel="stylesheet"> and
				// <link rel="modulepreload"> tags for every CSS/JS file a page
				// needs (including transitive dependencies).
				// ------------------------------------------------------------------
				const clientOutDir = path.join(root, outDir, 'client');
				const manifestPath = path.join(clientOutDir, '.vite', 'manifest.json');

				/** @type {Record<string, { file: string, css?: string[], imports?: string[], name?: string }>} */
				let clientManifest = {};
				if (fs.existsSync(manifestPath)) {
					clientManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
				} else {
					console.warn(
						'[@ripple-ts/vite-plugin] Client manifest not found at',
						manifestPath,
						'— asset preloading will be unavailable',
					);
				}

				/**
				 * Recursively collect all CSS files from a manifest entry and its
				 * imports, avoiding cycles via a visited set.
				 * @param {string} key - Manifest key (source-relative path)
				 * @param {Set<string>} [visited] - Already visited keys
				 * @returns {string[]}
				 */
				const collectCss = (key, visited = new Set()) => {
					if (visited.has(key)) return [];
					visited.add(key);
					const entry = clientManifest[key];
					if (!entry) return [];
					/** @type {string[]} */
					const css = [...(entry.css || [])];
					for (const imp of entry.imports || []) {
						css.push(...collectCss(imp, visited));
					}
					return css;
				};

				// Build a map of route entry → { js, css } from the manifest
				/** @type {Record<string, { js: string, css: string[] }>} */
				const clientAssetMap = {};

				const renderRoutes = loadedRippleConfig.router.routes.filter(
					(/** @type {Route} */ r) => r.type === 'render',
				);
				const uniqueEntries = [
					...new Set(renderRoutes.map((/** @type {RenderRoute} */ r) => r.entry)),
				];

				for (const entry of uniqueEntries) {
					const manifestKey = entry.startsWith('/') ? entry.slice(1) : entry;
					const manifestEntry = clientManifest[manifestKey];
					if (manifestEntry) {
						clientAssetMap[entry] = {
							js: manifestEntry.file,
							css: [...new Set(collectCss(manifestKey))],
						};
					}
				}

				// Find the hydrate runtime entry in the manifest
				let hydrateJsAsset = '';
				for (const [key, value] of Object.entries(clientManifest)) {
					if (key.includes('virtual:ripple-hydrate') || value.name === '__ripple_hydrate') {
						hydrateJsAsset = value.file;
						break;
					}
				}

				if (hydrateJsAsset) {
					// Store as a special key so the server can modulepreload it
					clientAssetMap.__hydrate_js = { js: hydrateJsAsset, css: [] };
				}

				console.log(
					`[@ripple-ts/vite-plugin] Built client asset map for ${Object.keys(clientAssetMap).length} entries`,
				);

				// Remove the .vite folder from the client build output.
				// The manifest was only needed at build time to construct the
				// clientAssetMap above. Leaving it in dist/client would expose
				// source file paths publicly via the static file server.
				const viteMetaDir = path.join(clientOutDir, '.vite');
				try {
					fs.rmSync(viteMetaDir, { recursive: true, force: true });
					console.log('[@ripple-ts/vite-plugin] Removed .vite metadata from client output');
				} catch {
					// Non-fatal — warn but continue
					console.warn('[@ripple-ts/vite-plugin] Could not remove .vite folder from client output');
				}

				// Generate the virtual server entry
				const serverEntryCode = generateServerEntry({
					routes: loadedRippleConfig.router.routes,
					rippleConfigPath: getRippleConfigPath(root),
					htmlTemplatePath: './index.html',
					rpcModulePaths: [...serverBlockModules],
					clientAssetMap,
				});

				const VIRTUAL_SERVER_ENTRY_ID = 'virtual:ripple-server-entry';
				const RESOLVED_VIRTUAL_SERVER_ENTRY_ID = '\0' + VIRTUAL_SERVER_ENTRY_ID;

				/** @type {Plugin} */
				const virtualEntryPlugin = {
					name: 'ripple-virtual-server-entry',
					resolveId(id) {
						if (id === VIRTUAL_SERVER_ENTRY_ID) return RESOLVED_VIRTUAL_SERVER_ENTRY_ID;
					},
					load(id) {
						if (id === RESOLVED_VIRTUAL_SERVER_ENTRY_ID) return serverEntryCode;
					},
				};

				const serverOutDir = path.join(root, outDir, 'server');

				// Do NOT add ripple() here — the user's vite.config.ts (loaded automatically
				// from `root`) already includes it. Adding another instance causes double
				// compilation of .ripple files.
				const { build: viteBuild } = await import('vite');
				try {
					await viteBuild({
						root,
						appType: 'custom',
						plugins: [virtualEntryPlugin],
						build: {
							outDir: serverOutDir,
							emptyOutDir: true,
							ssr: true,
							target: loadedRippleConfig?.build?.target,
							minify: loadedRippleConfig?.build?.minify ?? false,
							rollupOptions: {
								input: VIRTUAL_SERVER_ENTRY_ID,
								output: {
									entryFileNames: ENTRY_FILENAME,
									format: 'esm',
								},
							},
						},
						ssr: {
							external: [
								'@ripple-ts/adapter',
								'@ripple-ts/adapter-node',
								'@ripple-ts/adapter-bun',
								'@ripple-ts/adapter-vercel',
							],
							noExternal: [],
						},
					});

					// Copy the HTML template into the server output so the server
					// entry is self-contained and doesn't depend on dist/client/.
					// This is critical for platforms like Vercel where dist/client/
					// is served as static files and index.html would be returned as-is
					// (with unresolved SSR placeholders) instead of going through SSR.
					const clientHtml = path.join(clientOutDir, 'index.html');
					const serverHtml = path.join(serverOutDir, 'index.html');
					if (fs.existsSync(clientHtml)) {
						fs.copyFileSync(clientHtml, serverHtml);
						console.log('[@ripple-ts/vite-plugin] Copied HTML template to server output');
					}

					console.log('[@ripple-ts/vite-plugin] Server build complete.');
					console.log(`[@ripple-ts/vite-plugin] Output: ${path.join(root, outDir)}`);
					console.log(
						`[@ripple-ts/vite-plugin] Start with: node ${outDir}/server/${ENTRY_FILENAME}`,
					);
				} catch (/** @type {any} */ error) {
					console.error('[@ripple-ts/vite-plugin] Server build failed:', error);
					throw new Error(
						`Server build failed: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			},

			async resolveId(id, importer, options) {
				// Handle virtual hydrate module
				if (id === 'virtual:ripple-hydrate') {
					return '\0virtual:ripple-hydrate';
				}

				// Skip non-package imports (relative/absolute paths)
				if (id.startsWith('.') || id.startsWith('/') || id.includes(':')) {
					return null;
				}

				// Extract package name and subpath (handle scoped packages)
				let packageName;
				let subpath = '.';

				if (id.startsWith('@')) {
					const parts = id.split('/');
					packageName = parts.slice(0, 2).join('/');
					subpath = parts.length > 2 ? './' + parts.slice(2).join('/') : '.';
				} else {
					const parts = id.split('/');
					packageName = parts[0];
					subpath = parts.length > 1 ? './' + parts.slice(1).join('/') : '.';
				}

				// Skip if already detected
				if (ripplePackages.has(packageName)) {
					return null;
				}

				// Try to find package.json
				const pkgJsonPath = resolvePackageJson(packageName, root || process.cwd());

				if (pkgJsonPath && hasRippleSource(pkgJsonPath, subpath)) {
					ripplePackages.add(packageName);

					// If we're in dev mode and config is available, update optimizeDeps
					if (config?.command === 'serve') {
						console.log(`[@ripple-ts/vite-plugin] Detected Ripple source package: ${packageName}`);
					}
				}

				return null; // Let Vite handle the actual resolution
			},

			async load(id, opts) {
				// Handle virtual hydrate module
				if (id === '\0virtual:ripple-hydrate') {
					if (isBuild && renderRouteEntries.length > 0) {
						// Production: generate static import map so Vite bundles page components
						const importMapLines = renderRouteEntries
							.map((entry) => `  ${JSON.stringify(entry)}: () => import(${JSON.stringify(entry)}),`)
							.join('\n');

						// IMPORTANT: Use async IIFE instead of top-level await.
						// The page modules statically import from the main bundle (which contains
						// the runtime). If we used top-level await here, it would deadlock:
						// main bundle awaits page module import → page module awaits main bundle's
						// TLA to complete → circular wait.
						return `
import { hydrate, mount } from 'ripple';

const routeModules = {
${importMapLines}
};

(async () => {
  try {
    const data = JSON.parse(document.getElementById('__ripple_data').textContent);
    const target = document.getElementById('root');
    const loadModule = routeModules[data.entry];

    if (!loadModule) {
      console.error('[ripple] No client module for route:', data.entry);
      return;
    }

    const module = await loadModule();
    const Component =
      module.default ||
      Object.entries(module).find(([key, value]) => typeof value === 'function' && /^[A-Z]/.test(key))?.[1];

    if (!Component || !target) {
      console.error('[ripple] Unable to hydrate route: missing component export or #root target.');
      return;
    }

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
  } catch (error) {
    console.error('[ripple] Failed to bootstrap client hydration.', error);
  }
})();
`;
					}

					// Dev mode: use async IIFE to avoid top-level await deadlock
					// (same reason as production — page modules import from the main bundle)
					return `
import { hydrate, mount } from 'ripple';

(async () => {
  try {
    const data = JSON.parse(document.getElementById('__ripple_data').textContent);
    const target = document.getElementById('root');
    const module = await import(/* @vite-ignore */ data.entry);
    const Component =
      module.default ||
      Object.entries(module).find(([key, value]) => typeof value === 'function' && /^[A-Z]/.test(key))?.[1];

    if (!Component || !target) {
      console.error('[ripple] Unable to hydrate route: missing component export or #root target.');
      return;
    }

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
  } catch (error) {
    console.error('[ripple] Failed to bootstrap client hydration.', error);
  }
})();
`;
				}

				if (cssCache.has(id)) {
					return cssCache.get(id);
				}
			},

			transform: {
				filter: { id: /\.ripple$/ },

				async handler(code, id, opts) {
					const filename = id.replace(root, '');
					const ssr = opts?.ssr === true || this.environment.config.consumer === 'server';

					const { js, css } = await compile(code, filename, {
						mode: ssr ? 'server' : 'client',
						dev: config?.command === 'serve',
					});

					// Track modules with #server blocks for RPC (client build only)
					if (isBuild && !ssr && js.code.includes('_$_.rpc(')) {
						serverBlockModules.add(filename);
					}

					if (css !== '') {
						const cssId = createVirtualImportId(filename, root, 'style');
						cssCache.set(cssId, css);
						js.code += `\nimport ${JSON.stringify(cssId)};\n`;
					}

					return js;
				},
			},
		},
	];

	return plugins;
}

// This is mainly to enforce types and provide a better DX with types than anything else
export function defineConfig(/** @type {RippleConfigOptions} */ options) {
	return options;
}

// ============================================================================
// Helper functions for dev server
// ============================================================================

/**
 * Convert a Node.js IncomingMessage to a Web Request
 * @param {import('node:http').IncomingMessage} nodeRequest
 * @returns {Request}
 */
function nodeRequestToWebRequest(nodeRequest) {
	const protocol = 'http';
	const host = nodeRequest.headers.host || 'localhost';
	const url = new URL(nodeRequest.url || '/', `${protocol}://${host}`);

	const headers = new Headers();
	for (const [key, value] of Object.entries(nodeRequest.headers)) {
		if (value == null) continue;
		if (Array.isArray(value)) {
			for (const v of value) headers.append(key, v);
		} else {
			headers.set(key, value);
		}
	}

	const method = (nodeRequest.method || 'GET').toUpperCase();
	/** @type {RequestInit & { duplex?: 'half' }} */
	const init = { method, headers };

	// Add body for non-GET/HEAD requests
	if (method !== 'GET' && method !== 'HEAD') {
		init.body = /** @type {any} */ (Readable.toWeb(nodeRequest));
		init.duplex = 'half';
	}

	return new Request(url, init);
}

/**
 * Send a Web Response to a Node.js ServerResponse
 * @param {import('node:http').ServerResponse} nodeResponse
 * @param {Response} webResponse
 */
async function sendWebResponse(nodeResponse, webResponse) {
	nodeResponse.statusCode = webResponse.status;
	if (webResponse.statusText) {
		nodeResponse.statusMessage = webResponse.statusText;
	}

	// Copy headers
	webResponse.headers.forEach((value, key) => {
		nodeResponse.setHeader(key, value);
	});

	// Send body
	if (webResponse.body) {
		const reader = webResponse.body.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				nodeResponse.write(value);
			}
		} finally {
			reader.releaseLock();
		}
	}

	nodeResponse.end();
}

/**
 * Handle RPC requests for #server blocks in dev mode.
 *
 * Delegates to the shared `handle_rpc_request` from `@ripple-ts/adapter/rpc`,
 * providing a dev-specific `resolveFunction` that uses Vite's `ssrLoadModule`
 * and `globalThis.rpc_modules` (populated by the compiler during SSR).
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {import('vite').ViteDevServer} vite
 * @param {boolean} trustProxy
 * @param {RippleConfigOptions | null} config
 */
async function handleRpcRequest(req, res, vite, trustProxy, config) {
	try {
		// Convert Node request to Web Request for the shared handler
		const webRequest = nodeRequestToWebRequest(req);
		const asyncContext = getDevAsyncContext(config);

		const response = await handle_rpc_request(webRequest, {
			async resolveFunction(hash) {
				const rpcModules = /** @type {Map<string, [string, string]>} */ (
					/** @type {any} */ (globalThis).rpc_modules
				);
				if (!rpcModules) return null;

				const moduleInfo = rpcModules.get(hash);
				if (!moduleInfo) return null;

				const [filePath, funcName] = moduleInfo;
				const module = await vite.ssrLoadModule(filePath);
				const server = module._$_server_$_;

				if (!server || !server[funcName]) return null;
				return server[funcName];
			},
			async executeServerFunction(fn, body) {
				const { executeServerFunction } = await vite.ssrLoadModule('ripple/server');
				return executeServerFunction(fn, body);
			},
			asyncContext,
			trustProxy,
		});

		await sendWebResponse(res, response);
	} catch (error) {
		console.error('[@ripple-ts/vite-plugin] RPC error:', error);
		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'RPC failed' }));
	}
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
