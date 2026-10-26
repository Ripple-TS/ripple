// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { afterAll, afterEach, describe, expect, test } from 'vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '../../harness.js';
import { createMemoryHistory } from '@tanstack/history';
import { createControlledPromise } from '@tanstack/router-core';
import {
	Link,
	MatchRoute,
	Outlet,
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
	isMatch,
	useMatchRoute,
	useMatches,
} from '@ripple-ts/tanstack-router';

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: () => {
		return <Link to="/invoices/">To Invoices</Link>;
	},
});

const invoicesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: 'invoices',
	loader: () => [{ id: '1' }, { id: '2' }],
	component: () => <Outlet />,
});

const InvoicesIndex = () => {
	const matches = useMatches<DefaultRouter>();

	const loaderDataMatches = matches.value.filter((match) => isMatch(match, 'loaderData.0.id'));

	const contextMatches = matches.value.filter((match) => isMatch(match, 'context.permissions'));

	const incorrectMatches = matches.value.filter((match) => isMatch(match, 'loaderData.6.id'));

	return <div>
		<section>
			{'Loader Matches - '}
			{loaderDataMatches.map((match) => match.fullPath).join(',')}
		</section>
		<section>
			{'Context Matches - '}
			{contextMatches.map((match) => match.fullPath).join(',')}
		</section>
		<section>
			{'Incorrect Matches - '}
			{incorrectMatches.map((match) => match.fullPath).join(',')}
		</section>
	</div>;
};

const invoicesIndexRoute = createRoute({
	getParentRoute: () => invoicesRoute,
	path: '/',
	component: InvoicesIndex,
	context: () => ({
		permissions: 'permission',
	}),
});

const invoiceRoute = createRoute({
	getParentRoute: () => invoicesRoute,
	path: '$invoiceId',
	validateSearch: () => ({ page: 0 }),
});

const layoutRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: '_layout',
});

const commentsRoute = createRoute({
	getParentRoute: () => layoutRoute,
	path: 'comments/$id',
	validateSearch: () => ({
		page: 0,
		search: '',
	}),
	loader: () => [{ comment: 'one comment' }, { comment: 'two comment' }] as const,
});

const routeTree = rootRoute.addChildren([
	invoicesRoute.addChildren([invoicesIndexRoute, invoiceRoute]),
	indexRoute,
	layoutRoute.addChildren([commentsRoute]),
]);

const defaultRouter = createRouter({
	routeTree,
});

afterAll(() => defaultRouter.history.destroy());
type DefaultRouter = typeof defaultRouter;

afterEach(() => {
	cleanup();
	window.history.replaceState(null, '', '/');
});

test('when filtering useMatches by loaderData', async () => {
	render(() => <RouterProvider router={defaultRouter} />);

	const searchLink = await screen.findByRole('link', { name: 'To Invoices' });

	fireEvent.click(searchLink);

	expect(await screen.findByText('Loader Matches - /invoices')).toBeInTheDocument();

	expect(await screen.findByText('Context Matches - /invoices/')).toBeInTheDocument();

	expect(await screen.findByText('Incorrect Matches -')).toBeInTheDocument();
});

test('should show pendingComponent of root route', async () => {
	const root = createRootRoute({
		pendingComponent: () => <div data-testId="root-pending" />,
		loader: async () => {
			await new Promise((r) => setTimeout(r, 50));
		},
		component: () => <div data-testId="root-content" />,
	});
	const router = createRouter({
		routeTree: root,
		defaultPendingMs: 0,
		defaultPendingComponent: () => <div>default pending...</div>,
	});

	const rendered = render(() => <RouterProvider router={router} />);

	expect(await rendered.findByTestId('root-pending')).toBeInTheDocument();
	expect(await rendered.findByTestId('root-content')).toBeInTheDocument();
});

test('useMatchRoute follows superseding pending locations', async () => {
	const aGate = createControlledPromise<void>();
	const bGate = createControlledPromise<void>();

	function Layout() {
		const matchRoute = useMatchRoute();
		const pendingA = matchRoute({ to: '/a', pending: true });
		const pendingB = matchRoute({ to: '/b', pending: true });
		const resolvedB = matchRoute({ to: '/b', pending: false });
		return <div>
			<span data-testid="pending-a">{String(Boolean(pendingA.value))}</span>
			<span data-testid="pending-b">{String(Boolean(pendingB.value))}</span>
			<span data-testid="resolved-b">{String(Boolean(resolvedB.value))}</span>
			<Outlet />
		</div>;
	}

	const root = createRootRoute({ component: Layout });
	const index = createRoute({
		getParentRoute: () => root,
		path: '/',
	});
	const a = createRoute({
		getParentRoute: () => root,
		path: '/a',
		loader: () => aGate,
	});
	const b = createRoute({
		getParentRoute: () => root,
		path: '/b',
		loader: () => bGate,
	});
	const router = createRouter({
		routeTree: root.addChildren([index, a, b]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);

	await waitFor(() => {
		expect(screen.getByTestId('pending-a')).toHaveTextContent('false');
		expect(router.stores.status.get()).toBe('idle');
		expect(router.stores.resolvedLocation.get()?.pathname).toBe('/');
	});

	const navigationA = router.navigate({ to: '/a' });
	await waitFor(() => {
		expect(screen.getByTestId('pending-a')).toHaveTextContent('true');
		expect(screen.getByTestId('resolved-b')).toHaveTextContent('false');
	});

	const navigationB = router.navigate({ to: '/b' });
	await waitFor(() => {
		expect(screen.getByTestId('pending-a')).toHaveTextContent('false');
		expect(screen.getByTestId('pending-b')).toHaveTextContent('true');
		expect(screen.getByTestId('resolved-b')).toHaveTextContent('false');
	});

	aGate.resolve();
	bGate.resolve();
	await Promise.allSettled([navigationA, navigationB]);
	await waitFor(() => {
		expect(screen.getByTestId('pending-b')).toHaveTextContent('false');
		expect(screen.getByTestId('resolved-b')).toHaveTextContent('true');
	});
});
