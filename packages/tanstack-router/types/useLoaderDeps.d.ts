// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type {
	AnyRouter,
	RegisteredRouter,
	ResolveUseLoaderDeps,
	StrictOrFrom,
	UseLoaderDepsResult,
} from '@tanstack/router-core';
export interface UseLoaderDepsBaseOptions<TRouter extends AnyRouter, TFrom, TSelected> {
	select?: (deps: ResolveUseLoaderDeps<TRouter, TFrom>) => TSelected;
}
export type UseLoaderDepsOptions<
	TRouter extends AnyRouter,
	TFrom extends string | undefined,
	TSelected,
> = StrictOrFrom<TRouter, TFrom> & UseLoaderDepsBaseOptions<TRouter, TFrom, TSelected>;
export type UseLoaderDepsRoute<out TId> = <
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = unknown,
>(
	opts?: UseLoaderDepsBaseOptions<TRouter, TId, TSelected>,
) => Derived<UseLoaderDepsResult<TRouter, TId, TSelected>>;
export function useLoaderDeps<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string | undefined = undefined,
	TSelected = unknown,
>(
	opts: UseLoaderDepsOptions<TRouter, TFrom, TSelected>,
): Derived<UseLoaderDepsResult<TRouter, TFrom, TSelected>>;
