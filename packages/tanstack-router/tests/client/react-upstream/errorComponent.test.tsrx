// Ported from TanStack/react-router tests/errorComponent.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '../../react-harness.js';
import {
	ErrorComponent,
	HeadContent,
	Link,
	Outlet,
	RouterProvider,
	createBrowserHistory,
	createControlledPromise,
	createLazyRoute,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	notFound,
} from '@ripple-ts/tanstack-router';
import {
	RouterServer,
	createRequestHandler,
	renderRouterToString,
} from '@ripple-ts/tanstack-router';
import type { ErrorComponentProps, RouterHistory } from '@ripple-ts/tanstack-router';

function MyErrorComponent(props: ErrorComponentProps) {
	return <div>
		{'Error: '}
		{getErrorMessage(props.error)}
	</div>;
}
function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
async function asyncToThrowFn() {
	await new Promise((resolve) => setTimeout(resolve, 500));
	throw new Error('error thrown');
}
function throwFn() {
	throw new Error('error thrown');
}
function primitiveThrowFn() {
	throw 'primitive error thrown';
}
let history: RouterHistory;
beforeEach(() => {
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	history.destroy();
	vi.resetAllMocks();
	window.history.replaceState(null, 'root', '/');
	cleanup();
});
describe.each([true, false])('with lazy errorComponent=%s', (isUsingLazyError) => {
	describe('stale route errors do not leak after navigation', () => {
		test.each([
			{
				caller: 'loader' as const,
				routeOptions: {
					loader: throwFn,
				},
			},
			{
				caller: 'render' as const,
				routeOptions: {
					component: function RenderErrorComponent() {
						throwFn();
					},
				},
			},
		])('navigating away from a $caller error does not call the next route errorComponent', async ({
			routeOptions,
		}) => {
			const rootRoute = createRootRoute();
			const indexErrorComponent = vi.fn(() => <div>{'Index error'}</div>);
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: function Home() {
					return <div>
						<div>{'Index route content'}</div>
						<Link to="/about">{'link to about'}</Link>
					</div>;
				},
				errorComponent: indexErrorComponent,
			});
			const aboutRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/about',
				component: function About() {
					return <div>{'About route content'}</div>;
				},
				errorComponent: isUsingLazyError ? undefined : MyErrorComponent,
				...routeOptions,
			});
			if (isUsingLazyError) {
				aboutRoute.lazy(
					() => Promise.resolve(
						createLazyRoute('/about')({
							errorComponent: MyErrorComponent,
						}),
					),
				);
			}
			const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
			const router = createRouter({
				routeTree,
				history,
			});
			render(() => <RouterProvider router={router} />);
			const linkToAbout = await screen.findByRole('link', {
				name: 'link to about',
			});
			await act(() => fireEvent.click(linkToAbout));
			expect(
				await screen.findByText('Error: error thrown', undefined, {
					timeout: 1500,
				}),
			).toBeInTheDocument();
			await act(() => router.navigate({ to: '/' }));
			expect(await screen.findByText('Index route content')).toBeInTheDocument();
			expect(indexErrorComponent).not.toHaveBeenCalled();
		});
	});
});
test('errorComponent receives primitive errors thrown from beforeLoad', async () => {
	const rootRoute = createRootRoute();
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: function Home() {
			return <div>
				<Link to="/about">{'link to about'}</Link>
			</div>;
		},
	});
	const aboutRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/about',
		beforeLoad: primitiveThrowFn,
		component: function About() {
			return <div>{'About route content'}</div>;
		},
		errorComponent: ({ error }) => <div>
			{'Error: '}
			{String(error)}
		</div>,
	});
	const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
	const router = createRouter({
		routeTree,
		history,
	});
	render(() => <RouterProvider router={router} />);
	const linkToAbout = await screen.findByRole('link', {
		name: 'link to about',
	});
	await act(() => fireEvent.click(linkToAbout));
	expect(
		await screen.findByText('Error: primitive error thrown', undefined, {
			timeout: 750,
		}),
	).toBeInTheDocument();
	expect(screen.queryByText('About route content')).not.toBeInTheDocument();
});
test.each(['beforeLoad', 'loader'] as const)(
	'a Promise synchronously thrown from %s renders the route error UI',
	async (hook) => {
		const thrown = Promise.resolve('not route data');
		const rootRoute = createRootRoute();
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			beforeLoad: hook === 'beforeLoad'
				? () => {
						throw thrown;
					}
				: undefined,
			loader: hook === 'loader'
				? () => {
						throw thrown;
					}
				: undefined,
			errorComponent: ({ error }) => <div>
				{error instanceof Error && error.cause === thrown
					? 'Promise route error'
					: 'Wrong route error'}
			</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByText('Promise route error')).toBeInTheDocument();
		expect(screen.queryByText('Wrong route error')).not.toBeInTheDocument();
	},
);
test('a later fresh ancestor loader failure owns the reachable boundary', async () => {
	const parentStarted = createControlledPromise<void>();
	const childStarted = createControlledPromise<void>();
	const parentGate = createControlledPromise<void>();
	const childGate = createControlledPromise<void>();
	const childSettled = createControlledPromise<void>();
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>{'Home'}</div>,
	});
	const parentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/parent',
		component: Outlet,
		loader: async () => {
			parentStarted.resolve();
			await parentGate;
			throw new Error('later parent failure');
		},
		errorComponent: () => <div>{'Parent error boundary'}</div>,
	});
	const childRoute = createRoute({
		getParentRoute: () => parentRoute,
		path: '/child',
		loader: async () => {
			childStarted.resolve();
			await childGate;
			childSettled.resolve();
			throw new Error('first child failure');
		},
		errorComponent: () => <div>{'Child error boundary'}</div>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([
			indexRoute,
			parentRoute.addChildren([childRoute]),
		]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	await router.load();
	render(() => <RouterProvider router={router} />);
	let navigation!: Promise<void>;
	await act(async () => {
		navigation = router.navigate({ to: '/parent/child' });
		await Promise.all([parentStarted, childStarted]);
	});
	await act(async () => {
		childGate.resolve();
		await childSettled;
		parentGate.resolve();
		await navigation;
	});
	expect(screen.getByText('Parent error boundary')).toBeInTheDocument();
	expect(screen.queryByText('Child error boundary')).not.toBeInTheDocument();
});
test('a fresh ancestor failure waits for lazy options before rendering its error', async () => {
	const parentStarted = createControlledPromise<void>();
	const childStarted = createControlledPromise<void>();
	const parentGate = createControlledPromise<void>();
	const childGate = createControlledPromise<void>();
	const childSettled = createControlledPromise<void>();
	const lazyParentOptions = createLazyRoute('/parent')({
		component: () => <>
			<div>{'Lazy parent shell'}</div>
			<Outlet />
		</>,
	});
	const parentChunk = createControlledPromise<typeof lazyParentOptions>();
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>{'Home'}</div>,
	});
	const parentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/parent',
		loader: async () => {
			parentStarted.resolve();
			await parentGate;
			throw new Error('later parent failure');
		},
		errorComponent: () => <div>{'Parent error boundary'}</div>,
	}).lazy(() => parentChunk);
	const childRoute = createRoute({
		getParentRoute: () => parentRoute,
		path: '/child',
		loader: async () => {
			childStarted.resolve();
			await childGate;
			childSettled.resolve();
			throw new Error('first child failure');
		},
		errorComponent: () => <div>{'Child error boundary'}</div>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([
			indexRoute,
			parentRoute.addChildren([childRoute]),
		]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	await router.load();
	render(() => <RouterProvider router={router} />);
	let navigation: Promise<void> | undefined;
	try {
		await act(async () => {
			navigation = router.navigate({ to: '/parent/child' });
			await Promise.all([parentStarted, childStarted]);
		});
		await act(async () => {
			childGate.resolve();
			await childSettled;
			parentGate.resolve();
			await Promise.resolve();
		});
		expect(parentChunk.status).toBe('pending');
		expect(screen.getByText('Home')).toBeInTheDocument();
		expect(screen.queryByText('Parent error boundary')).not.toBeInTheDocument();
		expect(screen.queryByText('Child error boundary')).not.toBeInTheDocument();
		expect(screen.queryByText('Lazy parent shell')).not.toBeInTheDocument();
	} finally {
		await act(async () => {
			childGate.resolve();
			parentGate.resolve();
			parentChunk.resolve(lazyParentOptions);
			await navigation;
		});
	}
	expect(screen.getByText('Parent error boundary')).toBeInTheDocument();
	expect(screen.queryByText('Lazy parent shell')).not.toBeInTheDocument();
	expect(screen.queryByText('Child error boundary')).not.toBeInTheDocument();
});
describe('notFoundComponent is rendered when an error is thrown in params.parse', () => {
	test('displays notFoundComponent when error is thrown in params.parse', async () => {
		const history = createMemoryHistory({ initialEntries: ['/'] });
		const rootLoader = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1));
			return { ok: true };
		});
		const rootRoute = createRootRoute({
			component: function Root() {
				return <Outlet />;
			},
			notFoundComponent: function NotFound() {
				return <div>{'No pizza'}</div>;
			},
			pendingComponent: function Pending() {
				return <div>{'Loading...'}</div>;
			},
			loader: rootLoader,
			shouldReload: true,
			pendingMs: 0,
			pendingMinMs: 100,
			wrapInSuspense: true,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: function Home() {
				return <div>
					<Link to="/pizza/rotten" preload="intent">{'link to rotten pizza'}</Link>
				</div>;
			},
		});
		const restaurantRoute = createRoute({
			getParentRoute: () => rootRoute,
			id: 'restaurant',
			component: function Restaurant() {
				return <Outlet />;
			},
		});
		const pizzaRoute = createRoute({
			getParentRoute: () => restaurantRoute,
			path: '/pizza/$pizzaType',
			component: function Pizza() {
				return <div>{'Pizza'}</div>;
			},
			params: {
				parse: (p) => {
					if (p.pizzaType === 'rotten') {
						throw new Error('404 No rotten pizzas');
					}
					return { pizzaType: p.pizzaType };
				},
				stringify: (p) => ({ pizzaType: p.pizzaType }),
			},
			onError: () => {
				throw notFound();
			},
		});
		const routeTree = rootRoute.addChildren([
			indexRoute,
			restaurantRoute.addChildren([pizzaRoute]),
		]);
		const router = createRouter({
			routeTree,
			history,
		});
		render(() => <RouterProvider router={router} />);
		const linkToRottenPizza = await screen.findByRole('link', {
			name: 'link to rotten pizza',
		});
		expect(rootLoader).toHaveBeenCalledTimes(1);
		expect(linkToRottenPizza).toBeInTheDocument();
		await act(() => fireEvent.mouseOver(linkToRottenPizza));
		await act(() => fireEvent.click(linkToRottenPizza));
		const notFoundComponent = await screen.findByText('No pizza', undefined, {
			timeout: 750,
		});
		expect(rootLoader).toHaveBeenCalledTimes(2);
		expect(notFoundComponent).toBeInTheDocument();
	});
});
