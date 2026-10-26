export { Router, createRouter } from './router.js';
export { createRootRoute, createRootRouteWithContext, createRoute } from './route.js';
export { RouterProvider, RouterContextProvider, Outlet } from './RouterProvider.tsrx';
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
} from './hooks.js';
export {
	createControlledPromise,
	defaultParseSearch,
	defaultStringifySearch,
	isNotFound,
	isRedirect,
	notFound,
	redirect,
} from '@tanstack/router-core';

export { createBrowserHistory, createHashHistory, createMemoryHistory } from '@tanstack/history';
