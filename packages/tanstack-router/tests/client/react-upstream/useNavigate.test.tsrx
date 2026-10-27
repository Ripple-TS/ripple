// Ported from TanStack/react-router tests/useNavigate.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import React, { act } from '../upstream/reactivity.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '../../react-harness.js';
import { z } from 'zod';
import { trailingSlashOptions } from '@tanstack/router-core';
import {
	Navigate,
	Outlet,
	RouterProvider,
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouteMask,
	createRouter,
	getRouteApi,
	useNavigate,
	useParams,
} from '@ripple-ts/tanstack-router';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

let history: RouterHistory;
beforeEach(() => {
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	history.destroy();
	window.history.replaceState(null, 'root', '/');
	vi.clearAllMocks();
	vi.resetAllMocks();
	cleanup();
});
test('when navigating to /auth/sign-in with literal path (no params)', async () => {
	const rootRoute = createRootRoute();
	const IndexComponent = () => {
		const navigate = useNavigate();
		return <>
			<h1>{'Index'}</h1>
			<button
				data-testid="navigate-btn"
				onClick={() => navigate({ to: '/auth/sign-in' })}
			>{'Navigate to Sign In'}</button>
		</>;
	};
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: IndexComponent,
	});
	const authRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/auth/$path',
		component: () => {
			const params = authRoute.useParams();
			return <div>
				<h1 data-testid="auth-heading">{'Auth Route'}</h1>
				<span data-testid="path-param">{params.value.path}</span>
			</div>;
		},
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, authRoute]),
		history,
	});
	render(() => <RouterProvider router={router} />);
	const btn = await screen.findByTestId('navigate-btn');
	// First click should navigate successfully
	await act(() => fireEvent.click(btn));
	// Should be at /auth/sign-in with correct params
	expect(window.location.pathname).toBe('/auth/sign-in');
	expect(await screen.findByTestId('auth-heading')).toBeInTheDocument();
	expect((await screen.findByTestId('path-param')).textContent).toBe('sign-in');
});
