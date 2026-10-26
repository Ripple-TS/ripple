// Ported from TanStack/solid-router tests/store-updates-during-navigation.test.tsx,
// "preload a preloaded route w/ async loader", at da2adec76dbe6c0da6d6a0d5640f7b9388217f45.
// See NOTICE. Ripple's lazy reader is consumed by an effect; unused Link controls
// from the upstream setup are omitted. The zero-update assertion is preserved.
import { expect, test, vi } from 'vitest';
import { effect } from 'ripple';
import {
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	RouterProvider,
	Outlet,
	useRouterState,
} from '@ripple-ts/tanstack-router';
import { render } from '../../harness.js';

test('preload a preloaded route w/ async loader', async () => {
	const select = vi.fn();
	function Root() @{
		const state = useRouterState({ select });
		effect(() => {
			state.value;
		});
		<Outlet />
	}
	const root = createRootRoute({ component: Root });
	const index = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => <h1>Index</h1>,
	});
	const posts = createRoute({
		getParentRoute: () => root,
		path: '/posts',
		loader: () => new Promise((resolve) => setTimeout(() => resolve({ hello: 'world' }), 100)),
		component: () => <h1>Posts</h1>,
	});
	const router = createRouter({
		routeTree: root.addChildren([index, posts]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		defaultPreload: 'intent',
	});
	function App() {
		return <RouterProvider {router} />;
	}
	const view = render(App);
	await view.findByText('Index');
	await router.preloadRoute({ to: '/posts' });
	await new Promise((resolve) => setTimeout(resolve, 20));
	const before = select.mock.calls.length;
	await router.preloadRoute({ to: '/posts' });
	expect(select.mock.calls.length - before).toBe(0);
});
