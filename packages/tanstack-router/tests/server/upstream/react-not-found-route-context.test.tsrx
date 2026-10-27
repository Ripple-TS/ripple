import { parseHTML } from 'linkedom';
// Ported from TanStack/react-router tests/not-found-route-context.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, expect, test, vi } from 'vitest';
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRootRouteWithContext,
	createRoute,
	createRouter,
	notFound,
} from '@ripple-ts/tanstack-router';
import { createRequestHandler, renderRouterToString } from '@ripple-ts/tanstack-router/ssr/server';

const expectedContext = 'from router / from root / from parent';
function createRouteTree() {
	const rootRoute = createRootRouteWithContext<{
		routerValue: string;
	}>()({
		context: () => ({ rootValue: 'from root' }),
	});
	const parentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/parent',
		context: () => ({ parentValue: 'from parent' }),
		component: ParentComponent,
	});
	const childRoute = createRoute({
		getParentRoute: () => parentRoute,
		path: '/child',
		context: (): {
			childValue: string;
		} => {
			throw notFound();
		},
		component: () => <div>{'Child content'}</div>,
		notFoundComponent: ChildNotFoundComponent,
	});
	function ParentComponent() {
		const context = parentRoute.useRouteContext();
		return <>
			<output data-testid="parent-context">{[
				context.value.routerValue,
				context.value.rootValue,
				context.value.parentValue,
			].join(' / ')}</output>
			<Outlet />
		</>;
	}
	function ChildNotFoundComponent() {
		const context = parentRoute.useRouteContext();
		return <output data-testid="not-found-context">{[
			context.value.routerValue,
			context.value.rootValue,
			context.value.parentValue,
		].join(' / ')}</output>;
	}
	return rootRoute.addChildren([parentRoute.addChildren([childRoute])]);
}
test('an SSR load-phase not-found preserves inherited ancestor context', async () => {
	const response = await createRequestHandler({
		request: new Request('http://localhost/parent/child'),
		createRouter: () => createRouter({
			routeTree: createRouteTree(),
			context: { routerValue: 'from router' },
			isServer: true,
		}),
	})(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	const html = await response.text();
	const document = parseHTML(html).document;
	expect(document.querySelector('[data-testid="parent-context"]')?.textContent).toBe(
		expectedContext,
	);
	expect(document.querySelector('[data-testid="not-found-context"]')?.textContent).toBe(
		expectedContext,
	);
	expect(html).not.toContain('Child content');
});
