// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expect, onTestFinished, test, vi } from 'vitest';
import { render, screen } from '../../harness.js';
import {
	createControlledPromise,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
	Outlet,
} from '@ripple-ts/tanstack-router';

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
test('global catch boundary resets when a background child generation recovers', async () => {
	const refresh = createControlledPromise<number>();
	let loaderCalls = 0;
	const rootRoute = createRootRoute({ component: Outlet });
	const childRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		loader: {
			staleReloadMode: 'background',
			handler: () => (++loaderCalls === 1 ? 1 : refresh),
		},
		component: () => {
			const revision = childRoute.useLoaderData();
			if (revision.value === 1) {
				throw new Error('stale child render failed');
			}
			return <div>Recovered child revision {revision.value}</div>;
		},
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([childRoute]),
	});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});

	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('stale child render failed')).toBeInTheDocument();

	const invalidation = router.invalidate();
	await vi.waitFor(() => expect(loaderCalls).toBe(2));
	expect(screen.getByText('stale child render failed')).toBeInTheDocument();
	expect(screen.queryByText(/Recovered child revision/)).not.toBeInTheDocument();
	refresh.resolve(2);
	await invalidation;

	expect(await screen.findByText('Recovered child revision 2')).toBeInTheDocument();
	expect(screen.queryByText('stale child render failed')).not.toBeInTheDocument();
});

test(
	'ancestor route errorComponent resets when a background child generation recovers',
	async () => {
		const refresh = createControlledPromise<number>();
		let loaderCalls = 0;
		const rootRoute = createRootRoute({
			component: Outlet,
			errorComponent: ({ error }) => <div>Ancestor error: {getErrorMessage(error)}</div>,
		});
		const childRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			loader: {
				staleReloadMode: 'background',
				handler: () => (++loaderCalls === 1 ? 1 : refresh),
			},
			component: () => {
				const revision = childRoute.useLoaderData();
				if (revision.value === 1) {
					throw new Error('stale child render failed');
				}
				return <div>Recovered child revision {revision.value}</div>;
			},
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([childRoute]),
		});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});

		render(() => <RouterProvider router={router} />);
		expect(
			await screen.findByText('Ancestor error: stale child render failed'),
		).toBeInTheDocument();

		const invalidation = router.invalidate({
			filter: (match) => match.routeId === childRoute.id,
		});
		onTestFinished(async () => {
			refresh.resolve(2);
			await Promise.allSettled([invalidation]);
		});

		await vi.waitFor(() => expect(loaderCalls).toBe(2));
		expect(screen.getByText('Ancestor error: stale child render failed')).toBeInTheDocument();
		refresh.resolve(2);
		await invalidation;

		expect(await screen.findByText('Recovered child revision 2')).toBeInTheDocument();
	},
);
