// Ported from TanStack/react-router tests/link-selector.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';
import { act, cleanup, render, waitFor } from '../../react-harness.js';
import { afterEach, expect, test, vi } from 'vitest';
import {
	Link,
	RouterContextProvider,
	RouterProvider,
	createHashHistory,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});
async function setup(trailingSlash: 'never' | 'preserve' = 'never') {
	const root = createRootRoute();
	const router = createRouter({
		routeTree: root.addChildren([
			createRoute({ getParentRoute: () => root, path: '/posts/$id' }),
		]),
		history: createMemoryHistory({ initialEntries: ['/posts/1'] }),
		trailingSlash,
	});
	await router.load();
	return router;
}
test('a fixed href follows active, inactive and active-again locations', async () => {
	const router = await setup();
	const view = render(
		() => <RouterContextProvider router={router}>
			<Link to="/posts/$id" params={{ id: '1' }} search={{ page: 1 }}>{'Post'}</Link>
		</RouterContextProvider>,
	);
	const link = view.getByText('Post');
	for (const [id, page, active] of [
		['1', 1, true],
		['2', 1, false],
		['1', 2, false],
		['1', 1, true],
	] as const) {
		await act(() => router.navigate({ to: '/posts/$id', params: { id }, search: { page } }));
		expect(link).toHaveAttribute('href', '/posts/1?page=1');
		expect(link.getAttribute('aria-current')).toBe(active ? 'page' : null);
	}
});
test('hash history refreshes a cached destination after the outer URL changes', async () => {
	const original = window.location.href;
	window.history.replaceState(null, '', '/shell?outer=one#/posts/1');
	const history = createHashHistory();
	const root = createRootRoute({
		component: () => <Link to="/posts/$id" params={{ id: '1' }} search={{}}>{'Post'}</Link>,
	});
	const router = createRouter({
		routeTree: root.addChildren([
			createRoute({ getParentRoute: () => root, path: '/posts/$id' }),
		]),
		history,
		trailingSlash: 'never',
	});
	try {
		const view = render(() => <RouterProvider router={router} />);
		const link = await view.findByText('Post');
		expect(link).toHaveAttribute('href', '/shell?outer=one#/posts/1');
		expect(link).toHaveAttribute('aria-current', 'page');
		act(() => {
			window.history.replaceState(null, '', '/other?outer=two#/posts/2');
		});
		await waitFor(() => {
			expect(link).toHaveAttribute('href', '/other?outer=two#/posts/1');
			expect(link).not.toHaveAttribute('aria-current');
		});
	} finally {
		cleanup();
		history.destroy();
		window.history.replaceState(null, '', original);
	}
});
test.each([false, true])('cached paths retain segment boundaries and basepaths (exact=%s)', async (
	exact,
) => {
	const router = await setup();
	router.update({ basepath: '/app', trailingSlash: 'preserve' });
	const view = render(
		() => <RouterContextProvider router={router}>
			<Link to="/posts/$id/" params={{ id: '1' }} activeOptions={{ exact }}>{'Post'}</Link>
		</RouterContextProvider>,
	);
	const link = view.getByText('Post');
	for (const [to, active] of [
		['/posts/1', true],
		['/posts/1/details', !exact],
		['/posts/10', false],
		['/posts/1/', true],
	] as const) {
		await act(() => router.navigate({ to }));
		expect(link).toHaveAttribute('href', '/app/posts/1/');
		expect(link.getAttribute('aria-current')).toBe(active ? 'page' : null);
	}
	router.update({ basepath: '/new' });
	await act(() => router.navigate({ to: '/posts/1/' }));
	expect(link).toHaveAttribute('href', '/new/posts/1/');
	expect(link).toHaveAttribute('aria-current', 'page');
});
