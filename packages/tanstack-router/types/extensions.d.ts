import type { LinkComponent } from './link.js';
import type { Component, Children } from 'ripple';
import type {
	ErrorComponentProps,
	NotFoundRouteProps,
	UseNavigateResult,
} from '@tanstack/router-core';
import type { UseMatchRoute } from './useMatch.js';
import type { UseParamsRoute } from './useParams.js';
import type { UseSearchRoute } from './useSearch.js';
import type { UseLoaderDataRoute } from './useLoaderData.js';
import type { UseLoaderDepsRoute } from './useLoaderDeps.js';
import type { UseRouteContextRoute } from './useRouteContext.js';

export type RouteComponent = Component<Record<string, never>> & { preload?: () => Promise<void> };
export type ErrorRouteComponent = Component<ErrorComponentProps>;
export type NotFoundRouteComponent = Component<NotFoundRouteProps>;

declare module '@tanstack/router-core' {
	interface ErrorBoundaryTypes {
		error: Error;
	}
	interface UpdatableRouteOptionsExtensions {
		component?: RouteComponent;
		pendingComponent?: RouteComponent;
		errorComponent?: ErrorRouteComponent | false | null;
		notFoundComponent?: NotFoundRouteComponent;
	}
	interface RouterOptionsExtensions {
		defaultComponent?: RouteComponent;
		defaultPendingComponent?: RouteComponent;
		defaultErrorComponent?: ErrorRouteComponent;
		defaultNotFoundComponent?: NotFoundRouteComponent;
		Wrap?: Component<{ children?: Children }>;
		InnerWrap?: Component<{ children?: Children }>;
	}
	interface RouteExtensions<in out TId, in out TFullPath> {
		Link: LinkComponent<Extract<TFullPath, string>>;
		useMatch: UseMatchRoute<TId>;
		useParams: UseParamsRoute<TId>;
		useSearch: UseSearchRoute<TId>;
		useLoaderData: UseLoaderDataRoute<TId>;
		useLoaderDeps: UseLoaderDepsRoute<TId>;
		useRouteContext: UseRouteContextRoute<TId>;
		useNavigate: () => UseNavigateResult<Extract<TFullPath, string>>;
	}
}
