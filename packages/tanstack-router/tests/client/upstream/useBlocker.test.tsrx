// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '../../harness.js';

import {
	Block,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	useBlocker,
	useNavigate,
} from '@ripple-ts/tanstack-router';

afterEach(() => {
	window.history.replaceState(null, 'root', '/');
	cleanup();
});

describe('useBlocker', () => {
	test('does not block navigation when not enabled', async () => {
		const rootRoute = createRootRoute();

		const IndexComponent = () => {
			const navigate = useNavigate();

			useBlocker({ shouldBlockFn: () => false });

			return <>
				<h1>Index</h1>
				<button onClick={() => navigate({ to: '/' })}>Index</button>
				<button onClick={() => navigate({ to: '/posts' })}>Posts</button>
			</>;
		};

		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: IndexComponent,
		});

		const postsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts',
			component: () => {
				return <>
					<h1>Posts</h1>
				</>;
			},
		});

		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postsRoute]),
		});

		render(() => <RouterProvider router={router} />);

		const postsButton = await screen.findByRole('button', { name: 'Posts' });

		fireEvent.click(postsButton);

		expect(await screen.findByRole('heading', { name: 'Posts' })).toBeInTheDocument();

		expect(window.location.pathname).toBe('/posts');
	});

	test('does not block navigation when disabled', async () => {
		const rootRoute = createRootRoute();

		const IndexComponent = () => {
			const navigate = useNavigate();

			useBlocker({ shouldBlockFn: () => true, disabled: true });

			return <>
				<h1>Index</h1>
				<button onClick={() => navigate({ to: '/' })}>Index</button>
				<button onClick={() => navigate({ to: '/posts' })}>Posts</button>
			</>;
		};

		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: IndexComponent,
		});

		const postsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts',
			component: () => {
				return <>
					<h1>Posts</h1>
				</>;
			},
		});

		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postsRoute]),
		});

		render(() => <RouterProvider router={router} />);

		const postsButton = await screen.findByRole('button', { name: 'Posts' });

		fireEvent.click(postsButton);

		expect(await screen.findByRole('heading', { name: 'Posts' })).toBeInTheDocument();

		expect(window.location.pathname).toBe('/posts');
	});

	test('blocks navigation when enabled', async () => {
		const rootRoute = createRootRoute();

		const IndexComponent = () => {
			const navigate = useNavigate();

			useBlocker({ shouldBlockFn: () => true });

			return <>
				<h1>Index</h1>
				<button onClick={() => navigate({ to: '/' })}>Index</button>
				<button onClick={() => navigate({ to: '/posts' })}>Posts</button>
			</>;
		};

		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: IndexComponent,
		});

		const postsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts',
			component: () => {
				return <>
					<h1>Posts</h1>
				</>;
			},
		});

		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postsRoute]),
		});

		render(() => <RouterProvider router={router} />);

		const postsButton = await screen.findByRole('button', { name: 'Posts' });

		fireEvent.click(postsButton);

		expect(await screen.findByRole('heading', { name: 'Index' })).toBeInTheDocument();

		expect(window.location.pathname).toBe('/');
	});

	test('gives correct arguments to shouldBlockFn', async () => {
		const rootRoute = createRootRoute();

		const shouldBlockFn = vi.fn().mockReturnValue(true);

		const IndexComponent = () => {
			const navigate = useNavigate();

			useBlocker({ shouldBlockFn });

			return <>
				<h1>Index</h1>
				<button onClick={() => navigate({ to: '/' })}>Index</button>
				<button onClick={() => navigate({ to: '/posts', replace: true })}>
					Posts
				</button>
			</>;
		};

		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: IndexComponent,
		});

		const postsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts',
			component: () => {
				return <>
					<h1>Posts</h1>
				</>;
			},
		});

		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postsRoute]),
		});

		render(() => <RouterProvider router={router} />);

		const postsButton = await screen.findByRole('button', { name: 'Posts' });

		fireEvent.click(postsButton);

		expect(await screen.findByRole('heading', { name: 'Index' })).toBeInTheDocument();

		expect(window.location.pathname).toBe('/');

		expect(shouldBlockFn).toHaveBeenCalledWith({
			action: 'REPLACE',
			current: {
				routeId: indexRoute.id,
				fullPath: indexRoute.fullPath,
				pathname: '/',
				params: {},
				search: {},
			},
			next: {
				routeId: postsRoute.id,
				fullPath: postsRoute.fullPath,
				pathname: '/posts',
				params: {},
				search: {},
			},
		});
	});
});
