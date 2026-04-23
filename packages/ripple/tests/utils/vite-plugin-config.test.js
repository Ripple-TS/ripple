import { describe, expect, it } from 'vitest';
import { RenderRoute, resolveRippleConfig } from '@ripple-ts/vite-plugin';

const fake_compat_factory = Object.assign(
	() =>
		Object.assign(
			{
				createComponent() {},
				createRoot() {
					return () => {};
				},
			},
			{
				__ripple_compat__: {
					from: '@ripple-ts/compat-react',
					factory: 'createReactCompat',
				},
			},
		),
	{
		__ripple_compat__: {
			from: '@ripple-ts/compat-react',
			factory: 'createReactCompat',
		},
	},
);

describe('vite-plugin-ripple config resolution', () => {
	it('preserves compat descriptors and applies defaults', () => {
		const config = resolveRippleConfig({
			router: {
				routes: [
					new RenderRoute({
						path: '/',
						entry: '/src/App.tsrx',
					}),
				],
			},
			compat: {
				react: {
					from: '@ripple-ts/compat-react',
					factory: 'createReactCompat',
				},
			},
		});

		expect(config.compat).toEqual({
			react: {
				from: '@ripple-ts/compat-react',
				factory: 'createReactCompat',
			},
		});
		expect(config.middlewares).toEqual([]);
		expect(config.platform.env).toEqual({});
		expect(config.server.trustProxy).toBe(false);
	});

	it('defaults compat to an empty object', () => {
		const config = resolveRippleConfig({
			router: {
				routes: [],
			},
		});

		expect(config.compat).toEqual({});
	});

	it('allows compat-only configs without routes', () => {
		const config = resolveRippleConfig({
			compat: {
				react: fake_compat_factory,
			},
		});

		expect(config.router.routes).toEqual([]);
		expect(config.compat.react).toEqual({
			from: '@ripple-ts/compat-react',
			factory: 'createReactCompat',
		});
	});

	it('normalizes imported compat factories to descriptors', () => {
		const config = resolveRippleConfig({
			router: {
				routes: [],
			},
			compat: {
				react: fake_compat_factory,
			},
		});

		expect(config.compat.react).toEqual({
			from: '@ripple-ts/compat-react',
			factory: 'createReactCompat',
		});
	});

	it('normalizes invoked compat entries to descriptors', () => {
		const config = resolveRippleConfig({
			router: {
				routes: [],
			},
			compat: {
				react: fake_compat_factory(),
			},
		});

		expect(config.compat.react).toEqual({
			from: '@ripple-ts/compat-react',
			factory: 'createReactCompat',
		});
	});
});
