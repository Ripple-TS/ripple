// Ported from TanStack/react-router tests/issue-2182-root-pending.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, render, screen } from '../../react-harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import {
	RouterProvider,
	createControlledPromise,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});
// https://github.com/TanStack/router/issues/2182
test('root pending fallback remains visible through pendingMinMs', async () => {
	vi.useFakeTimers();
	const loaderGate = createControlledPromise<string>();
	const rootRoute = createRootRoute({
		pendingMs: 0,
		pendingMinMs: 100,
		pendingComponent: () => <div data-testid="root-pending">{'Pending'}</div>,
		loader: () => loaderGate,
		component: () => <div data-testid="root-content">{'Loaded'}</div>,
	});
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
	expect(screen.getByTestId('root-pending')).toBeInTheDocument();
	expect(screen.queryByTestId('root-content')).not.toBeInTheDocument();
	loaderGate.resolve('loaded');
	await act(async () => {
		await vi.advanceTimersByTimeAsync(99);
	});
	expect(screen.getByTestId('root-pending')).toBeInTheDocument();
	expect(screen.queryByTestId('root-content')).not.toBeInTheDocument();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1);
	});
	expect(screen.queryByTestId('root-pending')).not.toBeInTheDocument();
	expect(screen.getByTestId('root-content')).toBeInTheDocument();
});
