// Ported from TanStack/react-router tests/link.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import * as React from '../upstream/reactivity.js';

import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import {
	act,
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from '../../react-harness.js';
import { z } from 'zod';
import { trailingSlashOptions } from '@tanstack/router-core';
import {
	Link,
	Outlet,
	RouterContextProvider,
	RouterProvider,
	createBrowserHistory,
	createHashHistory,
	createLink,
	createMemoryHistory,
	createRootRoute,
	createRootRouteWithContext,
	createRoute,
	createRouteMask,
	createRouter,
	getRouteApi,
	notFound,
	redirect,
	retainSearchParams,
	stripSearchParams,
	useLinkProps,
	useLoaderData,
	useMatchRoute,
	useParams,
	useRouteContext,
	useRouterState,
	useSearch,
} from '@ripple-ts/tanstack-router';

import { getIntersectionObserverMock, getSearchParamsFromURI, sleep } from '../upstream/utils.ts';
import type { RouterHistory } from '@ripple-ts/tanstack-router';

const ioObserveMock = vi.fn();
const ioDisconnectMock = vi.fn();
let ioCallback: IntersectionObserverCallback;
let history: RouterHistory;
beforeEach(() => {
	const io = getIntersectionObserverMock({
		observe: ioObserveMock,
		disconnect: ioDisconnectMock,
		onCreate: (callback) => {
			ioCallback = callback;
		},
	});
	vi.stubGlobal('IntersectionObserver', io);
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	vi.useRealTimers();
	history.destroy();
	window.history.replaceState(null, 'root', '/');
	vi.resetAllMocks();
	cleanup();
});
const WAIT_TIME = 300;
describe('Link', () => {
	describe('active and href updates', () => {
		const createControlledPromise = () => {
			let resolve!: () => void;
			const promise = new Promise<void>((r) => {
				resolve = r;
			});
			return { promise, resolve };
		};
		test('relative links from root keep javascript-like segments rooted', async () => {
			const rootRoute = createRootRoute();
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: () => <Link to="../javascript:alert(1)">{'Continue'}</Link>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([indexRoute]),
				history: createMemoryHistory({ initialEntries: ['/'] }),
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByRole('link', { name: 'Continue' })).toHaveAttribute(
				'href',
				'/javascript:alert(1)',
			);
		});
	});
	test('404 thrown in child will bubble up to the root with beforeLoad', async () => {
		const rootRoute = createRootRoute({
			notFoundComponent: () => <div>{'Root notFoundComponent'}</div>,
			beforeLoad: () => ({ ok: true }),
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => {
				return <>
					<h1>{'Index'}</h1>
					<Link to="/nonExistingPost">{'Non existing post'}</Link>
				</>;
			},
		});
		const postRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '$postId',
			params: {
				parse: (p) => {
					if (p.postId === 'nonExistingPost') {
						throw new Error('Post not exists');
					}
					return {
						postId: p.postId,
					};
				},
				stringify: (p) => ({ postId: p.postId }),
			},
			onError: () => {
				throw notFound();
			},
			component: () => <div>{'Existing Post'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postRoute]),
		});
		render(() => <RouterProvider router={router} />);
		const postsLink = await screen.findByRole('link', {
			name: 'Non existing post',
		});
		await act(() => fireEvent.click(postsLink));
		const errorText = await screen.findByText('Root notFoundComponent');
		expect(errorText).toBeInTheDocument();
	});
	test('404 thrown in child will bubble up to the root with async loader', async () => {
		const rootRoute = createRootRoute({
			notFoundComponent: () => <div>{'Root notFoundComponent'}</div>,
			loader: async () => {
				await sleep(0);
				return { ok: true };
			},
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => {
				return <>
					<h1>{'Index'}</h1>
					<Link to="/nonExistingPost">{'Non existing post'}</Link>
				</>;
			},
		});
		const postRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '$postId',
			params: {
				parse: (p) => {
					if (p.postId === 'nonExistingPost') {
						throw new Error('Post not exists');
					}
					return {
						postId: p.postId,
					};
				},
				stringify: (p) => ({ postId: p.postId }),
			},
			onError: () => {
				throw notFound();
			},
			component: () => <div>{'Existing Post'}</div>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, postRoute]),
		});
		render(() => <RouterProvider router={router} />);
		const postsLink = await screen.findByRole('link', {
			name: 'Non existing post',
		});
		await act(() => fireEvent.click(postsLink));
		const errorText = await screen.findByText('Root notFoundComponent');
		expect(errorText).toBeInTheDocument();
	});
	test(
		'Link.preload="viewport" should cancel and use new link options after they change',
		async () => {
			const rootRoute = createRootRoute();
			const RouteComponent = () => {
				const [to, setTo] = React.useState<'/about' | '/other'>('/about');
				const [preload, setPreload] = React.useState<'viewport' | 'intent' | false>('viewport');
				return <>
					<button
						onClick={() => setTo((current) => (current === '/about' ? '/other' : '/about'))}
					>{'Change destination'}</button>
					<button onClick={() => setPreload('intent')}>{'Use intent'}</button>
					<button onClick={() => setPreload(false)}>{'Disable preload'}</button>
					<Link
						to={track(() => to.value)}
						preload={track(() => preload.value)}
						preloadDelay={50}
					>{'Viewport Link'}</Link>
				</>;
			};
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: RouteComponent,
			});
			const aboutRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/about',
			});
			const otherRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/other',
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([indexRoute, aboutRoute, otherRoute]),
				history,
			});
			const preloadRouteSpy = vi.spyOn(router, 'preloadRoute');
			render(() => <RouterProvider router={router} />);
			const viewportLink = await screen.findByRole('link', {
				name: 'Viewport Link',
			});
			const initialIoCallback = ioCallback;
			vi.useFakeTimers();
			ioCallback(
				[
					{
						isIntersecting: true,
						target: viewportLink,
					} as unknown as IntersectionObserverEntry,
				],
				{} as IntersectionObserver,
			);
			fireEvent.click(screen.getByRole('button', { name: 'Change destination' }));
			expect(viewportLink).toHaveAttribute('href', '/other');
			expect(ioCallback).not.toBe(initialIoCallback);
			ioCallback(
				[
					{
						isIntersecting: false,
						target: viewportLink,
					} as unknown as IntersectionObserverEntry,
				],
				{} as IntersectionObserver,
			);
			await vi.advanceTimersByTimeAsync(50);
			expect(preloadRouteSpy).not.toHaveBeenCalled();
			ioCallback(
				[
					{
						isIntersecting: true,
						target: viewportLink,
					} as unknown as IntersectionObserverEntry,
				],
				{} as IntersectionObserver,
			);
			fireEvent.click(screen.getByRole('button', { name: 'Change destination' }));
			expect(viewportLink).toHaveAttribute('href', '/about');
			ioCallback(
				[
					{
						isIntersecting: true,
						target: viewportLink,
					} as unknown as IntersectionObserverEntry,
				],
				{} as IntersectionObserver,
			);
			await vi.advanceTimersByTimeAsync(50);
			expect(preloadRouteSpy).toHaveBeenCalledTimes(1);
			expect(preloadRouteSpy).toHaveBeenCalledWith(expect.objectContaining({ to: '/about' }));
			preloadRouteSpy.mockClear();
			fireEvent.click(screen.getByRole('button', { name: 'Use intent' }));
			fireEvent.mouseEnter(viewportLink);
			fireEvent.click(screen.getByRole('button', { name: 'Disable preload' }));
			fireEvent.mouseLeave(viewportLink);
			await vi.advanceTimersByTimeAsync(50);
			expect(preloadRouteSpy).not.toHaveBeenCalled();
			// An effect with preloading disabled owns no resources. Re-enabling it
			// must still install cancellation for a newly scheduled intent timer.
			fireEvent.click(screen.getByRole('button', { name: 'Use intent' }));
			fireEvent.mouseEnter(viewportLink);
			await vi.advanceTimersByTimeAsync(49);
			expect(preloadRouteSpy).not.toHaveBeenCalled();
			fireEvent.click(screen.getByRole('button', { name: 'Disable preload' }));
			await vi.advanceTimersByTimeAsync(1);
			expect(preloadRouteSpy).not.toHaveBeenCalled();
			fireEvent.click(screen.getByRole('button', { name: 'Use intent' }));
			fireEvent.mouseEnter(viewportLink);
			await vi.advanceTimersByTimeAsync(50);
			expect(preloadRouteSpy).toHaveBeenCalledTimes(1);
			preloadRouteSpy.mockClear();
			fireEvent.click(screen.getByRole('button', { name: 'Disable preload' }));
			initialIoCallback(
				[
					{
						isIntersecting: true,
						target: viewportLink,
					} as unknown as IntersectionObserverEntry,
				],
				{} as IntersectionObserver,
			);
			await vi.advanceTimersByTimeAsync(50);
			expect(preloadRouteSpy).not.toHaveBeenCalled();
		},
	);
});
describe('protocolAllowlist', () => {
	const rootRoute = createRootRoute();
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
		component: () => <>
			<Link data-testid="custom-protocol-link" to="x-safari-https://example.com" />
			<Link
				data-testid="intent-protocol-link"
				to="intent://example.com#Intent;scheme=https;end"
				reloadDocument
			/>
		</>,
	});
	let consoleWarn = vi.fn();
	beforeEach(() => {
		consoleWarn = vi.fn();
		vi.spyOn(console, 'warn').mockImplementation(consoleWarn);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});
	it('should work like normal links when protocolAllowlist is set', async () => {
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history,
			protocolAllowlist: ['x-safari-https:', 'intent:'],
		});
		render(() => <RouterProvider router={router} />);
		const links = await screen.findAllByRole('link');
		expect(links[0]).toHaveAttribute('href', 'x-safari-https://example.com');
		expect(links[1]).toHaveAttribute('href', 'intent://example.com#Intent;scheme=https;end');
		expect(consoleWarn).not.toHaveBeenCalled();
	});
	it('should block links when protocol is not in allowlist', async () => {
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history,
			protocolAllowlist: [],
		});
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByTestId('custom-protocol-link')).not.toHaveAttribute('href');
		expect(screen.getByTestId('intent-protocol-link')).not.toHaveAttribute('href');
		expect(consoleWarn).toHaveBeenCalledWith(
			'Blocked Link with dangerous protocol: x-safari-https://example.com',
		);
		expect(consoleWarn).toHaveBeenCalledWith(
			'Blocked Link with dangerous protocol: intent://example.com#Intent;scheme=https;end',
		);
	});
});
describe('masked and custom history hrefs', () => {
	test.each([false, true])('updates a mounted link across destination types (rewrite: %s)', async (
		rewrite,
	) => {
		const nextLoader = vi.fn(() => 'next page');
		const rootRoute = createRootRoute({
			component: function ChangingDestination() {
				const [phase, setPhase] = React.useState(0);
				const to = track(
					() => phase.value === 0
						? '/target'
						: phase.value === 3 || rewrite
							? '/next'
							: phase.value === 1
								? 'https://other.example/next'
								: 'javascript:alert(1)',
				);
				return <>
					<button onClick={() => setPhase((p) => p + 1)}>{'Change destination'}</button>
					<Link
						data-testid="changing-link"
						to={to}
						hash={track(
							() => rewrite && phase.value === 1
								? 'external'
								: rewrite && phase.value === 2
									? 'blocked'
									: undefined,
						)}
						preload="intent"
						preloadDelay={0}
						render={({ isActive }) => String(isActive)}
					/>
					<Outlet />
				</>;
			},
		});
		const targetRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/target',
			component: () => <p>{'target page'}</p>,
		});
		const nextRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/next',
			loader: nextLoader,
			component: () => <p>{'next page'}</p>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([targetRoute, nextRoute]),
			history: createMemoryHistory({ initialEntries: ['/target'] }),
			rewrite: rewrite
				? {
						output: ({ url }) => url.hash === '#external'
							? new URL('https://other.example/next')
							: url.hash === '#blocked'
								? new URL('javascript:alert(1)')
								: url,
					}
				: undefined,
		});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(() => <RouterProvider router={router} />);
		const link = await screen.findByTestId('changing-link');
		expect(link).toHaveTextContent('true');
		expect(link).toHaveAttribute('aria-current', 'page');
		const clickWasIntercepted = () => {
			let intercepted = false;
			// Observe the router's handling, then cancel native document navigation.
			document.addEventListener('click', (event) => {
				intercepted = event.defaultPrevented;
				event.preventDefault();
			}, { once: true });
			fireEvent.click(link);
			return intercepted;
		};
		for (const href of ['https://other.example/next', null]) {
			fireEvent.click(screen.getByText('Change destination'));
			await waitFor(() => expect(link.getAttribute('href')).toBe(href));
			expect(link).toHaveTextContent('false');
			expect(link).not.toHaveAttribute('aria-current');
			expect(clickWasIntercepted()).toBe(href === null);
			fireEvent.mouseOver(link);
			await act(() => sleep(10));
			expect(nextLoader).not.toHaveBeenCalled();
			expect(screen.getByText('target page')).toBeInTheDocument();
			fireEvent.mouseLeave(link);
		}
		fireEvent.click(screen.getByText('Change destination'));
		await waitFor(() => expect(link).toHaveAttribute('href', '/next'));
		fireEvent.mouseOver(link);
		await waitFor(() => expect(nextLoader).toHaveBeenCalledTimes(1));
		expect(clickWasIntercepted()).toBe(true);
		expect(await screen.findByText('next page')).toBeInTheDocument();
		await waitFor(() => expect(link).toHaveTextContent('true'));
		expect(link).toHaveAttribute('aria-current', 'page');
	});
	test('renders every internal Link on the router origin', async () => {
		const inputs = [
			'//evil.example',
			'/\\evil.example',
			'\\/evil.example',
			' \t/\\evil.example',
		];
		const rootRoute = createRootRoute();
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <>
				{inputs.map((to, index) => <Link key={to} data-testid={`unsafe-link-${index}`} to={to} />)}
			</>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history,
		});
		render(() => <RouterProvider router={router} />);
		for (let index = 0; index < inputs.length; index++) {
			const link = await screen.findByTestId(`unsafe-link-${index}`);
			const href = link.getAttribute('href');
			expect(href).not.toBeNull();
			expect(new URL(href!, window.location.href).origin).toBe(window.location.origin);
		}
	});
	test('does not intercept an external href produced by custom history', async () => {
		const customHistory = createBrowserHistory({
			createHref: () => 'https://other.example/path',
		});
		const rootRoute = createRootRoute();
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <Link data-testid="custom-history-link" to="/safe" />,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute]),
			history: customHistory,
		});
		render(() => <RouterProvider router={router} />);
		const link = await screen.findByTestId('custom-history-link');
		expect(link).toHaveAttribute('href', 'https://other.example/path');
		expect(fireEvent.click(link)).toBe(true);
		customHistory.destroy();
	});
	test('blocked links stay inactive and cannot regain an href', async () => {
		const rootRoute = createRootRoute();
		const safeRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/safe',
			component: () => <Link
				data-testid="rewritten-link"
				to="/safe"
				hash="blocked"
				activeProps={{ 'data-active': 'true' }}
				inactiveProps={{
					href: 'javascript:inactive()',
					'data-inactive': 'true',
				} as unknown as {
					'data-inactive': string;
				}}
			/>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([safeRoute]),
			history: createMemoryHistory({ initialEntries: ['/safe'] }),
			rewrite: {
				output: ({ url }) => url.hash === '#blocked' ? new URL('javascript:alert(1)') : url,
			},
		});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(() => <RouterProvider router={router} />);
		const link = await screen.findByTestId('rewritten-link');
		expect(link).not.toHaveAttribute('href');
		expect(link).not.toHaveAttribute('aria-current');
		expect(link).not.toHaveAttribute('data-active');
		expect(link).toHaveAttribute('data-inactive', 'true');
		expect(fireEvent.click(link)).toBe(false);
	});
});
describe('explicit-undefined params are not collapsed into an empty object', () => {
	// `params: { category: undefined }` clears an inherited optional param while
	// `params: {}` inherits it, so the two build different locations. The link
	// options are stabilised by value, and that comparison must not treat them as
	// equal or the link keeps publishing the stale href.
	it('updates href when params goes from {} to { category: undefined }', async () => {
		function CategoryLink({ params }: { params: Record<string, string | undefined> }) {
			return <Link to="/posts/{-$category}" params={params} data-testid="lnk">{'link'}</Link>;
		}
		const rootRoute = createRootRoute({ component: () => <Outlet /> });
		const postsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/posts/{-$category}',
			component: function Posts() {
				const [params, setParams] = React.useState<Record<string, string | undefined>>({});
				return <>
					<button
						data-testid="clear"
						onClick={() => setParams({ category: undefined })}
					>{'clear'}</button>
					<CategoryLink params={track(() => params.value)} />
				</>;
			},
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([postsRoute]),
			history: createMemoryHistory({ initialEntries: ['/posts/tech'] }),
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => expect(screen.getByTestId('lnk')).toHaveAttribute('href', '/posts/tech'));
		fireEvent.click(screen.getByTestId('clear'));
		await waitFor(() => expect(screen.getByTestId('lnk')).toHaveAttribute('href', '/posts'));
	});
});
