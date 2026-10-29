import { ViewTransition, createViewTransition } from 'ripple';
import { afterEach, expect, test, vi } from 'vitest';
import {
	RouterProvider,
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
} from '@ripple-ts/tanstack-router';
import { cleanup, render, screen, waitFor } from '../harness.js';
import { installViewTransitions } from '../../../ripple/tests/view-transition/native.js';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	Reflect.deleteProperty(document, 'startViewTransition');
});

test(
	'uses one native owner for navigation and direct updates and restores the core wrapper',
	async () => {
		const native = installViewTransitions();
		const shared = vi.fn();
		const root = createRootRoute({ component: () => <Outlet /> });
		const first = createRoute({
			getParentRoute: () => root,
			path: '/',
			component: () => <ViewTransition name="route" onShare={shared}>
				<p>first</p>
			</ViewTransition>,
		});
		const next = createRoute({
			getParentRoute: () => root,
			path: '/next',
			component: () => <ViewTransition name="route" onShare={shared}>
				<p>next</p>
			</ViewTransition>,
		});
		const router = createRouter({
			routeTree: root.addChildren([first, next]),
			history: createMemoryHistory(),
			defaultViewTransition: { types: ['forward'] },
		});
		const original = router.startViewTransition;
		function App() @{
			const viewTransition = createViewTransition();
			<RouterProvider {router} {viewTransition} />
		}
		render(App);
		expect(await screen.findByText('first')).toBeInTheDocument();
		await waitFor(() => expect(router.state.status).toBe('idle'));
		for (const transition of native.transitions) transition.finish();
		native.start.mockClear();
		shared.mockClear();
		await router.navigate({ to: '/next' });
		expect(await screen.findByText('next')).toBeInTheDocument();
		await waitFor(() => expect(shared).toHaveBeenCalledOnce());
		expect(native.start).toHaveBeenCalledOnce();
		expect(native.transitions.at(-1).types).toEqual(new Set(['forward']));
		native.transitions.at(-1).finish();
		await router.navigate({ to: '/', viewTransition: false });
		expect(await screen.findByText('first')).toBeInTheDocument();
		expect(native.start).toHaveBeenCalledOnce();
		cleanup();
		expect(router.startViewTransition).toBe(original);
	},
);
