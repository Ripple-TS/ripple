import type { Component } from '#public';

declare global {
	function render(component: Component): void;

	var container: HTMLDivElement;
	var error: string | undefined;
}
