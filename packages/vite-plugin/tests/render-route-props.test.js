import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHandler } from '../src/server/production.js';
import { handleRenderRoute } from '../src/server/render-route.js';
import { createLayoutWrapper, createPropsWrapper } from '../src/server/component-wrappers.js';
import { RenderRoute } from '../src/routes.js';

/**
 * @param {string} html
 * @returns {any}
 */
function parseRippleData(html) {
	const match = html.match(/<script id="__ripple_data" type="application\/json">([^<]+)<\/script>/);
	if (!match) {
		throw new Error('Missing __ripple_data script');
	}
	return JSON.parse(match[1]);
}

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
		render: async (Component) => {
			Component({ fromRender: true });
			return { head: '', body: '<div>ok</div>', css: new Set() };
		},
		getCss: () => '',
		htmlTemplate: '<html><head><!--ssr-head--></head><body><!--ssr-body--></body></html>',
		executeServerFunction: async () => '',
	};
}

describe('render route SSR props', () => {
	it('allows render routes to prefer a named component export from an entry tuple', () => {
		const route = new RenderRoute({
			path: '/docs/guide/dom-refs',
			entry: ['DomRefsPage', '/src/pages/docs/guide/dom-refs.tsrx'],
		});

		expect(route.entry).toEqual(['DomRefsPage', '/src/pages/docs/guide/dom-refs.tsrx']);
		expect(route.before).toEqual([]);
		expect(() => new RenderRoute({ path: '/missing' })).toThrow('RenderRoute requires an `entry`.');
	});

	it('passes injected props as the first SSR component argument', () => {
		const Component = vi.fn();
		const Wrapped = createPropsWrapper(Component, {
			params: { slug: 'echo-api' },
		});

		Wrapped({ fromRender: true, params: { slug: 'ignored' } });

		expect(Component.mock.calls).toEqual([
			[
				{
					fromRender: true,
					params: { slug: 'echo-api' },
				},
			],
		]);
	});

	it('passes route params to production render route components', async () => {
		let pageProps;
		function Page(props) {
			pageProps = props;
		}

		const handler = createHandler(
			{
				routes: [
					{
						type: 'render',
						path: '/tool/:slug',
						entry: '/src/ToolPage.tsrx',
						before: [],
					},
				],
				components: { '/src/ToolPage.tsrx': Page },
				layouts: {},
				middlewares: [],
				runtime: createRuntime(),
			},
			createHandlerOptions(),
		);

		await handler(new Request('https://example.test/tool/echo-api'));

		expect(pageProps).toEqual({
			fromRender: true,
			params: { slug: 'echo-api' },
		});
	});

	it('passes route params to production render route components from named entry tuples', async () => {
		let pageProps;
		function Page(props) {
			pageProps = props;
		}

		const handler = createHandler(
			{
				routes: [
					{
						type: 'render',
						path: '/tool/:slug',
						entry: ['NamedToolPage', '/src/ToolPage.tsrx'],
						before: [],
					},
				],
				components: { '/src/ToolPage.tsrx#NamedToolPage': Page },
				layouts: {},
				middlewares: [],
				runtime: createRuntime(),
			},
			createHandlerOptions(),
		);

		const response = await handler(new Request('https://example.test/tool/echo-api'));
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(pageProps).toEqual({
			fromRender: true,
			params: { slug: 'echo-api' },
		});
		expect(parseRippleData(html)).toEqual({
			entry: '/src/ToolPage.tsrx',
			routeIndex: 0,
			params: { slug: 'echo-api' },
		});
	});

	it('passes route params and root boundary to production render route components', async () => {
		let pageProps;
		let renderOptions;
		function Page(props) {
			pageProps = props;
		}
		const rootBoundary = {
			pending() {},
			catch() {},
		};
		const route = {
			type: 'render',
			path: '/tool/:slug',
			entry: '/src/ToolPage.tsrx',
			before: [],
		};

		const handler = createHandler(
			{
				routes: [route],
				components: { '/src/ToolPage.tsrx': Page },
				layouts: {},
				middlewares: [],
				runtime: createRuntime(),
				rootBoundary,
			},
			{
				...createHandlerOptions(),
				render: async (Component, options) => {
					renderOptions = options;
					Component({ fromRender: true });
					return { head: '', body: '<div>ok</div>', css: new Set() };
				},
			},
		);

		const response = await handler(new Request('https://example.test/tool/echo-api'));
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(pageProps).toEqual({
			fromRender: true,
			params: { slug: 'echo-api' },
		});
		expect(renderOptions).toEqual({ rootBoundary });
		expect(parseRippleData(html)).toEqual({
			entry: '/src/ToolPage.tsrx',
			routeIndex: 0,
			params: { slug: 'echo-api' },
		});
	});

	it('passes route params to dev render route components', async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-render-route-'));
		fs.writeFileSync(
			path.join(tmpDir, 'index.html'),
			'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div></body></html>',
		);

		let pageProps;
		function Page(props) {
			pageProps = props;
		}

		const vite = {
			config: { root: tmpDir },
			transformIndexHtml: vi.fn(async (_pathname, html) => html),
			ssrLoadModule: vi.fn(async (id) => {
				if (id === 'ripple/server') {
					const { render } = createHandlerOptions();
					return {
						render,
						get_css_for_hashes: () => '',
					};
				}
				if (id === '/src/ToolPage.tsrx') {
					return { default: Page };
				}
				throw new Error(`Unexpected module: ${id}`);
			}),
		};

		try {
			const response = await handleRenderRoute(
				{
					type: 'render',
					path: '/tool/:slug',
					entry: '/src/ToolPage.tsrx',
					before: [],
				},
				{
					request: new Request('https://example.test/tool/echo-api'),
					params: { slug: 'echo-api' },
					url: new URL('https://example.test/tool/echo-api'),
					state: new Map(),
				},
				vite,
			);

			expect(response.status).toBe(200);
			expect(pageProps).toEqual({
				fromRender: true,
				params: { slug: 'echo-api' },
			});
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it('uses the named export from a dev render route entry tuple', async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-render-route-'));
		fs.writeFileSync(
			path.join(tmpDir, 'index.html'),
			'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div></body></html>',
		);

		let pageProps;
		function Page(props) {
			pageProps = props;
		}
		function WrongPage() {
			throw new Error('default export should not be used');
		}

		const vite = {
			config: { root: tmpDir },
			transformIndexHtml: vi.fn(async (_pathname, html) => html),
			ssrLoadModule: vi.fn(async (id) => {
				if (id === 'ripple/server') {
					const { render } = createHandlerOptions();
					return {
						render,
						get_css_for_hashes: () => '',
					};
				}
				if (id === '/src/ToolPage.tsrx') {
					return { default: WrongPage, NamedToolPage: Page };
				}
				throw new Error(`Unexpected module: ${id}`);
			}),
		};

		try {
			const response = await handleRenderRoute(
				{
					type: 'render',
					path: '/tool/:slug',
					entry: ['NamedToolPage', '/src/ToolPage.tsrx'],
					before: [],
				},
				{
					request: new Request('https://example.test/tool/echo-api'),
					params: { slug: 'echo-api' },
					url: new URL('https://example.test/tool/echo-api'),
					state: new Map(),
				},
				vite,
			);

			expect(response.status).toBe(200);
			expect(pageProps).toEqual({
				fromRender: true,
				params: { slug: 'echo-api' },
			});
			expect(vite.ssrLoadModule).toHaveBeenCalledWith('/src/ToolPage.tsrx');
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it('passes route params and root boundary to dev render route components', async () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-render-route-'));
		fs.writeFileSync(
			path.join(tmpDir, 'index.html'),
			'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div></body></html>',
		);

		let pageProps;
		let renderOptions;
		function Page(props) {
			pageProps = props;
		}
		const rootBoundary = {
			pending() {},
			catch() {},
		};
		const route = {
			type: 'render',
			path: '/tool/:slug',
			entry: '/src/ToolPage.tsrx',
			before: [],
		};

		const vite = {
			config: { root: tmpDir },
			transformIndexHtml: vi.fn(async (_pathname, html) => html),
			ssrLoadModule: vi.fn(async (id) => {
				if (id === 'ripple/server') {
					return {
						render: async (Component, options) => {
							renderOptions = options;
							Component({ fromRender: true });
							return { head: '', body: '<div>ok</div>', css: new Set() };
						},
						get_css_for_hashes: () => '',
					};
				}
				if (id === '/src/ToolPage.tsrx') {
					return { default: Page };
				}
				throw new Error(`Unexpected module: ${id}`);
			}),
		};

		try {
			const response = await handleRenderRoute(
				route,
				{
					request: new Request('https://example.test/tool/echo-api'),
					params: { slug: 'echo-api' },
					url: new URL('https://example.test/tool/echo-api'),
					state: new Map(),
				},
				vite,
				{
					router: { routes: [route] },
					rootBoundary,
				},
			);
			const html = await response.text();

			expect(response.status).toBe(200);
			expect(pageProps).toEqual({
				fromRender: true,
				params: { slug: 'echo-api' },
			});
			expect(renderOptions).toEqual({ rootBoundary });
			expect(parseRippleData(html)).toEqual({
				entry: '/src/ToolPage.tsrx',
				routeIndex: 0,
				params: { slug: 'echo-api' },
			});
			expect(vite.ssrLoadModule).toHaveBeenCalledTimes(2);
			expect(vite.ssrLoadModule).toHaveBeenCalledWith('ripple/server');
			expect(vite.ssrLoadModule).toHaveBeenCalledWith('/src/ToolPage.tsrx');
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it('wraps layout children as a server TSRX element and passes page params through', () => {
		const Page = vi.fn();
		const Layout = vi.fn(({ children }) => {
			children.render({ fromChild: true });
		});
		const Wrapped = createLayoutWrapper(Layout, Page, {
			params: { slug: 'echo-api' },
		});

		Wrapped({ fromRender: true });

		const layoutProps = Layout.mock.calls[0][0];
		expect(layoutProps.fromRender).toBe(true);
		expect(layoutProps.children[Symbol.for('ripple.element')]).toBe(true);
		expect(Page.mock.calls).toEqual([
			[
				{
					fromRender: true,
					fromChild: true,
					params: { slug: 'echo-api' },
				},
			],
		]);
	});
});
