// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
// Derived replaces Solid Accessor; all route inference assertions are retained.
import { expectTypeOf, test } from 'vitest';
import {
	createRootRoute,
	createRoute,
	createRouter,
	useLocation,
} from '@ripple-ts/tanstack-router';
import type { ParsedLocation } from '@ripple-ts/tanstack-router';

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
});

const invoicesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: 'invoices',
});

const routeTree = rootRoute.addChildren([invoicesRoute, indexRoute]);

const defaultRouter = createRouter({ routeTree });

type DefaultRouter = typeof defaultRouter;

test('should have the types for a ParsedLocation in useLocation', () => {
	const location = useLocation<DefaultRouter>();

	expectTypeOf(location.value).toEqualTypeOf<ParsedLocation>();
	expectTypeOf(location.value)
		.toHaveProperty('pathname')
		.toEqualTypeOf<ParsedLocation['pathname']>();
});

test('should have the type of string for selecting the pathname in useLocation', () => {
	const pathname = useLocation<DefaultRouter, string>({
		select: (state) => state.pathname,
	}).value;

	expectTypeOf(pathname).toMatchTypeOf<ParsedLocation['pathname']>();
});
