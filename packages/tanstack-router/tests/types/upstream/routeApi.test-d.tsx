// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
// Derived replaces Solid Accessor; all route inference assertions are retained.
import { describe, expectTypeOf, test } from 'vitest';
import {
	createRootRoute,
	createRoute,
	createRouter,
	getRouteApi,
} from '@ripple-ts/tanstack-router';
import type { Derived } from 'ripple';
import type { MakeRouteMatch, UseNavigateResult } from '@tanstack/router-core';
import type { LinkComponent } from '@ripple-ts/tanstack-router';

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
	beforeLoad: () => ({ beforeLoadContext: 0 }),
	loaderDeps: () => ({ dep: 0 }),
	loader: () => ({ data: 0 }),
});

const routeTree = rootRoute.addChildren([
	invoicesRoute.addChildren([invoicesIndexRoute, invoiceRoute]),
	indexRoute,
]);

const defaultRouter = createRouter({
	routeTree,
});

type DefaultRouter = typeof defaultRouter;

type ExtractDefaultFrom<T> = T extends UseNavigateResult<infer DefaultFrom> ? DefaultFrom : never;

describe('getRouteApi', () => {
	const invoiceRouteApi = getRouteApi<'/invoices/$invoiceId', DefaultRouter>(
		'/invoices/$invoiceId',
	);
	describe('useNavigate', () => {
		test('has a static `from`', () => {
			const navigate = invoiceRouteApi.useNavigate();
			navigate;
			expectTypeOf<ExtractDefaultFrom<typeof navigate>>().toEqualTypeOf<'/invoices/$invoiceId'>();
		});
	});
	test('useParams', () => {
		expectTypeOf(invoiceRouteApi.useParams<DefaultRouter>()).toEqualTypeOf<
			Derived<{
				invoiceId: string;
			}>
		>();

		expectTypeOf(
			invoiceRouteApi.useParams<DefaultRouter, unknown, false>({
				shouldThrow: false,
			}),
		).toEqualTypeOf<Derived<{ invoiceId: string } | undefined>>();
	});
	test('useContext', () => {
		expectTypeOf(invoiceRouteApi.useRouteContext<DefaultRouter>()).toEqualTypeOf<
			Derived<{
				beforeLoadContext: number;
			}>
		>();
	});
	test('useSearch', () => {
		expectTypeOf(invoiceRouteApi.useSearch<DefaultRouter>()).toEqualTypeOf<
			Derived<{
				page: number;
			}>
		>();

		expectTypeOf(
			invoiceRouteApi.useSearch<DefaultRouter, unknown, false>({
				shouldThrow: false,
			}),
		).toEqualTypeOf<Derived<{ page: number } | undefined>>();
	});
	test('useLoaderData', () => {
		expectTypeOf(invoiceRouteApi.useLoaderData<DefaultRouter>()).toEqualTypeOf<
			Derived<{
				data: number;
			}>
		>();
	});
	test('useLoaderDeps', () => {
		expectTypeOf(invoiceRouteApi.useLoaderDeps<DefaultRouter>()).toEqualTypeOf<
			Derived<{
				dep: number;
			}>
		>();
	});
	test('useMatch', () => {
		expectTypeOf(invoiceRouteApi.useMatch<DefaultRouter>()).toEqualTypeOf<
			Derived<MakeRouteMatch<typeof routeTree, '/invoices/$invoiceId'>>
		>();

		expectTypeOf(
			invoiceRouteApi.useMatch<DefaultRouter, unknown, false>({
				shouldThrow: false,
			}),
		).toEqualTypeOf<
			Derived<MakeRouteMatch<typeof routeTree, '/invoices/$invoiceId'> | undefined>
		>();
	});
	test('Link', () => {
		const Link = invoiceRouteApi.Link;
		expectTypeOf(Link).toEqualTypeOf<LinkComponent<'/invoices/$invoiceId'>>();
	});
});

describe('createRoute', () => {
	describe('useNavigate', () => {
		test('has a static `from`', () => {
			const navigate = invoiceRoute.useNavigate();
			expectTypeOf<ExtractDefaultFrom<typeof navigate>>().toEqualTypeOf<'/invoices/$invoiceId'>();
		});
	});
});
