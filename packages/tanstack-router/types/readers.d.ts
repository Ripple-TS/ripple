import type { Derived } from 'ripple';
import type {
	AnyRouter,
	DeepPartial,
	Expand,
	MakeOptionalPathParams,
	MakeOptionalSearchParams,
	MakeRouteMatchUnion,
	MaskOptions,
	MatchRouteOptions,
	RegisteredRouter,
	ResolveRoute,
	RouterState,
	ToSubOptionsProps,
} from '@tanstack/router-core';
import type { Reactive } from './link.js';

export declare function useLocation<
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = RouterState<TRouter['routeTree']>['location'],
>(options?: {
	select?: (location: RouterState<TRouter['routeTree']>['location']) => TSelected;
}): Derived<TSelected>;
export declare function useMatches<
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = Array<MakeRouteMatchUnion<TRouter>>,
>(options?: {
	select?: (matches: Array<MakeRouteMatchUnion<TRouter>>) => TSelected;
}): Derived<TSelected>;
export declare const useParentMatches: typeof useMatches;
export declare const useChildMatches: typeof useMatches;
export declare function useCanGoBack(): Derived<boolean>;

export type UseMatchRouteOptions<
	TRouter extends AnyRouter,
	TFrom extends string,
	TTo extends string | undefined,
	TMaskFrom extends string = TFrom,
	TMaskTo extends string = '',
> = NoInfer<
	Reactive<
		ToSubOptionsProps<TRouter, TFrom, TTo> &
			DeepPartial<MakeOptionalSearchParams<TRouter, TFrom, TTo>> &
			DeepPartial<MakeOptionalPathParams<TRouter, TFrom, TTo>> &
			MaskOptions<TRouter, TMaskFrom, TMaskTo> &
			MatchRouteOptions
	>
> & { to?: TTo | Derived<TTo>; from?: TFrom | Derived<TFrom> };
export declare function useMatchRoute<TRouter extends AnyRouter = RegisteredRouter>(): <
	const TFrom extends string = string,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(
	options: UseMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>,
) => Derived<false | Expand<ResolveRoute<TRouter, TFrom, TTo>['types']['allParams']>>;
