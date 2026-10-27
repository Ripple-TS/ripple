// Ported from TanStack/react-router tests/routeContext.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { act, cleanup, fireEvent, render, screen } from '../../react-harness.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { useEffect } from '../upstream/reactivity.js';
import {
	Link,
	Outlet,
	RouterProvider,
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouter,
	redirect,
} from '@ripple-ts/tanstack-router';
import { sleep } from '../upstream/utils.ts';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

let history: RouterHistory;
beforeEach(() => {
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	history.destroy();
	window.history.replaceState(null, 'root', '/');
	vi.clearAllMocks();
	vi.resetAllMocks();
	cleanup();
});
const WAIT_TIME = 150;
describe('context function', () => {
	describe('routeId in context function', () => {
		test('receives correct routeId for index route', async () => {
			const mockContextFn = vi.fn();
			const rootRoute = createRootRoute();
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				context: ({ routeId }) => {
					mockContextFn(routeId);
				},
				component: () => <div>{'Index page'}</div>,
			});
			const routeTree = rootRoute.addChildren([indexRoute]);
			const router = createRouter({ routeTree, history });
			render(() => <RouterProvider router={router} />);
			const rootElement = await screen.findByText('Index page');
			expect(rootElement).toBeInTheDocument();
			expect(mockContextFn).toHaveBeenCalledWith('/');
		});
		test('receives correct routeId for nested route', async () => {
			const mockParentContextFn = vi.fn();
			const mockChildContextFn = vi.fn();
			const rootRoute = createRootRoute();
			const parentRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/parent',
				context: ({ routeId }) => {
					mockParentContextFn(routeId);
				},
				component: () => <div>
					{'Parent page '}
					<Outlet />
				</div>,
			});
			const childRoute = createRoute({
				getParentRoute: () => parentRoute,
				path: '/child',
				context: ({ routeId }) => {
					mockChildContextFn(routeId);
				},
				component: () => <div>{'Child page'}</div>,
			});
			const routeTree = rootRoute.addChildren([
				parentRoute.addChildren([childRoute]),
			]);
			const router = createRouter({ routeTree, history });
			await act(() => router.navigate({ to: '/parent/child' }));
			render(() => <RouterProvider router={router} />);
			const childElement = await screen.findByText('Child page');
			expect(childElement).toBeInTheDocument();
			expect(mockParentContextFn).toHaveBeenCalledWith('/parent');
			expect(mockChildContextFn).toHaveBeenCalledWith('/parent/child');
		});
		test('receives correct routeId for route with dynamic params', async () => {
			const mockContextFn = vi.fn();
			const rootRoute = createRootRoute();
			const postRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/posts/$postId',
				context: ({ routeId }) => {
					mockContextFn(routeId);
				},
				component: () => <div>{'Post page'}</div>,
			});
			const routeTree = rootRoute.addChildren([postRoute]);
			const router = createRouter({ routeTree, history });
			await act(() => router.navigate({ to: '/posts/$postId', params: { postId: '123' } }));
			render(() => <RouterProvider router={router} />);
			const postElement = await screen.findByText('Post page');
			expect(postElement).toBeInTheDocument();
			expect(mockContextFn).toHaveBeenCalledWith('/posts/$postId');
		});
	});
});
describe('routeId in beforeLoad', () => {
	test('receives correct routeId for root route', async () => {
		const mock = vi.fn();
		const rootRoute = createRootRoute({
			beforeLoad: ({ routeId }) => {
				mock(routeId);
			},
			component: () => <div>{'Root page'}</div>,
		});
		const routeTree = rootRoute.addChildren([]);
		const router = createRouter({ routeTree, history });
		render(() => <RouterProvider router={router} />);
		const rootElement = await screen.findByText('Root page');
		expect(rootElement).toBeInTheDocument();
		expect(mock).toHaveBeenCalledWith('__root__');
	});
	test('receives correct routeId for index route', async () => {
		const mock = vi.fn();
		const rootRoute = createRootRoute();
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			beforeLoad: ({ routeId }) => {
				mock(routeId);
			},
			component: () => <div>{'Index page'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute]);
		const router = createRouter({ routeTree, history });
		render(() => <RouterProvider router={router} />);
		const indexElement = await screen.findByText('Index page');
		expect(indexElement).toBeInTheDocument();
		expect(mock).toHaveBeenCalledWith('/');
	});
	test('receives correct routeId for nested routes', async () => {
		const mockParent = vi.fn();
		const mockChild = vi.fn();
		const rootRoute = createRootRoute();
		const parentRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/parent',
			beforeLoad: ({ routeId }) => {
				mockParent(routeId);
			},
			component: () => <div>
				{'Parent page '}
				<Outlet />
			</div>,
		});
		const childRoute = createRoute({
			getParentRoute: () => parentRoute,
			path: '/child',
			beforeLoad: ({ routeId }) => {
				mockChild(routeId);
			},
			component: () => <div>{'Child page'}</div>,
		});
		const routeTree = rootRoute.addChildren([
			parentRoute.addChildren([childRoute]),
		]);
		const router = createRouter({ routeTree, history });
		await act(() => router.navigate({ to: '/parent/child' }));
		render(() => <RouterProvider router={router} />);
		const childElement = await screen.findByText('Child page');
		expect(childElement).toBeInTheDocument();
		expect(mockParent).toHaveBeenCalledWith('/parent');
		expect(mockChild).toHaveBeenCalledWith('/parent/child');
	});
	test('receives correct routeId for route with dynamic params', async () => {
		const mock = vi.fn();
		const rootRoute = createRootRoute();
		const postRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts/$postId',
			beforeLoad: ({ routeId }) => {
				mock(routeId);
			},
			component: () => <div>{'Post page'}</div>,
		});
		const routeTree = rootRoute.addChildren([postRoute]);
		const router = createRouter({ routeTree, history });
		await act(() => router.navigate({ to: '/posts/$postId', params: { postId: '123' } }));
		render(() => <RouterProvider router={router} />);
		const postElement = await screen.findByText('Post page');
		expect(postElement).toBeInTheDocument();
		expect(mock).toHaveBeenCalledWith('/posts/$postId');
	});
	test('receives correct routeId for layout route', async () => {
		const mock = vi.fn();
		const rootRoute = createRootRoute();
		const layoutRoute = createRoute({
			getParentRoute: () => rootRoute,
			id: '_layout',
			beforeLoad: ({ routeId }) => {
				mock(routeId);
			},
			component: () => <div>
				{'Layout '}
				<Outlet />
			</div>,
		});
		const indexRoute = createRoute({
			getParentRoute: () => layoutRoute,
			path: '/',
			component: () => <div>{'Index page'}</div>,
		});
		const routeTree = rootRoute.addChildren([
			layoutRoute.addChildren([indexRoute]),
		]);
		const router = createRouter({ routeTree, history });
		render(() => <RouterProvider router={router} />);
		const indexElement = await screen.findByText('Index page');
		expect(indexElement).toBeInTheDocument();
		expect(mock).toHaveBeenCalledWith('/_layout');
	});
});
