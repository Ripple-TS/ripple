// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type {
	AnyRouter,
	RegisteredRouter,
	UseRouteContextBaseOptions,
	UseRouteContextOptions,
	UseRouteContextResult,
} from '@tanstack/router-core';
export type UseRouteContextRoute<out TFrom> = <
	TRouter extends AnyRouter = RegisteredRouter,
	TSelected = unknown,
>(
	opts?: UseRouteContextBaseOptions<TRouter, TFrom, true, TSelected>,
) => Derived<UseRouteContextResult<TRouter, TFrom, true, TSelected>>;
export function useRouteContext<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string | undefined = undefined,
	TStrict extends boolean = true,
	TSelected = unknown,
>(
	opts: UseRouteContextOptions<TRouter, TFrom, TStrict, TSelected>,
): Derived<UseRouteContextResult<TRouter, TFrom, TStrict, TSelected>>;
