import {
	createRenderObserver,
	effect,
	track,
	untrack,
	type Children,
	type Derived,
	type ViewTransitionController,
} from 'ripple';
import {
	getLocationChangeInfo,
	trimPathRight,
	isNotFound,
	type NotFoundError,
	type AnyRouter,
	type AnyRouteMatch,
} from '@tanstack/router-core';
import { isServer } from '@tanstack/router-core/isServer';
import { routerContext, matchContext, fallbackContext } from './context.js';
import { useRouter } from './hooks.js';
import { resolveInput } from './inputs.js';
import { useHydrated } from './Assets.tsrx';
import { findErrorBoundary, findNotFoundBoundary } from './boundaries.js';

const mounted = new WeakSet<AnyRouter>();

function Fragment({ children }: { children?: Children }) {
	return <>
		{children}
	</>;
}
function Empty() {
	return null;
}

function Fallback({ kind, children }: { kind: string; children?: Children }) @{
	fallbackContext.set(kind);
	<>
		{children}
	</>
}
export function ErrorComponent({ error }: { error: unknown }) {
	return <pre>
		{error instanceof Error ? error.message : String(error)}
	</pre>;
}

function DefaultNotFound() {
	return <p>Not Found</p>;
}

function Driver({ viewTransition }: { viewTransition?: ViewTransitionController }) @{
	const router = useRouter();
	const observer = createRenderObserver();
	if (!(isServer ?? router.isServer)) {
		effect(
			() => untrack(() => {
				if (
					mounted.has(router)
				) throw new Error('A router can only have one mounted RouterProvider.');
				mounted.add(router);
				const previous = router.startTransition;
				const previousViewTransition = router.startViewTransition;
				router.startTransition = (update) => observer.run(update);
				if (viewTransition) {
					// One owner of the native API: replace core's wrapper, rather than
					// starting a second transition from its render callback.
					router.startViewTransition = (update) => {
						const option = router.shouldViewTransition ?? router.options.defaultViewTransition;
						router.shouldViewTransition = undefined;
						if (!option) return update();
						const types =
							typeof option === 'object'
								? typeof option.types === 'function'
									? option.types(
											getLocationChangeInfo(
												router.latestLocation,
												router.stores.resolvedLocation.get(),
											),
										)
									: option.types
								: undefined;
						if (types === false) return update();
						return viewTransition.run(update, { types }).rendered.then(() => {});
					};
				}
				const unsubscribe = router.history.subscribe((event) => {
					void router.load(event).catch(console.error);
				});
				let active = true;
				router.updateLatestLocation();
				const resolved = router.stores.resolvedLocation.get();
				const alreadyResolved =
					resolved?.href === router.latestLocation.href &&
						resolved.state.__TSR_key === router.latestLocation.state.__TSR_key;
				const state = router.state;
				const loadingCurrent =
					state.isLoading && state.location.href === router.latestLocation.href &&
						state.location.state.__TSR_key === router.latestLocation.state.__TSR_key;
				const next = router.buildLocation({
					to: router.latestLocation.pathname,
					search: true,
					params: true,
					hash: true,
					state: true,
					_includeValidateSearch: true,
				});
				if (trimPathRight(router.latestLocation.publicHref) !== trimPathRight(next.publicHref)) {
					void router.commitLocation({ ...next, replace: true, ignoreBlocker: true }).catch(
						console.error,
					);
				} else if (!alreadyResolved && !loadingCurrent) {
					void router.load().catch(console.error);
				} else {
					if (resolved && !loadingCurrent) void observer.run(() => {}).then((rendered) => {
						if (active && rendered && router.stores.resolvedLocation.get() === resolved) {
							router.emit({ type: 'onRendered', ...getLocationChangeInfo(resolved, resolved) });
						}
					});
				}
				return () => {
					active = false;
					unsubscribe();
					observer.dispose();
					router.startTransition = previous;
					router.startViewTransition = previousViewTransition;
					mounted.delete(router);
				};
			}),
		);
	}
	<Matches />
}

function ProviderContext({ router, children }: { router: AnyRouter; children?: Children }) @{
	if (routerContext.get() !== router) {
		matchContext.set(undefined);
		fallbackContext.set(undefined);
	}
	routerContext.set(router);
	<>
		{children}
	</>
}

export function RouterContextProvider({
	router,
	context,
	children,
}: {
	router: AnyRouter;
	context?: Record<string, unknown> | Derived<Record<string, unknown>>;
	children?: Children;
}) @{
	const initialContext = router.options.context;
	const updateContext = () => {
		const value = resolveInput(context);
		if (value) router.update({ context: { ...initialContext, ...value } });
	};
	updateContext();
	effect(updateContext);
	const Wrap = router.options.Wrap ?? Fragment;
	<Wrap>
		<ProviderContext {router}>{children}</ProviderContext>
	</Wrap>
}

export function RouterProvider({
	router,
	context,
	viewTransition,
}: {
	router: AnyRouter;
	context?: Record<string, unknown> | Derived<Record<string, unknown>>;
	viewTransition?: ViewTransitionController;
}) {
	return <RouterContextProvider {router} {context}>
		<Driver {viewTransition} />
	</RouterContextProvider>;
}

function Matches() @{
	const router = useRouter();
	const InnerWrap = router.options.InnerWrap ?? Fragment;
	<InnerWrap>
		@if (router.options.disableGlobalCatchBoundary) {
			<RootMatch />
		} @else {
			@try {
				<RootMatch />
			} @catch (error, reset) {
				const captured = router.stores.matches.get();
				router.options.defaultOnCatch?.(error);
				effect(() => {
					if (router.stores.matches.get() !== captured) reset();
				});
				const Catch = router.options.defaultErrorComponent || ErrorComponent;
				@try {
					<Catch {error} {reset} />
				} @pending {
					<></>
				}
			}
		}
	</InnerWrap>
}

function RootMatch() @{
	const router = useRouter();
	@for (const id of router.stores.ids.get().slice(0, 1); key id) {
		<Match routeId={id} />
	}
}

function Match({ routeId }: { routeId: string }) @{
	const router = useRouter();
	const route = router.routesById[routeId];
	const match = track(() => router.stores.getMatchStore(routeId).get());
	matchContext.set({ routeId, match });
	const hydrated = useHydrated();
	// A loaded error already has a known boundary. Select it before entering
	// descendants so hydration never walks markup the server replaced.
	const failure = track(
		() => router.stores.matches.get().find(
			(candidate) =>
				candidate.status === 'error' && findErrorBoundary(router, candidate.routeId) === routeId,
		),
	);
	const Pending = track(() => {
		match.value;
		return route.options.pendingComponent ?? router.options.defaultPendingComponent ?? Empty;
	});
	const Shell = route.isRoot ? route.options.shellComponent ?? Fragment : Fragment;
	<Shell>
		@try {
			@if (failure.value) {
				@for (const failed of [failure.value]; key failed) {
					<LoadedError {routeId} error={failed!.error} />
				}
			} @else if (
				match.value?.status === 'pending' ||
					!hydrated.value && (match.value?.ssr === false || match.value?.ssr === 'data-only')
			) {
				<Fallback kind="pendingComponent">
					<{Pending.value} />
				</Fallback>
			} @else {
				<MatchContent {match} />
			}
		} @pending {
			<Fallback kind="pendingComponent">
				<{Pending.value} />
			</Fallback>
		} @catch (error, reset) {
			const captured = match.value;
			effect(() => {
				if (match.value !== captured) reset();
			});
			const notFound = isNotFound(error);
			const Catch = route.options.errorComponent ?? router.options.defaultErrorComponent;
			if (!notFound && !Catch) throw error;
			const onCatch = route.options.onCatch ?? router.options.defaultOnCatch;
			if (!notFound) onCatch?.(error);
			@try {
				@if (notFound) {
					const boundaryId = findNotFoundBoundary(router, routeId, error as NotFoundError);
					if (boundaryId !== routeId && !route.isRoot) throw error;
					<RouteNotFound {routeId} error={error as NotFoundError} />
				} @else {
					<Fallback kind="errorComponent">
						<Catch {error} {reset} info={{ componentStack: '' }} />
					</Fallback>
				}
			} @pending {
				<></>
			}
		}
	</Shell>
}

function LoadedError({ routeId, error }: { routeId: string; error: unknown }) @{
	const router = useRouter();
	const route = router.routesById[routeId];
	const Catch =
		route.options.errorComponent || router.options.defaultErrorComponent || ErrorComponent;
	const onCatch = route.options.onCatch ?? router.options.defaultOnCatch;
	onCatch?.(error);
	@try {
		<Fallback kind="errorComponent">
			<Catch
				{error}
				reset={() => {
					void router.invalidate();
				}}
				info={{ componentStack: '' }}
			/>
		</Fallback>
	} @pending {
		<></>
	}
}

function MatchContent({ match }: { match: Derived<AnyRouteMatch | undefined> }) @{
	const router = useRouter();
	const nearest = matchContext.get()!;
	const route = router.routesById[nearest.routeId];
	const Component = track(() => {
		match.value;
		return route.options.component ?? router.options.defaultComponent ?? Outlet;
	});
	const key = track(() => {
		const current = match.value;
		const remount = route.options.remountDeps ?? router.options.defaultRemountDeps;
		if (!current || !remount) return nearest.routeId;
		return JSON.stringify(
			remount({
				routeId: nearest.routeId,
				loaderDeps: current.loaderDeps,
				params: current._strictParams,
				search: current._strictSearch,
			}),
		) ??
			nearest.routeId;
	});
	@if (match.value?.status === 'error') {
		throw match.value.error;
		<></>
	} @else if (match.value?.status === 'notFound') {
		<RouteNotFound routeId={nearest.routeId} error={match.value.error as NotFoundError} />
	} @else if (match.value?.status === 'success') {
		@for (const identity of [key.value]; key identity) {
			<{Component.value} />
		}
	}
}

function RouteNotFound({ routeId, error }: { routeId: string; error?: NotFoundError }) @{
	const router = useRouter();
	const route = router.routesById[routeId];
	const NotFound =
		route.options.notFoundComponent ?? router.options.defaultNotFoundComponent ?? DefaultNotFound;
	<Fallback kind="notFoundComponent">
		<NotFound {...error} />
	</Fallback>
}

export function Outlet() @{
	const router = useRouter();
	const parent = matchContext.get();
	const fallback = fallbackContext.get();
	if (fallback && import.meta.env.DEV) {
		console.warn(
			`Warning: An <Outlet /> was rendered inside a ${fallback}. <Outlet /> should only be rendered inside a route component.`,
		);
	}
	if (!parent) throw new Error('Outlet must be rendered inside a route component.');
	const children = track(() => {
		const ids = router.stores.ids.get();
		const index = ids.indexOf(parent.routeId);
		return fallback || index < 0 || parent.match.value?._notFound
			? []
			: ids.slice(index + 1, index + 2);
	});
	@if (!fallback && parent.match.value?._notFound) {
		<RouteNotFound routeId={parent.routeId} error={parent.match.value.error as NotFoundError} />
	} @else {
		@for (const id of children.value; key id) {
			<Match routeId={id} />
		}
	}
}
