import type { Children, Derived, TSRXElement } from 'ripple';
import type {
	AnyRouter,
	Expand,
	NavigateOptions,
	RegisteredRouter,
	ResolveRoute,
} from '@tanstack/router-core';
import type { Reactive } from './link.js';
import type { UseMatchRouteOptions } from './readers.js';
export declare function Navigate<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string = string,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(
	props: Reactive<NavigateOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>> & {
		to?: TTo | Derived<TTo>;
		from?: TFrom | Derived<TFrom>;
	},
): TSRXElement;
export declare function MatchRoute<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string = string,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(
	props: UseMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & {
		children?: Children;
		render?: (
			params: false | Expand<ResolveRoute<TRouter, TFrom, TTo>['types']['allParams']>,
		) => Children;
	},
): TSRXElement;
export declare function useAwaited<T>(options: {
	promise: Promise<T> | Derived<Promise<T>>;
}): Derived<T>;
export declare function Await<T>(props: {
	promise: Promise<T> | Derived<Promise<T>>;
	fallback?: Children;
	render: (value: T) => Children;
}): TSRXElement;
