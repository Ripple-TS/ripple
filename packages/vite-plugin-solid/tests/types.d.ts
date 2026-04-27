import type { Component } from 'solid-js';

declare global {
	var render: <Props extends object>(component: Component<{}>, props?: Props) => Promise<void>;

	var flush: () => Promise<void>;

	var container: HTMLDivElement;
}
