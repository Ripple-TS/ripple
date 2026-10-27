// Ported from TanStack/react-router tests/useMatch.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { useState } from '../upstream/reactivity.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '../../react-harness.js';
import {
	Link,
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	useMatch,
} from '@ripple-ts/tanstack-router';
import type { RouteComponent, RouterHistory } from '@ripple-ts/tanstack-router';

afterEach(() => {
	window.history.replaceState(null, 'root', '/');
	cleanup();
});
describe('useMatch', () => {
	function setup({
		RootComponent,
		history,
	}: {
		RootComponent: RouteComponent;
		history?: RouterHistory;
	}) {
		const rootRoute = createRootRoute({
			component: RootComponent,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <>
				<h1>{'IndexTitle'}</h1>
				<Link to="/posts">{'Posts'}</Link>
			</>,
		});
		history = history || createMemoryHistory({ initialEntries: ['/'] });
		const postsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts',
			component: () => <h1>{'PostsTitle'}</h1>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postsRoute]),
			history,
		});
		return render(() => <RouterProvider router={router} />);
	}
	describe('when match is found', () => {
		test('returns undefined from select when match is found', async () => {
			const select = vi.fn(() => undefined);
			function RootComponent() {
				const match = useMatch({ from: '/posts', select });
				expect(match.value).toBeUndefined();
				return <Outlet />;
			}
			setup({
				RootComponent,
				history: createMemoryHistory({ initialEntries: ['/posts'] }),
			});
			const postsTitle = await screen.findByText('PostsTitle');
			expect(postsTitle).toBeInTheDocument();
			expect(select).toHaveBeenCalled();
		});
	});
});
