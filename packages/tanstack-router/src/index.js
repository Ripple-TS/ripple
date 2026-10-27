export { Router, createRouter } from './router.js';
export {
	createRootRoute,
	createRootRouteWithContext,
	createRoute,
	getRouteApi,
	createRouteMask,
	createLazyRoute,
} from './route.js';
export {
	RouterProvider,
	RouterContextProvider,
	Outlet,
	ErrorComponent,
} from './RouterProvider.tsrx';
export {
	useRouter,
	useRouterState,
	useMatch,
	useParams,
	useSearch,
	useLoaderData,
	useLoaderDeps,
	useRouteContext,
	useNavigate,
	useLocation,
	useMatches,
	useParentMatches,
	useChildMatches,
	useMatchRoute,
	useCanGoBack,
} from './hooks.js';
export {
	createControlledPromise,
	SearchParamError,
	rootRouteId,
	defaultParseSearch,
	defaultStringifySearch,
	isNotFound,
	isRedirect,
	notFound,
	isMatch,
	lazyFn,
	retainSearchParams,
	stripSearchParams,
	redirect,
} from '@tanstack/router-core';

export { createBrowserHistory, createHashHistory, createMemoryHistory } from '@tanstack/history';

export { Link, createLink } from './Link.tsrx';
export { useLinkProps, linkOptions } from './link.js';
export { lazyRouteComponent } from './lazyRouteComponent.tsrx';
export { Navigate, MatchRoute, Await, useAwaited } from './navigation.tsrx';
export { useBlocker } from './blocker.js';
export { Block } from './Block.tsrx';
export { useElementScrollRestoration } from './scroll.js';
