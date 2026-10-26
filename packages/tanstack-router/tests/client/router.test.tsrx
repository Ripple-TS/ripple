import { describe, expect, it, vi } from 'vitest';
import { effect, track, trackAsync } from 'ripple';
import {
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	RouterProvider,
	Outlet,
	createControlledPromise,
} from '@ripple-ts/tanstack-router';
import { render, waitFor, fireEvent } from '../harness.js';

describe('native Ripple router', () => {
	it(
		'replaces a noncanonical initial search instead of pushing another history entry',
		async () => {
			const root = createRootRoute({ component: () => <Outlet /> });
			const loader = vi.fn();
			const page = createRoute({
				getParentRoute: () => root,
				path: '/page',
				validateSearch: (search: Record<string, unknown>) => ({
					tab: typeof search.tab === 'number' ? search.tab : 0,
				}),
				loader,
				component: () => <p>Page</p>,
			});
			const history = createMemoryHistory({ initialEntries: ['/page?tab=oops'] });
			const router = createRouter({ routeTree: root.addChildren([page]), history });
			function App() {
				return <RouterProvider {router} />;
			}
			const view = render(App);
			await view.findByText('Page');
			expect(history.location.href).toBe('/page?tab=0');
			expect(history.location.state.__TSR_index).toBe(0);
			expect(loader).toHaveBeenCalledTimes(1);
		},
	);

	it('loads a history change made while the provider was unmounted', async () => {
		const root = createRootRoute({ component: () => <Outlet /> });
		const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
		const b = createRoute({ getParentRoute: () => root, path: '/b', component: () => <p>B</p> });
		const history = createMemoryHistory({ initialEntries: ['/a'] });
		const router = createRouter({ routeTree: root.addChildren([a, b]), history });
		function App() {
			return <RouterProvider {router} />;
		}
		const first = render(App);
		await first.findByText('A');
		await waitFor(() => expect(router.state.status).toBe('idle'));
		first.unmount();
		history.push('/b');
		const next = render(App);
		await next.findByText('B');
		expect(history.subscribers.size).toBe(1);
	});

	it('adopts an initial load already in flight without restarting its guards', async () => {
		const gate = createControlledPromise<void>();
		const started = createControlledPromise<void>();
		const guard = vi.fn(() => {
			started.resolve();
			return gate;
		});
		const root = createRootRoute({ beforeLoad: guard, component: () => <p>Ready</p> });
		const router = createRouter({
			routeTree: root,
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		const initial = router.load();
		await started;
		function App() {
			return <RouterProvider {router} />;
		}
		const view = render(App);
		gate.resolve();
		await initial;
		await view.findByText('Ready');
		expect(guard).toHaveBeenCalledTimes(1);
	});

	it(
		'renders unhandled route errors in the global boundary and recovers on navigation',
		async () => {
			const root = createRootRoute({ component: () => <Outlet /> });
			const bad = createRoute({
				getParentRoute: () => root,
				path: '/bad',
				component: () => {
					throw new Error('broken route');
				},
			});
			const good = createRoute({
				getParentRoute: () => root,
				path: '/good',
				component: () => <p>Recovered</p>,
			});
			const router = createRouter({
				routeTree: root.addChildren([bad, good]),
				history: createMemoryHistory({ initialEntries: ['/bad'] }),
			});
			function App() {
				return <RouterProvider {router} />;
			}
			const view = render(App);
			await view.findByText('Error: broken route');
			await router.navigate({ to: '/good' });
			expect(view.getByText('Recovered')).toBeTruthy();
		},
	);
	it(
		'creates outside mount, loads nested routes, and retains a parent across navigation',
		async () => {
			const mounted = vi.fn();
			const disposed = vi.fn();
			function Layout() @{
				const count = track(0);
				effect(() => {
					mounted();
					return disposed;
				});
				<>
					<button onClick={() => count.value++}>{'Count ' + count.value}</button>
					<Outlet />
				</>
			}
			const root = createRootRoute({ component: Layout });
			const first = createRoute({
				getParentRoute: () => root,
				path: '/first',
				component: () => <p>First</p>,
			});
			const second = createRoute({
				getParentRoute: () => root,
				path: '/second',
				loader: () => 'Second',
				component: Second,
			});
			function Second() @{
				const data = second.useLoaderData();
				<p>{data.value as string}</p>
			}
			const router = createRouter({
				routeTree: root.addChildren([first, second]),
				history: createMemoryHistory({ initialEntries: ['/first'] }),
			});
			function App() {
				return <RouterProvider {router} />;
			}
			expect(router.isServer).toBe(false);
			const view = render(App);
			expect(router.history.subscribers.size).toBe(1);
			await view.findByText('First');
			fireEvent.click(view.getByRole('button', { name: 'Count 0' }));
			await router.navigate({ to: '/second' });
			expect(view.getByText('Second')).toBeTruthy();
			expect(view.getByRole('button', { name: 'Count 1' })).toBeTruthy();
			expect(mounted).toHaveBeenCalledTimes(1);
			view.unmount();
			expect(disposed).toHaveBeenCalledTimes(1);
			const next = render(App);
			await next.findByText('Second');
			await router.navigate({ to: '/first' });
			expect(next.getByText('First')).toBeTruthy();
		},
	);

	it(
		'settles navigation after suspended destination rendering, with lifecycle events observing committed DOM',
		async () => {
			const gate = createControlledPromise<string>();
			const root = createRootRoute({ component: () => <Outlet /> });
			const first = createRoute({
				getParentRoute: () => root,
				path: '/first',
				component: () => <p>First</p>,
			});
			function Second() @{
				const data = trackAsync(() => gate);
				<p>{data.value}</p>
			}
			const second = createRoute({
				getParentRoute: () => root,
				path: '/second',
				component: Second,
			});
			const router = createRouter({
				routeTree: root.addChildren([first, second]),
				history: createMemoryHistory({ initialEntries: ['/first'] }),
			});
			function App() {
				return <RouterProvider {router} />;
			}
			const view = render(App);
			await view.findByText('First');
			await waitFor(() => expect(router.state.status).toBe('idle'));
			const events: string[] = [];
			const offResolved = router.subscribe(
				'onResolved',
				() => events.push(`resolved:${view.queryByText('Second') !== null}`),
			);
			const offRendered = router.subscribe(
				'onRendered',
				() => events.push(`rendered:${view.queryByText('Second') !== null}`),
			);
			try {
				const navigation = router.navigate({ to: '/second' });
				await Promise.resolve();
				expect(events).toEqual([]);
				gate.resolve('Second');
				await navigation;
				expect(events).toEqual(['resolved:true', 'rendered:true']);
			} finally {
				gate.resolve('Second');
				offResolved();
				offRendered();
			}
		},
	);
});
