// Native pending-boundary adaptation of TanStack/react-router tests/root-pending-min.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, render, screen } from '../../react-harness.js';

import { afterEach, expect, test, vi } from 'vitest';

const dehydrateSsrMatchId = (id: string) => id.replaceAll('/', '#');
import { hydrate } from '@ripple-ts/tanstack-router/ssr/client';
import {
	RouterProvider,
	createControlledPromise,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

const testCleanups: Array<() => void | Promise<void>> = [];
afterEach(async () => {
	while (testCleanups.length) {
		await testCleanups.pop()!();
	}
	cleanup();
	vi.useRealTimers();
	delete window.$_TSR;
});
// Ripple has a container root, so its configured root pending boundary remains enabled.
// React disables this boundary without a separate document shell.
test(
	'a post-hydration root reload shows its configured fallback through pendingMinMs',
	async () => {
		const reloadGate = createControlledPromise<void>();
		const rootLoader = vi.fn(() => reloadGate.then(() => ({ generation: 2 })));
		const rootRoute = createRootRoute({
			pendingMs: 0,
			pendingMinMs: 100,
			pendingComponent: () => <div data-testid="root-pending">{'Pending'}</div>,
			loader: rootLoader,
			component: () => <div data-testid="root-content">
				{'Generation '}
				{rootRoute.useLoaderData().value.generation}
			</div>,
		});
		const router = createRouter({
			routeTree: rootRoute,
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		const rootMatch = router.matchRoutes(router.latestLocation)[0]!;
		// This is the same public bootstrap shape produced by the server. Calling
		// hydrate() ensures router.ssr and the active match are established through
		// the real client hydration path rather than by mutating router stores.
		window.$_TSR = {
			router: {
				manifest: { routes: {} },
				dehydratedData: {},
				matches: [
					{
						i: dehydrateSsrMatchId(rootMatch.id),
						s: 'success',
						ssr: true,
						l: { generation: 1 },
						u: Date.now(),
					},
				],
			},
			h: vi.fn(),
			e: vi.fn(),
			c: vi.fn(),
			p: vi.fn(),
			buffer: [],
			initialized: false,
		};
		await hydrate(router);
		expect(router.ssr).toBeDefined();
		render(() => <RouterProvider router={router} />);
		expect(screen.getByTestId('root-content')).toHaveTextContent('Generation 1');
		expect(rootLoader).not.toHaveBeenCalled();
		vi.useFakeTimers();
		let invalidation!: Promise<void>;
		await act(async () => {
			invalidation = router.invalidate({ forcePending: true });
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(rootLoader).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId('root-pending')).toBeInTheDocument();
		expect(screen.queryByTestId('root-content')).not.toBeInTheDocument();
		await act(async () => {
			reloadGate.resolve();
			await Promise.resolve();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(99);
		});
		expect(screen.queryByTestId('root-pending')).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
			await invalidation;
		});
		expect(screen.queryByTestId('root-pending')).not.toBeInTheDocument();
		expect(screen.getByTestId('root-content')).toHaveTextContent('Generation 2');
	},
);
