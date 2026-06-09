import type { ComponentType, JSX, VNode } from 'preact';

type DynamicIntrinsicElements = JSX.IntrinsicElements;
export type DynamicElementType =
	| keyof DynamicIntrinsicElements
	| ComponentType<any>
	| (string & {});
type DynamicTarget<T> = Exclude<T, null | undefined | false>;
type DynamicComponentProps<T> = [T] extends [never]
	? Record<string, unknown>
	: T extends ComponentType<infer P>
		? Omit<P, 'is'>
		: T extends keyof DynamicIntrinsicElements
			? DynamicIntrinsicElements[T]
			: Record<string, unknown>;

export type DynamicProps<T extends DynamicElementType> = DynamicComponentProps<
	DynamicTarget<NoInfer<T>>
> & {
	is: T | null | undefined | false;
};

export function Dynamic<T extends keyof DynamicIntrinsicElements>(
	props: DynamicIntrinsicElements[T] & {
		is: T | null | undefined | false;
	},
): VNode | null;
export function Dynamic<T extends DynamicElementType>(
	props: DynamicComponentProps<DynamicTarget<NoInfer<T>>> & {
		is: T | null | undefined | false;
	},
): VNode | null;
