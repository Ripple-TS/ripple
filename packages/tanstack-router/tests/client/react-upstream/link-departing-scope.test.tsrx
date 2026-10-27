// Ported from TanStack/react-router tests/link-departing-scope.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, fireEvent, render, screen, waitFor } from '../../react-harness.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	Link,
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouteMask,
	createRouter,
	redirect,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});
type Deferred = {
	promise: Promise<void>;
	resolve: () => void;
};
function deferred(): Deferred {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
}
type Gates = Partial<Record<'a' | 'b' | 'items', Deferred>>;
function setup(
	{
		initial = '/a',
		strict = false,
		bAfterGate,
		beforeRender,
	}: {
		initial?: string;
		strict?: boolean;
		bAfterGate?: () => void;
		beforeRender?: (router: any) => void;
	} = {},
) {
	const gates: Gates = {};
	const counts = {
		aUpdater: 0,
		aRenders: 0,
		goneUpdater: 0,
		suspendedUpdater: 0,
	};
	// The `x` dependency of every `/a` load, preloads included.
	const aLoads: Array<unknown> = [];
	// The `x` of every location the `a-next` link derives from.
	const nextFrom: Array<unknown> = [];
	const controls: {
		setHash?: (hash: string | undefined) => void;
		setExtra?: (extra: boolean) => void;
		setGone?: (gone: boolean) => void;
		setRenderPreload?: (renderPreload: boolean) => void;
	} = {};
	let suspendGate: Deferred | undefined;
	function Suspender() {
		if (suspendGate) {
			throw suspendGate.promise;
		}
		return null;
	}
	const root = createRootRoute({
		component: () => <>
			<Link to="/b" data-testid="root-b">{'root b'}</Link>
			<Outlet />
		</>,
	});
	const layout = createRoute({
		getParentRoute: () => root,
		id: '_layout',
		component: () => <>
			<Link to="/b" data-testid="layout-b">{'layout b'}</Link>
			<Outlet />
		</>,
	});
	function AComponent() {
		const [hash, setHash] = React.useState<string | undefined>(undefined);
		const [extra, setExtra] = React.useState(false);
		const [gone, setGone] = React.useState(false);
		const [renderPreload, setRenderPreload] = React.useState(false);
		controls.setHash = setHash;
		controls.setExtra = setExtra;
		controls.setGone = setGone;
		controls.setRenderPreload = setRenderPreload;
		return <>
			<h1>{'A page'}</h1>
			<Link
				to="/a"
				data-testid="a-self"
				search={(prev: any) => {
					counts.aUpdater++;
					return prev;
				}}
			>
				{() => {
					counts.aRenders++;
					return 'a self';
				}}
			</Link>
			<Link to="." hash={track(() => hash.value)} data-testid="a-dot">{'a dot'}</Link>
			<Link
				to="/a"
				search={(prev: any) => {
					nextFrom.push(prev.x);
					return { x: `${prev.x}-next` };
				}}
				preload="intent"
				preloadDelay={0}
				data-testid="a-next"
			>{'a next'}</Link>
			{renderPreload.value
				? <Link
						to="/a"
						search={(prev: any) => ({ x: `${prev.x}-render` })}
						preload="render"
						data-testid="a-render"
					>{'a render'}</Link>
				: null}
			{extra.value
				? <Link to="." search={(prev: any) => prev} data-testid="a-extra">{'a extra'}</Link>
				: null}
			{gone.value
				? null
				: <Link
						to="/a"
						data-testid="a-gone"
						search={(prev: any) => {
							counts.goneUpdater++;
							return prev;
						}}
					>{'a gone'}</Link>}
			<React.Suspense fallback={<span>{'suspended'}</span>}>
				<Link
					to="/a"
					data-testid="a-suspended"
					search={(prev: any) => {
						counts.suspendedUpdater++;
						return prev;
					}}
				>{'a suspended'}</Link>
				<Suspender />
			</React.Suspense>
		</>;
	}
	const a = createRoute({
		getParentRoute: () => layout,
		path: '/a',
		loaderDeps: ({ search }: { search: any }) => ({ x: search.x }),
		loader: ({
			deps,
		}: {
			deps: {
				x: unknown;
			};
		}) => {
			aLoads.push(deps.x);
			return gates.a?.promise;
		},
		component: AComponent,
	});
	const b = createRoute({
		getParentRoute: () => layout,
		path: '/b',
		loader: async () => {
			await gates.b?.promise;
			bAfterGate?.();
		},
		component: () => <h1>{'B page'}</h1>,
	});
	const c = createRoute({
		getParentRoute: () => root,
		path: '/c',
		component: () => <h1>{'C page'}</h1>,
	});
	const items = createRoute({
		getParentRoute: () => root,
		path: '/items/$id',
		loader: () => gates.items?.promise,
		component: () => <>
			<h1>{'Items page'}</h1>
			<Link to="/items/$id" params={{ id: '1' }} data-testid="item-1">{'item 1'}</Link>
			<Link to="/items/$id" params={{ id: '2' }} data-testid="item-2">{'item 2'}</Link>
		</>,
	});
	const router = createRouter({
		routeTree: root.addChildren([layout.addChildren([a, b]), c, items]),
		history: createMemoryHistory({ initialEntries: [initial] }),
	});
	beforeRender?.(router);
	const app = <RouterProvider router={router} />;
	render(() => strict ? <React.StrictMode>{app}</React.StrictMode> : app);
	const link = (id: string) => screen.getByTestId(id);
	const isActive = (id: string) => link(id).getAttribute('aria-current') === 'page';
	const href = (id: string) => link(id).getAttribute('href');
	async function start(options: any) {
		await act(async () => {
			void router.navigate(options);
			await Promise.resolve();
		});
	}
	async function settle() {
		await waitFor(() => expect(router.state.status).toBe('idle'));
	}
	async function release(name: keyof Gates) {
		const gate = gates[name]!;
		gates[name] = undefined;
		await act(async () => {
			gate.resolve();
			await gate.promise;
		});
	}
	return {
		router,
		gates,
		counts,
		aLoads,
		nextFrom,
		controls,
		link,
		isActive,
		href,
		start,
		settle,
		release,
		setSuspendGate: (gate: Deferred | undefined) => (suspendGate = gate),
	};
}
describe('masked links in a departing match', () => {
	test.each(['mask', 'routeMasks'] as const)(
		'a link with a fixed %s builds its location once and does not rerender across navigations',
		async (kind) => {
			// Every location the router builds for the masked link passes through
			// the output rewrite.
			let maskedBuilds = 0;
			let renders = 0;
			const root = createRootRoute({
				component: () => <>
					<Link
						to="/photo"
						search={{ id: 1 }}
						mask={kind === 'mask' ? { to: '/posts', search: { from: 'photo' } } as any : undefined}
						data-testid="masked"
						render={() => {
							renders++;
							return 'masked';
						}}
					/>
					<Outlet />
				</>,
			});
			const routes = ['a', 'b', 'photo', 'posts'].map(
				(path) => createRoute({
					getParentRoute: () => root,
					path: `/${path}`,
					component: () => <h1>
						{path}
						{' page'}
					</h1>,
				}),
			);
			const routeTree = root.addChildren(routes);
			const router = createRouter({
				routeTree,
				history: createMemoryHistory({ initialEntries: ['/a'] }),
				rewrite: {
					output: ({ url }) => {
						if (url.pathname === '/photo' || url.pathname === '/posts') {
							maskedBuilds++;
						}
						return url;
					},
				},
				routeMasks: kind === 'routeMasks'
					? [
							createRouteMask(
								{
									routeTree,
									from: '/photo',
									to: '/posts',
									search: { from: 'photo' },
								} as any,
							),
						]
					: undefined,
			});
			render(() => <RouterProvider router={router} />);
			const link = await screen.findByTestId('masked');
			expect(link).toHaveAttribute('href', '/posts?from=photo');
			const buildsAfterMount = maskedBuilds;
			const rendersAfterMount = renders;
			for (const to of ['/b', '/a', '/b']) {
				await act(() => router.navigate({ to }));
				await screen.findByText(`${to.slice(1)} page`);
			}
			expect(link).toHaveAttribute('href', '/posts?from=photo');
			expect(maskedBuilds).toBe(buildsAfterMount);
			expect(renders).toBe(rendersAfterMount);
		},
	);
});
