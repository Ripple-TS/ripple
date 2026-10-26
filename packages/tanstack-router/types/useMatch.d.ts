// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type {
	AnyRouter,
	MakeRouteMatch,
	MakeRouteMatchUnion,
	RegisteredRouter,
	StrictOrFrom,
	ThrowConstraint,
	ThrowOrOptional,
} from '@tanstack/router-core';
export interface UseMatchBaseOptions<
	TRouter extends AnyRouter,
	TFrom,
	TStrict extends boolean,
	TThrow extends boolean,
	TSelected,
> {
	select?: (match: MakeRouteMatch<TRouter['routeTree'], TFrom, TStrict>) => TSelected;
	shouldThrow?: TThrow;
}
export type UseMatchRoute<out TFrom> = <
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = unknown,
	TThrow extends boolean = true,
>(
	opts?: UseMatchBaseOptions<TRouter, TFrom, true, TThrow, TSelected>,
) => Derived<ThrowOrOptional<UseMatchResult<TRouter, TFrom, true, TSelected>, TThrow>>;
export type UseMatchOptions<
	TRouter extends AnyRouter,
	TFrom extends string | undefined,
	TStrict extends boolean,
	TThrow extends boolean,
	TSelected,
> = StrictOrFrom<TRouter, TFrom, TStrict> &
	UseMatchBaseOptions<TRouter, TFrom, TStrict, TThrow, TSelected>;
export type UseMatchResult<
	TRouter extends AnyRouter,
	TFrom,
	TStrict extends boolean,
	TSelected,
> = unknown extends TSelected
	? TStrict extends true
		? MakeRouteMatch<TRouter['routeTree'], TFrom, TStrict>
		: MakeRouteMatchUnion<TRouter>
	: TSelected;
export function useMatch<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string | undefined = undefined,
	TStrict extends boolean = true,
	TThrow extends boolean = true,
	TSelected = unknown,
>(
	opts: UseMatchOptions<TRouter, TFrom, TStrict, ThrowConstraint<TStrict, TThrow>, TSelected>,
): Derived<ThrowOrOptional<UseMatchResult<TRouter, TFrom, TStrict, TSelected>, TThrow>>;
