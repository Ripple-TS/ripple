import { describe, expect, it, vi } from 'vitest';
import { Context, effect, flushSync, track, trackAsync, type Children } from 'ripple';
import {
	createRootRoute,
	createRootRouteWithContext,
	createRoute,
	createRouter,
	createMemoryHistory,
	createLazyRoute,
	RouterProvider,
	Outlet,
	Link,
	Navigate,
	MatchRoute,
	Await,
	lazyRouteComponent,
	getRouteApi,
	useMatches,
	useParentMatches,
	useChildMatches,
	useLocation,
	useMatchRoute,
	useRouter,
	useBlocker,
	useElementScrollRestoration,
	notFound,
	redirect,
	createControlledPromise,
} from '@ripple-ts/tanstack-router';
import { render, fireEvent, waitFor, advanceTimers } from '../harness.js';

it(
	'propagates wrapper and tracked provider context through pathless and index routes',
	async () => {
		const outer = new Context<string>();
		const inner = new Context<string>();
		let setUser!: (user: string) => void;
		function Wrap({ children }: { children?: Children }) @{
			outer.set('outer');
			<>
				{children}
			</>
		}
		function InnerWrap({ children }: { children?: Children }) @{
			expect(useRouter()).toBe(router);
			inner.set('inner');
			<>
				{children}
			</>
		}
		const root = createRootRouteWithContext<{ user: string }>()({ component: Outlet });
		const layout = createRoute({
			getParentRoute: () => root,
			id: '_layout',
			beforeLoad: ({ context }) => ({ label: context.user.toUpperCase() }),
			component: Outlet,
		});
		const index = createRoute({
			getParentRoute: () => layout,
			path: '/',
			loader: ({ context }) => context.label,
			component: Page,
		});
		function Page() @{
			const data = index.useLoaderData();
			const o = outer.get();
			const i = inner.get();
			<p>{o + ':' + i + ':' + data.value}</p>
		}
		const router = createRouter({
			routeTree: root.addChildren([layout.addChildren([index])]),
			history: createMemoryHistory(),
			context: { user: 'base' },
			Wrap,
			InnerWrap,
		});
		function App() @{
			const context = track({ user: 'first' });
			setUser = (user) => {
				context.value = { user };
			};
			<RouterProvider {router} {context} />
		}
		const view = render(App);
		await view.findByText('outer:inner:FIRST');
		setUser('second');
		flushSync();
		expect(view.getByText('outer:inner:FIRST')).toBeTruthy();
		await router.invalidate();
		expect(view.getByText('outer:inner:SECOND')).toBeTruthy();
	},
);

it(
	'reads scoped data and parent/child matches while isolating selectors on same-route updates',
	async () => {
		const selected = vi.fn();
		const mounted = vi.fn();
		const api = getRouteApi('/posts/$id');
		const root = createRootRoute({ component: Layout });
		function Layout() @{
			const children = useChildMatches({
				select: (matches) => matches.map((match) => match.routeId).join(','),
			});
			<>
				<p>{'children:' + children.value}</p>
				<Outlet />
			</>
		}
		const page = createRoute({
			getParentRoute: () => root,
			path: '/posts/$id',
			validateSearch: (search) => ({ tab: search.tab ?? 'a' }),
			loaderDeps: ({ search }) => ({ tab: search.tab }),
			beforeLoad: () => ({ role: 'reader' }),
			loader: ({ params, deps }) => ({ id: params.id, tab: deps.tab }),
			component: Page,
		});
		function Page() @{
			mounted();
			const params = api.useParams();
			const search = api.useSearch();
			const data = api.useLoaderData();
			const deps = api.useLoaderDeps();
			const context = api.useRouteContext();
			const parents = useParentMatches({ select: (matches) => matches.length });
			const all = useMatches({ select: (matches) => matches.length });
			const stable = api.useParams({ select: (params) => ({ id: params.id }) });
			const location = useLocation({ select: (location) => location.pathname });
			effect(() => selected(stable.value));
			<>
				<p>{JSON.stringify([
					params.value,
					search.value,
					data.value,
					deps.value,
					context.value,
					parents.value,
					all.value,
					location.value,
				])}</p>
				<api.Link to=".">Scoped</api.Link>
			</>
		}
		const router = createRouter({
			routeTree: root.addChildren([page]),
			history: createMemoryHistory({ initialEntries: ['/posts/one'] }),
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('Scoped');
		expect(view.container.textContent).toContain('reader');
		expect(view.container.textContent).toContain('children:/posts/$id');
		await router.navigate({ to: '/posts/$id', params: { id: 'one' }, search: { tab: 'b' } });
		expect(selected).toHaveBeenCalledOnce();
		expect(mounted).toHaveBeenCalledOnce();
		expect(view.container.textContent).toContain('"tab":"b"');
		await router.navigate({ to: '/posts/$id', params: { id: 'two' }, search: { tab: 'b' } });
		expect(selected).toHaveBeenCalledTimes(2);
		expect(mounted).toHaveBeenCalledOnce();
		expect(view.getByText('Scoped').getAttribute('href')).toContain('/posts/two');
	},
);

it('updates MatchRoute from tracked params and Navigate from tracked destinations', async () => {
	let change!: () => void;
	function Layout() @{
		const id = track('one');
		change = () => {
			id.value = 'two';
		};
		<>
			<MatchRoute
				to="/posts/$id"
				params={track(() => ({ id: id.value }))}
				render={(params) => <p>
					{params ? params.id : 'no-match'}
				</p>}
			/>
			<Navigate to="/posts/$id" params={track(() => ({ id: id.value }))} />
			<Outlet />
		</>
	}
	const root = createRootRoute({ component: Layout });
	const index = createRoute({ getParentRoute: () => root, path: '/' });
	const page = createRoute({ getParentRoute: () => root, path: '/posts/$id' });
	const router = createRouter({
		routeTree: root.addChildren([index, page]),
		history: createMemoryHistory(),
	});
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('one');
	change();
	await view.findByText('two');
	expect(router.state.location.pathname).toBe('/posts/two');
});

it.each(['fuzzy', 'root'] as const)(
	'selects the %s not-found boundary while preserving its layout',
	async (notFoundMode) => {
		const root = createRootRoute({
			component: () => <>
				<h1>Root</h1>
				<Outlet />
			</>,
			notFoundComponent: () => <p>Root missing</p>,
		});
		const settings = createRoute({
			getParentRoute: () => root,
			path: '/settings',
			component: () => <>
				<h2>Settings</h2>
				<Outlet />
			</>,
			notFoundComponent: () => <p>Settings missing</p>,
		});
		const index = createRoute({
			getParentRoute: () => settings,
			path: '/',
			component: () => <p>Settings index</p>,
		});
		const router = createRouter({
			routeTree: root.addChildren([settings.addChildren([index])]),
			history: createMemoryHistory({ initialEntries: ['/settings'] }),
			notFoundMode,
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('Settings index');
		await router.navigate({ to: '/settings/missing' });
		expect(
			view.getByText(notFoundMode === 'fuzzy' ? 'Settings missing' : 'Root missing'),
		).toBeTruthy();
		expect(view.getByRole('heading', { name: 'Root' })).toBeTruthy();
		await router.navigate({ to: '/settings/' });
		expect(view.getByText('Settings index')).toBeTruthy();
	},
);

it(
	'routes render-thrown notFound to its named ancestor and passes data, without invoking error handlers',
	async () => {
		const onCatch = vi.fn();
		const root = createRootRoute({
			component: Outlet,
			notFoundComponent: ({ data }) => <p>{data as string}</p>,
			onCatch,
		});
		const page = createRoute({
			getParentRoute: () => root,
			path: '/',
			component: () => {
				throw notFound({ routeId: root.id, data: 'Missing item' });
			},
			errorComponent: () => <p>Wrong error</p>,
			onCatch,
		});
		const router = createRouter({
			routeTree: root.addChildren([page]),
			history: createMemoryHistory(),
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('Missing item');
		expect(onCatch).not.toHaveBeenCalled();
	},
);

it('retries a rejected lazy route import after invalidation', async () => {
	const options = createLazyRoute('/lazy')({ component: () => <p>Lazy recovered</p> });
	const importer = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(options);
	const root = createRootRoute({ component: Outlet });
	const page = createRoute({ getParentRoute: () => root, path: '/lazy' }).lazy(importer);
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory({ initialEntries: ['/lazy'] }),
	});
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('offline');
	await router.invalidate();
	expect(view.getByText('Lazy recovered')).toBeTruthy();
	expect(importer).toHaveBeenCalledTimes(2);
});

it('cancels a superseded loader and never renders its late result', async () => {
	const gate = createControlledPromise<string>();
	let signal!: AbortSignal;
	const root = createRootRoute({ component: Outlet });
	const home = createRoute({ getParentRoute: () => root, path: '/', component: () => <p>Home</p> });
	const slow = createRoute({
		getParentRoute: () => root,
		path: '/slow',
		loader: ({ abortController }) => {
			signal = abortController.signal;
			return gate;
		},
		component: () => <p>Stale</p>,
	});
	const fast = createRoute({
		getParentRoute: () => root,
		path: '/fast',
		component: () => <p>Fast</p>,
	});
	const router = createRouter({
		routeTree: root.addChildren([home, slow, fast]),
		history: createMemoryHistory(),
	});
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('Home');
	const pending = router.navigate({ to: '/slow' });
	await waitFor(() => expect(signal).toBeDefined());
	await router.navigate({ to: '/fast' });
	expect(signal.aborted).toBe(true);
	gate.resolve('late');
	await pending;
	expect(view.queryByText('Stale')).toBe(null);
	expect(view.getByText('Fast')).toBeTruthy();
});

it(
	'renders awaited falsy values, updates the promise, and routes rejections through a boundary',
	async () => {
		const first = createControlledPromise<number>();
		const second = createControlledPromise<number>();
		let update!: () => void;
		function App() @{
			const promise = track<Promise<number>>(first);
			update = () => {
				promise.value = second;
			};
			@try {
				<Await {promise} fallback="Waiting" render={(value) => <p>{'Value ' + value}</p>} />
			} @catch (error) {
				<p>{String(error)}</p>
			}
		}
		const view = render(App);
		await view.findByText('Waiting');
		first.resolve(0);
		await view.findByText('Value 0');
		update();
		flushSync();
		expect(view.getByText('Value 0')).toBeTruthy();
		second.reject(new Error('rejected'));
		await view.findByText('Error: rejected');
	},
);

it.each([undefined, null, false, 0, ''])(
	'surfaces a falsy lazy rejection (%s) without retrying recursively',
	async (failure) => {
		const importer = vi.fn().mockRejectedValue(failure);
		const Page = lazyRouteComponent(importer);
		function App() @{
			@try {
				<Page />
			} @catch (error) {
				<p>{'Failed:' + String(error)}</p>
			}
		}
		const view = render(App);
		await view.findByText('Failed:' + String(failure));
		expect(importer).toHaveBeenCalledOnce();
	},
);

it('calls the selected route onCatch with the original render error', async () => {
	const failure = new Error('render failed');
	const local = vi.fn();
	const fallback = vi.fn();
	const root = createRootRoute({ component: Outlet });
	const page = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => {
			throw failure;
		},
		errorComponent: ({ error }) => <p>{error.message}</p>,
		onCatch: local,
	});
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory(),
		defaultOnCatch: fallback,
	});
	const view = render(() => <RouterProvider {router} />);
	await view.findByText('render failed');
	expect(local).toHaveBeenCalledWith(failure);
	expect(fallback).not.toHaveBeenCalled();
});

it.each(['root', 'default', 'ancestor'] as const)(
	'falls back to the %s not-found UI when a scoped render error has no local boundary',
	async (fallback) => {
		const Missing = ({ data }: { data?: unknown }) => <p>{'Missing:' + String(data)}</p>;
		const root = createRootRoute({
			component: Outlet,
			notFoundComponent: fallback === 'root' ? Missing : undefined,
		});
		const layout = createRoute({
			getParentRoute: () => root,
			path: '/layout',
			component: Outlet,
			notFoundComponent: fallback === 'ancestor' ? Missing : undefined,
		});
		const api = getRouteApi('/layout/child');
		const page = createRoute({
			getParentRoute: () => layout,
			path: '/child',
			component: () => {
				throw api.notFound({ data: 'scoped item' });
			},
		});
		const router = createRouter({
			routeTree: root.addChildren([layout.addChildren([page])]),
			history: createMemoryHistory({ initialEntries: ['/layout/child'] }),
			defaultNotFoundComponent: fallback === 'default' ? Missing : undefined,
		});
		const view = render(() => <RouterProvider {router} />);
		await view.findByText('Missing:scoped item');
		expect(view.container.querySelector('pre')).toBe(null);
	},
);
