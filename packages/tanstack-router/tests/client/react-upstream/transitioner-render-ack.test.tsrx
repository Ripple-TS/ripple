// Ported from TanStack/react-router tests/transitioner-render-ack.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { StrictMode, act } from '../upstream/reactivity.js';
import { cleanup, render, screen, waitFor } from '../../react-harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import {
	Outlet,
	RouterProvider,
	createControlledPromise,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

const testCleanups: Array<() => void> = [];
afterEach(() => {
	while (testCleanups.length) {
		testCleanups.pop()!();
	}
	cleanup();
	vi.useRealTimers();
});
test(
	'an immediately completed background refresh cannot replace the acknowledged foreground generation',
	async () => {
		let generation = 0;
		const rootRoute = createRootRoute({ component: Outlet });
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			loader: {
				staleReloadMode: 'background',
				handler: () => ++generation,
			},
			component: () => <div>
				{'Generation '}
				{indexRoute.useLoaderData().value}
			</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Generation 1')).toBeInTheDocument();
		await waitFor(() => expect(router.state.status).toBe('idle'));
		await act(() => router.invalidate());
		expect(await screen.findByText('Generation 2')).toBeInTheDocument();
		expect(router.state.status).toBe('idle');
	},
);
test(
	'a navigation started by route lifecycle keeps the pending minimum of its own render',
	async () => {
		const slowLoader = createControlledPromise<void>();
		let nestedNavigation: Promise<void> | undefined;
		const rootRoute = createRootRoute({ component: Outlet });
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>{'Index'}</div>,
		});
		const redirectorRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/redirector',
			onEnter: () => {
				nestedNavigation = router.navigate({ to: '/slow' });
			},
			component: () => <div>{'Redirector'}</div>,
		});
		const slowRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/slow',
			pendingMs: 0,
			pendingMinMs: 100,
			pendingComponent: () => <div>{'Slow pending'}</div>,
			loader: () => slowLoader,
			component: () => <div>{'Slow done'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, redirectorRoute, slowRoute]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Index')).toBeInTheDocument();
		await waitFor(() => expect(router.state.status).toBe('idle'));
		vi.useFakeTimers();
		let firstNavigation!: Promise<void>;
		await act(async () => {
			firstNavigation = router.navigate({ to: '/redirector' });
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(nestedNavigation).toBeDefined();
		expect(screen.getByText('Slow pending')).toBeInTheDocument();
		await act(async () => {
			slowLoader.resolve();
			await Promise.resolve();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(99);
		});
		expect(screen.getByText('Slow pending')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
			await Promise.all([firstNavigation, nestedNavigation!]);
		});
		expect(screen.queryByText('Slow pending')).not.toBeInTheDocument();
		expect(screen.getByText('Slow done')).toBeInTheDocument();
	},
);
