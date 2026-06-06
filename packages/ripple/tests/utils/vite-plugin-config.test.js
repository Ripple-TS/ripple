import { describe, expect, it } from 'vitest';
import { RenderRoute, resolveRippleConfig } from '@ripple-ts/vite-plugin';

describe('vite-plugin-ripple config resolution', () => {
	it('preserves routes and applies defaults', () => {
		const route = new RenderRoute({
			path: '/',
			entry: '/src/App.tsrx',
		});
		const config = resolveRippleConfig({
			router: {
				routes: [route],
			},
		});

		expect(config.router.routes).toEqual([route]);
		expect(config.middlewares).toEqual([]);
		expect(config.platform.env).toEqual({});
		expect(config.server.trustProxy).toBe(false);
		expect(config.rootBoundary).toEqual({});
		expect(config.build.outDir).toBe('dist');
	});

	it('defaults routes to an empty array', () => {
		const config = resolveRippleConfig({
			router: {
				routes: [],
			},
		});

		expect(config.router.routes).toEqual([]);
	});

	it('allows configs without routes', () => {
		const config = resolveRippleConfig({
			middlewares: [() => {}],
			platform: {
				env: {
					API_URL: 'https://example.com',
				},
			},
			server: {
				trustProxy: true,
			},
		});

		expect(config.router.routes).toEqual([]);
		expect(config.middlewares).toHaveLength(1);
		expect(config.platform.env).toEqual({
			API_URL: 'https://example.com',
		});
		expect(config.server.trustProxy).toBe(true);
	});

	it('preserves build options', () => {
		const config = resolveRippleConfig({
			build: {
				outDir: 'build',
				minify: true,
				target: 'es2022',
			},
		});

		expect(config.build).toEqual({
			outDir: 'build',
			minify: true,
			target: 'es2022',
		});
	});

	it('throws for invalid routes', () => {
		expect(() =>
			resolveRippleConfig({
				router: {
					routes: /** @type {any} */ ('/'),
				},
			}),
		).toThrow('router.routes must be an array');
	});
});
