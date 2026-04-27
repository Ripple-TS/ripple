import { describe, it, expect, vi, afterEach } from 'vitest';
import { ripple } from '@ripple-ts/vite-plugin';
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

/**
 * Tests for configureServer middleware ordering.
 *
 * Ripple's SSR/API middleware is route-owning middleware. It must be
 * registered as a pre-hook (no return value from configureServer) so
 * it runs before Vite's HTML fallback middleware, which otherwise
 * intercepts non-file GET requests and serves index.html.
 */
describe('configureServer middleware ordering', () => {
	/**
	 * Get the main ripple plugin from the plugin array.
	 * @returns {{ plugin: import('vite').Plugin, plugins: import('vite').Plugin[] }}
	 */
	function getPlugins() {
		const plugins = ripple({ excludeRippleExternalModules: true });
		const plugin = plugins.find((p) => p.name === 'vite-plugin-ripple');
		if (!plugin) throw new Error('vite-plugin-ripple not found in plugin array');
		return { plugin, plugins };
	}

	/**
	 * Create a mock ViteDevServer with just enough surface for configureServer.
	 */
	function createMockVite() {
		/** @type {Function[]} */
		const registeredMiddlewares = [];
		return {
			middlewares: {
				use: vi.fn((/** @type {Function} */ fn) => {
					registeredMiddlewares.push(fn);
				}),
			},
			registeredMiddlewares,
			ssrLoadModule: vi.fn(),
			ssrFixStacktrace: vi.fn(),
			environments: {},
		};
	}

	/**
	 * Call configResolved on the plugin to set up `root` and `config`.
	 * @param {import('vite').Plugin} plugin
	 */
	async function initPlugin(plugin) {
		if (typeof plugin.configResolved === 'function') {
			await plugin.configResolved(
				/** @type {any} */ ({
					root: '/nonexistent-test-root',
					command: 'serve',
				}),
			);
		}
	}

	// --- Unit tests (mocked Vite) ---

	it('uses a pre-hook — configureServer does NOT return a function', async () => {
		const { plugin } = getPlugins();
		const mockVite = createMockVite();

		await initPlugin(plugin);

		const result = plugin.configureServer(/** @type {any} */ (mockVite));

		// A post-hook returns a function (or async function).
		// A pre-hook returns undefined (void).
		expect(result).toBeUndefined();
	});

	it('registers middleware synchronously inside configureServer', async () => {
		const { plugin } = getPlugins();
		const mockVite = createMockVite();

		await initPlugin(plugin);

		plugin.configureServer(/** @type {any} */ (mockVite));

		expect(mockVite.middlewares.use).toHaveBeenCalledTimes(1);
		expect(mockVite.registeredMiddlewares).toHaveLength(1);
		expect(typeof mockVite.registeredMiddlewares[0]).toBe('function');
	});

	it('middleware calls next() when no ripple config exists', async () => {
		const { plugin } = getPlugins();
		const mockVite = createMockVite();

		await initPlugin(plugin);

		plugin.configureServer(/** @type {any} */ (mockVite));

		const middleware = mockVite.registeredMiddlewares[0];
		expect(middleware).toBeDefined();

		/** @type {ReturnType<typeof vi.fn>} */
		let next;
		const nextCalled = new Promise((resolve) => {
			next = vi.fn(() => resolve(undefined));

			const req = /** @type {any} */ ({
				url: '/api/test',
				method: 'GET',
				headers: { host: 'localhost' },
			});

			const res = /** @type {any} */ ({
				statusCode: 200,
				headersSent: false,
				setHeader: vi.fn(),
				end: vi.fn(),
			});

			middleware(req, res, next);
		});

		await nextCalled;

		// @ts-ignore — next is assigned inside the Promise constructor
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('ripple middleware is registered before a simulated html fallback', async () => {
		const { plugin } = getPlugins();
		/** @type {Function[]} */
		const stack = [];

		const mockVite = /** @type {any} */ ({
			middlewares: {
				use: vi.fn((/** @type {Function} */ fn) => {
					stack.push(fn);
				}),
			},
			ssrLoadModule: vi.fn(),
			ssrFixStacktrace: vi.fn(),
			environments: {},
		});

		await initPlugin(plugin);

		const returnValue = plugin.configureServer(mockVite);

		// Our middleware should already be registered (pre-hook)
		expect(stack).toHaveLength(1);

		// Simulate Vite adding its internal html fallback AFTER configureServer
		const htmlFallback = (
			/** @type {any} */ req,
			/** @type {any} */ res,
			/** @type {any} */ _next,
		) => {
			res.setHeader('Content-Type', 'text/html');
			res.end('<html>fallback</html>');
		};
		stack.push(htmlFallback);

		// Ripple middleware is at index 0, html fallback is at index 1
		expect(stack[0]).not.toBe(htmlFallback);
		expect(stack[1]).toBe(htmlFallback);

		if (typeof returnValue === 'function') {
			throw new Error(
				'configureServer returned a function — this is a post-hook pattern ' +
					'which places middleware AFTER viteHtmlFallbackMiddleware. ' +
					'SSR/API routes will be unreachable.',
			);
		}
	});

	// --- Integration tests (real Vite dev server) ---

	/** @type {import('vite').ViteDevServer | null} */
	let server = null;

	afterEach(async () => {
		if (server) {
			await server.close();
			server = null;
		}
	});

	it('middleware is ordered before html fallback in a real Vite server', async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-vite-test-'));
		fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body></body></html>');

		try {
			server = await createServer({
				root: tmpDir,
				configFile: false,
				plugins: [ripple({ excludeRippleExternalModules: true })],
				server: { middlewareMode: true },
				logLevel: 'silent',
			});

			const stack = server.middlewares.stack;

			const rippleIndex = stack.findIndex((/** @type {any} */ layer) => {
				const name = layer.handle?.name || layer.name || '';
				return name === 'rippleDevMiddleware';
			});

			const htmlFallbackIndex = stack.findIndex((/** @type {any} */ layer) => {
				const name = layer.handle?.name || layer.name || '';
				return name.includes('htmlFallback') || name.includes('HtmlFallback');
			});

			// Our middleware must exist in the stack
			expect(rippleIndex).toBeGreaterThanOrEqual(0);

			// If Vite has an HTML fallback, our middleware must come before it
			if (htmlFallbackIndex !== -1) {
				expect(rippleIndex).toBeLessThan(htmlFallbackIndex);
			}
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it('non-ripple requests pass through to next middleware', async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-vite-test-'));
		fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body>hello</body></html>');

		try {
			server = await createServer({
				root: tmpDir,
				configFile: false,
				plugins: [ripple({ excludeRippleExternalModules: true })],
				server: { middlewareMode: true },
				logLevel: 'silent',
			});

			const response = await new Promise((resolve) => {
				const req = /** @type {any} */ ({
					url: '/',
					method: 'GET',
					headers: { host: 'localhost', accept: 'text/html' },
					on: () => {},
					removeListener: () => {},
				});

				const chunks = [];
				const res = /** @type {any} */ ({
					statusCode: 200,
					headersSent: false,
					_headers: {},
					setHeader(key, val) {
						this._headers[key] = val;
					},
					getHeader(key) {
						return this._headers[key];
					},
					writeHead(status, headers) {
						this.statusCode = status;
						if (headers) Object.assign(this._headers, headers);
					},
					write(chunk) {
						chunks.push(chunk);
					},
					end(chunk) {
						if (chunk) chunks.push(chunk);
						resolve({
							statusCode: this.statusCode,
							headers: this._headers,
							body: Buffer.concat(
								chunks.map((c) => (typeof c === 'string' ? Buffer.from(c) : c)),
							).toString(),
						});
					},
					on: () => {},
					removeListener: () => {},
				});

				server.middlewares.handle(req, res);
			});

			// Ripple middleware passed through and Vite handled the request
			expect(response.statusCode).toBe(200);
			expect(response.body).toContain('hello');
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});
