// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type {
	AnyRouter,
	RegisteredRouter,
	ResolveUseSearch,
	StrictOrFrom,
	ThrowConstraint,
	ThrowOrOptional,
	UseSearchResult,
} from '@tanstack/router-core';
export interface UseSearchBaseOptions<
	TRouter extends AnyRouter,
	TFrom,
	TStrict extends boolean,
	TThrow extends boolean,
	TSelected,
> {
	select?: (state: ResolveUseSearch<TRouter, TFrom, TStrict>) => TSelected;
	shouldThrow?: TThrow;
}
export type UseSearchOptions<
	TRouter extends AnyRouter,
	TFrom,
	TStrict extends boolean,
	TThrow extends boolean,
	TSelected,
> = StrictOrFrom<TRouter, TFrom, TStrict> &
	UseSearchBaseOptions<TRouter, TFrom, TStrict, TThrow, TSelected>;
export type UseSearchRoute<out TFrom> = <
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = unknown,
	TThrow extends boolean = true,
>(
	opts?: UseSearchBaseOptions<TRouter, TFrom, /* TStrict */ true, TThrow, TSelected>,
) => Derived<ThrowOrOptional<UseSearchResult<TRouter, TFrom, true, TSelected>, TThrow>>;
export function useSearch<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string | undefined = undefined,
	TStrict extends boolean = true,
	TThrow extends boolean = true,
	TSelected = unknown,
>(
	opts: UseSearchOptions<TRouter, TFrom, TStrict, ThrowConstraint<TStrict, TThrow>, TSelected>,
): Derived<ThrowOrOptional<UseSearchResult<TRouter, TFrom, TStrict, TSelected>, TThrow>>;
