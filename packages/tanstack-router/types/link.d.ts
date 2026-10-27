import type { Children, Component, CSSProperties, Derived, JSX, TSRXElement } from 'ripple';
import type {
	AnyRouter,
	LinkOptions,
	RegisteredRouter,
	ToPathOption,
	FromPathOption,
	Constrain,
	InferFrom,
	InferTo,
	InferMaskFrom,
	InferMaskTo,
} from '@tanstack/router-core';

export type Reactive<T> = { [K in keyof T]: T[K] | Derived<T[K]> };
type KnownProps<T> = {
	[K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};
export type AnchorProps = Omit<KnownProps<JSX.IntrinsicElements['a']>, 'children' | 'style'> & {
	style?: CSSProperties;
	[key: `data-${string}`]: unknown;
};
export type LinkProps<
	TRouter extends AnyRouter = RegisteredRouter,
	TFrom extends string = string,
	TTo extends string | undefined = undefined,
	TMaskFrom extends string = TFrom,
	TMaskTo extends string = '',
> = NoInfer<Reactive<LinkOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>>> & {
	to?: ToPathOption<TRouter, TFrom, TTo> | Derived<ToPathOption<TRouter, TFrom, TTo>>;
	from?: FromPathOption<TRouter, TFrom> | Derived<FromPathOption<TRouter, TFrom>>;
	mask?:
		| {
				to?: ToPathOption<TRouter, TMaskFrom, TMaskTo>;
				from?: FromPathOption<TRouter, TMaskFrom>;
		  }
		| Derived<{
				to?: ToPathOption<TRouter, TMaskFrom, TMaskTo>;
				from?: FromPathOption<TRouter, TMaskFrom>;
		  }>;
} & Omit<Reactive<AnchorProps>, 'href' | 'ref' | `on${string}`> &
	Pick<AnchorProps, Extract<keyof AnchorProps, 'ref' | `on${string}`>> & {
		activeProps?:
			| Partial<AnchorProps>
			| (() => Partial<AnchorProps>)
			| Derived<Partial<AnchorProps> | undefined>;
		inactiveProps?:
			| Partial<AnchorProps>
			| (() => Partial<AnchorProps>)
			| Derived<Partial<AnchorProps> | undefined>;
		children?: Children;
		render?: (state: { readonly isActive: boolean }) => Children;
	};
export type LinkComponent<TDefaultFrom extends string = string, TExtra = {}> = <
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string = TDefaultFrom,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(
	props: LinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & TExtra,
) => TSRXElement;
export declare const Link: LinkComponent;
export declare function createLink<
	TProps extends { linkProps: Derived<AnchorProps>; children?: Children },
>(component: Component<TProps>): LinkComponent<string, Omit<TProps, 'linkProps' | 'children'>>;
export declare function useLinkProps<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string = string,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(options: LinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>): Derived<AnchorProps>;
// Preserve the caller's literal object (or tuple) while checking destinations.
type InputValues<T> = { [K in keyof T]: T[K] extends Derived<infer V> ? V : T[K] };
type ValidateLinkOptions<TRouter extends AnyRouter, TOptions> = Constrain<
	TOptions,
	LinkProps<
		TRouter,
		InferFrom<InputValues<TOptions>>,
		InferTo<InputValues<TOptions>>,
		InferMaskFrom<InputValues<TOptions>>,
		InferMaskTo<InputValues<TOptions>>
	>
>;
export declare function linkOptions<const TOptions, TRouter extends AnyRouter = RegisteredRouter>(
	options: TOptions extends ReadonlyArray<unknown>
		? { [K in keyof TOptions]: ValidateLinkOptions<TRouter, TOptions[K]> }
		: ValidateLinkOptions<TRouter, TOptions>,
): TOptions;
