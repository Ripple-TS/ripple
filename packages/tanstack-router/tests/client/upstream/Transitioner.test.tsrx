import { track } from 'ripple';
// Ported from TanStack/solid-router tests/Transitioner.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '../../harness.js';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { RouterProvider } from '@ripple-ts/tanstack-router';

describe('Transitioner', () => {
	it('should call router.load() when Transitioner mounts on the client', async () => {
		const loader = vi.fn();
		const rootRoute = createRootRoute();
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>Index</div>,
			loader,
		});
		const routeTree = rootRoute.addChildren([indexRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['/'],
			}),
		});
		// Mock router.load() to verify it gets called
		const loadSpy = vi.spyOn(router, 'load');
		render(() => <RouterProvider router={router} />);
		// Wait for the createRenderEffect to run and call router.load()
		await waitFor(() => {
			expect(loadSpy).toHaveBeenCalledTimes(1);
			expect(loader).toHaveBeenCalledTimes(1);
		});
		loadSpy.mockRestore();
	});
});
