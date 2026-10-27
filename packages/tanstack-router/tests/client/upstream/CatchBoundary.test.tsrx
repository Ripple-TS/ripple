import { track } from 'ripple';
// Ported from TanStack/solid-router tests/CatchBoundary.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45. See NOTICE.
// Ripple uses Derived.value for reactive readers and real mount/disposal in the harness.
import { resolve } from 'node:path';
import { lazy } from './reactivity.js';
import { afterEach, expect, onTestFinished, test, vi } from 'vitest';
import { cleanup, render, screen } from '../../harness.js';
import { createControlledPromise } from '@tanstack/router-core';
import { build } from 'vite';

import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import type { ErrorComponentProps } from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});
test('keeps the Outlet diagnostic context after a route render throws', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
	const rootRoute = createRootRoute({ component: Outlet });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => {
			throw new Error('Render failed');
		},
		errorComponent: () => <>
			<span>{'Render fallback'}</span>
			<Outlet />
		</>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Render fallback')).toBeInTheDocument();
	expect(warn).toHaveBeenCalledWith(
		'Warning: An <Outlet /> was rendered inside a errorComponent. <Outlet /> should only be rendered inside a route component.',
	);
});
