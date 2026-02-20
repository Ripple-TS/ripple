/** @import {PackageJson} from 'type-fest' */
/** @import {Plugin, ResolvedConfig, ViteDevServer} from 'vite' */
/** @import {RipplePluginOptions, RippleConfigOptions, Route, Middleware, RenderRoute} from '@ripple-ts/vite-plugin' */

/// <reference types="ripple/compiler/internal/rpc" />

import { compile } from 'ripple/compiler';
import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';

import { createRouter } from './server/router.js';
import { createContext, runMiddlewareChain } from './server/middleware.js';
import { handleRenderRoute } from './server/render-route.js';
import { handleServerRoute } from './server/server-route.js';

// Re-export route classes
export { RenderRoute, ServerRoute } from './routes.js';

const VITE_FS_PREFIX = '/@fs/';
const IS_WINDOWS = process.platform === 'win32';

// AsyncLocalStorage for request-scoped fetch patching
const rpcContext = new AsyncLocalStorage();

// Patch fetch once at module level to support relative URLs in #server blocks
const originalFetch = globalThis.fetch;

/**
 * Quick check whether a string looks like it already has a URL scheme (e.g. "http://", "https://", "data:").
 * @param {string} url
 * @returns {boolean}
 */
function hasScheme(url) {
	return /^[a-z][a-z0-9+\-.]*:/i.test(url);
}

/**
 * Patch global fetch to resolve relative URLs based on the current request context.
 * This allows server functions in #server blocks to use relative URLs
 * (root-relative like "/api/foo" or path-relative like "api/foo", "./api/foo", "../api/foo")
 * that are resolved against the incoming request's origin.
 * // TODO: a similar logic needs to be ported to the adapters
 * @param {string | Request | URL} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
globalThis.fetch = function (input, init) {
	const context = rpcContext.getStore();

	if (context?.origin) {
		// Handle string URLs — resolve any non-absolute URL against the origin
		if (typeof input === 'string' && !hasScheme(input)) {
			input = new URL(input, context.origin).href;
		}
		// Handle Request objects
		else if (input instanceof Request) {
			const url = input.url;
			if (!hasScheme(url)) {
				input = new Request(new URL(url, context.origin).href, input);
			}
		}
		// Handle URL objects constructed with relative paths
		else if (input instanceof URL) {
			if (!input.protocol || input.protocol === '' || input.origin === 'null') {
				const relative = input.pathname + (input.search || '') + (input.hash || '');
				input = new URL(relative, context.origin);
			}
		}
	}

	return originalFetch(input, init);
};

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

	/** @type {RippleConfigOptions | null} */
	let rippleConfig = null;
	/** @type {ReturnType<typeof createRouter> | null} */
	let router = null;

	/** @type {Plugin[]} */
	const plugins = [
		{
			name: 'vite-plugin-ripple',
			// make sure our resolver runs before vite internal resolver to resolve ripple field correctly
			enforce: 'pre',
			api,

			async config(userConfig) {
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
			 * Configure the dev server with SSR middleware
			 * @param {ViteDevServer} vite
			 */
			configureServer(vite) {
				// Return a function to be called after Vite's internal middlewares
				return async () => {
					// Load ripple.config.ts
					const configPath = path.join(root, 'ripple.config.ts');
					if (!fs.existsSync(configPath)) {
						console.log('[@ripple-ts/vite-plugin] No ripple.config.ts found, skipping SSR setup');
						return;
					}

					try {
						const configModule = await vite.ssrLoadModule(configPath);
						rippleConfig = configModule.default;

						if (!rippleConfig?.router?.routes) {
							console.log('[@ripple-ts/vite-plugin] No routes defined in ripple.config.ts');
							return;
						}

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
							if (url.pathname.startsWith('/_$_ripple_rpc_$_/')) {
								await handleRpcRequest(
									req,
									res,
									url,
									vite,
									rippleConfig.server?.trustProxy ?? false,
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
								const freshConfig = await vite.ssrLoadModule(configPath);
								rippleConfig = freshConfig.default;

								if (!rippleConfig || !rippleConfig.router || !rippleConfig.router.routes) {
									console.log('[@ripple-ts/vite-plugin] No routes defined in ripple.config.ts');
									next();
									return;
								}

								// Check if routes have changed
								if (
									JSON.stringify(freshConfig.default.router.routes) !==
									JSON.stringify(rippleConfig.router.routes)
								) {
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

								// Get global middlewares
								const globalMiddlewares = rippleConfig.middlewares || [];

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
					return `
import { hydrate, mount } from 'ripple';

const data = JSON.parse(document.getElementById('__ripple_data').textContent);
const target = document.getElementById('root');

try {
  const module = await import(/* @vite-ignore */ data.entry);
  const Component =
    module.default ||
    Object.entries(module).find(([key, value]) => typeof value === 'function' && /^[A-Z]/.test(key))?.[1];

  if (!Component || !target) {
    console.error('[ripple] Unable to hydrate route: missing component export or #root target.');
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
export function defineConfig(/** @type {RipplePluginOptions} */ options) {
	return options;
}

// ============================================================================
// Helper functions for dev server
// ============================================================================

/**
 * Derive the request origin (protocol + host) from a Node.js request.
 * Only honors `X-Forwarded-Proto` and `X-Forwarded-Host` headers when
 * `trustProxy` is explicitly enabled; otherwise the protocol comes from the
 * socket and the host from the `Host` header.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {boolean} trustProxy
 * @returns {string}
 */
function deriveOrigin(req, trustProxy) {
	let protocol = /** @type {import('node:tls').TLSSocket} */ (req.socket).encrypted
		? 'https'
		: 'http';
	let host = req.headers.host || 'localhost';

	if (trustProxy) {
		const forwardedProto = req.headers['x-forwarded-proto'];
		const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
		if (proto) {
			protocol = proto.split(',')[0].trim();
		}

		const forwardedHost = req.headers['x-forwarded-host'];
		const fwdHost = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
		if (fwdHost) {
			host = fwdHost.split(',')[0].trim();
		}
	}

	return `${protocol}://${host}`;
}

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
 * Handle RPC requests for #server blocks
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {URL} url
 * @param {import('vite').ViteDevServer} vite
 * @param {boolean} trustProxy
 */
async function handleRpcRequest(req, res, url, vite, trustProxy) {
	// we don't really need trustProxy in vite but leaving it as a model for production adapters
	try {
		const hash = url.pathname.slice('/_$_ripple_rpc_$_/'.length);

		// Get request body
		const body = await getRequestBody(req);

		// Load the RPC module info from globalThis (set during SSR)
		const rpcModules = /** @type {Map<string, [string, string]>} */ (
			/** @type {any} */ (globalThis).rpc_modules
		);
		if (!rpcModules) {
			res.statusCode = 500;
			res.end('RPC modules not initialized');
			return;
		}

		const moduleInfo = rpcModules.get(hash);
		if (!moduleInfo) {
			res.statusCode = 404;
			res.end(`RPC function not found: ${hash}`);
			return;
		}

		const [filePath, funcName] = moduleInfo;

		// Load the module and execute the function
		const { executeServerFunction } = await vite.ssrLoadModule('ripple/server');
		const module = await vite.ssrLoadModule(filePath);
		const server = module._$_server_$_;

		if (!server || !server[funcName]) {
			res.statusCode = 404;
			res.end(`Server function not found: ${funcName}`);
			return;
		}

		const origin = deriveOrigin(req, trustProxy);

		// Execute server function within async context
		// This allows the patched fetch to access the origin without global state
		await rpcContext.run({ origin }, async () => {
			const result = await executeServerFunction(server[funcName], body);

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.end(result);
		});
	} catch (error) {
		console.error('[@ripple-ts/vite-plugin] RPC error:', error);
		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'RPC failed' }));
	}
}

/**
 * Get the body of a request as a string
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function getRequestBody(req) {
	return new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
			if (data.length > 1e6) {
				req.destroy();
				reject(new Error('Request body too large'));
			}
		});
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
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
