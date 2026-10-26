// Ported from TanStack/solid-router tests/issue-7986-retained-pending.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// DOM queries/assertions are preserved; Solid resource/accessor reads use trackAsync/.value.
import { cleanup, render, screen, waitFor } from '../../harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import { createControlledPromise } from '@tanstack/router-core';
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import type { ControlledPromise } from '@tanstack/router-core';

const controlledPromises = new Set<ControlledPromise<void>>();
const pendingOperations = new Set<Promise<unknown>>();
afterEach(async () => {
	try {
		for (const promise of controlledPromises) {
			if (promise.status === 'pending') {
				promise.resolve();
			}
		}
		if (vi.isFakeTimers()) {
			await vi.runAllTimersAsync();
		}
		await Promise.allSettled(pendingOperations);
	} finally {
		controlledPromises.clear();
		pendingOperations.clear();
		cleanup();
		vi.useRealTimers();
		vi.restoreAllMocks();
	}
});
const navigationDelay = 100;
function delayNavigation() {
	return new Promise<void>((resolve) => setTimeout(resolve, navigationDelay));
}
function controlled() {
	const promise = createControlledPromise<void>();
	controlledPromises.add(promise);
	return promise;
}
function track<T>(operation: Promise<T>) {
	pendingOperations.add(operation);
	return operation;
}
function setup() {
	const navigationBeforeLoadStarted = controlled();
	let beforeLoadCalls = 0;
	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const layoutRoute = createRoute({
		getParentRoute: () => rootRoute,
		id: 'app',
		beforeLoad: async () => {
			if (++beforeLoadCalls > 1) {
				navigationBeforeLoadStarted.resolve();
				await delayNavigation();
			}
			return { user: 'test' };
		},
		component: () => <Outlet />,
	});
	const projectRoute = createRoute({
		getParentRoute: () => layoutRoute,
		path: '/projects/$projectId',
		validateSearch: (search: Record<string, unknown>): {
			tab?: string;
		} => typeof search.tab === 'string' ? { tab: search.tab } : {},
		component: Project,
	});
	function Project() {
		const params = projectRoute.useParams();
		const search = projectRoute.useSearch();
		return <div data-testid="content">
			{'project='}
			{params.value.projectId}
			{' tab='}
			{search.value.tab ?? 'default'}
		</div>;
	}
	const router = createRouter({
		routeTree: rootRoute.addChildren([layoutRoute.addChildren([projectRoute])]),
		history: createMemoryHistory({ initialEntries: ['/projects/p1'] }),
		defaultPendingComponent: () => <div data-testid="pending">Pending</div>,
		defaultPendingMs: 0,
		defaultPendingMinMs: 1,
	});
	return { router, navigationBeforeLoadStarted };
}
test('a search-only navigation retains successful UI while beforeLoad reruns', async () => {
	const { router, navigationBeforeLoadStarted } = setup();
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByTestId('content')).toHaveTextContent('project=p1 tab=default');
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const navigation = track(
		router.navigate({
			to: '/projects/$projectId',
			params: { projectId: 'p1' },
			search: { tab: 'files' },
		}),
	);
	await navigationBeforeLoadStarted;
	expect(screen.getByTestId('content')).toBeVisible();
	expect(screen.getByTestId('content')).toHaveTextContent('project=p1 tab=default');
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	await vi.advanceTimersByTimeAsync(0);
	expect(screen.getByTestId('content')).toBeVisible();
	expect(screen.getByTestId('content')).toHaveTextContent('project=p1 tab=default');
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	await vi.advanceTimersByTimeAsync(navigationDelay);
	await navigation;
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	expect(screen.getByTestId('content')).toHaveTextContent('project=p1 tab=files');
});
test('a path-param navigation retains successful UI while beforeLoad reruns', async () => {
	const { router, navigationBeforeLoadStarted } = setup();
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByTestId('content')).toHaveTextContent('project=p1 tab=default');
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const navigation = track(
		router.navigate({
			to: '/projects/$projectId',
			params: { projectId: 'p2' },
		}),
	);
	await navigationBeforeLoadStarted;
	expect(screen.getByTestId('content')).toBeVisible();
	expect(screen.getByTestId('content')).toHaveTextContent('project=p1 tab=default');
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	await vi.advanceTimersByTimeAsync(0);
	expect(screen.getByTestId('content')).toBeVisible();
	expect(screen.getByTestId('content')).toHaveTextContent('project=p1 tab=default');
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	await vi.advanceTimersByTimeAsync(navigationDelay);
	await navigation;
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	expect(screen.getByTestId('content')).toHaveTextContent('project=p2 tab=default');
});
test('a blocking reload retains the exact successful match', async () => {
	const reloadStarted = controlled();
	let loaderCalls = 0;
	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const pageRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/page',
		validateSearch: (search: Record<string, unknown>): {
			tab?: string;
		} => typeof search.tab === 'string' ? { tab: search.tab } : {},
		shouldReload: true,
		loader: {
			staleReloadMode: 'blocking',
			handler: () => {
				if (++loaderCalls === 1) {
					return 'initial';
				}
				reloadStarted.resolve();
				return delayNavigation().then(() => 'reloaded');
			},
		},
		component: () => <div data-testid="content">
			{pageRoute.useLoaderData().value}
			{' tab='}
			{pageRoute.useSearch().value.tab ?? 'default'}
		</div>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([pageRoute]),
		history: createMemoryHistory({ initialEntries: ['/page'] }),
		defaultPendingComponent: () => <div data-testid="pending">Pending</div>,
		defaultPendingMs: 0,
		defaultPendingMinMs: 1,
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByTestId('content')).toHaveTextContent('initial tab=default');
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const navigation = track(
		router.navigate({
			to: '/page',
			search: { tab: 'files' },
		}),
	);
	await reloadStarted;
	const contentWhileLoading = screen.getByTestId('content');
	expect(contentWhileLoading).toBeVisible();
	expect(contentWhileLoading).toHaveTextContent('initial tab=default');
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	await vi.advanceTimersByTimeAsync(0);
	expect(screen.getByTestId('content')).toBeVisible();
	expect(screen.getByTestId('content')).toHaveTextContent('initial tab=default');
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	await vi.advanceTimersByTimeAsync(navigationDelay);
	await navigation;
	expect(screen.queryByTestId('pending')).not.toBeInTheDocument();
	expect(screen.getByTestId('content')).toHaveTextContent('reloaded tab=files');
});
