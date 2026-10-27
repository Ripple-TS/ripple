// Ported from TanStack/react-router tests/navigate.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { afterEach, describe, expect, it, test, vi } from 'vitest';
import { trailingSlashOptions } from '@tanstack/router-core';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

afterEach(() => {
	vi.clearAllMocks();
});
function createTestRouter(initialHistory?: RouterHistory) {
	const history = initialHistory ?? createMemoryHistory({ initialEntries: ['/'] });
	const rootRoute = createRootRoute({});
	const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
	const postsRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/posts',
	});
	const postIdRoute = createRoute({
		getParentRoute: () => postsRoute,
		path: '/$slug',
	});
	const projectRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/p',
	});
	const projectIdRoute = createRoute({
		getParentRoute: () => projectRoute,
		path: '/$projectId',
	});
	const projectVersionRoute = createRoute({
		getParentRoute: () => projectIdRoute,
		path: '/$version',
	});
	const projectFrameRoute = createRoute({
		getParentRoute: () => projectVersionRoute,
		path: '/$framework',
	});
	const uRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/u',
	});
	const uLayoutRoute = createRoute({
		id: '_layout',
		getParentRoute: () => uRoute,
	});
	const uUsernameRoute = createRoute({
		getParentRoute: () => uLayoutRoute,
		path: '$username',
	});
	const gRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/g',
	});
	const gLayoutRoute = createRoute({
		id: 'layout',
		getParentRoute: () => gRoute,
	});
	const gUsernameRoute = createRoute({
		getParentRoute: () => gLayoutRoute,
		path: '$username',
	});
	const searchRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'search',
		validateSearch: (search: Record<string, unknown>) => {
			return {
				['foo=bar']: Number(search['foo=bar'] ?? 1),
			};
		},
	});
	const projectTree = projectRoute.addChildren([
		projectIdRoute.addChildren([
			projectVersionRoute.addChildren([projectFrameRoute]),
		]),
	]);
	const uTree = uRoute.addChildren([uLayoutRoute.addChildren([uUsernameRoute])]);
	const gTree = gRoute.addChildren([gLayoutRoute.addChildren([gUsernameRoute])]);
	const routeTree = rootRoute.addChildren([
		indexRoute,
		postsRoute.addChildren([postIdRoute]),
		projectTree,
		uTree,
		gTree,
	]);
	const router = createRouter({ routeTree, history });
	return {
		router,
		routes: {
			indexRoute,
			postsRoute,
			postIdRoute,
			projectRoute,
			projectIdRoute,
			projectVersionRoute,
			projectFrameRoute,
		},
	};
}
function toNullObj<T>(obj: T): T {
	if (typeof obj === 'object') return Object.assign(Object.create(null), obj);
	return obj;
}
describe('relative navigation', () => {
	it('should navigate to a parent route with .. from unsafe relative path', async () => {
		const { router } = createTestRouter(
			createMemoryHistory({ initialEntries: ['/posts/tanner/child'] }),
		);
		await router.load();
		expect(router.state.location.pathname).toBe('/posts/tanner/child');
		await router.navigate({
			to: '..',
			unsafeRelative: 'path',
		});
		expect(router.state.location.pathname).toBe('/posts/tanner');
	});
});
