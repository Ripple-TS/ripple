import { effect, track } from 'ripple';
import { replaceEqualDeep } from '@tanstack/router-core';
import { routerContext, matchContext } from './context.js';
import { resolveInputs } from './inputs.js';

/** @typedef {import('@tanstack/router-core').AnyRouteMatch} Match */
/** @typedef {import('@tanstack/router-core').AnyRouter} AnyRouter */
/** @template [T=unknown] @typedef {{ from?: string; strict?: boolean; shouldThrow?: boolean; select?: (value: T) => unknown }} Options */

/** @returns {AnyRouter} */
export function useRouter() {
	var router = routerContext.get();
	if (!router) throw new Error('Router hooks must be called inside a RouterProvider.');
	return router;
}

/** @template T @param {() => T} read @returns {import('ripple').Derived<T>} */
function selectValue(read) {
	/** @type {T} */
	var previous;
	var initialized = false;
	return track(() => {
		var next = read();
		previous = initialized ? replaceEqualDeep(previous, next) : next;
		initialized = true;
		return previous;
	});
}

/** @param {{ router?: AnyRouter; select?: (state: AnyRouter['state']) => unknown }} [options] */
export function useRouterState(options = {}) {
	var context = routerContext.get();
	var candidate = options.router ?? context;
	if (!candidate) throw new Error('useRouterState() requires a router or RouterProvider.');
	var router = candidate;
	return selectValue(() => {
		var state = router.stores.__store.get();
		return options.select ? options.select(state) : state;
	});
}

/** @param {Options<Match>} [options] */
export function useMatch(options = {}) {
	var router = useRouter();
	var nearest = matchContext.get();
	var read = () =>
		options.from ? router.stores.getMatchStore(options.from).get() : nearest?.match.value;
	var requireMatch = () => {
		var match = read();
		if (!match && (options.shouldThrow ?? true)) {
			throw new Error(
				`Could not find an active match${options.from ? ` from "${options.from}"` : ''}.`,
			);
		}
		return match;
	};
	effect(() => {
		requireMatch();
	});
	return selectValue(() => {
		var match = requireMatch();
		return match && options.select ? options.select(match) : match;
	});
}

/** @template T @param {Options<T>} options @param {(match: Match) => T} read */
function useMatchValue(options, read) {
	return useMatch({
		...options,
		select: (match) => {
			var value = read(match);
			return options.select ? options.select(value) : value;
		},
	});
}

/** @param {Options} [options] */
export function useParams(options = {}) {
	return useMatchValue(options, (match) =>
		options.strict === false ? match.params : match._strictParams,
	);
}
/** @param {Options} [options] */
export function useSearch(options = {}) {
	return useMatchValue(options, (match) => match.search);
}
/** @param {Options} [options] */
export function useLoaderData(options = {}) {
	return useMatchValue(options, (match) => match.loaderData);
}
/** @param {Options} [options] */
export function useLoaderDeps(options = {}) {
	return useMatchValue(options, (match) => match.loaderDeps);
}
/** @param {Options} [options] */
export function useRouteContext(options = {}) {
	return useMatchValue(options, (match) => match.context);
}

/** @param {{ from?: string }} [defaults] */
export function useNavigate(defaults = {}) {
	var router = useRouter();
	/** @param {import('@tanstack/router-core').NavigateOptions<AnyRouter>} options */
	return (options) => router.navigate({ ...options, from: options.from ?? defaults.from });
}

/** @param {{ select?: (location: AnyRouter['state']['location']) => unknown }} [options] */
export function useLocation(options = {}) {
	var router = useRouter();
	return selectValue(() => {
		var location = router.stores.location.get();
		return options.select ? options.select(location) : location;
	});
}

/** @param {{ select?: (matches: Match[]) => unknown }} [options] */
export function useMatches(options = {}) {
	var router = useRouter();
	return selectValue(() => {
		var matches = router.stores.matches.get();
		return options.select ? options.select(matches) : matches;
	});
}

/** @param {{ select?: (matches: Match[]) => unknown }} [options] */
export function useParentMatches(options = {}) {
	var nearest = matchContext.get();
	return useMatches({
		select: (matches) => {
			var index = matches.findIndex((match) => match.routeId === nearest?.routeId);
			var parents = index < 0 ? [] : matches.slice(0, index);
			return options.select ? options.select(parents) : parents;
		},
	});
}

/** @param {{ select?: (matches: Match[]) => unknown }} [options] */
export function useChildMatches(options = {}) {
	var nearest = matchContext.get();
	return useMatches({
		select: (matches) => {
			var index = matches.findIndex((match) => match.routeId === nearest?.routeId);
			var children = nearest && index < 0 ? [] : matches.slice(index + 1);
			return options.select ? options.select(children) : children;
		},
	});
}

export function useMatchRoute() {
	var router = useRouter();
	/** @param {Record<string, any>} options */
	return (options) =>
		selectValue(() => {
			var { pending, caseSensitive, fuzzy, includeSearch, ...rest } = resolveInputs(options);
			router.stores.location.get();
			router.stores.resolvedLocation.get();
			router.stores.status.get();
			return router.matchRoute(rest, { pending, caseSensitive, fuzzy, includeSearch });
		});
}

export function useCanGoBack() {
	return useLocation({ select: (location) => location.state.__TSR_index !== 0 });
}
