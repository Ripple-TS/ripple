// Ported from TanStack/react-router tests/issue-2905-root-beforeload-pending.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, render, screen } from '../../react-harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import {
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});
// https://github.com/TanStack/router/issues/2905
test('#2905: a root pendingComponent renders while root beforeLoad is pending', async () => {
	vi.useFakeTimers();
	const rootRoute = createRootRoute({
		beforeLoad: async () => {
			await new Promise((resolve) => setTimeout(resolve, 3000));
		},
		pendingComponent: () => <div data-testid="root-pending">{'Root pending'}</div>,
		component: () => <div data-testid="root-content">{'Root'}</div>,
	});
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
	await act(async () => {
		await vi.advanceTimersByTimeAsync(999);
	});
	expect(screen.queryByTestId('root-pending')).not.toBeInTheDocument();
	expect(screen.queryByTestId('root-content')).not.toBeInTheDocument();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1);
	});
	expect(screen.getByTestId('root-pending')).toBeInTheDocument();
	expect(screen.queryByTestId('root-content')).not.toBeInTheDocument();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1999);
	});
	expect(screen.getByTestId('root-pending')).toBeInTheDocument();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1);
	});
	expect(screen.queryByTestId('root-pending')).not.toBeInTheDocument();
	expect(screen.getByTestId('root-content')).toBeInTheDocument();
});
