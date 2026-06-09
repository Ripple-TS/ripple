import type { NativeElements } from 'vue-jsx-vapor';

type DynamicIntrinsicElements = NativeElements;

export type DynamicElementType =
	| keyof DynamicIntrinsicElements
	| ((props: any, ...args: any[]) => any)
	| (new (...args: any[]) => { $props: any })
	| (string & {});

type DynamicTarget<T> = Exclude<T, null | undefined | false>;
type DynamicComponentProps<T> = [T] extends [never]
	? Record<string, unknown>
	: T extends new (...args: any[]) => { $props: infer P }
		? Omit<P, 'is'>
		: T extends (props: infer P, ...args: any[]) => any
			? Omit<P, 'is'>
			: T extends keyof DynamicIntrinsicElements
				? DynamicIntrinsicElements[T]
				: Record<string, unknown>;

export type DynamicProps<T extends DynamicElementType> = DynamicComponentProps<
	DynamicTarget<NoInfer<T>>
> & {
	is: T | null | undefined | false;
};

export function Dynamic<T extends DynamicElementType>(
	props: DynamicComponentProps<DynamicTarget<NoInfer<T>>> & {
		is: T | null | undefined | false;
	},
): any;
