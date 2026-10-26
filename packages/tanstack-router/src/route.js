import { BaseRoute, BaseRootRoute } from '@tanstack/router-core';
import {
	useMatch,
	useParams,
	useSearch,
	useRouteContext,
	useLoaderData,
	useLoaderDeps,
	useNavigate,
} from './hooks.js';

/** @template {{ id: string; fullPath: string }} T @param {T} route */
function bindRoute(route) {
	return Object.assign(route, {
		/** @param {import('./hooks.js').Options} [options] */
		useMatch: (options) => useMatch({ ...options, from: route.id }),
		/** @param {import('./hooks.js').Options} [options] */
		useParams: (options) => useParams({ ...options, from: route.id }),
		/** @param {import('./hooks.js').Options} [options] */
		useSearch: (options) => useSearch({ ...options, from: route.id }),
		/** @param {import('./hooks.js').Options} [options] */
		useLoaderData: (options) => useLoaderData({ ...options, from: route.id }),
		/** @param {import('./hooks.js').Options} [options] */
		useLoaderDeps: (options) => useLoaderDeps({ ...options, from: route.id }),
		/** @param {import('./hooks.js').Options} [options] */
		useRouteContext: (options) => useRouteContext({ ...options, from: route.id }),
		useNavigate: () => useNavigate({ from: route.fullPath }),
	});
}

/** @param {import('@tanstack/router-core').AnyRoute['options']} options */
export function createRoute(options) {
	return bindRoute(new BaseRoute(options));
}
/** @param {import('@tanstack/router-core').AnyRoute['options']} [options] */
export function createRootRoute(options) {
	return bindRoute(new BaseRootRoute(options));
}
export function createRootRouteWithContext() {
	return createRootRoute;
}
