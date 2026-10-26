// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type {
	AnyRouter,
	RegisteredRouter,
	ResolveUseLoaderData,
	StrictOrFrom,
	UseLoaderDataResult,
} from '@tanstack/router-core';
export interface UseLoaderDataBaseOptions<
	TRouter extends AnyRouter,
	TFrom,
	TStrict extends boolean,
	TSelected,
> {
	select?: (match: ResolveUseLoaderData<TRouter, TFrom, TStrict>) => TSelected;
}
export type UseLoaderDataOptions<
	TRouter extends AnyRouter,
	TFrom extends string | undefined,
	TStrict extends boolean,
	TSelected,
> = StrictOrFrom<TRouter, TFrom, TStrict> &
	UseLoaderDataBaseOptions<TRouter, TFrom, TStrict, TSelected>;
export type UseLoaderDataRoute<out TId> = <
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = unknown,
>(
	opts?: UseLoaderDataBaseOptions<TRouter, TId, true, TSelected>,
) => Derived<UseLoaderDataResult<TRouter, TId, true, TSelected>>;
export function useLoaderData<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string | undefined = undefined,
	TStrict extends boolean = true,
	TSelected = unknown,
>(
	opts: UseLoaderDataOptions<TRouter, TFrom, TStrict, TSelected>,
): Derived<UseLoaderDataResult<TRouter, TFrom, TStrict, TSelected>>;
