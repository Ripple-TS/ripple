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
	});
});
