// Ported from TanStack/react-router tests/public-presentation-lane-contract.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { act, cleanup, render, screen, waitFor } from '../../react-harness.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createControlledPromise } from '@tanstack/router-core';
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	notFound,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});
describe('public presentation lane contracts', () => {
	test('visible pending UI publishes every matched route and its loading state', async () => {
		const parentGate = createControlledPromise<string>();
		const rootRoute = createRootRoute({ component: Outlet });
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>{'Home'}</div>,
		});
		const parentRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/parent',
			pendingMs: 0,
			pendingComponent: () => <div>{'Loading parent'}</div>,
			loader: () => parentGate,
			component: Outlet,
		});
		const childRoute = createRoute({
			getParentRoute: () => parentRoute,
			path: '/child',
			loader: () => 'child data',
			component: () => <div>{'Child content'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([
				indexRoute,
				parentRoute.addChildren([childRoute]),
			]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Home')).toBeInTheDocument();
		await waitFor(() => expect(router.state.status).toBe('idle'));
		let navigation!: Promise<void>;
		await act(async () => {
			navigation = router.navigate({ to: '/parent/child' });
			await Promise.resolve();
		});
		expect(await screen.findByText('Loading parent')).toBeInTheDocument();
		expect(screen.queryByText('Child content')).not.toBeInTheDocument();
		expect(router.state.matches.map((match) => match.routeId)).toEqual([
			rootRoute.id,
			parentRoute.id,
			childRoute.id,
		]);
		expect(router.state.matches.find((match) => match.routeId === parentRoute.id)).toMatchObject({
			status: 'pending',
			isFetching: 'loader',
		});
		await act(async () => {
			parentGate.resolve('parent data');
			await navigation;
		});
		expect(screen.getByText('Child content')).toBeInTheDocument();
		expect(router.state.status).toBe('idle');
	});
	test('an exact-boundary terminal result supersedes an unrendered pending offer', async () => {
		const pendingRenderStarted = createControlledPromise<void>();
		const pendingRender = createControlledPromise<void>();
		const terminalLoadStarted = createControlledPromise<void>();
		const terminalLoad = createControlledPromise<void>();
		const rootRoute = createRootRoute({
			validateSearch: (search: Record<string, unknown>) => ({
				terminal: search.terminal === true,
			}),
			pendingMs: 0,
			pendingMinMs: 100,
			pendingComponent: () => {
				pendingRenderStarted.resolve();
				throw pendingRender;
			},
			beforeLoad: async ({ search }) => {
				if (search.terminal) {
					terminalLoadStarted.resolve();
					await terminalLoad;
					throw notFound();
				}
			},
			notFoundComponent: () => <div>{'Root not found'}</div>,
			component: Outlet,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>{'Home'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history: createMemoryHistory({ initialEntries: ['/?terminal=false'] }),
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Home')).toBeInTheDocument();
		await waitFor(() => expect(router.state.status).toBe('idle'));
		vi.useFakeTimers();
		vi.setSystemTime(0);
		let navigation: Promise<void> | undefined;
		try {
			await act(async () => {
				navigation = router.navigate({
					to: '/',
					search: { terminal: true },
				});
				await terminalLoadStarted;
				await vi.advanceTimersByTimeAsync(0);
				await pendingRenderStarted;
			});
			expect(screen.getByText('Home')).toBeInTheDocument();
			await act(async () => {
				terminalLoad.resolve();
				await navigation;
			});
			expect(screen.getByText('Root not found')).toBeInTheDocument();
			expect(Date.now()).toBe(0);
		} finally {
			terminalLoad.resolve();
			pendingRender.resolve();
			await act(async () => {
				await vi.advanceTimersByTimeAsync(1000);
				await Promise.allSettled(navigation ? [navigation] : []);
			});
		}
	});
	test('a reentrant navigation from onResolved suppresses the stale onRendered event', async () => {
		const rootRoute = createRootRoute({ component: Outlet });
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>{'Home'}</div>,
		});
		const firstRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/first',
			component: () => <div>{'First'}</div>,
		});
		const secondRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/second',
			component: () => <div>{'Second'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, firstRoute, secondRoute]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Home')).toBeInTheDocument();
		await waitFor(() => expect(router.state.status).toBe('idle'));
		const renderedPaths: Array<string> = [];
		let successor: Promise<void> | undefined;
		const unsubscribeResolved = router.subscribe('onResolved', (event) => {
			if (event.toLocation.pathname === '/first') {
				successor = router.navigate({ to: '/second' });
			}
		});
		const unsubscribeRendered = router.subscribe('onRendered', (event) => {
			if (event.toLocation.pathname !== '/') {
				renderedPaths.push(event.toLocation.pathname);
			}
		});
		try {
			await act(() => router.navigate({ to: '/first' }));
			await act(async () => {
				await successor;
			});
			expect(screen.getByText('Second')).toBeInTheDocument();
			expect(screen.queryByText('First')).not.toBeInTheDocument();
			expect(renderedPaths).toEqual(['/second']);
		} finally {
			unsubscribeResolved();
			unsubscribeRendered();
		}
	});
});
