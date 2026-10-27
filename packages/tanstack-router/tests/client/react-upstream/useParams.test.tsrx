// Ported from TanStack/react-router tests/useParams.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '../../react-harness.js';
import {
	Link,
	Outlet,
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
	useParams,
} from '@ripple-ts/tanstack-router';

test('useParams({ strict: false }) returns parsed params after child navigation', async () => {
	const rootRoute = createRootRoute();
	const parentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'parent',
		component: ParentComponent,
	});
	const versionRoute = createRoute({
		getParentRoute: () => parentRoute,
		path: '$version',
		params: {
			parse: (params) => ({
				...params,
				version: parseInt(params.version),
			}),
			stringify: (params) => ({
				...params,
				version: `${params.version}`,
			}),
		},
		component: VersionComponent,
	});
	function ParentComponent() {
		const reactiveReader0 = useParams({ strict: false });
		return <div>
			<div data-testid="version-type">
				{typeof reactiveReader0.value.version}
			</div>
			<div data-testid="version-value">{String(reactiveReader0.value.version)}</div>
			<Link
				data-testid="version-2-link"
				to={versionRoute.fullPath}
				params={{ version: 2 }}
			>{'Version 2'}</Link>
			<Outlet />
		</div>;
	}
	function VersionComponent() {
		return <div data-testid="version-route">{'Version Route'}</div>;
	}
	window.history.replaceState({}, '', '/parent/1');
	const router = createRouter({
		routeTree: rootRoute.addChildren([parentRoute.addChildren([versionRoute])]),
	});
	render(() => <RouterProvider router={router} />);
	await act(() => router.load());
	expect(await screen.findByTestId('version-type')).toHaveTextContent('number');
	expect(await screen.findByTestId('version-value')).toHaveTextContent('1');
	const version2Link = await screen.findByTestId('version-2-link');
	await act(() => fireEvent.click(version2Link));
	await vi.waitFor(() => expect(router.state.status).toBe('idle'));
	expect(await screen.findByTestId('version-route')).toBeInTheDocument();
	expect(await screen.findByTestId('version-type')).toHaveTextContent('number');
	expect(await screen.findByTestId('version-value')).toHaveTextContent('2');
});
