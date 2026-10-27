import { track } from 'ripple';
// Ported from TanStack/solid-router tests/ClientOnly.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '../../harness.js';
import {
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import { ClientOnly } from '@ripple-ts/tanstack-router';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

afterEach(() => {
	vi.resetAllMocks();
	cleanup();
});
function createTestRouter(initialHistory?: RouterHistory) {
	const history = initialHistory ?? createMemoryHistory({ initialEntries: ['/'] });
	const rootRoute = createRootRoute({});
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>
			<p>{'Index Route'}</p>
			<ClientOnly fallback={<div data-testid="loading">{'Loading...'}</div>}>
				<div data-testid="client-only-content">{'Client Only Content'}</div>
			</ClientOnly>
		</div>,
	});
	const routeTree = rootRoute.addChildren([indexRoute]);
	const router = createRouter({ routeTree, history });
	return {
		router,
		routes: { indexRoute },
	};
}
describe('ClientOnly', () => {
	beforeEach(() => {
		window.scrollTo = vi.fn();
	});
	// Clear mocks after each test to prevent interference
	afterEach(() => {
		vi.clearAllMocks();
	});
	it('should render client content after hydration', async () => {
		const { router } = createTestRouter();
		await router.load();
		// Mock useSyncExternalStore to simulate hydration
		// vi.spyOn(Solid, 'createEffect').mockImplementation(() => true)
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByTestId('client-only-content')).toBeInTheDocument();
		expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
	});
	it('should handle navigation with client-only content', async () => {
		const { router } = createTestRouter();
		await router.load();
		// Simulate hydration
		// vi.spyOn(Solid, 'createEffect').mockImplementation(() => true)
		// Re-render after hydration
		render(() => <RouterProvider router={router} />);
		// Content should be visible before navigation
		expect(await screen.findByTestId('client-only-content')).toBeInTheDocument();
		// Navigate to a different route and back
		await router.navigate({ to: '/other' });
		await router.navigate({ to: '/' });
		// Content should still be visible after navigation
		expect(await screen.findByTestId('client-only-content')).toBeInTheDocument();
	});
});
