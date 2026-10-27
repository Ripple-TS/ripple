// Ported from TanStack/react-router tests/issue-4467-lazy-route-pending.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, render, screen } from '../../react-harness.js';
import { afterEach, expect, onTestFinished, test, vi } from 'vitest';
import {
	Outlet,
	RouterProvider,
	createControlledPromise,
	createLazyRoute,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});
test('a lazy pending component is offered while the eager loader is still pending', async () => {
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <h1>{'Index page'}</h1>,
	});
	const loader = createControlledPromise<void>();
	const lazyPageOptions = createLazyRoute('/page')({
		pendingComponent: () => <p role="status">{'Loading lazy page'}</p>,
		component: () => <h1>{'Page'}</h1>,
	});
	const lazyOptions = createControlledPromise<typeof lazyPageOptions>();
	const pageRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/page',
		loader: () => loader,
	}).lazy(() => lazyOptions);
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, pageRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		defaultPendingMs: 0,
		defaultPendingMinMs: 0,
		defaultPendingComponent: () => <p role="status">{'Loading default'}</p>,
	});
	let navigation: Promise<void> | undefined;
	onTestFinished(async () => {
		await act(async () => {
			lazyOptions.resolve(lazyPageOptions);
			loader.resolve();
			await navigation;
		});
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByRole('heading', { name: 'Index page' })).toBeInTheDocument();
	act(() => {
		navigation = router.navigate({ to: '/page' });
	});
	expect(await screen.findByRole('status')).toHaveTextContent('Loading default');
	await act(async () => {
		lazyOptions.resolve(lazyPageOptions);
	});
	expect(await screen.findByRole('status')).toHaveTextContent('Loading lazy page');
	expect(screen.queryByRole('heading', { name: 'Page' })).not.toBeInTheDocument();
	await act(async () => {
		loader.resolve();
		await navigation;
	});
	expect(screen.getByRole('heading', { name: 'Page' })).toBeInTheDocument();
});
