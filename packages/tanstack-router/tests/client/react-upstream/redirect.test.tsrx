// Ported from TanStack/react-router tests/redirect.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, fireEvent, render, screen } from '../../react-harness.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createControlledPromise } from '@tanstack/router-core';
import {
	Link,
	Outlet,
	RouterProvider,
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouter,
	redirect,
	useRouter,
} from '@ripple-ts/tanstack-router';
import { sleep } from '../upstream/utils.ts';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

let history: RouterHistory;
function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
beforeEach(() => {
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	history.destroy();
	vi.clearAllMocks();
	vi.resetAllMocks();
	window.history.replaceState(null, 'root', '/');
	cleanup();
});
const WAIT_TIME = 100;
describe('redirect', () => {
	describe('SPA', () => {
		test('allows a same-location redirect to settle after a side effect', async () => {
			let firstLoad = true;
			const loader = vi.fn(() => {
				if (firstLoad) {
					firstLoad = false;
					throw redirect({ to: '/' });
				}
			});
			const rootRoute = createRootRoute();
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				loader,
				component: () => <div>{'Index page'}</div>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([indexRoute]),
				history,
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByText('Index page')).toBeInTheDocument();
			expect(window.location.pathname).toBe('/');
			expect(loader).toHaveBeenCalledTimes(2);
			expect(router.state.status).toBe('idle');
		});
		test('renders the source error boundary when building a redirect target fails', async () => {
			const boom = new Error('redirect search failed');
			const rootRoute = createRootRoute({ component: Outlet });
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: () => <div>{'Home'}</div>,
			});
			const sourceRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/source',
				beforeLoad: () => {
					throw redirect({
						to: '/target',
						search: () => {
							throw boom;
						},
					});
				},
				errorComponent: ({ error }) =>
					<div data-testid="source-error">{getErrorMessage(error)}</div>,
			});
			const targetRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/target',
				component: () => <div>{'Target'}</div>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([
					indexRoute,
					sourceRoute,
					targetRoute,
				]),
				history,
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByText('Home')).toBeInTheDocument();
			await act(() => router.navigate({ to: '/source' }));
			expect(await screen.findByTestId('source-error')).toHaveTextContent(boom.message);
			expect(screen.queryByText('Home')).not.toBeInTheDocument();
			expect(screen.queryByText('Target')).not.toBeInTheDocument();
			expect(window.location.pathname).toBe('/source');
			expect(router.state.status).toBe('idle');
		});
		test('renders a root error after too many same-location redirects', async () => {
			const loader = vi.fn(() => {
				throw redirect({ to: '/' });
			});
			const rootRoute = createRootRoute({
				errorComponent: ({ error }) => <div data-testid="root-error">
					{'Root: '}
					{getErrorMessage(error)}
				</div>,
			});
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				loader,
				errorComponent: ({ error }) => <div data-testid="index-error">
					{'Index: '}
					{getErrorMessage(error)}
				</div>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([indexRoute]),
				history,
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByTestId('root-error')).toHaveTextContent('Root: Too many redirects');
			expect(screen.queryByTestId('index-error')).not.toBeInTheDocument();
			expect(window.location.pathname).toBe('/');
			expect(loader).toHaveBeenCalledTimes(21);
			expect(router.state.status).toBe('idle');
		});
		test('renders a root error after too many alternating redirects', async () => {
			const indexLoader = vi.fn(() => {
				throw redirect({ to: '/other' });
			});
			const otherLoader = vi.fn(() => {
				throw redirect({ to: '/' });
			});
			const rootRoute = createRootRoute({
				errorComponent: ({ error }) => <div data-testid="root-error">
					{'Root: '}
					{getErrorMessage(error)}
				</div>,
			});
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				loader: indexLoader,
				errorComponent: ({ error }) => <div data-testid="index-error">
					{'Index: '}
					{getErrorMessage(error)}
				</div>,
			});
			const otherRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/other',
				loader: otherLoader,
				errorComponent: ({ error }) => <div data-testid="other-error">
					{'Other: '}
					{getErrorMessage(error)}
				</div>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([indexRoute, otherRoute]),
				history,
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByTestId('root-error')).toHaveTextContent('Root: Too many redirects');
			expect(screen.queryByTestId('index-error')).not.toBeInTheDocument();
			expect(screen.queryByTestId('other-error')).not.toBeInTheDocument();
			expect(window.location.pathname).toBe('/');
			expect(indexLoader).toHaveBeenCalledTimes(11);
			expect(otherLoader).toHaveBeenCalledTimes(10);
			expect(router.state.status).toBe('idle');
		});
	});
});
