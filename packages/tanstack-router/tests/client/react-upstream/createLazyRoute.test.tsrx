// Ported from TanStack/react-router tests/createLazyRoute.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '../../react-harness.js';
import {
	Link,
	RouterProvider,
	createBrowserHistory,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
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
			<Link to="/heavy">{'Link to heavy'}</Link>
		</div>,
	});
	const heavyRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/heavy',
	}).lazy(() => import('../upstream/lazy/heavy.tsrx').then((d) => d.default('/heavy')));
	const routeTree = rootRoute.addChildren([indexRoute, heavyRoute]);
	const router = createRouter({ routeTree, history });
	return {
		router,
		routes: { indexRoute, heavyRoute },
	};
}
describe('preload: matched routes', { timeout: 20000 }, () => {
	it('should render a lazy route errorComponent when the loader throws on first load', async () => {
		const history = createMemoryHistory({ initialEntries: ['/lazy-error'] });
		const rootRoute = createRootRoute();
		const lazyErrorRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/lazy-error',
			loader: () => {
				throw new Error('lazy error');
			},
		}).lazy(() => import('./lazy-error.tsrx').then((d) => d.Route('/lazy-error')));
		const router = createRouter({
			routeTree: rootRoute.addChildren([lazyErrorRoute]),
			history,
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Lazy Error: lazy error')).toBeInTheDocument();
		expect(screen.queryByText('About route content')).not.toBeInTheDocument();
	});
});
