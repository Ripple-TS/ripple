// Ported from TanStack/react-router tests/on-rendered-same-href-state.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { act } from '../upstream/reactivity.js';
import { cleanup, render, screen, waitFor } from '../../react-harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import { createMemoryHistory } from '@tanstack/history';
import {
	Outlet,
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

const testCleanups: Array<() => void> = [];
afterEach(() => {
	while (testCleanups.length) {
		testCleanups.pop()!();
	}
	cleanup();
});
test('onRendered fires for a same-href navigation with a new history key', async () => {
	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <div>{'Index'}</div>,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Index')).toBeInTheDocument();
	await waitFor(() => {
		expect(router.state.status).toBe('idle');
		expect(router.state.resolvedLocation?.href).toBe('/');
	});
	const initialHistoryKey = router.state.resolvedLocation?.state.__TSR_key;
	expect(initialHistoryKey).toBeDefined();
	const onRendered = vi.fn();
	const unsubscribe = router.subscribe('onRendered', onRendered);
	testCleanups.push(unsubscribe);
	await act(
		() => router.navigate({
			to: '/',
			state: { sameHrefState: true } as any,
		}),
	);
	await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
	const event = onRendered.mock.calls[0]![0];
	expect(event.fromLocation?.state.sameHrefState).toBeUndefined();
	expect(event.toLocation.state.sameHrefState).toBe(true);
	expect(event.fromLocation?.href).toBe('/');
	expect(event.toLocation.href).toBe('/');
	expect(event.hrefChanged).toBe(false);
	expect(event.fromLocation?.state.__TSR_key).toBe(initialHistoryKey);
	expect(event.toLocation.state.__TSR_key).toBeDefined();
	expect(event.toLocation.state.__TSR_key).not.toBe(initialHistoryKey);
	expect(router.state.resolvedLocation?.state.__TSR_key).toBe(event.toLocation.state.__TSR_key);
});
