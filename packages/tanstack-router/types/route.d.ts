// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type {
	AnyContext,
	AnyRoute,
	Register,
	ResolveFullPath,
	ResolveId,
	ResolveParams,
	RootRoute as RootRouteCore,
	RootRouteOptions,
	RouteConstraints,
	Route as RouteCore,
	RouteOptions,
	RouteMask,
	RouterCore,
	ToMaskOptions,
} from '@tanstack/router-core';
export declare function createRoute<
	TRegister = unknown,
	TParentRoute extends RouteConstraints['TParentRoute'] = AnyRoute,
	TPath extends RouteConstraints['TPath'] = '/',
	TFullPath extends RouteConstraints['TFullPath'] = ResolveFullPath<TParentRoute, TPath>,
	TCustomId extends RouteConstraints['TCustomId'] = string,
	TId extends RouteConstraints['TId'] = ResolveId<TParentRoute, TCustomId, TPath>,
	TSearchValidator = undefined,
	TParams = ResolveParams<TPath>,
	TRouteContextFn = AnyContext,
	TBeforeLoadFn = AnyContext,
	TLoaderDeps extends Record<string, any> = {},
	TLoaderFn = undefined,
	TChildren = unknown,
	TSSR = unknown,
	THandlers = undefined,
>(
	options: RouteOptions<
		TRegister,
		TParentRoute,
		TId,
		TCustomId,
		TFullPath,
		TPath,
		TSearchValidator,
		TParams,
		TLoaderDeps,
		TLoaderFn,
		AnyContext,
		TRouteContextFn,
		TBeforeLoadFn,
		TSSR,
		THandlers
	>,
): RouteCore<
	TRegister,
	TParentRoute,
	TPath,
	TFullPath,
	TCustomId,
	TId,
	TSearchValidator,
	TParams,
	AnyContext,
	TRouteContextFn,
	TBeforeLoadFn,
	TLoaderDeps,
	TLoaderFn,
	TChildren,
	unknown,
	TSSR,
	THandlers,
	undefined
>;
export declare function createRootRouteWithContext<TRouterContext extends {}>(): <
	TRegister = Register,
	TRouteContextFn = AnyContext,
	TBeforeLoadFn = AnyContext,
	TSearchValidator = undefined,
	TLoaderDeps extends Record<string, any> = {},
	TLoaderFn = undefined,
	TSSR = unknown,
	THandlers = undefined,
>(
	options?: RootRouteOptions<
		TRegister,
		TSearchValidator,
		TRouterContext,
		TRouteContextFn,
		TBeforeLoadFn,
		TLoaderDeps,
		TLoaderFn,
		TSSR,
		THandlers
	>,
) => RootRouteCore<
	TRegister,
	TSearchValidator,
	TRouterContext,
	TRouteContextFn,
	TBeforeLoadFn,
	TLoaderDeps,
	TLoaderFn,
	unknown,
	unknown,
	TSSR,
	THandlers,
	undefined
>;
export declare function createRootRoute<
	TRegister = Register,
	TSearchValidator = undefined,
	TRouterContext = {},
	TRouteContextFn = AnyContext,
	TBeforeLoadFn = AnyContext,
	TLoaderDeps extends Record<string, any> = {},
	TLoaderFn = undefined,
	TSSR = unknown,
	THandlers = undefined,
>(
	options?: RootRouteOptions<
		TRegister,
		TSearchValidator,
		TRouterContext,
		TRouteContextFn,
		TBeforeLoadFn,
		TLoaderDeps,
		TLoaderFn,
		TSSR,
		THandlers
	>,
): RootRouteCore<
	TRegister,
	TSearchValidator,
	TRouterContext,
	TRouteContextFn,
	TBeforeLoadFn,
	TLoaderDeps,
	TLoaderFn,
	unknown,
	unknown,
	TSSR,
	THandlers
>;

import type {
	ConstrainLiteral,
	RegisteredRouter,
	AnyRouter,
	RouteIds,
	RouteTypesById,
	NotFoundError,
	RouteById,
	LazyRouteOptions,
} from '@tanstack/router-core';
import type { UseMatchRoute } from './useMatch.js';
import type { UseParamsRoute } from './useParams.js';
import type { UseSearchRoute } from './useSearch.js';
import type { UseLoaderDataRoute } from './useLoaderData.js';
import type { UseLoaderDepsRoute } from './useLoaderDeps.js';
import type { UseRouteContextRoute } from './useRouteContext.js';
import type { UseNavigateResult } from '@tanstack/router-core';
import type { LinkComponent } from './link.js';
export interface RouteApi<TId, TRouter extends AnyRouter = RegisteredRouter> {
	useMatch: UseMatchRoute<TId>;
	useParams: UseParamsRoute<TId>;
	useSearch: UseSearchRoute<TId>;
	useLoaderData: UseLoaderDataRoute<TId>;
	useLoaderDeps: UseLoaderDepsRoute<TId>;
	useRouteContext: UseRouteContextRoute<TId>;
	useNavigate: () => UseNavigateResult<RouteTypesById<TRouter, TId>['fullPath']>;
	Link: LinkComponent<RouteTypesById<TRouter, TId>['fullPath']>;
	notFound: (options?: NotFoundError) => NotFoundError;
}
export declare function getRouteApi<const TId, TRouter extends AnyRouter = RegisteredRouter>(
	id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>,
): RouteApi<TId, TRouter>;
export declare function createLazyRoute<
	TRouter extends AnyRouter = RegisteredRouter,
	TId extends string = string,
>(
	id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>,
): (
	options: LazyRouteOptions,
) => RouteApi<TId, TRouter> & { options: { id: TId } & LazyRouteOptions };

export declare function createRouteMask<
	TRouteTree extends AnyRoute,
	TFrom extends string,
	TTo extends string,
>(
	options: { routeTree: TRouteTree } & ToMaskOptions<
		RouterCore<TRouteTree, 'never', false>,
		TFrom,
		TTo
	>,
): RouteMask<TRouteTree>;
