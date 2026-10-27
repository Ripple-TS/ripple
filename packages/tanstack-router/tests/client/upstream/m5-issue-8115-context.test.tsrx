import { track } from 'ripple';
// Ported from TanStack/solid-router tests/issue-8115-context.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { Show, createMemo, createSignal } from './reactivity.js';
import { cleanup, fireEvent, render, screen, waitFor } from '../../harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import { hydrate } from '@ripple-ts/tanstack-router/ssr/client';
import { attachRouterServerSsrUtils } from '@tanstack/router-core/ssr/server';
import {
	Outlet,
	RouterProvider,
	Scripts,
	createControlledPromise,
	createMemoryHistory,
	createRootRoute,
	createRootRouteWithContext,
	createRoute,
	createRouter,
	useLocation,
} from '@ripple-ts/tanstack-router';

declare module '@tanstack/history' {
	interface HistoryState {
		issue8115Revision?: 'old' | 'new';
	}
}
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	delete window.$_TSR;
	delete (window as
		Window & {
			$R?: unknown;
		}).$R;
	document.body.innerHTML = '';
});
test(
	'#8115: hydration does not render a successful route with missing context when context reconstruction fails',
	async () => {
		const contextError = new Error('client context reconstruction failed');
		const clientSuccessRenderValues: Array<string | undefined> = [];
		let clientContextAttempts = 0;
		let serverPhase = true;
		const createRouteTree = () => {
			const rootRoute = createRootRoute({
				component: () => <>
					<Outlet />
					<Scripts />
				</>,
			});
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				context: (): {
					locale: string;
				} => {
					if (serverPhase) {
						return { locale: 'en' };
					}
					clientContextAttempts++;
					throw contextError;
				},
				component: () => {
					const context = indexRoute.useRouteContext();
					const locale = createMemo(() => {
						const value: string | undefined = context.value.locale;
						if (!serverPhase) {
							clientSuccessRenderValues.push(value);
						}
						return value;
					});
					return <div data-testid="route-success">
						{'Locale: '}
						{locale() ?? 'missing'}
					</div>;
				},
				errorComponent: ({ error }) => <div data-testid="route-error">
					{error instanceof Error ? error.message : String(error)}
				</div>,
			});
			return rootRoute.addChildren([indexRoute]);
		};
		const serverRouter = createRouter({
			routeTree: createRouteTree(),
			history: createMemoryHistory({ initialEntries: ['/'] }),
			isServer: true,
		});
		attachRouterServerSsrUtils({ router: serverRouter, manifest: undefined });
		const currentScriptSpy = vi.spyOn(document, 'currentScript', 'get');
		try {
			await serverRouter.load();
			expect(serverRouter.state.matches.at(-1)?.context).toMatchObject({
				locale: 'en',
			});
			expect(serverRouter.state.matches.at(-1)?.status).toBe('success');
			await serverRouter.serverSsr!.dehydrate();
			const scripts = serverRouter.serverSsr!.takeInitialHydrationScriptTags();
			expect(scripts?.before.length).toBeGreaterThan(0);
			// These scripts come exclusively from the router's production SSR serializer.
			for (const script of scripts!.before) {
				expect(script.children).toBeTruthy();
				currentScriptSpy.mockReturnValue(document.createElement('script'));
				new Function(script.children!)();
			}
		} finally {
			currentScriptSpy.mockRestore();
			serverRouter.serverSsr?.cleanup();
		}
		expect(window.$_TSR?.router?.matches.at(-1)?.s).toBe('success');
		serverPhase = false;
		const clientRouter = createRouter({
			routeTree: createRouteTree(),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		await hydrate(clientRouter);
		render(() => <RouterProvider router={clientRouter} />);
		expect(await screen.findByTestId('route-error')).toHaveTextContent(contextError.message);
		expect(clientContextAttempts).toBeGreaterThan(0);
		expect(screen.queryByTestId('route-success')).not.toBeInTheDocument();
		expect(clientSuccessRenderValues).not.toContain(undefined);
	},
);
