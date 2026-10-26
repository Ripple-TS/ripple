import type { Children, Component, CSSProperties, Derived, JSX, TSRXElement } from 'ripple';
import type { AnyRouter, LinkOptions, RegisteredRouter } from '@tanstack/router-core';

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
	to?: TTo | Derived<TTo>;
	from?: TFrom | Derived<TFrom>;
	mask?: { to?: TMaskTo; from?: TMaskFrom } | Derived<{ to?: TMaskTo; from?: TMaskFrom }>;
} & Omit<Reactive<AnchorProps>, 'href' | 'ref' | `on${string}`> &
	Pick<AnchorProps, Extract<keyof AnchorProps, 'ref' | `on${string}`>> & {
		activeProps?: Partial<AnchorProps> | (() => Partial<AnchorProps>);
		inactiveProps?: Partial<AnchorProps> | (() => Partial<AnchorProps>);
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
export declare function linkOptions<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string = string,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(
	options: LinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>,
): LinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;
