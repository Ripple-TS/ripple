import type { Component } from 'solid-js';
import type { JSX } from '@solidjs/web';

type IntrinsicElement = Extract<keyof JSX.IntrinsicElements, string>;
export type DynamicElementType = IntrinsicElement | Component<any> | (string & {});
type DynamicTarget<T> = Exclude<T, null | undefined | false>;
type ElementFromTag<T> = T extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[T]
	: T extends keyof SVGElementTagNameMap
		? SVGElementTagNameMap[T]
		: T extends keyof MathMLElementTagNameMap
			? MathMLElementTagNameMap[T]
			: Element;
type DynamicIntrinsicProps = {
	[T in IntrinsicElement]: JSX.ElementAttributes<ElementFromTag<T>> & {
		is: T | null | undefined | false;
	};
}[IntrinsicElement];
type DynamicComponentProps<T> = [T] extends [never]
	? Record<string, unknown>
	: T extends Component<infer P>
		? P
		: T extends IntrinsicElement
			? JSX.IntrinsicElements[T]
			: Record<string, unknown>;

export type DynamicProps<T extends DynamicElementType> = DynamicComponentProps<
	DynamicTarget<NoInfer<T>>
> & {
	is: T | null | undefined | false;
};

export function Dynamic(props: DynamicIntrinsicProps): JSX.Element;
export function Dynamic<T extends DynamicElementType>(
	props: DynamicComponentProps<DynamicTarget<NoInfer<T>>> & {
		is: T | null | undefined | false;
	},
): JSX.Element;
