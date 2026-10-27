import { parseHTML } from 'linkedom';
// Ported from TanStack/react-router tests/errorComponent.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	ErrorComponent,
	HeadContent,
	Link,
	Outlet,
	RouterProvider,
	Scripts,
	createBrowserHistory,
	createControlledPromise,
	createLazyRoute,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	notFound,
} from '@ripple-ts/tanstack-router';
import { createRequestHandler, renderRouterToString } from '@ripple-ts/tanstack-router/ssr/server';
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
test('SSR errorComponent receives primitive errors thrown from beforeLoad', async () => {
	const rootRoute = createRootRoute({
		shellComponent: function RootDocument({ children }) {
			return <>
				{children}
				<Scripts />
			</>;
		},
		component: function Root() {
			return <Outlet />;
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
	const handler = createRequestHandler({
		request: new Request('http://localhost/about'),
		createRouter: () => createRouter({
			routeTree: rootRoute.addChildren([aboutRoute]),
			isServer: true,
		}),
	});
	const response = await handler(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	expect(response.status).toBe(500);
	const html = await response.text();
	expect(html).toContain('Error:');
	expect(html).toContain('primitive error thrown');
});
test('SSR renders a later fresh ancestor loader failure', async () => {
	const parentStarted = createControlledPromise<void>();
	const childStarted = createControlledPromise<void>();
	const parentGate = createControlledPromise<void>();
	const childGate = createControlledPromise<void>();
	const childSettled = createControlledPromise<void>();
	const rootRoute = createRootRoute({
		shellComponent: function RootDocument({ children }) {
			return <>
				{children}
				<Scripts />
			</>;
		},
		component: Outlet,
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
	const handler = createRequestHandler({
		request: new Request('http://localhost/parent/child'),
		createRouter: () => createRouter({
			routeTree: rootRoute.addChildren([
				parentRoute.addChildren([childRoute]),
			]),
			isServer: true,
		}),
	});
	const responsePromise = handler(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	await Promise.all([parentStarted, childStarted]);
	childGate.resolve();
	await childSettled;
	parentGate.resolve();
	const response = await responsePromise;
	const html = await response.text();
	expect(response.status).toBe(500);
	expect(html).toContain('Parent error boundary');
	expect(html).not.toContain('Child error boundary');
});
// https://github.com/TanStack/router/issues/4684
test('#4684: SSR renders head content when beforeLoad throws', async () => {
	const rootRoute = createRootRoute({
		head: () => ({
			links: [
				{ rel: 'stylesheet', href: '/global.css' },
			],
		}),
		shellComponent: function RootDocument({ children }) {
			return <>
				<HeadContent />
				{children}
				<Scripts />
			</>;
		},
		component: Outlet,
	});
	const failingRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/fail',
		beforeLoad: () => {
			throw new Error('beforeLoad failed');
		},
		head: ({ match }) => ({
			meta: [{ title: match.error ? 'Error title' : 'Success title' }],
		}),
		component: function FailingRoute() {
			return <div>{'Route content'}</div>;
		},
		errorComponent: ({ error }) => <div>
			{'Error UI: '}
			{getErrorMessage(error)}
		</div>,
	});
	const handler = createRequestHandler({
		request: new Request('http://localhost/fail'),
		createRouter: () => createRouter({
			routeTree: rootRoute.addChildren([failingRoute]),
			isServer: true,
		}),
	});
	const response = await handler(
		({ request, router, responseHeaders }) => renderRouterToString({
			request,
			router,
			responseHeaders,
			children: () => <RouterProvider router={router} />,
		}),
	);
	expect(response.status).toBe(500);
	const html = await response.text();
	const serverDocument = parseHTML(html).document;
	expect(serverDocument.body.textContent).toContain('Error UI: beforeLoad failed');
	expect(serverDocument.head.querySelector('title')?.textContent).toBe('Error title');
	expect(
		serverDocument.head.querySelector('link[rel="stylesheet"][href="/global.css"]'),
	).not.toBeNull();
});
