import type { Component, JSX, ValidComponent } from 'solid-js';

type IntrinsicElement = Extract<keyof JSX.IntrinsicElements, string>;
type ComponentProps<T extends ValidComponent> =
	T extends Component<infer P>
		? P
		: T extends IntrinsicElement
			? JSX.IntrinsicElements[T]
			: Record<string, unknown>;

export type DynamicProps<T extends ValidComponent, P = ComponentProps<T>> = {
	[K in keyof P]: P[K];
} & {
	is: T | null | undefined | false;
};

export function Dynamic<T extends ValidComponent>(props: DynamicProps<T>): JSX.Element;
