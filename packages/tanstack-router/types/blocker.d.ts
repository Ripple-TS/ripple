import type { Children, Derived, TSRXElement } from 'ripple';
import type { HistoryAction } from '@tanstack/history';
import type { AnyRoute, AnyRouter, ParseRoute, RegisteredRouter } from '@tanstack/router-core';
export type BlockerLocation<
	TRouter extends AnyRouter = RegisteredRouter,
	TRoute extends AnyRoute = ParseRoute<TRouter['routeTree']>,
> = TRoute extends any
	? {
			routeId: TRoute['id'];
			fullPath: TRoute['fullPath'];
			pathname: string;
			params: TRoute['types']['allParams'];
			search: TRoute['types']['fullSearchSchema'];
		}
	: never;
export type ShouldBlockFn<TRouter extends AnyRouter = RegisteredRouter> = (options: {
	current: BlockerLocation<TRouter>;
	next: BlockerLocation<TRouter>;
	action: HistoryAction;
}) => boolean | Promise<boolean>;
export type BlockerResolver<TRouter extends AnyRouter = RegisteredRouter> =
	| {
			status: 'blocked';
			current: BlockerLocation<TRouter>;
			next: BlockerLocation<TRouter>;
			action: HistoryAction;
			proceed: () => void;
			reset: () => void;
	  }
	| {
			status: 'idle';
			current: undefined;
			next: undefined;
			action: undefined;
			proceed: undefined;
			reset: undefined;
	  };
export type UseBlockerOptions<
	TRouter extends AnyRouter = RegisteredRouter,
	TWithResolver extends boolean = false,
> = {
	shouldBlockFn: ShouldBlockFn<TRouter>;
	enableBeforeUnload?: boolean | (() => boolean) | Derived<boolean>;
	disabled?: boolean | Derived<boolean>;
	withResolver?: TWithResolver;
};
export declare function useBlocker<
	TRouter extends AnyRouter = RegisteredRouter,
	TWithResolver extends boolean = false,
>(options: UseBlockerOptions<TRouter, TWithResolver>): Derived<BlockerResolver<TRouter>>;
export declare function Block<
	TRouter extends AnyRouter = RegisteredRouter,
	TWithResolver extends boolean = false,
>(
	props: UseBlockerOptions<TRouter, TWithResolver> & {
		children?: Children;
		render?: (state: BlockerResolver<TRouter>) => Children;
	},
): TSRXElement;
