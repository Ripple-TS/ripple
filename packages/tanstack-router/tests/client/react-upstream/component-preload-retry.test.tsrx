// Ported from TanStack/react-router tests/component-preload-retry.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '../../react-harness.js';
import { createControlledPromise } from '@tanstack/router-core';
import {
	Link,
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
	useRouter,
} from '@ripple-ts/tanstack-router';
import type { ErrorComponentProps } from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	sessionStorage.clear();
});
test('concurrent component preloads share the import', async () => {
	const componentImport = createControlledPromise<{
		default: () => null;
	}>();
	const importer = vi.fn(() => componentImport);
	const Page = lazyRouteComponent(importer);
	const first = Page.preload?.();
	const second = Page.preload?.();
	expect(importer).toHaveBeenCalledOnce();
	componentImport.resolve({ default: () => null });
	await Promise.all([first, second]);
});
test('renders after retrying a module download that failed during preload', async () => {
	const PageContent = () => <div>{'Page content'}</div>;
	const importer = vi.fn<
		() => Promise<{
			default: typeof PageContent;
		}>
	>().mockRejectedValueOnce(
		new TypeError('Failed to fetch dynamically imported module: /assets/page.js'),
	).mockResolvedValue({ default: PageContent });
	const Page = lazyRouteComponent(importer);
	await Page.preload?.();
	const rootRoute = createRootRoute();
	const pageRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/page',
		component: Page,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([pageRoute]),
		history: createMemoryHistory({ initialEntries: ['/page'] }),
	});
	render(() => <RouterProvider router={router} />);
	expect(await screen.findByText('Page content')).toBeInTheDocument();
	expect(importer).toHaveBeenCalledTimes(2);
});
