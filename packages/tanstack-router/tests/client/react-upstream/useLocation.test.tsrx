// Ported from TanStack/react-router tests/useLocation.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { useEffect } from '../upstream/reactivity.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '../../react-harness.js';
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	useLocation,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	window.history.replaceState(null, 'root', '/');
	cleanup();
});
describe('useLocation', () => {
	test(
		'keeps a selected pathname reference stable across search and hash updates when structural sharing is enabled',
		async () => {
			const effectSpy = vi.fn();
			const pathnameSelections: Array<{
				pathname: string;
			}> = [];
			const rootRoute = createRootRoute({
				component: function RootComponent() {
					const pathnameSelection = useLocation({
						select: (location) => ({ pathname: location.pathname }),
					});
					useEffect(() => {
						effectSpy(pathnameSelection.value);
						pathnameSelections.push(pathnameSelection.value);
					}, () => [pathnameSelection.value]);
					return <Outlet />;
				},
			});
			const postsRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/posts',
				component: () => <h1>{'Posts'}</h1>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([postsRoute]),
				history: createMemoryHistory({
					initialEntries: ['/posts?foo=one#first'],
				}),
				defaultStructuralSharing: true,
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByRole('heading', { name: 'Posts' })).toBeInTheDocument();
			await waitFor(() => expect(effectSpy).toHaveBeenCalledTimes(1));
			const initialPathnameSelection = pathnameSelections[0];
			await act(
				() => router.navigate({
					to: '/posts',
					search: { foo: 'two' },
					hash: 'first',
				}),
			);
			await waitFor(() => {
				expect(router.state.location.search).toEqual({ foo: 'two' });
				expect(effectSpy).toHaveBeenCalledTimes(1);
			});
			await act(
				() => router.navigate({
					to: '/posts',
					search: { foo: 'two' },
					hash: 'second',
				}),
			);
			await waitFor(() => {
				expect(router.state.location.hash).toBe('second');
				expect(effectSpy).toHaveBeenCalledTimes(1);
			});
			expect(pathnameSelections).toHaveLength(1);
			expect(pathnameSelections[0]).toBe(initialPathnameSelection);
		},
	);
});
