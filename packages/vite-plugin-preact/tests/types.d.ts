import type { ComponentType } from 'preact';

declare global {
	var render: <Props extends object>(
		component: ComponentType<Props>,
		props?: Props,
	) => Promise<void>;

	var container: HTMLDivElement;
}
