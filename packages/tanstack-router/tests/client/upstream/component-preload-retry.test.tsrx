// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.

import { afterEach, expect, onTestFinished, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '../../harness.js';
import { createControlledPromise } from '@tanstack/router-core';
import {
	Link,
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
	useRouter,
} from '@ripple-ts/tanstack-router';
import type { ErrorComponentProps } from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

test('a component loads when rendered before preload', async () => {
	const importer = vi.fn().mockResolvedValue({
		default: () => <div>Page content</div>,
	});
	const Page = lazyRouteComponent(importer);

	render(() => <Page />);

	expect(await screen.findByText('Page content')).toBeInTheDocument();
	expect(importer).toHaveBeenCalledTimes(1);
});

test('a resolved client component preload is reused', async () => {
	const importer = vi.fn().mockResolvedValue({ default: () => null });
	const Page = lazyRouteComponent(importer);

	await Page.preload?.();
	expect(Page.preload).toBeUndefined();
	expect(importer).toHaveBeenCalledTimes(1);
});

test('revisiting a resolved lazy component skips pending UI', async () => {
	const PageContent = () => <div>Page content</div>;
	const componentImport = createControlledPromise<{
		default: typeof PageContent;
	}>();
	const repeatedImport = createControlledPromise<{
		default: typeof PageContent;
	}>();
	const importer = vi.fn().mockImplementationOnce(() => componentImport).mockImplementationOnce(
		() => repeatedImport,
	);
	const Page = lazyRouteComponent(importer);
	const PendingComponent = vi.fn(() => <div data-testid="pending-component">Loading page</div>);
	const rootRoute = createRootRoute({
		component: () => <>
			<Link to="/">Home link</Link>
			<Link to="/page">Page link</Link>
			<Outlet />
		</>,
	});
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>Home content</div>,
	});
	const pageRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/page',
		component: Page,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, pageRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		defaultPendingMs: 0,
		defaultPendingMinMs: 0,
		defaultPendingComponent: PendingComponent,
	});

	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Home content')).toBeInTheDocument();

	fireEvent.click(screen.getByRole('link', { name: 'Page link' }));
	expect(await screen.findByTestId('pending-component')).toHaveTextContent('Loading page');
	componentImport.resolve({ default: PageContent });
	expect(await screen.findByText('Page content')).toBeInTheDocument();

	fireEvent.click(screen.getByRole('link', { name: 'Home link' }));
	expect(await screen.findByText('Home content')).toBeInTheDocument();
	PendingComponent.mockClear();
	fireEvent.click(screen.getByRole('link', { name: 'Page link' }));
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(screen.queryByText('Page content')).toBeInTheDocument();
	expect(screen.queryByTestId('pending-component')).not.toBeInTheDocument();
	expect(PendingComponent).not.toHaveBeenCalled();
	expect(importer).toHaveBeenCalledOnce();
});

test('a missing export fails through the route error UI instead of recursing', async () => {
	vi.spyOn(console, 'error').mockImplementation(() => {});

	const importer = vi.fn().mockResolvedValue({ Other: () => null });
	const Page = lazyRouteComponent(importer, 'Missing' as never);
	const rootRoute = createRootRoute();
	const pageRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/page',
		component: Page,
		errorComponent: (props: ErrorComponentProps) => <div>{props.error.message}</div>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([pageRoute]),
		history: createMemoryHistory({ initialEntries: ['/page'] }),
	});

	render(() => <RouterProvider router={router} />);

	expect(
		await screen.findByText('lazyRouteComponent: export "Missing" not found'),
	).toBeInTheDocument();
});

test('a failed component download is retried from the route error UI', async () => {
	vi.spyOn(console, 'error').mockImplementation(() => {});

	const PageContent = () => <div>Page content</div>;
	const retryImport = createControlledPromise<{ default: typeof PageContent }>();
	onTestFinished(() => retryImport.resolve({ default: PageContent }));
	const importer = vi.fn<() => Promise<{ default: typeof PageContent }>>().mockRejectedValueOnce(
		new Error('component download failed'),
	).mockImplementation(() => retryImport);
	const Page = lazyRouteComponent(importer);

	function RouteError(props: ErrorComponentProps) {
		const router = useRouter();
		return <button
			type="button"
			onClick={() => {
				props.reset();
				void router.invalidate();
			}}
		>
			Retry
		</button>;
	}

	const rootRoute = createRootRoute();
	const pageRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/page',
		component: Page,
		errorComponent: RouteError,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([pageRoute]),
		history: createMemoryHistory({ initialEntries: ['/page'] }),
	});

	render(() => <RouterProvider router={router} />);

	fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

	await vi.waitFor(() => expect(importer).toHaveBeenCalledTimes(2));
	expect(screen.queryByText('Page content')).not.toBeInTheDocument();
	retryImport.resolve({ default: PageContent });

	expect(await screen.findByText('Page content')).toBeInTheDocument();
	expect(importer).toHaveBeenCalledTimes(2);
	expect(Page.preload).toBeUndefined();
});
