// Ported from TanStack/react-router tests/Scripts.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '../../react-harness.js';
import {
	HeadContent,
	Link,
	Outlet,
	RouterContextProvider,
	RouterProvider,
	createBrowserHistory,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { Scripts } from '@ripple-ts/tanstack-router';
import type { Manifest } from '@tanstack/router-core';

// React 19 keeps stylesheet resources keyed by href alive for the lifetime of
// the test module, so these tests use explicit asset URLs to avoid collisions
// between cases even though Testing Library cleanup runs after each test.
function createTestManifest(
	routeId: string,
	options?: {
		stylesheetHref?: string;
		preloadHref?: string;
		scriptFormat?: Manifest['scriptFormat'];
	},
): Manifest {
	return {
		...(options?.scriptFormat ? { scriptFormat: options.scriptFormat } : {}),
		routes: {
			[routeId]: {
				preloads: [options?.preloadHref ?? '/main.js'],
				css: [options?.stylesheetHref ?? '/main.css'],
			},
		},
	};
}
const browserHistories: Array<ReturnType<typeof createBrowserHistory>> = [];
const createTestBrowserHistory = () => {
	const history = createBrowserHistory();
	browserHistories.push(history);
	return history;
};
afterEach(() => {
	cleanup();
	browserHistories.splice(0).forEach((history) => history.destroy());
	window.history.replaceState(null, 'root', '/');
	delete window.$_TSR;
});
describe('scripts with async/defer attributes', () => {
	test('client renders scripts with attributes (including async/defer)', async () => {
		const rootRoute = createRootRoute({
			scripts: () => [
				{
					src: 'script.js',
					async: true,
					crossOrigin: 'anonymous',
				},
			],
			component: () => {
				return <div>
					<div data-testid="async-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
			component: () => {
				return <div data-testid="async-index">{'index'}</div>;
			},
		});
		// Clear head and any leftover body scripts between tests.
		document.head.innerHTML = '';
		document.querySelectorAll('body script').forEach((s) => s.remove());
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
			isServer: false, // Client-side rendering
		});
		await router.load();
		await act(() => render(() => <RouterProvider router={router} />));
		expect(await screen.findByTestId('async-root')).toBeInTheDocument();
		const script = document.querySelector('script[src="script.js"]');
		expect(script).toBeTruthy();
		// Attributes are preserved on the client.
		expect(script?.getAttribute('src')).toBe('script.js');
		expect(script?.hasAttribute('async')).toBe(true);
		expect(script?.getAttribute('crossorigin')).toBe('anonymous');
	});
});
describe('ssr HeadContent', () => {
	test('assetCrossOrigin overrides manifest crossOrigin values', async () => {
		const history = createTestBrowserHistory();
		const stylesheetHref = '/override-cross-origin.css';
		const preloadHref = '/override-cross-origin.js';
		const rootRoute = createRootRoute({
			component: () => {
				return <>
					<HeadContent assetCrossOrigin="anonymous" />
					<Outlet />
				</>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
			component: () => <div>{'Index'}</div>,
		});
		const router = createRouter({
			history,
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		router.ssr = {
			manifest: {
				routes: {
					[rootRoute.id]: {
						preloads: [
							{ href: preloadHref, crossOrigin: 'use-credentials' as const },
						],
						css: [
							{
								href: stylesheetHref,
								crossOrigin: 'use-credentials',
							},
						],
					},
				},
			} as any,
		};
		await router.load();
		await act(() => render(() => <RouterProvider router={router} />));
		await waitFor(() => {
			expect(
				document.head.querySelector(`link[rel="stylesheet"][href="${stylesheetHref}"]`),
			).toBeTruthy();
			expect(
				document.head.querySelector(`link[rel="modulepreload"][href="${preloadHref}"]`),
			).toBeTruthy();
		});
		expect(
			document.head.querySelector(`link[rel="stylesheet"][href="${stylesheetHref}"]`)?.getAttribute(
				'crossorigin',
			),
		).toBe('anonymous');
		expect(
			document.head.querySelector(`link[rel="modulepreload"][href="${preloadHref}"]`)?.getAttribute(
				'crossorigin',
			),
		).toBe('anonymous');
	});
	test('does not render retained descendant assets past a terminal parent boundary', async () => {
		let failParent = false;
		const childHeadScript = '{"source":"child-head"}';
		const childBodyScript = '{"source":"child-body"}';
		const childManifestScript = '{"source":"child-manifest"}';
		const childPreload = '/terminal-child-preload.js';
		const childHeadLink = '/terminal-child-head-link.js';
		const rootRoute = createRootRoute({
			component: () => <>
				<HeadContent />
				<Outlet />
				<Scripts />
			</>,
		});
		const parentRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/parent',
			shouldReload: true,
			loader: () => {
				if (failParent) {
					throw new Error('parent failed');
				}
			},
			component: Outlet,
			errorComponent: () => <div>{'Parent error'}</div>,
		});
		const childRoute = createRoute({
			getParentRoute: () => parentRoute,
			path: '/child',
			head: () => ({
				meta: [
					{ name: 'terminal-child', content: 'visible' },
				],
				links: [
					{ rel: 'preload', href: childHeadLink },
				],
				styles: [{ children: '.terminal-child { color: red }' }],
				scripts: [
					{ type: 'application/ld+json', children: childHeadScript },
				],
			}),
			scripts: () => [
				{ type: 'application/ld+json', children: childBodyScript },
			],
			component: () => <div>{'Child content'}</div>,
		});
		const router = createRouter({
			history: createMemoryHistory({ initialEntries: ['/parent/child'] }),
			routeTree: rootRoute.addChildren([parentRoute.addChildren([childRoute])]),
		});
		router.ssr = {
			manifest: {
				routes: {
					[childRoute.id]: {
						preloads: [childPreload],
						scripts: [
							{
								attrs: { type: 'application/ld+json' },
								children: childManifestScript,
							},
						],
					},
				},
			},
		};
		await router.load();
		await act(() => render(() => <RouterProvider router={router} />));
		await waitFor(() => {
			expect(document.head.querySelector('meta[name="terminal-child"]')).not.toBeNull();
			expect(document.head.querySelector(`link[href="${childPreload}"]`)).not.toBeNull();
			expect(document.head.querySelector(`link[href="${childHeadLink}"]`)).not.toBeNull();
			expect(document.head.textContent).toContain('.terminal-child { color: red }');
			expect(document.documentElement.textContent).toContain(childHeadScript);
			expect(document.documentElement.textContent).toContain(childBodyScript);
			expect(document.documentElement.textContent).toContain(childManifestScript);
		});
		failParent = true;
		await act(() => router.invalidate());
		await screen.findByText('Parent error');
		expect(router.state.matches).toHaveLength(3);
		expect(router.state.matches[1]).toMatchObject({
			routeId: parentRoute.id,
			status: 'error',
		});
		expect(router.state.matches[2]).toMatchObject({
			routeId: childRoute.id,
			meta: [
				{ name: 'terminal-child', content: 'visible' },
			],
			scripts: [
				{ type: 'application/ld+json', children: childBodyScript },
			],
		});
		await waitFor(() => {
			expect(document.head.querySelector('meta[name="terminal-child"]')).toBeNull();
			expect(document.head.querySelector(`link[href="${childPreload}"]`)).toBeNull();
			expect(document.head.querySelector(`link[href="${childHeadLink}"]`)).toBeNull();
			expect(document.head.textContent).not.toContain('.terminal-child { color: red }');
			expect(document.documentElement.textContent).not.toContain(childHeadScript);
			expect(document.documentElement.textContent).not.toContain(childBodyScript);
			expect(document.documentElement.textContent).not.toContain(childManifestScript);
		});
	});
});
describe('data script rendering', () => {
	test('data script preserves content on client', async () => {
		const jsonLd = JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Test',
		});
		const rootRoute = createRootRoute({
			scripts: () => [
				{
					type: 'application/ld+json',
					children: jsonLd,
				},
			],
			component: () => {
				return <div>
					<div data-testid="data-client-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
		});
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		await router.load();
		const { container } = await act(() => render(() => <RouterProvider router={router} />));
		const rootEl = container.querySelector('[data-testid="data-client-root"]');
		expect(rootEl).not.toBeNull();
		const scriptEl = container.querySelector('script[type="application/ld+json"]');
		expect(scriptEl).not.toBeNull();
		expect(scriptEl!.innerHTML).toBe(jsonLd);
	});
	test('executable script is injected into document.head via useEffect on client', async () => {
		const rootRoute = createRootRoute({
			scripts: () => [
				{ children: 'console.log("hello")' },
			],
			component: () => {
				return <div>
					<div data-testid="exec-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
		});
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		await router.load();
		const { container } = await act(() => render(() => <RouterProvider router={router} />));
		const rootEl = container.querySelector('[data-testid="exec-root"]');
		expect(rootEl).not.toBeNull();
		// Executable inline scripts are injected into document.head via useEffect,
		// not rendered in the React tree on the client.
		const headScript = document.head.querySelector('script:not([type]):not([src])');
		expect(headScript).not.toBeNull();
		expect(headScript!.textContent).toBe('console.log("hello")');
	});
	test('module script is injected into document.head via useEffect on client', async () => {
		const rootRoute = createRootRoute({
			scripts: () => [
				{
					type: 'module',
					children: 'import { foo } from "./foo.js"',
				},
			],
			component: () => {
				return <div>
					<div data-testid="module-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
		});
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		await router.load();
		const { container } = await act(() => render(() => <RouterProvider router={router} />));
		const rootEl = container.querySelector('[data-testid="module-root"]');
		expect(rootEl).not.toBeNull();
		// Module scripts are injected into document.head via useEffect,
		// not rendered in the React tree on the client.
		const moduleScript = document.head.querySelector('script[type="module"]');
		expect(moduleScript).not.toBeNull();
		expect(moduleScript!.textContent).toBe('import { foo } from "./foo.js"');
	});
	test('application/json data script preserves content', async () => {
		const jsonData = JSON.stringify({ config: { theme: 'dark' } });
		const rootRoute = createRootRoute({
			scripts: () => [
				{
					type: 'application/json',
					children: jsonData,
				},
			],
			component: () => {
				return <div>
					<div data-testid="json-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
		});
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		await router.load();
		const { container } = await act(() => render(() => <RouterProvider router={router} />));
		const rootEl = container.querySelector('[data-testid="json-root"]');
		expect(rootEl).not.toBeNull();
		const scriptEl = container.querySelector('script[type="application/json"]');
		expect(scriptEl).not.toBeNull();
		expect(scriptEl!.innerHTML).toBe(jsonData);
	});
	test('data script does not duplicate into document.head', async () => {
		const jsonLd = JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Test Org',
		});
		const rootRoute = createRootRoute({
			scripts: () => [
				{
					type: 'application/ld+json',
					children: jsonLd,
				},
			],
			component: () => {
				return <div>
					<div data-testid="dup-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
		});
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		await router.load();
		const { container } = await act(() => render(() => <RouterProvider router={router} />));
		const rootEl = container.querySelector('[data-testid="dup-root"]');
		expect(rootEl).not.toBeNull();
		// Data scripts should NOT be duplicated into document.head by useEffect
		const headScripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(headScripts.length).toBe(0);
		// Should only exist once in the container
		const containerScripts = container.querySelectorAll('script[type="application/ld+json"]');
		expect(containerScripts.length).toBe(1);
		expect(containerScripts[0]!.innerHTML).toBe(jsonLd);
	});
	test('empty string type is treated as executable, injected via useEffect on client', async () => {
		const rootRoute = createRootRoute({
			scripts: () => [
				{
					type: '',
					children: 'console.log("empty type")',
				},
			],
			component: () => {
				return <div>
					<div data-testid="empty-type-root">{'root'}</div>
					<Outlet />
					<Scripts />
				</div>;
			},
		});
		const indexRoute = createRoute({
			path: '/',
			getParentRoute: () => rootRoute,
		});
		const router = createRouter({
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
			routeTree: rootRoute.addChildren([indexRoute]),
		});
		await router.load();
		const { container } = await act(() => render(() => <RouterProvider router={router} />));
		const rootEl = container.querySelector('[data-testid="empty-type-root"]');
		expect(rootEl).not.toBeNull();
		// Empty type = text/javascript per HTML spec. Executable scripts are
		// injected into document.head via useEffect on the client.
		const scriptEl = document.head.querySelector('script[type=""]');
		expect(scriptEl).not.toBeNull();
		expect(scriptEl!.textContent).toBe('console.log("empty type")');
	});
});
