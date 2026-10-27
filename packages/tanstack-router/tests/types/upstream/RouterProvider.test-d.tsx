// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
// Derived replaces Solid Accessor; all route inference assertions are retained.
import { expectTypeOf, test } from 'vitest';
import {
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
});

const invoicesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: 'invoices',
});

const invoicesIndexRoute = createRoute({
	getParentRoute: () => invoicesRoute,
	path: '/',
});

const invoiceRoute = createRoute({
	getParentRoute: () => invoicesRoute,
	path: '$invoiceId',
	validateSearch: () => ({ page: 0 }),
});

const routeTree = rootRoute.addChildren([
	invoicesRoute.addChildren([invoicesIndexRoute, invoiceRoute]),
	indexRoute,
]);

const defaultRouter = createRouter({
	routeTree,
});

type DefaultRouter = typeof defaultRouter;

test('can pass default router to the provider', () => {
	expectTypeOf(RouterProvider<DefaultRouter>)
		.parameter(0)
		.toMatchTypeOf<{
			router: DefaultRouter;
			routeTree?: DefaultRouter['routeTree'];
		}>();
});
