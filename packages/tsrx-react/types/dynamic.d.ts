import type { JSX, JSXElementConstructor, ReactElement } from 'react';

type DataAttributes = {
	[Key in `data-${string}`]?: string | number | boolean | null | undefined;
};

type DynamicIntrinsicElements = JSX.IntrinsicElements;
export type DynamicElementType =
	| keyof DynamicIntrinsicElements
	| JSXElementConstructor<any>
	| (string & {});
type DynamicTarget<T> = Exclude<T, null | undefined | false>;
type DynamicIntrinsicProps = {
	[T in keyof DynamicIntrinsicElements]: DynamicIntrinsicElements[T] &
		DataAttributes & {
			is: T | null | undefined | false;
		};
}[keyof DynamicIntrinsicElements];
type DynamicComponentProps<T> = [T] extends [never]
	? Record<string, unknown>
	: T extends JSXElementConstructor<infer P>
		? Omit<P, 'is'>
		: T extends keyof DynamicIntrinsicElements
			? DynamicIntrinsicElements[T] & DataAttributes
			: Record<string, unknown>;

export type DynamicProps<T extends DynamicElementType> = DynamicComponentProps<
	DynamicTarget<NoInfer<T>>
> & {
	is: T | null | undefined | false;
};

export function Dynamic(props: DynamicIntrinsicProps): ReactElement | null;
export function Dynamic<T extends DynamicElementType>(
	props: DynamicComponentProps<DynamicTarget<NoInfer<T>>> & {
		is: T | null | undefined | false;
	},
): ReactElement | null;
