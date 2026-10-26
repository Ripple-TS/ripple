// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { effect, track, trackReadOnly } from 'ripple';
import { isServer } from '@tanstack/router-core/isServer';
import { useRouter } from './hooks.js';
import { resolveInput } from './inputs.js';

const idle = {
	status: 'idle',
	current: undefined,
	next: undefined,
	action: undefined,
	proceed: undefined,
	reset: undefined,
};

/** @param {import('../types/blocker.js').UseBlockerOptions<any, boolean>} options */
export function useBlocker(options) {
	var router = useRouter();
	/** @type {import('ripple').Tracked<import('../types/blocker.js').BlockerResolver<any>>} */
	var resolver = track(/** @type {any} */ (idle));
	if (!(isServer ?? router.isServer))
		effect(() => {
			if (resolveInput(options.disabled)) return;
			var enableBeforeUnload = resolveInput(options.enableBeforeUnload) ?? true;
			var active = true;
			var generation = 0;
			/** @type {(() => void) | undefined} */
			var cancelGuard;
			/** @type {((blocked: boolean) => void) | undefined} */
			var settle;
			/** @param {import('@tanstack/history').HistoryLocation} location */
			var getLocation = (location) => {
				var parsed = router.parseLocation(location);
				var [, params, route] = router.getMatchedRoutes(parsed.pathname);
				return {
					routeId: route?.id ?? '__notFound__',
					fullPath: route?.fullPath ?? parsed.pathname,
					pathname: parsed.pathname,
					params,
					search: parsed.search,
				};
			};
			var dispose = router.history.block({
				enableBeforeUnload,
				/** @param {import('@tanstack/history').BlockerFnArgs} args */
				blockerFn: async ({ currentLocation, nextLocation, action }) => {
					var destination = router._pendingLocation?.maskedLocation ?? router._pendingLocation;
					var commit =
						(action === 'PUSH' || action === 'REPLACE') &&
						destination?.publicHref === nextLocation.href
							? router._commitPromise
							: undefined;
					var request = ++generation;
					cancelGuard?.();
					settle?.(true);
					var current = getLocation(currentLocation);
					var next = getLocation(nextLocation);
					if (current.routeId === '__notFound__' && next.routeId !== '__notFound__') return false;
					/** @type {() => void} */
					var cancel = () => {};
					/** @type {Promise<boolean>} */
					var canceled = new Promise((resolve) => {
						cancel = () => resolve(true);
					});
					cancelGuard = cancel;
					var blocked;
					try {
						blocked = await Promise.race([
							options.shouldBlockFn({ current, next, action }),
							canceled,
						]);
					} finally {
						if (cancelGuard === cancel) cancelGuard = undefined;
					}
					if (!active || request !== generation || router.history.location !== currentLocation)
						blocked = true;
					else if (blocked && options.withResolver) {
						settle?.(true);
						blocked = await new Promise((resolve) => {
							var finish = (/** @type {boolean} */ value) => {
								if (settle !== finish) return;
								settle = undefined;
								resolver.value = /** @type {any} */ (idle);
								resolve(value);
							};
							settle = finish;
							resolver.value = {
								status: 'blocked',
								current,
								next,
								action,
								proceed: () => finish(false),
								reset: () => finish(true),
							};
						});
					}
					// Memory history does not publish a blocked commit. Settle only
					// this attempt, never a newer navigation's rendering promise.
					if (blocked) commit?.resolve();
					return blocked;
				},
			});
			return () => {
				active = false;
				cancelGuard?.();
				settle?.(true);
				dispose();
			};
		});
	return trackReadOnly(resolver);
}
