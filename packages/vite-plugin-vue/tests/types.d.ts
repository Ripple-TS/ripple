import type { VaporComponent } from 'vue';

declare global {
	var render: <Props extends object>(component: VaporComponent, props?: Props) => Promise<void>;

	var flush: () => Promise<void>;

	var container: HTMLDivElement;
}
