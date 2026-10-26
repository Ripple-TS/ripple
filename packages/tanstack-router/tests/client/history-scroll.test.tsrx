import { expect, it, vi } from 'vitest';
import { flushSync, track, trackAsync } from 'ripple';
import {
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	RouterProvider,
	Outlet,
	useBlocker,
	useElementScrollRestoration,
	createControlledPromise,
} from '@ripple-ts/tanstack-router';
import { render, waitFor } from '../harness.js';

it(
	'resolves blocked navigation with proceed/reset and removes blockers when disabled or disposed',
	async () => {
		let resolve!: ReturnType<typeof useBlocker>;
		let disable!: () => void;
		function Layout() @{
			const disabled = track(false);
			disable = () => {
				disabled.value = true;
			};
			resolve = useBlocker({ shouldBlockFn: () => true, withResolver: true, disabled });
			<Outlet />
		}
		const root = createRootRoute({ component: Layout });
		const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
		const b = createRoute({ getParentRoute: () => root, path: '/b', component: () => <p>B</p> });
		const history = createMemoryHistory({ initialEntries: ['/a'] });
		const block = vi.spyOn(history, 'block');
		const router = createRouter({ routeTree: root.addChildren([a, b]), history });
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('A');
		const first = router.navigate({ to: '/b' });
		await waitFor(() => expect(resolve.value.status).toBe('blocked'));
		expect(resolve.value.next?.pathname).toBe('/b');
		resolve.value.reset?.();
		await first;
		expect(router.state.location.pathname).toBe('/a');
		expect(resolve.value.status).toBe('idle');
		const second = router.navigate({ to: '/b' });
		await waitFor(() => expect(resolve.value.status).toBe('blocked'));
		resolve.value.proceed?.();
		await second;
		expect(view.getByText('B')).toBeTruthy();
		disable();
		flushSync();
		await router.navigate({ to: '/a' });
		expect(view.getByText('A')).toBeTruthy();
		expect(block).toHaveBeenCalledOnce();
		view.unmount();
		expect(history.subscribers.size).toBe(0);
	},
);

it(
	'settles an outstanding resolver on provider disposal and ignores a late async guard',
	async () => {
		const gate = createControlledPromise<boolean>();
		let resolver!: ReturnType<typeof useBlocker>;
		function Layout() @{
			resolver = useBlocker({ shouldBlockFn: () => gate, withResolver: true });
			<Outlet />
		}
		const root = createRootRoute({ component: Layout });
		const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
		const b = createRoute({ getParentRoute: () => root, path: '/b' });
		const history = createMemoryHistory({ initialEntries: ['/a'] });
		const router = createRouter({ routeTree: root.addChildren([a, b]), history });
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('A');
		const navigation = router.navigate({ to: '/b' });
		view.unmount();
		gate.resolve(true);
		await navigation;
		expect(history.location.pathname).toBe('/a');
		expect(resolver.value.status).toBe('idle');
	},
);

it('cancels a pending confirmation when its component unmounts', async () => {
	let resolver!: ReturnType<typeof useBlocker>;
	function Layout() @{
		resolver = useBlocker({ shouldBlockFn: () => true, withResolver: true });
		<Outlet />
	}
	const root = createRootRoute({ component: Layout });
	const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
	const b = createRoute({ getParentRoute: () => root, path: '/b' });
	const history = createMemoryHistory({ initialEntries: ['/a'] });
	const router = createRouter({ routeTree: root.addChildren([a, b]), history });
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('A');
	const navigation = router.navigate({ to: '/b' });
	await waitFor(() => expect(resolver.value.status).toBe('blocked'));
	view.unmount();
	await navigation;
	expect(history.location.pathname).toBe('/a');
});

it(
	'restores window and element scroll on back only after suspended destination DOM commits',
	async () => {
		const gate = createControlledPromise<void>();
		let suspend = false;
		const seen: boolean[] = [];
		const root = createRootRoute({ component: Outlet });
		function A() @{
			const saved = useElementScrollRestoration({ id: 'panel' });
			const data = trackAsync(() => suspend ? gate : Promise.resolve());
			<>
				<p>
					{data.value === undefined ? 'A' : ''}
				</p>
				<div id="panel" data-scroll-restoration-id="panel">Panel</div>
				<p>{'saved:' + (saved?.scrollY ?? 0)}</p>
			</>
		}
		const a = createRoute({ getParentRoute: () => root, path: '/a', component: A });
		const b = createRoute({ getParentRoute: () => root, path: '/b', component: () => <p>B</p> });
		const history = createMemoryHistory({ initialEntries: ['/a'] });
		const router = createRouter({
			routeTree: root.addChildren([a, b]),
			history,
			scrollRestoration: true,
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('A');
		await waitFor(() => expect(router.state.status).toBe('idle'));
		const panel = view.container.querySelector('#panel')!;
		panel.scrollTop = 80;
		panel.dispatchEvent(new Event('scroll', { bubbles: false }));
		vi.stubGlobal('scrollY', 120);
		document.dispatchEvent(new Event('scroll'));
		await router.navigate({ to: '/b' });
		suspend = true;
		const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
			seen.push(!!view.queryByText('A'));
		});
		scroll.mockClear();
		history.back();
		await waitFor(() => expect(router.state.location.pathname).toBe('/a'));
		expect(scroll).not.toHaveBeenCalled();
		gate.resolve();
		await view.findByText('A');
		await waitFor(() => expect(router.state.status).toBe('idle'));
		expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 120 }));
		expect(seen).toEqual([true]);
		expect(view.container.querySelector('#panel')!.scrollTop).toBe(80);
		expect(view.getByText('saved:80')).toBeTruthy();
		vi.unstubAllGlobals();
	},
);

it('scrolls a rendered hash target and honors resetScroll=false', async () => {
	const intoView = vi.fn();
	const root = createRootRoute({ component: Outlet });
	const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
	const b = createRoute({
		getParentRoute: () => root,
		path: '/b',
		component: () => <div
			id="target"
			ref={(node) => {
				node.scrollIntoView = intoView;
			}}
		>B</div>,
	});
	const router = createRouter({
		routeTree: root.addChildren([a, b]),
		history: createMemoryHistory({ initialEntries: ['/a'] }),
	});
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('A');
	await router.navigate({ to: '/b', hash: 'target' });
	expect(intoView).toHaveBeenCalledOnce();
	const scroll = vi.spyOn(window, 'scrollTo');
	scroll.mockClear();
	await router.navigate({ to: '/a', resetScroll: false });
	expect(scroll).not.toHaveBeenCalled();
});

it('disposal releases a guard that never settles', async () => {
	const started = createControlledPromise<void>();
	function Layout() @{
		useBlocker({
			shouldBlockFn: () => {
				started.resolve();
				return new Promise<boolean>(() => {});
			},
		});
		<Outlet />
	}
	const root = createRootRoute({ component: Layout });
	const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
	const b = createRoute({ getParentRoute: () => root, path: '/b' });
	const router = createRouter({
		routeTree: root.addChildren([a, b]),
		history: createMemoryHistory({ initialEntries: ['/a'] }),
	});
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('A');
	const navigation = router.navigate({ to: '/b' });
	await started;
	view.unmount();
	await navigation;
	expect(router.history.location.pathname).toBe('/a');
});

it(
	'a newer allowed navigation cancels an older confirmation without letting stale proceed commit',
	async () => {
		let resolver!: ReturnType<typeof useBlocker>;
		function Layout() @{
			resolver = useBlocker({
				shouldBlockFn: ({ next }) => next.pathname === '/b',
				withResolver: true,
			});
			<Outlet />
		}
		const root = createRootRoute({ component: Layout });
		const routes = ['/a', '/b', '/c'].map(
			(path) => createRoute({ getParentRoute: () => root, path, component: () => <p>{path}</p> }),
		);
		const router = createRouter({
			routeTree: root.addChildren(routes),
			history: createMemoryHistory({ initialEntries: ['/a'] }),
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('/a');
		const first = router.navigate({ to: '/b' });
		await waitFor(() => expect(resolver.value.status).toBe('blocked'));
		const staleProceed = resolver.value.proceed!;
		await router.navigate({ to: '/c' });
		await first;
		staleProceed();
		expect(resolver.value.status).toBe('idle');
		expect(router.history.location.pathname).toBe('/c');
	},
);

it(
	'does not commit a just-approved confirmation over a newer ignored-blocker navigation',
	async () => {
		let resolver!: ReturnType<typeof useBlocker>;
		function Layout() @{
			resolver = useBlocker({ shouldBlockFn: () => true, withResolver: true });
			<Outlet />
		}
		const root = createRootRoute({ component: Layout });
		const routes = ['/a', '/b', '/c'].map(
			(path) => createRoute({ getParentRoute: () => root, path, component: () => <p>{path}</p> }),
		);
		const router = createRouter({
			routeTree: root.addChildren(routes),
			history: createMemoryHistory({ initialEntries: ['/a'] }),
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('/a');
		const first = router.navigate({ to: '/b' });
		await waitFor(() => expect(resolver.value.status).toBe('blocked'));
		resolver.value.proceed!();
		const newer = router.navigate({ to: '/c', ignoreBlocker: true });
		await Promise.all([first, newer]);
		expect(router.history.location.pathname).toBe('/c');
		expect(view.getByText('/c')).toBeTruthy();
	},
);

it(
	'enables window/history scroll restoration through router options without an element hook',
	async () => {
		const root = createRootRoute({ component: Outlet });
		const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
		const b = createRoute({ getParentRoute: () => root, path: '/b', component: () => <p>B</p> });
		const history = createMemoryHistory({ initialEntries: ['/a'] });
		const router = createRouter({
			routeTree: root.addChildren([a, b]),
			history,
			scrollRestoration: true,
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('A');
		await waitFor(() => expect(router.state.status).toBe('idle'));
		vi.stubGlobal('scrollY', 246);
		try {
			document.dispatchEvent(new Event('scroll'));
			await router.navigate({ to: '/b' });
			const scroll = vi.spyOn(window, 'scrollTo');
			scroll.mockClear();
			history.back();
			await view.findByText('A');
			await waitFor(
				() => expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 246 })),
			);
		} finally {
			vi.unstubAllGlobals();
		}
	},
);
