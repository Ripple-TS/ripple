// Ported from TanStack/solid-router tests/Outlet.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '../../harness.js';
import { createMemoryHistory } from '@tanstack/history';
import { createControlledPromise, notFound } from '@tanstack/router-core';
import {
	Outlet,
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

const outletWarning = (component: 'pendingComponent' | 'errorComponent' | 'notFoundComponent') =>
	`Warning: An <Outlet /> was rendered inside a ${component}. <Outlet /> should only be rendered inside a route component.`;
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});
test('does not warn when Outlet is rendered inside a route component', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const rootRoute = createRootRoute({
		component: () => <>
			<span>Root route</span>
			<Outlet />
		</>,
	});
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <span>Index route</span>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Index route')).toBeInTheDocument();
	expect(warn).not.toHaveBeenCalled();
});
test('warns when Outlet is rendered inside a pendingComponent', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const pending = createControlledPromise<void>();
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <span>Index route</span>,
	});
	const pendingRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/pending',
		loader: () => pending,
		pendingMs: 0,
		pendingComponent: () => <>
			<span>Pending route</span>
			<Outlet />
		</>,
		component: () => <span>Resolved route</span>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, pendingRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	await screen.findByText('Index route');
	const navigation = router.navigate({ to: '/pending' });
	expect(await screen.findByText('Pending route')).toBeInTheDocument();
	pending.resolve();
	await navigation;
	expect(warn).toHaveBeenCalledWith(outletWarning('pendingComponent'));
});
test('warns when Outlet is rendered inside an errorComponent', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		loader: () => {
			throw new Error('Loader failed');
		},
		errorComponent: () => <>
			<span>Error route</span>
			<Outlet />
		</>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Error route')).toBeInTheDocument();
	expect(warn).toHaveBeenCalledWith(outletWarning('errorComponent'));
});
test('warns when Outlet is rendered inside a notFoundComponent', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <span>Index route</span>,
	});
	const notFoundRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/not-found',
		component: () => {
			throw notFound();
		},
		notFoundComponent: () => <>
			<span>Not found route</span>
			<Outlet />
		</>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, notFoundRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	await screen.findByText('Index route');
	await router.navigate({ to: '/not-found' });
	expect(await screen.findByText('Not found route')).toBeInTheDocument();
	expect(warn).toHaveBeenCalledWith(outletWarning('notFoundComponent'));
});

// Ripple regression: a separate router in a fallback starts a fresh match scope.
test('an independent router inside a fallback owns its Outlet context', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const nestedRoot = createRootRoute({ component: Outlet });
	const nestedPage = createRoute({
		getParentRoute: () => nestedRoot,
		path: '/',
		component: () => <span>Nested page</span>,
	});
	const nested = createRouter({
		routeTree: nestedRoot.addChildren([nestedPage]),
		history: createMemoryHistory(),
	});
	const root = createRootRoute({ component: Outlet });
	const page = createRoute({
		getParentRoute: () => root,
		path: '/',
		loader: () => {
			throw new Error('outer');
		},
		errorComponent: () => <RouterProvider router={nested} />,
	});
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory(),
	});
	render(() => <RouterProvider {router} />);
	expect(await screen.findByText('Nested page')).toBeInTheDocument();
	expect(warn).not.toHaveBeenCalled();
});
