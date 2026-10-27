// Ported from TanStack/react-router tests/not-found-pending-context.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { act, cleanup, render, screen } from '../../react-harness.js';
import { expect, test } from 'vitest';
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRouteWithContext,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

function createGate() {
	let resolve!: () => void;
	const promise = new Promise<void>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}
test(
	'an automatic not-found destination shows pending UI until owner context is ready',
	async () => {
		const beforeLoadStarted = createGate();
		const beforeLoadGate = createGate();
		let gateNextBeforeLoad = false;
		const rootRoute = createRootRouteWithContext<{
			product: string;
		}>()({
			beforeLoad: async () => {
				if (gateNextBeforeLoad) {
					gateNextBeforeLoad = false;
					beforeLoadStarted.resolve();
					await beforeLoadGate.promise;
					return { user: 'Grace', access: 'editor' };
				}
				return { user: 'Ada', access: 'reader' };
			},
			pendingMs: 0,
			pendingMinMs: 0,
			pendingComponent: () => <p role="status">{'Loading account'}</p>,
			component: () => {
				const context = rootRoute.useRouteContext();
				return <main>
					<h1>{'Account portal'}</h1>
					<output data-testid="owner-context">
						{context.value.product}
						{' / '}
						{context.value.user}
						{' / '}
						{context.value.access}
					</output>
					<Outlet />
				</main>;
			},
			notFoundComponent: () => {
				const context = rootRoute.useRouteContext();
				return <p data-testid="not-found-context">
					{'Missing page for '}
					{context.value.product}
					{' / '}
					{context.value.user}
					{' / '}
					{context.value.access}
				</p>;
			},
		});
		const dashboardRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/dashboard',
			component: () => <p>{'Dashboard'}</p>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([dashboardRoute]),
			history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
			context: { product: 'Router Cloud' },
		});
		let navigation: Promise<void> | undefined;
		try {
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByText('Dashboard')).toBeVisible();
			expect(screen.getByTestId('owner-context')).toHaveTextContent('Router Cloud / Ada / reader');
			gateNextBeforeLoad = true;
			await act(async () => {
				navigation = router.navigate({ to: '/missing' } as any);
				await beforeLoadStarted.promise;
				await new Promise((resolve) => setTimeout(resolve, 0));
			});
			expect(screen.getByRole('status')).toHaveTextContent('Loading account');
			// Ripple removes the pending subtree instead of keeping React's hidden DOM.
			expect(screen.queryByTestId('owner-context')).not.toBeInTheDocument();
			await act(async () => {
				beforeLoadGate.resolve();
				await navigation;
			});
			expect(screen.getByRole('heading', { name: 'Account portal' })).toBeVisible();
			expect(screen.getByTestId('owner-context')).toBeVisible();
			expect(screen.getByTestId('owner-context')).toHaveTextContent(
				'Router Cloud / Grace / editor',
			);
			expect(screen.getByTestId('not-found-context')).toHaveTextContent(
				'Missing page for Router Cloud / Grace / editor',
			);
			expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
			expect(screen.queryByText('Loading account')).not.toBeInTheDocument();
		} finally {
			beforeLoadGate.resolve();
			await act(async () => {
				await Promise.allSettled(navigation ? [navigation] : []);
			});
			cleanup();
		}
	},
);
