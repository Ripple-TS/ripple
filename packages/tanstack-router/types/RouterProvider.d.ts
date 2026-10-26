import type { Children, TSRXElement } from 'ripple';
import type { AnyRouter, RegisteredRouter } from '@tanstack/router-core';

export interface RouterProps<TRouter extends AnyRouter = RegisteredRouter> {
	router: TRouter;
	context?: Partial<TRouter['options']['context']>;
}

export declare function RouterProvider<TRouter extends AnyRouter = RegisteredRouter>(
	props: RouterProps<TRouter>,
): TSRXElement;
export declare function RouterContextProvider<TRouter extends AnyRouter = RegisteredRouter>(
	props: RouterProps<TRouter> & { children?: Children },
): TSRXElement;
export declare function Outlet(): TSRXElement;
