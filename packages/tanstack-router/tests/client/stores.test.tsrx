import { describe, expect, it } from 'vitest';
import { effect, flushSync } from 'ripple';
import {
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	RouterProvider,
	Outlet,
	useRouterState,
} from '@ripple-ts/tanstack-router';
import { getStoreFactory } from '../../src/stores.js';
import { render, waitFor } from '../harness.js';

describe('Ripple store contract', () => {
	it(
		'supports pre-mount creation, literal functions, updater functions, and read-after-write',
		() => {
			const factory = getStoreFactory({ isServer: false });
			const value = factory.createMutableStore(1);
			value.set((old) => old + 1);
			expect(value.get()).toBe(2);
			const fn = () => 3;
			const callback = factory.createMutableStore(fn);
			expect(callback.get()).toBe(fn);
			callback.set(() => () => 4);
			expect(callback.get()()).toBe(4);
		},
	);

	it('publishes batches consistently and preserves unchanged readonly results', () => {
		const factory = getStoreFactory({ isServer: false });
		const first = factory.createMutableStore(0);
		const second = factory.createMutableStore(0);
		const combined = factory.createReadonlyStore(
			() => ({ first: first.get(), second: second.get() }),
		);
		const initial = combined.get();
		expect(combined.get()).toBe(initial);
		const seen: string[] = [];
		function App() @{
			effect(() => {
				const state = combined.get();
				seen.push(`${state.first}:${state.second}`);
			});
			<p>{combined.get().first + combined.get().second}</p>
		}
		const view = render(App);
		factory.batch(() => {
			first.set(1);
			second.set(2);
		});
		expect(combined.get()).toEqual({ first: 1, second: 2 });
		flushSync();
		expect(seen).toEqual(['0:0', '1:2']);
		expect(view.getByText('3')).toBeTruthy();
		view.unmount();
		first.set(3);
		flushSync();
		expect(seen).toHaveLength(2);
		expect(combined.get()).toEqual({ first: 3, second: 2 });
	});

	it('does not rerun a pathname consumer for a search-only navigation', async () => {
		const seen: string[] = [];
		function Root() @{
			const path = useRouterState({ select: (state) => state.location.pathname });
			effect(() => {
				seen.push(path.value);
			});
			<Outlet />
		}
		const root = createRootRoute({ component: Root });
		const page = createRoute({
			getParentRoute: () => root,
			path: '/',
			component: () => <p>Page</p>,
		});
		const router = createRouter({
			routeTree: root.addChildren([page]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		function App() {
			return <RouterProvider {router} />;
		}
		const view = render(App);
		await view.findByText('Page');
		await waitFor(() => expect(router.state.status).toBe('idle'));
		await router.navigate({ to: '/', search: { tab: 'next' } });
		expect(seen).toEqual(['/']);
	});

	it(
		'keeps the stores live when the router was created inside a component that later unmounts',
		async () => {
			const root = createRootRoute({ component: () => <Outlet /> });
			const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
			const b = createRoute({ getParentRoute: () => root, path: '/b', component: () => <p>B</p> });
			function makeRouter() {
				return createRouter({
					routeTree: root.addChildren([a, b]),
					history: createMemoryHistory({ initialEntries: ['/a'] }),
				});
			}
			let router: ReturnType<typeof makeRouter>;
			function Creator() @{
				router = makeRouter();
				<RouterProvider {router} />
			}
			const first = render(Creator);
			await first.findByText('A');
			first.unmount();
			function Reader() {
				return <RouterProvider {router} />;
			}
			const second = render(Reader);
			await router!.navigate({ to: '/b' });
			expect(second.getByText('B')).toBeTruthy();
		},
	);
});
