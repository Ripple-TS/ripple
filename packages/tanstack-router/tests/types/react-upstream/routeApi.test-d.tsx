// Ported from TanStack/react-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expectTypeOf, test } from 'vitest';
import { createRootRoute, createRoute } from '@ripple-ts/tanstack-router';
const rootRoute = createRootRoute();
const invoicesRoute = createRoute({ getParentRoute: () => rootRoute, path: 'invoices' });
const invoicesIndexRoute = createRoute({ getParentRoute: () => invoicesRoute, path: '/' });
const layoutRoute = createRoute({ getParentRoute: () => rootRoute, id: '_layout' });
test('index route fullPath should have trailing slash to match runtime', () => {
	expectTypeOf(invoicesIndexRoute.fullPath).toEqualTypeOf<'/invoices/'>();
});
test('layout route fullPath should be "/" not empty string', () => {
	expectTypeOf(layoutRoute.fullPath).toEqualTypeOf<'/'>();
});
