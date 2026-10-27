// Ported from TanStack/react-router tests/not-found.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
	Link,
	Outlet,
	RouterProvider,
	Scripts,
	createBrowserHistory,
	createControlledPromise,
	createLazyRoute,
	createRootRoute,
	createRoute,
	createRouter,
	notFound,
	rootRouteId,
} from '@ripple-ts/tanstack-router';
import { createRequestHandler, renderRouterToString } from '@ripple-ts/tanstack-router/ssr/server';
import type { NotFoundRouteProps, RouterHistory } from '@ripple-ts/tanstack-router';

test('SSR uses a lazy route notFoundComponent for an eager beforeLoad failure', async () => {
	const rootRoute = createRootRoute({
		// Streaming SSR requires the <Scripts /> boundary in the shell.
		shellComponent: ({ children }) => <>
			{children}
			<Scripts />
		</>,
		component: Outlet,
		notFoundComponent: () => <div>{'Root not found'}</div>,
	});
	const failingRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/lazy-not-found',
		beforeLoad: () => {
			throw notFound();
		},
	}).lazy(
		() => Promise.resolve(
			createLazyRoute('/lazy-not-found')({
				notFoundComponent: () => <div>{'Lazy route not found'}</div>,
			}),
		),
	);
	const handler = createRequestHandler({
		request: new Request('http://localhost/lazy-not-found'),
		createRouter: () => createRouter({
			routeTree: rootRoute.addChildren([failingRoute]),
			isServer: true,
		}),
	});
	const response = await handler(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	expect(response.status).toBe(404);
	const html = await response.text();
	expect(html).toContain('Lazy route not found');
	expect(html).not.toContain('Root not found');
});
test.each(['server'] as const)('a lazy child boundary handles a fuzzy URL miss on the %s', async (
	environment,
) => {
	const rootRoute = createRootRoute({
		// Streaming SSR requires the <Scripts /> boundary in the shell; the
		// client render outputs no scripts here.
		shellComponent: ({ children }) => <>
			{children}
			<Scripts />
		</>,
		component: Outlet,
		notFoundComponent: () => <div>{'Root fuzzy boundary'}</div>,
	});
	const parentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/parent',
		component: Outlet,
		notFoundComponent: () => <div>{'Parent fuzzy boundary'}</div>,
	});
	const childRoute = createRoute({
		getParentRoute: () => parentRoute,
		path: '/child',
	}).lazy(
		() => Promise.resolve(
			createLazyRoute('/parent/child')({
				notFoundComponent: () => <div>{'Lazy child fuzzy boundary'}</div>,
			}),
		),
	);
	const routeTree = rootRoute.addChildren([
		parentRoute.addChildren([childRoute]),
	]);
	const response = await createRequestHandler({
		request: new Request('http://localhost/parent/child/missing'),
		createRouter: () => createRouter({ routeTree, isServer: true }),
	})(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	expect(response.status).toBe(404);
	const html = await response.text();
	expect(html).toContain('Lazy child fuzzy boundary');
	expect(html).not.toContain('Parent fuzzy boundary');
});
