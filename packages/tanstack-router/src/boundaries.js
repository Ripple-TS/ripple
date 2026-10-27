/**
 * Render-thrown not-found values use the same ancestor search as loader errors.
 * Without a configured boundary, a named route can render the router default;
 * an unnamed not-found falls back to the root.
 * @param {import('@tanstack/router-core').AnyRouter} router
 * @param {string} routeId
 * @param {import('@tanstack/router-core').NotFoundError} error
 * @returns {string}
 */
export function findNotFoundBoundary(router, routeId, error) {
	var target = router.routesById[error.routeId ?? routeId];
	for (var route = target; route; route = route.parentRoute) {
		if (route.options.notFoundComponent) return route.id;
	}
	return error.routeId && target ? target.id : '__root__';
}

/** @param {import('@tanstack/router-core').AnyRouter} router @param {string} routeId */
export function findErrorBoundary(router, routeId) {
	for (var route = router.routesById[routeId]; route; route = route.parentRoute) {
		if (route.options.errorComponent || router.options.defaultErrorComponent) return route.id;
	}
	return router.options.disableGlobalCatchBoundary ? undefined : '__root__';
}
