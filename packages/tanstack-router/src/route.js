import { BaseRoute, BaseRootRoute, notFound } from '@tanstack/router-core';
import { createRouteLink, createRouteIdLink } from './Link.tsrx';
import {
	useMatch,
	useParams,
	useSearch,
	useRouteContext,
	useLoaderData,
	useLoaderDeps,
	useNavigate,
	useRouter,
} from './hooks.js';

/** @template {{ id: string; fullPath?: string }} T @param {T} route @param {() => string} getFullPath */
function bindRoute(route, getFullPath) {
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
		useNavigate: () => useNavigate({ from: getFullPath() }),
		Link: createRouteLink(getFullPath),
	});
}

/** @param {import('@tanstack/router-core').AnyRoute['options']} options */
export function createRoute(options) {
	var route = new BaseRoute(options);
	return bindRoute(route, () => route.fullPath);
}
/** @param {import('@tanstack/router-core').AnyRoute['options']} [options] */
export function createRootRoute(options) {
	var route = new BaseRootRoute(options);
	return bindRoute(route, () => route.fullPath);
}
export function createRootRouteWithContext() {
	return createRootRoute;
}

/** @param {string} id */
export function getRouteApi(id) {
	return Object.assign(
		bindRoute({ id }, () => useRouter().routesById[id].fullPath),
		{
			/** @param {import('@tanstack/router-core').NotFoundError} [options] */
			notFound: (options) => notFound({ routeId: /** @type {any} */ (id), ...options }),
			Link: createRouteIdLink(id),
		},
	);
}

/** @param {string} id */
export function createLazyRoute(id) {
	/** @param {import('@tanstack/router-core').LazyRouteOptions} options */
	return (options) => Object.assign(getRouteApi(id), { options: { id, ...options } });
}

/** @template T @param {T} options @returns {T} */
export function createRouteMask(options) {
	return options;
}
