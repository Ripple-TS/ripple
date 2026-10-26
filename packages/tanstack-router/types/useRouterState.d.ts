// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type { AnyRouter, RegisteredRouter, RouterState } from '@tanstack/router-core';
export type UseRouterStateOptions<TRouter extends AnyRouter, TSelected> = {
	router?: TRouter;
	select?: (state: RouterState<TRouter['routeTree']>) => TSelected;
};
export type UseRouterStateResult<TRouter extends AnyRouter, TSelected> = unknown extends TSelected
	? RouterState<TRouter['routeTree']>
	: TSelected;
export function useRouterState<TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown>(
	opts?: UseRouterStateOptions<TRouter, TSelected>,
): Derived<UseRouterStateResult<TRouter, TSelected>>;
