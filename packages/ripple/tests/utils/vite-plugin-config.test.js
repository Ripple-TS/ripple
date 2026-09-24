import { describe, expect, it } from 'vitest';
import { RenderRoute, resolveRippleConfig } from '@ripple-ts/vite-plugin';
import { resolveRootBoundary, resolveTransport } from '@ripple-ts/vite-plugin/production';

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
		expect(config.transport).toBeUndefined();
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

	it.each([['transport', '/src/money.ts'], '/src/transport.ts'])(
		'preserves the transport module %s when resolving a config again',
		(transport) => {
			const config = resolveRippleConfig({ transport });
			expect(config.transport).toBe(transport);
			expect(resolveRippleConfig(config).transport).toBe(transport);
		},
	);

	it.each([
		null,
		false,
		[],
		['transport'],
		{ Money: { encode: () => false, decode: (data) => data } },
		() => {},
	])('rejects transport %s that is not a module entry', (transport) => {
		expect(() => resolveRippleConfig({ transport })).toThrow(
			'transport must be a module path or an [exportName, path] tuple',
		);
	});

	it('reads the transport from its module', () => {
		const transport = { Money: { encode: () => false, decode: (data) => data } };
		expect(resolveTransport(['transport', '/src/money.ts'], { transport })).toBe(transport);
		expect(resolveTransport('/src/transport.ts', { default: transport })).toBe(transport);
		expect(() => resolveTransport('/src/money.ts', { transport })).toThrow(
			'transport: /src/money.ts export `default` must be an object.',
		);
	});

	it.each([null, [], false, {}, { encode() {} }, { decode() {} }, { encode: true, decode() {} }])(
		'rejects invalid transport handler %s',
		(Money) => {
			expect(() => resolveTransport('/src/transport.ts', { default: { Money } })).toThrow(
				'transport.Money (/src/transport.ts export `default`) must be an object with encode and decode functions',
			);
		},
	);

	it('rejects root boundary components that are not module entries', () => {
		expect(() => resolveRippleConfig({ rootBoundary: { pending: () => {} } })).toThrow(
			'rootBoundary.pending must be a module path or an [exportName, path] tuple',
		);
	});

	it('reads root boundary components from their modules', () => {
		function Loading() {}
		function ErrorScreen() {}
		const boundary = { pending: '/src/Loading.tsrx', catch: ['ErrorScreen', '/src/screens.tsrx'] };
		expect(resolveRippleConfig({ rootBoundary: boundary }).rootBoundary).toBe(boundary);
		expect(
			resolveRootBoundary(boundary, {
				pending: { default: Loading },
				catch: { Loading, ErrorScreen },
			}),
		).toEqual({ pending: Loading, catch: ErrorScreen });
		expect(() => resolveRootBoundary({ catch: '/src/screens.tsrx' }, { catch: {} })).toThrow(
			'rootBoundary.catch: no component export found in /src/screens.tsrx.',
		);
	});
});
