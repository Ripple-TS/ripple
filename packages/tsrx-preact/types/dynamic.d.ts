import type { ComponentType, JSX, VNode } from 'preact';

export type DynamicElementType = keyof JSX.IntrinsicElements | ComponentType<any>;

export type DynamicProps<T extends DynamicElementType> = Omit<
	T extends ComponentType<infer P>
		? P
		: T extends keyof JSX.IntrinsicElements
			? JSX.IntrinsicElements[T]
			: Record<string, unknown>,
	'is'
> & {
	is: T | null | undefined | false;
};

export function Dynamic<T extends DynamicElementType>(props: DynamicProps<T>): VNode | null;
