import type { AnyRouter } from '@tanstack/router-core';
import type { Component } from 'ripple';
export interface HydrateRouterOptions {
	router: AnyRouter;
	target: HTMLElement;
	children?: Component;
}
export declare function hydrate(router: AnyRouter): Promise<void>;
export declare function hydrateRouter(options: HydrateRouterOptions): Promise<() => void>;
