// Ported from TanStack/react-router tests/loaders.test.tsx
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
	useRouter,
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
	vi.resetAllMocks();
	window.history.replaceState(null, 'root', '/');
	cleanup();
});
const WAIT_TIME = 100;
test(
	'reproducer for #6388 - rapid navigation between parameterized routes should not trigger errorComponent',
	async () => {
		const errorComponentRenderCount = vi.fn();
		const onAbortMock = vi.fn();
		const loaderCompleteMock = vi.fn();
		const rootRoute = createRootRoute({
			component: () => <div>
				<Link data-testid="link-to-home" to="/">{'Home'}</Link>
				<Link
					data-testid="link-to-param-1"
					to="/something/$id"
					params={{ id: '1' }}
					preload={false}
				>{'Param 1'}</Link>
				<Link
					data-testid="link-to-param-2"
					to="/something/$id"
					params={{ id: '2' }}
					preload={false}
				>{'Param 2'}</Link>
				<Outlet />
			</div>,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div data-testid="home-page">{'Home page'}</div>,
		});
		const paramRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/something/$id',
			pendingMs: 0,
			loader: async ({ params, abortController }) => {
				const result = await new Promise<{
					id: string;
					done: boolean;
				}>((resolve, reject) => {
					const timer = setTimeout(() => {
						loaderCompleteMock(params.id);
						resolve({ id: params.id, done: true });
					}, WAIT_TIME * 5);
					abortController.signal.addEventListener('abort', () => {
						clearTimeout(timer);
						onAbortMock(params.id);
						reject(new DOMException('Aborted', 'AbortError'));
					});
				});
				return result;
			},
			component: () => {
				const data = paramRoute.useLoaderData();
				return <div data-testid="param-page">
					{'Param Component '}
					{data.value.id}
					{' '}
					{data.value.done ? 'Done' : 'Not done'}
				</div>;
			},
			errorComponent: ({ error }) => {
				errorComponentRenderCount(error);
				return <div data-testid="error-component">
					{'Error Component:'}
					{' '}
					{error instanceof Error ? error.message : String(error)}
					{' | Name:'}
					{' '}
					{error instanceof Error ? error.name : typeof error}
				</div>;
			},
			pendingComponent: () => <div data-testid="pending-component">{'Pending'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute, paramRoute]);
		const router = createRouter({
			routeTree,
			history,
			defaultPreload: false,
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByTestId('home-page')).toBeInTheDocument();
		const param1Link = await screen.findByTestId('link-to-param-1');
		fireEvent.click(param1Link);
		expect(await screen.findByTestId('pending-component')).toBeInTheDocument();
		const param2Link = await screen.findByTestId('link-to-param-2');
		fireEvent.click(param2Link);
		expect(await screen.findByTestId('pending-component')).toBeInTheDocument();
		fireEvent.click(param1Link);
		expect(await screen.findByTestId('pending-component')).toBeInTheDocument();
		const paramPage = await screen.findByTestId('param-page');
		expect(onAbortMock).toHaveBeenCalled();
		expect(errorComponentRenderCount).not.toHaveBeenCalled();
		expect(screen.queryByTestId('error-component')).not.toBeInTheDocument();
		expect(screen.queryByTestId('pending-component')).not.toBeInTheDocument();
		expect(paramPage).toBeInTheDocument();
		expect(paramPage).toHaveTextContent('Param Component 1 Done');
		expect(loaderCompleteMock).toHaveBeenCalled();
	},
);
