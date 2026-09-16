import { describe, it, expect } from 'vitest';
import { prerenderRoutes } from '../src/server/production.js';
import { resolveRippleConfig } from '../src/load-config.js';
import { RenderRoute } from '../src/routes.js';

function createRuntime() {
	return {
		hash: () => '00000000',
		createAsyncContext: () => ({
			run: (_store, fn) => fn(),
			getStore: () => undefined,
		}),
	};
}

function createHandlerOptions() {
	return {
		render: /** @type {import('../types/production.d.ts').RenderFunction} */ (
			async (/** @type {Function} */ Component) => {
				Component({});
				return { head: '<title>t</title>', body: '<div>page</div>', css: new Set(['abc']) };
			}
		),
		getCss: () => '.x{}',
		htmlTemplate: '<html><head><!--ssr-head--></head><body><!--ssr-body--></body></html>',
		executeServerFunction: async () => '',
		createSsrStream: () => {
			throw new Error('streaming must not be used for prerendering');
		},
	};
}

describe('prerenderRoutes', () => {
	it('renders only the marked static routes, buffered, into full documents', async () => {
		const Home = () => {};
		const About = () => {};
		const routes = [
			new RenderRoute({ path: '/', entry: './src/Home.tsrx', prerender: true }),
			new RenderRoute({ path: '/about', entry: ['About', './src/About.tsrx'], prerender: true }),
			new RenderRoute({ path: '/live', entry: './src/Live.tsrx' }),
		];
		const pages = await prerenderRoutes(
			{
				routes,
				components: { './src/Home.tsrx': Home, './src/About.tsrx#About': About },
				layouts: {},
				middlewares: [],
				runtime: createRuntime(),
				streaming: true,
				clientAssets: { './src/Home.tsrx': { js: 'assets/home.js', css: ['assets/home.css'] } },
			},
			createHandlerOptions(),
		);

		expect([...pages.keys()]).toEqual(['/', '/about']);
		const home = /** @type {string} */ (pages.get('/'));
		expect(home).toContain('<div>page</div>');
		expect(home).toContain('<style data-ripple-ssr>.x{}</style>');
		expect(home).toContain('<link rel="stylesheet" href="/assets/home.css">');
		expect(home).toContain('id="__ripple_data"');
		expect(home).not.toContain('<!--ssr-body-->');
	});
});

describe('RenderRoute prerender validation', () => {
	it('rejects a dynamic path', () => {
		expect(() =>
			resolveRippleConfig({
				router: {
					routes: [
						new RenderRoute({ path: '/posts/:id', entry: './src/Post.tsrx', prerender: true }),
					],
				},
			}),
		).toThrow(/cannot be prerendered/);
	});

	it('accepts a static path and defaults to false', () => {
		const config = resolveRippleConfig({
			router: {
				routes: [
					new RenderRoute({ path: '/about', entry: './src/About.tsrx', prerender: true }),
					new RenderRoute({ path: '/', entry: './src/Home.tsrx' }),
				],
			},
		});
		const [about, home] = /** @type {RenderRoute[]} */ (config.router.routes);
		expect(about.prerender).toBe(true);
		expect(home.prerender).toBe(false);
	});
});
