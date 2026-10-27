// Ported from TanStack/react-router tests/route.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { cleanup, render, screen } from '../../react-harness.js';
import {
	RouterProvider,
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouter,
	getRouteApi,
	notFound,
} from '@ripple-ts/tanstack-router';
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
describe('route.head', () => {
	test('meta is set when loader throws notFound', async () => {
		const rootRoute = createRootRoute({
			head: () => ({
				meta: [
					{ title: 'Root' },
					{ charSet: 'utf-8' },
				],
			}),
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			head: () => ({
				meta: [{ title: 'Index' }],
			}),
			loader: async () => {
				throw notFound();
			},
			component: () => <div>{'Index'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute]);
		const router = createRouter({ routeTree });
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Not Found')).toBeInTheDocument();
		const metaState = router.state.matches.map((m) => m.meta);
		expect(metaState).toEqual([
			[
				{ title: 'Root' },
				{ charSet: 'utf-8' },
			],
			[{ title: 'Index' }],
		]);
	});
	test('meta is set when loader throws an error', async () => {
		const rootRoute = createRootRoute({
			head: () => ({
				meta: [
					{ title: 'Root' },
					{ charSet: 'utf-8' },
				],
			}),
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			head: () => ({
				meta: [{ title: 'Index' }],
			}),
			loader: async () => {
				throw new Error('Fly, you fools!');
			},
			component: () => <div>{'Index'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute]);
		const router = createRouter({ routeTree });
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Fly, you fools!')).toBeInTheDocument();
		const metaState = router.state.matches.map((m) => m.meta);
		expect(metaState).toEqual([
			[
				{ title: 'Root' },
				{ charSet: 'utf-8' },
			],
			[{ title: 'Index' }],
		]);
	});
});
