// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
// Derived replaces Solid Accessor; all route inference assertions are retained.
import type { Derived } from 'ripple';
import type { BlockerResolver } from '@ripple-ts/tanstack-router';
import { expectTypeOf, test } from 'vitest';
import { createRootRoute, createRoute, createRouter, useBlocker } from '@ripple-ts/tanstack-router';

test('blocker without resolver', () => {
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

	const routeTree = rootRoute.addChildren([
		invoicesRoute.addChildren([invoicesIndexRoute]),
		indexRoute,
	]);

	const defaultRouter = createRouter({
		routeTree,
	});

	type DefaultRouter = typeof defaultRouter;

	expectTypeOf(useBlocker<DefaultRouter, false>).returns.toEqualTypeOf<
		Derived<BlockerResolver<DefaultRouter>>
	>();
});

test('blocker with resolver', () => {
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

	const routeTree = rootRoute.addChildren([
		invoicesRoute.addChildren([invoicesIndexRoute]),
		indexRoute,
	]);

	const defaultRouter = createRouter({
		routeTree,
	});

	type DefaultRouter = typeof defaultRouter;

	expectTypeOf(useBlocker<DefaultRouter, true>).returns.toBeObject();
});

test('shouldBlockFn has corrent action', () => {
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

	const routeTree = rootRoute.addChildren([
		invoicesRoute.addChildren([invoicesIndexRoute]),
		indexRoute,
	]);

	const defaultRouter = createRouter({
		routeTree,
	});

	type DefaultRouter = typeof defaultRouter;

	expectTypeOf(useBlocker<DefaultRouter>)
		.parameter(0)
		.toHaveProperty('shouldBlockFn')
		.parameter(0)
		.toHaveProperty('action')
		.toEqualTypeOf<'PUSH' | 'REPLACE' | 'FORWARD' | 'BACK' | 'GO'>();

	expectTypeOf(useBlocker<DefaultRouter>)
		.parameter(0)
		.toHaveProperty('shouldBlockFn')
		.parameter(0)
		.toHaveProperty('current')
		.toHaveProperty('routeId')
		.toEqualTypeOf<'__root__' | '/' | '/invoices' | '/invoices/'>();

	expectTypeOf(useBlocker<DefaultRouter>)
		.parameter(0)
		.toHaveProperty('shouldBlockFn')
		.parameter(0)
		.toHaveProperty('next')
		.toHaveProperty('routeId')
		.toEqualTypeOf<'__root__' | '/' | '/invoices' | '/invoices/'>();
});
