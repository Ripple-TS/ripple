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

export type { ControlledPromise, NotFoundError, Redirect } from '@tanstack/router-core';
export type { HistoryLocation, HistoryState, RouterHistory } from '@tanstack/history';
import './extensions.js';
export { Router, createRouter } from './router.js';
export { createRootRoute, createRootRouteWithContext, createRoute } from './route.js';
export {
	RouterProvider,
	RouterContextProvider,
	Outlet,
	type RouterProps,
} from './RouterProvider.js';
export { useRouter } from './useRouter.js';
export { useRouterState } from './useRouterState.js';
export { useMatch } from './useMatch.js';
export { useParams } from './useParams.js';
export { useSearch } from './useSearch.js';
export { useLoaderData } from './useLoaderData.js';
export { useLoaderDeps } from './useLoaderDeps.js';
export { useRouteContext } from './useRouteContext.js';
export { useNavigate } from './useNavigate.js';
export type { Register, AnyRouter, AnyRoute, ErrorComponentProps } from '@tanstack/router-core';
