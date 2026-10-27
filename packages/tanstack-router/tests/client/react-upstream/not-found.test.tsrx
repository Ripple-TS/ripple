// Ported from TanStack/react-router tests/not-found.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { act, cleanup, render, screen } from '../../react-harness.js';
import {
	Link,
	Outlet,
	RouterProvider,
	createBrowserHistory,
	createControlledPromise,
	createLazyRoute,
	createRootRoute,
	createRoute,
	createRouter,
	notFound,
	rootRouteId,
} from '@ripple-ts/tanstack-router';
import {
	RouterServer,
	createRequestHandler,
	renderRouterToString,
} from '@ripple-ts/tanstack-router';
import type { NotFoundRouteProps, RouterHistory } from '@ripple-ts/tanstack-router';

let history: RouterHistory;
beforeEach(() => {
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	history.destroy();
	window.history.replaceState(null, 'root', '/');
	cleanup();
});
test(
	'navigating to an actively preloaded missing URL renders the global not-found boundary',
	async () => {
		const missingLoaderStarted = createControlledPromise<void>();
		const missingLoader = createControlledPromise<void>();
		const rootRoute = createRootRoute({
			component: Outlet,
			notFoundComponent: () => <div>{'Missing URL boundary'}</div>,
			loader: ({ location }) => {
				if (location.pathname === '/missing') {
					missingLoaderStarted.resolve();
					return missingLoader;
				}
				return;
			},
			shouldReload: true,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>{'Home'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history,
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Home')).toBeInTheDocument();
		const preload = router.preloadRoute({ to: '/missing' } as any);
		await missingLoaderStarted;
		const navigation = router.navigate({ to: '/missing' } as any);
		missingLoader.resolve();
		await act(() => Promise.all([preload, navigation]));
		expect(screen.getByText('Missing URL boundary')).toBeInTheDocument();
		expect(screen.queryByText('Home')).not.toBeInTheDocument();
	},
);
test('a lazy route notFoundComponent handles an eager beforeLoad failure', async () => {
	const rootRoute = createRootRoute({
		component: Outlet,
		notFoundComponent: () => <div>{'Root not found'}</div>,
	});
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>{'Home'}</div>,
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
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, failingRoute]),
		history,
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Home')).toBeInTheDocument();
	await act(() => router.navigate({ to: '/lazy-not-found' }));
	expect(screen.getByText('Lazy route not found')).toBeInTheDocument();
	expect(screen.queryByText('Root not found')).not.toBeInTheDocument();
});
