import {
	createRouter,
	createRootRoute,
	HeadContent,
	Scripts,
	ClientOnly,
	useHydrated,
} from '@ripple-ts/tanstack-router';
import {
	createRequestHandler,
	renderRouterToStream,
	renderRouterToString,
} from '@ripple-ts/tanstack-router/ssr/server';
import { hydrate, hydrateRouter } from '@ripple-ts/tanstack-router/ssr/client';
import type { Component, Derived } from 'ripple';
const getRouter = () =>
	createRouter({ routeTree: createRootRoute({ shellComponent: (_props) => null }) });
const handler = createRequestHandler({
	createRouter: getRouter,
	request: new Request('http://localhost/'),
});
const buffered: Promise<Response> = handler(renderRouterToString);
const streamed: Promise<Response> = handler(renderRouterToStream);
const router = getRouter();
const restoring: Promise<void> = hydrate(router);
const disposing: Promise<() => void> = hydrateRouter({ router, target: document.body });
const hydrated: Derived<boolean> = useHydrated();
const head: Component = HeadContent;
const scripts: Component = Scripts;
const client: Component<{ children?: string }> = ClientOnly;
void [buffered, streamed, restoring, disposing, hydrated, head, scripts, client];
// @ts-expect-error hydration requires a DOM target
hydrateRouter({ router, target: 'app' });
// @ts-expect-error requests require a factory, not a shared router
createRequestHandler({ createRouter: router, request: new Request('http://localhost/') });
// @ts-expect-error the render helper needs its request for cancellation
renderRouterToStream({ router });
