import { createRenderObserver, effect, track, untrack, type Children, type Derived } from 'ripple';
import {
	getLocationChangeInfo,
	trimPathRight,
	type AnyRouter,
	type AnyRouteMatch,
} from '@tanstack/router-core';
import { isServer } from '@tanstack/router-core/isServer';
import { routerContext, matchContext } from './context.js';
import { useRouter } from './hooks.js';

const mounted = new WeakSet<AnyRouter>();

function Fragment({ children }: { children?: Children }) {
	return <>
		{children}
	</>;
}
function Empty() {
	return null;
}
function DefaultError({ error }: { error: unknown }) {
	return <pre>{String(error)}</pre>;
}

function Driver() @{
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
				router.startTransition = (update) => observer.run(update);
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
					mounted.delete(router);
				};
			}),
		);
	}
	<Matches />
}

function ProviderContext({ router, children }: { router: AnyRouter; children?: Children }) @{
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
	context?: Record<string, unknown>;
	children?: Children;
}) @{
	if (context) router.update({
		...router.options,
		context: { ...router.options.context, ...context },
	});
	const Wrap = router.options.Wrap ?? Fragment;
	<Wrap>
		<ProviderContext {router}>{children}</ProviderContext>
	</Wrap>
}

export function RouterProvider({
	router,
	context,
}: {
	router: AnyRouter;
	context?: Record<string, unknown>;
}) {
	return <RouterContextProvider {router} {context}>
		<Driver />
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
				effect(() => {
					if (router.stores.matches.get() !== captured) reset();
				});
				const Catch = router.options.defaultErrorComponent || DefaultError;
				<Catch {error} {reset} />
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
	const Pending = track(() => {
		match.value;
		return route.options.pendingComponent ?? router.options.defaultPendingComponent ?? Empty;
	});
	@try {
		@if (match.value?.status === 'pending') {
			<{Pending.value} />
		} @else {
			<MatchContent {match} />
		}
	} @pending {
		<{Pending.value} />
	} @catch (error, reset) {
		const captured = match.value;
		effect(() => {
			if (match.value !== captured) reset();
		});
		const Catch = route.options.errorComponent ?? router.options.defaultErrorComponent;
		if (!Catch) throw error;
		<Catch {error} {reset} />
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
	@if (match.value?.status === 'error') {
		throw match.value.error;
		<></>
	} @else if (match.value?.status === 'notFound') {
		const NotFound =
			route.options.notFoundComponent ?? router.options.defaultNotFoundComponent ?? Empty;
		<NotFound />
	} @else if (match.value?.status === 'success') {
		<{Component.value} />
	}
}

export function Outlet() @{
	const router = useRouter();
	const parent = matchContext.get();
	if (!parent) throw new Error('Outlet must be rendered inside a route component.');
	const children = track(() => {
		const ids = router.stores.ids.get();
		const index = ids.indexOf(parent.routeId);
		return index < 0 || parent.match.value?._notFound ? [] : ids.slice(index + 1, index + 2);
	});
	@for (const id of children.value; key id) {
		<Match routeId={id} />
	}
}
