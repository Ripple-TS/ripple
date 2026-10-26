// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expect, test } from 'vitest';
import { render, screen, waitFor } from '../../harness.js';
import {
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	RouterProvider,
	Outlet,
} from '@ripple-ts/tanstack-router';

test('invalidate merges fresh parent beforeLoad context with cached child context', async () => {
	let generation = 0;
	let childContextCalls = 0;

	const rootRoute = createRootRoute({
		beforeLoad: () => {
			generation++;
			return {
				parentGeneration: generation,
				collision: `parent-${generation}`,
			};
		},
		component: Outlet,
	});
	const childRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		context: ({ context }) => {
			childContextCalls++;
			return {
				childSnapshotOfParent: context.parentGeneration,
				collision: `child-snapshot-${context.parentGeneration}`,
			};
		},
		component: () => {
			const context = childRoute.useRouteContext();

			return <div>
				<div data-testid="parent-generation">{context.value.parentGeneration}</div>
				<div data-testid="child-snapshot">{context.value.childSnapshotOfParent}</div>
				<div data-testid="collision">{context.value.collision}</div>
			</div>;
		},
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([childRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});

	render(() => <RouterProvider router={router} />);

	expect(await screen.findByTestId('parent-generation')).toHaveTextContent('1');
	expect(screen.getByTestId('child-snapshot')).toHaveTextContent('1');
	expect(screen.getByTestId('collision')).toHaveTextContent('child-snapshot-1');
	expect(generation).toBe(1);
	expect(childContextCalls).toBe(1);
	const childMatchId = router.state.matches[1]!.id;

	await router.invalidate();

	// The fresh parent contribution is merged under the cached child contribution.
	expect(router.state.matches[1]!.id).toBe(childMatchId);
	expect(generation).toBe(2);
	expect(childContextCalls).toBe(1);
	await waitFor(() => {
		expect(screen.getByTestId('parent-generation')).toHaveTextContent('2');
		expect(screen.getByTestId('child-snapshot')).toHaveTextContent('1');
		expect(screen.getByTestId('collision')).toHaveTextContent('child-snapshot-1');
	});
});
