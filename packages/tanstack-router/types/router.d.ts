import { RouterCore } from '@tanstack/router-core';
import type { RouterHistory } from '@tanstack/history';
import type {
	AnyRoute,
	CreateRouterFn,
	RouterConstructorOptions,
	TrailingSlashOption,
} from '@tanstack/router-core';

export declare class Router<
	in out TRouteTree extends AnyRoute,
	in out TTrailingSlashOption extends TrailingSlashOption = 'never',
	in out TDefaultStructuralSharingOption extends boolean = false,
	in out TRouterHistory extends RouterHistory = RouterHistory,
	in out TDehydrated extends Record<string, unknown> = Record<string, unknown>,
> extends RouterCore<
	TRouteTree,
	TTrailingSlashOption,
	TDefaultStructuralSharingOption,
	TRouterHistory,
	TDehydrated
> {
	constructor(
		options: RouterConstructorOptions<
			TRouteTree,
			TTrailingSlashOption,
			TDefaultStructuralSharingOption,
			TRouterHistory,
			TDehydrated
		>,
	);
}

export declare const createRouter: CreateRouterFn;
