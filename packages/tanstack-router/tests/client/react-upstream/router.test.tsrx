// Ported from TanStack/react-router tests/router.test.tsx
// Baseline: da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { track } from 'ripple';
import { act, useEffect, useRef } from '../upstream/reactivity.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '../../react-harness.js';
import { z } from 'zod';
import { composeRewrites, createControlledPromise, notFound } from '@tanstack/router-core';
import {
	Link,
	Outlet,
	RouterProvider,
	SearchParamError,
	createBrowserHistory,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	useNavigate,
} from '@ripple-ts/tanstack-router';
import type { StandardSchemaValidator } from '@tanstack/router-core';
import type {
	AnyRoute,
	AnyRouter,
	MakeRemountDepsOptionsUnion,
	RouterHistory,
	RouterOptions,
	ValidatorFn,
	ValidatorObj,
} from '@ripple-ts/tanstack-router';

let history: RouterHistory;
beforeEach(() => {
	history = createBrowserHistory();
	expect(window.location.pathname).toBe('/');
});
afterEach(() => {
	history.destroy();
	window.history.replaceState(null, 'root', '/');
	vi.clearAllMocks();
	vi.resetAllMocks();
	cleanup();
});
const mockFn1 = vi.fn();
const URISyntaxCharacters = [
	[';', '%3B'],
	[',', '%2C'],
	['/', '%2F'],
	['?', '%3F'],
	[':', '%3A'],
	['@', '%40'],
	['&', '%26'],
	['=', '%3D'],
	['+', '%2B'],
	['$', '%24'],
	['#', '%23'],
	['\\', '%5C'],
	['%', '%25'],
] as const;
export function validateSearchParams<TExpected extends Partial<Record<string, string>>>(
	expected: TExpected,
	router: AnyRouter,
) {
	const parsedSearch = new URLSearchParams(window.location.search);
	expect(parsedSearch.size).toBe(Object.keys(expected).length);
	for (const [key, value] of Object.entries(expected)) {
		expect(parsedSearch.get(key)).toBe(value);
	}
	expect(router.state.location.search).toEqual(expected);
}
function createTestRouter(
	options: RouterOptions<AnyRoute, 'never', any, any, any> & Required<
		Pick<RouterOptions<AnyRoute, 'never'>, 'history'>
	>,
) {
	const rootRoute = createRootRoute({
		validateSearch: z.object({ root: z.string().optional() }),
		component: () => {
			const search = rootRoute.useSearch();
			return <>
				<div data-testid="search-root">{search.value.root ?? '$undefined'}</div>
				<Outlet />
			</>;
		},
	});
	const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
	const usersRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/users',
	});
	const userRoute = createRoute({
		getParentRoute: () => usersRoute,
		path: '/$userId',
	});
	const userFilesRoute = createRoute({
		getParentRoute: () => userRoute,
		path: '/files/$fileId',
	});
	const postsRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/posts',
	});
	const postIdRoute = createRoute({
		getParentRoute: () => postsRoute,
		path: '/$slug',
	});
	const topLevelSplatRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '$',
	});
	// This is simulates a user creating a `é.tsx` file using file-based routing
	const pathSegmentEAccentRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/path-segment/é',
	});
	// This is simulates a user creating a `🚀.tsx` file using file-based routing
	const pathSegmentRocketEmojiRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/path-segment/🚀',
	});
	const pathSegmentSoloSplatRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/solo-splat/$',
	});
	const pathSegmentLayoutSplatRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/layout-splat',
	});
	const pathSegmentLayoutSplatIndexRoute = createRoute({
		getParentRoute: () => pathSegmentLayoutSplatRoute,
		path: '/',
	});
	const pathSegmentLayoutSplatSplatRoute = createRoute({
		getParentRoute: () => pathSegmentLayoutSplatRoute,
		path: '$',
	});
	const protectedRoute = createRoute({
		getParentRoute: () => rootRoute,
		id: '/_protected',
	}).lazy(() => import('../upstream/lazy/normal.tsrx').then((f) => f.Route('/_protected')));
	const protectedLayoutRoute = createRoute({
		getParentRoute: () => protectedRoute,
		id: '/_layout',
	}).lazy(() => import('../upstream/lazy/normal.tsrx').then((f) => f.Route('/_protected/_layout')));
	const protectedFileBasedLayoutRoute = createRoute({
		getParentRoute: () => protectedRoute,
		id: '/_fileBasedLayout',
	}).lazy(
		() => import('../upstream/lazy/normal.tsrx').then(
			(f) => f.FileRoute('/_protected/_fileBasedLayout'),
		),
	);
	const protectedFileBasedLayoutParentRoute = createRoute({
		getParentRoute: () => protectedFileBasedLayoutRoute,
		path: '/fileBasedParent',
	}).lazy(
		() => import('../upstream/lazy/normal.tsrx').then(
			(f) => f.FileRoute('/_protected/_fileBasedLayout/fileBasedParent'),
		),
	);
	const protectedLayoutParentRoute = createRoute({
		getParentRoute: () => protectedLayoutRoute,
		path: '/parent',
	}).lazy(
		() => import('../upstream/lazy/normal.tsrx').then((f) => f.Route('/_protected/_layout/parent')),
	);
	const protectedLayoutParentChildRoute = createRoute({
		getParentRoute: () => protectedLayoutParentRoute,
		path: '/child',
	}).lazy(
		() => import('../upstream/lazy/normal.tsrx').then(
			(f) => f.Route('/_protected/_layout/parent/child'),
		),
	);
	const protectedFileBasedLayoutParentChildRoute = createRoute({
		getParentRoute: () => protectedFileBasedLayoutParentRoute,
		path: '/child',
	}).lazy(
		() => import('../upstream/lazy/normal.tsrx').then(
			(f) => f.FileRoute('/_protected/_fileBasedLayout/fileBasedParent/child'),
		),
	);
	const searchRoute = createRoute({
		validateSearch: z.object({ search: z.string().optional() }),
		getParentRoute: () => rootRoute,
		path: 'search',
		component: () => {
			const search = searchRoute.useSearch();
			return <><div data-testid="search-search">{search.value.search ?? '$undefined'}</div></>;
		},
	});
	const searchWithDefaultRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: 'searchWithDefault',
	});
	const searchWithDefaultIndexRoute = createRoute({
		getParentRoute: () => searchWithDefaultRoute,
		path: '/',
		component: () => {
			return <>
				<Link
					data-testid="link-without-params"
					to="/searchWithDefault/check"
					search={{ default: 'd1' }}
				>{'without params'}</Link>
				<Link
					data-testid="link-with-optional-param"
					to="/searchWithDefault/check"
					search={{ optional: 'o1' }}
				>{'with optional param'}</Link>
				<Link
					data-testid="link-with-default-param"
					to="/searchWithDefault/check"
					search={{ default: 'd2' }}
				>{'with default param'}</Link>
				<Link
					data-testid="link-with-both-params"
					to="/searchWithDefault/check"
					search={{ optional: 'o1', default: 'd2' }}
				>{'with both params'}</Link>
			</>;
		},
	});
	const searchWithDefaultCheckRoute = createRoute({
		validateSearch: z.object({
			default: z.string().default('d1'),
			optional: z.string().optional(),
		}),
		getParentRoute: () => searchWithDefaultRoute,
		path: 'check',
		component: () => {
			const search = searchWithDefaultCheckRoute.useSearch();
			return <>
				<div data-testid="search-default">{search.value.default}</div>
				<div data-testid="search-optional">{search.value.optional ?? '$undefined'}</div>
			</>;
		},
	});
	const nestedSearchRoute = createRoute({
		getParentRoute: () => rootRoute,
		validateSearch: z.object({ foo: z.string() }),
		path: 'nested-search',
	});
	const nestedSearchChildRoute = createRoute({
		getParentRoute: () => nestedSearchRoute,
		validateSearch: z.object({ bar: z.string() }),
		path: 'child',
	});
	const linksToItselfRoute = createRoute({
		validateSearch: z.object({ search: z.string().optional() }),
		getParentRoute: () => rootRoute,
		path: 'linksToItself',
		component: () => {
			return <><Link to="/linksToItself" data-testid="link">{'Click me'}</Link></>;
		},
	});
	const routeTree = rootRoute.addChildren([
		indexRoute,
		usersRoute.addChildren([userRoute.addChildren([userFilesRoute])]),
		postsRoute.addChildren([postIdRoute]),
		pathSegmentEAccentRoute,
		pathSegmentRocketEmojiRoute,
		pathSegmentSoloSplatRoute,
		topLevelSplatRoute,
		pathSegmentLayoutSplatRoute.addChildren([
			pathSegmentLayoutSplatIndexRoute,
			pathSegmentLayoutSplatSplatRoute,
		]),
		protectedRoute.addChildren([
			protectedLayoutRoute.addChildren([
				protectedLayoutParentRoute.addChildren([
					protectedLayoutParentChildRoute,
				]),
			]),
			protectedFileBasedLayoutRoute.addChildren([
				protectedFileBasedLayoutParentRoute.addChildren([
					protectedFileBasedLayoutParentChildRoute,
				]),
			]),
		]),
		searchRoute,
		searchWithDefaultRoute.addChildren([
			searchWithDefaultIndexRoute,
			searchWithDefaultCheckRoute,
		]),
		nestedSearchRoute.addChildren([nestedSearchChildRoute]),
		linksToItselfRoute,
	]);
	const router = createRouter({ routeTree, ...options });
	return {
		router,
		routes: {
			indexRoute,
			postsRoute,
			postIdRoute,
			topLevelSplatRoute,
			pathSegmentEAccentRoute,
			pathSegmentRocketEmojiRoute,
		},
	};
}
describe('encoding: path params', () => {
	it('no decoding/encoding of path, url and href required', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
		});
		await act(() => router.load());
		expect(router.state.location.href.endsWith('/posts/tanner')).toBe(true);
		expect(router.state.location.href).toBe('/posts/tanner');
		expect(router.state.location.pathname).toBe('/posts/tanner');
	});
	it('should encode the url and href with unicode param', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/posts/🚀'] }),
		});
		await act(() => router.load());
		expect(router.state.location.href.endsWith('/posts/%F0%9F%9A%80')).toBe(true);
		expect(router.state.location.href).toBe('/posts/%F0%9F%9A%80');
		expect(router.state.location.pathname).toBe('/posts/🚀');
	});
	// the param that is passed in should be the param that is returned
	it('should treat encoded params as decoded value when encoded params is specified', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		await act(() => router.load());
		await act(
			() => router.navigate({
				to: '/posts/$slug',
				params: { slug: '100%25' },
			}),
		);
		expect(router.state.location.href.endsWith('/posts/100%2525')).toBe(true);
		expect(router.state.location.href).toBe('/posts/100%2525');
		expect(router.state.location.pathname).toBe('/posts/100%2525');
	});
	describe('pathname and URI syntax characters', () => {
		it.each(URISyntaxCharacters)('pathname should encode $0', async (character, encodedValue) => {
			const { router } = createTestRouter({
				history: createMemoryHistory({
					initialEntries: [`/`],
				}),
			});
			await act(() => router.load());
			await act(
				() => router.navigate({
					to: '/posts/$slug',
					params: { slug: `${character}jane%` },
				}),
			);
			expect(router.state.location.href.endsWith(`/posts/${encodedValue}jane%25`)).toBe(true);
			expect(router.state.location.href).toBe(`/posts/${encodedValue}jane%25`);
			expect(router.state.location.pathname).toBe(`/posts/${encodedValue}jane%25`);
		});
		it.each(
			URISyntaxCharacters.filter((c) => {
				const character = c[0];
				const strictlyNotAllowedCharacters = ['/', '?', '\\', '%', '#'];
				return !strictlyNotAllowedCharacters.includes(character);
			}),
		)('pathname should not encode $0 when allowed', async (character, _) => {
			const { router } = createTestRouter({
				history: createMemoryHistory({
					initialEntries: [`/`],
				}),
				pathParamsAllowedCharacters: [character] as any,
			});
			await act(() => router.load());
			await act(
				() => router.navigate({
					to: '/posts/$slug',
					params: { slug: `${character}jane%` },
				}),
			);
			expect(router.state.location.href.endsWith(`/posts/${character}jane%25`)).toBe(true);
			expect(router.state.location.href).toBe(`/posts/${character}jane%25`);
			expect(router.state.location.pathname).toBe(`/posts/${character}jane%25`);
		});
	});
	it('pathname should decode encoded unicode param', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/posts/%F0%9F%9A%80'] }),
		});
		await act(() => router.load());
		expect(router.state.location.href.endsWith('/posts/%F0%9F%9A%80')).toBe(true);
		expect(router.state.location.href).toBe('/posts/%F0%9F%9A%80');
		expect(router.state.location.pathname).toBe('/posts/🚀');
	});
	it('pathname params should decode combination of encoded characters', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({
				initialEntries: [
					'/posts/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
				],
			}),
		});
		await act(() => router.load());
		expect(
			router.state.location.href.endsWith(
				'/posts/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
			),
		).toBe(true);
		expect(router.state.location.href).toBe(
			'/posts/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
		);
		expect(router.state.location.pathname).toBe(
			'/posts/framework%2Freact%2Fguide%2Ffile-based-routing tanstack',
		);
	});
	it('path params no encoding/decoding required', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
		});
		await act(() => router.load());
		const match = router.state.matches.find((r) => r.routeId === routes.postIdRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any).slug).toBe('tanner');
	});
	it('path params should keep unicode characters', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/posts/🚀'] }),
		});
		await act(() => router.load());
		const match = router.state.matches.find((r) => r.routeId === routes.postIdRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any).slug).toBe('🚀');
	});
	it('path params should decode encoded unicode characters', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/posts/%F0%9F%9A%80'] }),
		});
		await act(() => router.load());
		const match = router.state.matches.find((r) => r.routeId === routes.postIdRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any).slug).toBe('🚀');
	});
	// the param that is passed in should be the param that is returned
	it('path params should not decode encoded characters when passed as param', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		await act(() => router.load());
		await act(() => router.navigate({ to: '/posts/$slug', params: { slug: '100%25' } }));
		const match = router.state.matches.find((r) => r.routeId === routes.postIdRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any).slug).toBe('100%25');
	});
	describe('path params should decode encoded URI syntax characters', () => {
		it.each(URISyntaxCharacters)('$1 => $0 - should be decoded', async (
			character,
			encodedValue,
		) => {
			const { router, routes } = createTestRouter({
				history: createMemoryHistory({
					initialEntries: [`/posts/100${encodedValue}100`],
				}),
			});
			await act(() => router.load());
			const match = router.state.matches.find((r) => r.routeId === routes.postIdRoute.id);
			if (!match) {
				throw new Error('No match found');
			}
			expect((match.params as unknown as any).slug).toBe(`100${character}100`);
		});
	});
	it('path params should decode combination of encoded characters', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({
				initialEntries: [
					'/posts/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
				],
			}),
		});
		await act(() => router.load());
		const match = router.state.matches.find((r) => r.routeId === routes.postIdRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any).slug).toBe(
			'framework/react/guide/file-based-routing tanstack',
		);
	});
});
describe('encoding/decoding: wildcard routes/params', () => {
	it('no decoding/encoding of path, url and href required', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/tanner'] }),
		});
		await router.load();
		expect(router.state.location.href.endsWith('/tanner')).toBe(true);
		expect(router.state.location.href).toBe('/tanner');
		expect(router.state.location.pathname).toBe('/tanner');
	});
	it('should encode the url and href with unicode param', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/🚀'] }),
		});
		await router.load();
		expect(router.state.location.href.endsWith('/%F0%9F%9A%80')).toBe(true);
		expect(router.state.location.href).toBe('/%F0%9F%9A%80');
		expect(router.state.location.pathname).toBe('/🚀');
	});
	describe('pathname and URI syntax characters', () => {
		it.each(URISyntaxCharacters)('$1 should not be decoded for pathname', async (
			character,
			encodedValue,
		) => {
			const { router } = createTestRouter({
				history: createMemoryHistory({
					initialEntries: [`/100${encodedValue}100`],
				}),
			});
			await router.load();
			expect(router.state.location.href.endsWith(`/100${encodedValue}100`)).toBe(true);
			expect(router.state.location.href).toBe(`/100${encodedValue}100`);
			expect(router.state.location.pathname).toBe(`/100${encodedValue}100`);
		});
	});
	it('pathname should decode encoded unicode path', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/%F0%9F%9A%80'] }),
		});
		await router.load();
		expect(router.state.location.href.endsWith('/%F0%9F%9A%80')).toBe(true);
		expect(router.state.location.href).toBe('/%F0%9F%9A%80');
		expect(router.state.location.pathname).toBe('/🚀');
	});
	it('decode only non URI syntax characters in path', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({
				initialEntries: [
					'/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
				],
			}),
		});
		await router.load();
		expect(
			router.state.location.href.endsWith(
				'/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
			),
		).toBe(true);
		expect(router.state.location.href).toBe(
			'/framework%2Freact%2Fguide%2Ffile-based-routing%20tanstack',
		);
		expect(router.state.location.pathname).toBe(
			'/framework%2Freact%2Fguide%2Ffile-based-routing tanstack',
		);
	});
	it('"/" should not be encoded in splat param paths', async () => {
		const { router } = createTestRouter({
			history: createMemoryHistory({
				initialEntries: ['/framework/react/guide/file-based-routing tanstack'],
			}),
		});
		await router.load();
		expect(router.state.location.href).toBe('/framework/react/guide/file-based-routing%20tanstack');
		expect(router.state.location.pathname).toBe(
			'/framework/react/guide/file-based-routing tanstack',
		);
	});
	it('no encoding/decoding of param required', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/tanner'] }),
		});
		await router.load();
		const match = router.state.matches.find((r) => r.routeId === routes.topLevelSplatRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any)._splat).toBe('tanner');
	});
	it('param should keep decoded unicode param', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/🚀'] }),
		});
		await router.load();
		const match = router.state.matches.find((r) => r.routeId === routes.topLevelSplatRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any)._splat).toBe('🚀');
	});
	it('param should be decoded for encoded unicode param', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({ initialEntries: ['/%F0%9F%9A%80'] }),
		});
		await router.load();
		const match = router.state.matches.find((r) => r.routeId === routes.topLevelSplatRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any)._splat).toBe('🚀');
	});
	it('"/" should not be encoded in splat params', async () => {
		const { router, routes } = createTestRouter({
			history: createMemoryHistory({
				initialEntries: ['/framework/react/guide/file-based-routing tanstack'],
			}),
		});
		await router.load();
		const match = router.state.matches.find((r) => r.routeId === routes.topLevelSplatRoute.id);
		if (!match) {
			throw new Error('No match found');
		}
		expect((match.params as unknown as any)._splat).toBe(
			'framework/react/guide/file-based-routing tanstack',
		);
	});
});
describe('encoding/decoding: URL path segment', () => {
	it.each([
		{
			test: 'should decode the pathname',
			input: '/path-segment/%C3%A9',
			path: '/path-segment/é',
			url: '/path-segment/%C3%A9',
		},
		{
			test: 'should not decode excluded characters',
			input: '/path-segment/100%25', // `%25` = `%`
			path: '/path-segment/100%25',
			url: '/path-segment/100%25',
		},
		{
			test: 'should not decode multiple excluded characters',
			input: '/path-segment/100%25%25',
			path: '/path-segment/100%25%25',
			url: '/path-segment/100%25%25',
		},
		{
			test: 'should not decode characters that are part of the URI syntax',
			input: '/path-segment/100%26', // `%26` = `&`
			path: '/path-segment/100%26',
			url: '/path-segment/100%26',
		},
		{
			test: 'should decode unicode characters',
			input: '/path-segment/%F0%9F%9A%80',
			path: '/path-segment/🚀',
			url: '/path-segment/%F0%9F%9A%80',
		},
		{
			test: 'should encode unicode characters in the url and href',
			input: '/path-segment/🚀é',
			path: '/path-segment/🚀é',
			url: '/path-segment/%F0%9F%9A%80%C3%A9',
		},
		{
			test: 'should encode unicode characters in the url and href and maintain already encoded characters',
			input: '/path-segment/🚀to%2Fthe%2Fmoon',
			path: '/path-segment/🚀to%2Fthe%2Fmoon',
			url: '/path-segment/%F0%9F%9A%80to%2Fthe%2Fmoon',
		},
		{
			test: 'should decode/encode combination of excluded, URI syntax and unicode characters correctly in the path, url and href',
			input: '/path-segment/%F0%9F%9A%80to%2Fthe%2Fmoon%25%F0%9F%9A%80to%2Fthe%2Fmoon%25',
			path: '/path-segment/🚀to%2Fthe%2Fmoon%25🚀to%2Fthe%2Fmoon%25',
			url: '/path-segment/%F0%9F%9A%80to%2Fthe%2Fmoon%25%F0%9F%9A%80to%2Fthe%2Fmoon%25',
		},
	])('$test', async ({ input, path, url }) => {
		const { router } = createTestRouter({
			history: createMemoryHistory({ initialEntries: [input] }),
		});
		render(() => <RouterProvider router={router} />);
		await act(() => router.load());
		expect(router.state.location.pathname).toBe(path);
		expect(router.state.location.href).toBe(url);
	});
});
describe('router rendering stability', () => {
	type RemountDepsFn = (opts: MakeRemountDepsOptionsUnion) => any;
	async function setup(opts?: {
		remountDeps: {
			default?: RemountDepsFn;
			fooId?: RemountDepsFn;
			foo2Id?: RemountDepsFn;
			barId?: RemountDepsFn;
			bar2Id?: RemountDepsFn;
		};
	}) {
		const mountMocks = {
			fooId: vi.fn(),
			foo2Id: vi.fn(),
			barId: vi.fn(),
			bar2Id: vi.fn(),
		};
		const rootRoute = createRootRoute({
			component: () => {
				return <div>
					<p>{'Root'}</p>
					<div>
						<Link data-testid="link-foo-1" to="/foo/$fooId" params={{ fooId: '1' }}>{'Foo1'}</Link>
						<Link data-testid="link-foo-2" to="/foo/$fooId" params={{ fooId: '2' }}>{'Foo2'}</Link>
						<Link
							data-testid="link-foo-3-bar-1"
							to="/foo/$fooId/bar/$barId"
							params={{ fooId: '3', barId: '1' }}
						>{'Foo3-Bar1'}</Link>
						<Link
							data-testid="link-foo-3-bar-2"
							to="/foo/$fooId/bar/$barId"
							params={{ fooId: '3', barId: '2' }}
						>{'Foo3-Bar2'}</Link>
						<Link
							data-testid="link-foo2-1-bar2-1"
							to="/foo2/$foo2Id/bar2/$bar2Id"
							params={{ foo2Id: '1', bar2Id: '1' }}
						>{'Foo2-1-Bar2_1'}</Link>
						<Link
							data-testid="link-foo2-1-bar2-2"
							to="/foo2/$foo2Id/bar2/$bar2Id"
							params={{ foo2Id: '1', bar2Id: '2' }}
						>{'Foo2-1-Bar2_2'}</Link>
						<Link
							data-testid="link-foo2-2-bar2-1"
							to="/foo2/$foo2Id/bar2/$bar2Id"
							params={{ foo2Id: '2', bar2Id: '1' }}
						>{'Foo2-2-Bar2_1'}</Link>
					</div>
					<Outlet />
				</div>;
			},
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => {
				return '';
			},
		});
		const fooIdRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/foo/$fooId',
			component: FooIdRouteComponent,
			remountDeps: opts?.remountDeps.fooId,
		});
		function FooIdRouteComponent() {
			const fooId = fooIdRoute.useParams({ select: (s) => s.fooId });
			useEffect(() => {
				mountMocks.fooId();
			}, () => []);
			return <div data-testid="fooId-page">
				{'Foo page '}
				<span data-testid="fooId-value">{fooId.value}</span>
				{' '}
				<Outlet />
			</div>;
		}
		const barIdRoute = createRoute({
			getParentRoute: () => fooIdRoute,
			path: '/bar/$barId',
			component: BarIdRouteComponent,
			remountDeps: opts?.remountDeps.barId,
		});
		function BarIdRouteComponent() {
			const barId = barIdRoute.useParams({ select: (s) => s.barId });
			useEffect(() => {
				mountMocks.barId();
			}, () => []);
			return <div data-testid="barId-page">
				{'Bar page '}
				<span data-testid="barId-value">{barId.value}</span>
				{' '}
				<Outlet />
			</div>;
		}
		const foo2IdRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/foo2/$foo2Id',
			component: Foo2IdRouteComponent,
			remountDeps: opts?.remountDeps.foo2Id,
		});
		function Foo2IdRouteComponent() {
			const reactiveReader0 = foo2IdRoute.useParams();
			let renderCount = 0;
			// Count rendering of this route's selected params, not React function calls.
			const renderCounter = track(() => {
				reactiveReader0.value.foo2Id;
				return ++renderCount;
			});
			useEffect(() => {
				mountMocks.foo2Id();
			}, () => [reactiveReader0.value.foo2Id]);
			return <div data-testid="foo2Id-page">
				{'RenderCount:'}
				{' '}
				<span data-testid="foo2Id-Render-Count">{renderCounter.value}</span>
				{'Foo page '}
				<span data-testid="foo2Id-value">{reactiveReader0.value.foo2Id}</span>
				<Outlet />
			</div>;
		}
		const bar2IdRoute = createRoute({
			getParentRoute: () => foo2IdRoute,
			path: '/bar2/$bar2Id',
			component: Bar2IdRouteComponent,
			remountDeps: opts?.remountDeps.bar2Id,
		});
		function Bar2IdRouteComponent() {
			const reactiveReader1 = bar2IdRoute.useParams();
			useEffect(() => {
				mountMocks.bar2Id();
			}, () => [reactiveReader1.value.bar2Id]);
			return <div data-testid="bar2Id-page">
				{'Bar2 page '}
				<span data-testid="bar2Id-value">{reactiveReader1.value.bar2Id}</span>
				{' '}
				<Outlet />
			</div>;
		}
		const routeTree = rootRoute.addChildren([
			fooIdRoute.addChildren([barIdRoute]),
			foo2IdRoute.addChildren([bar2IdRoute]),
			indexRoute,
		]);
		const router = createRouter({
			routeTree,
			defaultRemountDeps: opts?.remountDeps.default,
			history: createMemoryHistory({ initialEntries: ['/'] }),
		});
		await act(() => render(() => <RouterProvider router={router} />));
		const foo1 = await screen.findByTestId('link-foo-1');
		const foo2 = await screen.findByTestId('link-foo-2');
		const foo3bar1 = await screen.findByTestId('link-foo-3-bar-1');
		const foo3bar2 = await screen.findByTestId('link-foo-3-bar-2');
		const foo_2_1_bar2_1 = await screen.findByTestId('link-foo2-1-bar2-1');
		const foo_2_1_bar2_2 = await screen.findByTestId('link-foo2-1-bar2-2');
		const foo_2_2_bar2_1 = await screen.findByTestId('link-foo2-2-bar2-1');
		expect(foo1).toBeInTheDocument();
		expect(foo2).toBeInTheDocument();
		expect(foo3bar1).toBeInTheDocument();
		expect(foo3bar2).toBeInTheDocument();
		expect(foo_2_1_bar2_1).toBeInTheDocument();
		expect(foo_2_1_bar2_2).toBeInTheDocument();
		expect(foo_2_2_bar2_1).toBeInTheDocument();
		return {
			router,
			mountMocks,
			links: {
				foo1,
				foo2,
				foo3bar1,
				foo3bar2,
				foo_2_1_bar2_1,
				foo_2_1_bar2_2,
				foo_2_2_bar2_1,
			},
		};
	}
	async function check(
		page: 'fooId' | 'foo2Id' | 'barId' | 'bar2Id',
		expected: {
			value: string;
			mountCount: number;
		},
		mountMocks: Record<'fooId' | 'foo2Id' | 'barId' | 'bar2Id', () => void>,
	) {
		const p = await screen.findByTestId(`${page}-page`);
		expect(p).toBeInTheDocument();
		const value = await screen.findByTestId(`${page}-value`);
		expect(value).toBeInTheDocument();
		await waitFor(() => expect(value).toHaveTextContent(expected.value));
		expect(mountMocks[page]).toBeCalledTimes(expected.mountCount);
	}
	it(
		'should not remount the page component when navigating to the same route but different path param if no remount deps are configured',
		async () => {
			const { router, mountMocks, links } = await setup();
			await act(() => fireEvent.click(links.foo1));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '1', mountCount: 1 }, mountMocks);
			expect(mountMocks.barId).not.toHaveBeenCalled();
			await act(() => fireEvent.click(links.foo2));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '2', mountCount: 1 }, mountMocks);
			expect(mountMocks.barId).not.toHaveBeenCalled();
			await act(() => fireEvent.click(links.foo3bar1));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '3', mountCount: 1 }, mountMocks);
			await check('barId', { value: '1', mountCount: 1 }, mountMocks);
			await act(() => fireEvent.click(links.foo3bar2));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '3', mountCount: 1 }, mountMocks);
			await check('barId', { value: '2', mountCount: 1 }, mountMocks);
			mountMocks.foo2Id.mockClear();
			mountMocks.bar2Id.mockClear();
			await act(() => fireEvent.click(links.foo_2_1_bar2_1));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			const renderCount = await screen.findByTestId('foo2Id-Render-Count');
			await check('foo2Id', { value: '1', mountCount: 1 }, mountMocks);
			await check('bar2Id', { value: '1', mountCount: 1 }, mountMocks);
			expect(renderCount).toBeInTheDocument();
			expect(renderCount).toHaveTextContent('1');
			await act(() => fireEvent.click(links.foo_2_1_bar2_2));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('foo2Id', { value: '1', mountCount: 1 }, mountMocks);
			await check('bar2Id', { value: '2', mountCount: 2 }, mountMocks);
			expect(renderCount).toBeInTheDocument();
			expect(renderCount).toHaveTextContent('1');
			mountMocks.foo2Id.mockClear();
			mountMocks.bar2Id.mockClear();
			await act(() => fireEvent.click(links.foo_2_2_bar2_1));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('foo2Id', { value: '2', mountCount: 1 }, mountMocks);
			await check('bar2Id', { value: '1', mountCount: 1 }, mountMocks);
			expect(renderCount).toBeInTheDocument();
			expect(renderCount).toHaveTextContent('2');
		},
	);
	it(
		'should remount the fooId and barId page component when navigating to the same route but different path param if defaultRemountDeps with params is used',
		async () => {
			const defaultRemountDeps: RemountDepsFn = (opts) => {
				return opts.params;
			};
			const { router, mountMocks, links } = await setup({
				remountDeps: { default: defaultRemountDeps },
			});
			await act(() => fireEvent.click(links.foo1));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '1', mountCount: 1 }, mountMocks);
			expect(mountMocks.barId).not.toHaveBeenCalled();
			await act(() => fireEvent.click(links.foo2));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '2', mountCount: 2 }, mountMocks);
			expect(mountMocks.barId).not.toHaveBeenCalled();
			await act(() => fireEvent.click(links.foo3bar1));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '3', mountCount: 3 }, mountMocks);
			await check('barId', { value: '1', mountCount: 1 }, mountMocks);
			await act(() => fireEvent.click(links.foo3bar2));
			await waitFor(() => expect(router.state.status).toBe('idle'));
			await check('fooId', { value: '3', mountCount: 3 }, mountMocks);
			await check('barId', { value: '2', mountCount: 2 }, mountMocks);
		},
	);
});
describe('invalidate', () => {
	it(
		'does not render the route component while async loader notFound is waiting for later matches to settle',
		async () => {
			const history = createMemoryHistory({
				initialEntries: ['/parent/child/grandchild'],
			});
			const createControlledPromise = () => {
				let resolve!: () => void;
				const promise = new Promise<void>((r) => {
					resolve = r;
				});
				return { promise, resolve };
			};
			const grandchildLoader = createControlledPromise();
			const rootRoute = createRootRoute({
				component: () => <Outlet />,
				notFoundComponent: () => <div data-testid="root-not-found">{'Root Not Found'}</div>,
			});
			const parentRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/parent',
				component: () => <Outlet />,
				notFoundComponent: () => <div data-testid="parent-not-found">{'Parent Not Found'}</div>,
			});
			const childRoute = createRoute({
				getParentRoute: () => parentRoute,
				path: '/child',
				loader: async () => {
					await Promise.resolve();
					throw notFound();
				},
				component: () =>
					<div data-testid="child-component">{'Child component should not render'}</div>,
			});
			const grandchildRoute = createRoute({
				getParentRoute: () => childRoute,
				path: '/grandchild',
				loader: () => grandchildLoader.promise,
				component: () => <div data-testid="grandchild-component">{'Grandchild'}</div>,
			});
			const router = createRouter({
				routeTree: rootRoute.addChildren([
					parentRoute.addChildren([childRoute.addChildren([grandchildRoute])]),
				]),
				history,
				defaultPendingMs: 0,
				defaultPendingComponent: () => <div data-testid="pending">{'Loading...'}</div>,
			});
			render(() => <RouterProvider router={router} />);
			await waitFor(() => {
				expect(router.state.location.pathname).toBe('/parent/child/grandchild');
				expect(router.state.matches[0]?.routeId).toBe(rootRoute.id);
				expect(router.state.matches[1]?.routeId).toBe(parentRoute.id);
				expect(router.state.matches[2]?.routeId).toBe(childRoute.id);
			});
			expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('parent-not-found')).not.toBeInTheDocument();
			grandchildLoader.resolve();
			expect(await screen.findByTestId('parent-not-found')).toBeInTheDocument();
			expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
		},
	);
});
const createHistoryRouter = () => {
	const rootRoute = createRootRoute();
	const IndexComponent = () => {
		const navigate = useNavigate();
		return <>
			<h1>{'Index'}</h1>
			<button onClick={() => navigate({ to: '/' })}>{'Index'}</button>
			<button onClick={() => navigate({ to: '/posts' })}>{'Posts'}</button>
			<button onClick={() => navigate({ to: '/posts', replace: true })}>{'Replace'}</button>
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
		component: function Component() {
			const navigate = useNavigate();
			return <>
				<h1>{'Posts'}</h1>
				<button onClick={() => navigate({ to: '/' })}>{'Index'}</button>
			</>;
		},
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, postsRoute]),
		history,
	});
	return { router };
};
describe('notFound in beforeLoad with pendingComponent', () => {
	it(
		'renders notFound when child beforeLoad throws and parent has an immediate pending component',
		async () => {
			const history = createMemoryHistory({ initialEntries: ['/'] });
			const rootRoute = createRootRoute({
				component: () => <Outlet />,
				notFoundComponent: () => <div data-testid="root-not-found">{'Root Not Found'}</div>,
			});
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: () => <div data-testid="home-page">
					<Link to="/parent/child">{'Go to child'}</Link>
				</div>,
			});
			const parentRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/parent',
				pendingMs: 0,
				pendingComponent: () => <div data-testid="pending-component">{'Loading...'}</div>,
				component: () => <div data-testid="parent-component">
					{'Parent'}
					<Outlet />
				</div>,
				notFoundComponent: () => <div data-testid="parent-not-found">{'Parent Not Found'}</div>,
			});
			const childRoute = createRoute({
				getParentRoute: () => parentRoute,
				path: '/child',
				beforeLoad: () => {
					throw notFound();
				},
				component: () => <div data-testid="child-component">{'Child'}</div>,
			});
			const routeTree = rootRoute.addChildren([
				indexRoute,
				parentRoute.addChildren([childRoute]),
			]);
			const router = createRouter({ routeTree, history });
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByTestId('home-page')).toBeInTheDocument();
			await act(() => router.navigate({ to: '/parent/child' }));
			expect(await screen.findByTestId('parent-not-found')).toHaveTextContent('Parent Not Found');
			expect(screen.queryByTestId('root-not-found')).not.toBeInTheDocument();
			expect(screen.queryByTestId('pending-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
			expect(router.state.matches.map((match) => match.routeId)).toEqual([
				rootRoute.id,
				parentRoute.id,
				childRoute.id,
			]);
			expect(router.state.status).toBe('idle');
		},
	);
	it('renders notFound when child beforeLoad throws without a pending component', async () => {
		const history = createMemoryHistory({ initialEntries: ['/'] });
		const rootRoute = createRootRoute({
			notFoundComponent: () => <div data-testid="root-not-found">{'Root Not Found'}</div>,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div data-testid="home-page">{'Home'}</div>,
		});
		// Direct child of root (no intermediate parent)
		const childRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/child',
			beforeLoad: () => {
				throw notFound();
			},
			component: () => <div data-testid="child-component">{'Child'}</div>,
			notFoundComponent: () => <div data-testid="child-not-found">{'Child Not Found'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute, childRoute]);
		const router = createRouter({ routeTree, history });
		render(() => <RouterProvider router={router} />);
		expect(await screen.findByTestId('home-page')).toBeInTheDocument();
		await act(() => router.navigate({ to: '/child' }));
		expect(await screen.findByTestId('child-not-found')).toHaveTextContent('Child Not Found');
		expect(screen.queryByTestId('root-not-found')).not.toBeInTheDocument();
		expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
		expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
		expect(router.state.status).toBe('idle');
	});
	it(
		'renders notFound when nested child beforeLoad throws without a pending component',
		async () => {
			const history = createMemoryHistory({ initialEntries: ['/'] });
			const rootRoute = createRootRoute({
				component: () => <Outlet />,
				notFoundComponent: () => <div data-testid="root-not-found">{'Root Not Found'}</div>,
			});
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: () => <div data-testid="home-page">{'Home'}</div>,
			});
			const parentRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/parent',
				component: () => <div data-testid="parent-component">
					{'Parent'}
					<Outlet />
				</div>,
				notFoundComponent: () => <div data-testid="parent-not-found">{'Parent Not Found'}</div>,
			});
			const childRoute = createRoute({
				getParentRoute: () => parentRoute,
				path: '/child',
				beforeLoad: () => {
					throw notFound();
				},
				component: () => <div data-testid="child-component">{'Child'}</div>,
			});
			const routeTree = rootRoute.addChildren([
				indexRoute,
				parentRoute.addChildren([childRoute]),
			]);
			const router = createRouter({ routeTree, history });
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByTestId('home-page')).toBeInTheDocument();
			await act(() => router.navigate({ to: '/parent/child' }));
			expect(await screen.findByTestId('parent-not-found')).toHaveTextContent('Parent Not Found');
			expect(screen.queryByTestId('root-not-found')).not.toBeInTheDocument();
			expect(screen.queryByTestId('parent-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
			expect(router.state.matches.map((match) => match.routeId)).toEqual([
				rootRoute.id,
				parentRoute.id,
				childRoute.id,
			]);
			expect(router.state.status).toBe('idle');
		},
	);
	it.each(['ancestor', 'child'] as const)(
		'renders the parent notFound after showing %s pending UI',
		async (pendingOwner) => {
			const history = createMemoryHistory({ initialEntries: ['/'] });
			const beforeLoad = createControlledPromise<void>();
			const rootRoute = createRootRoute({
				component: () => <Outlet />,
				notFoundComponent: () => <div data-testid="root-not-found">{'Root Not Found'}</div>,
			});
			const indexRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/',
				component: () => <div data-testid="home-page">{'Home'}</div>,
			});
			const parentRoute = createRoute({
				getParentRoute: () => rootRoute,
				path: '/parent',
				...(pendingOwner === 'ancestor'
					? {
							beforeLoad: () => beforeLoad,
							pendingMs: 0,
							pendingComponent: () =>
								<div data-testid="ancestor-pending">{'Loading ancestor...'}</div>,
						}
					: {}),
				component: () => <div data-testid="parent-component">
					{'Parent'}
					<Outlet />
				</div>,
				notFoundComponent: () => <div data-testid="parent-not-found">{'Parent Not Found'}</div>,
			});
			const childRoute = createRoute({
				getParentRoute: () => parentRoute,
				path: '/child',
				...(pendingOwner === 'child'
					? {
							pendingMs: 0,
							pendingComponent: () => <div data-testid="child-pending">{'Loading child...'}</div>,
						}
					: {}),
				beforeLoad: async () => {
					if (pendingOwner === 'child') {
						await beforeLoad;
					}
					throw notFound();
				},
				component: () => <div data-testid="child-component">{'Child'}</div>,
			});
			const routeTree = rootRoute.addChildren([
				indexRoute,
				parentRoute.addChildren([childRoute]),
			]);
			const router = createRouter({
				routeTree,
				history,
				defaultPendingMinMs: 0,
			});
			render(() => <RouterProvider router={router} />);
			expect(await screen.findByTestId('home-page')).toBeInTheDocument();
			vi.useFakeTimers();
			let navigation!: Promise<void>;
			const pendingTestId = `${pendingOwner}-pending`;
			try {
				await act(async () => {
					navigation = router.navigate({ to: '/parent/child' });
					await vi.advanceTimersByTimeAsync(0);
				});
				expect(screen.getByTestId(pendingTestId)).toBeInTheDocument();
				if (pendingOwner === 'ancestor') {
					expect(screen.queryByTestId('parent-component')).not.toBeInTheDocument();
				} else {
					expect(screen.getByTestId('parent-component')).toBeInTheDocument();
				}
			} finally {
				try {
					await act(async () => {
						beforeLoad.resolve();
						await navigation;
					});
				} finally {
					vi.useRealTimers();
				}
			}
			expect(screen.getByTestId('parent-not-found')).toHaveTextContent('Parent Not Found');
			expect(screen.queryByTestId('root-not-found')).not.toBeInTheDocument();
			expect(screen.queryByTestId(pendingTestId)).not.toBeInTheDocument();
			expect(screen.queryByTestId('parent-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
			expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
			expect(router.state.matches.map((match) => match.routeId)).toEqual([
				rootRoute.id,
				parentRoute.id,
				childRoute.id,
			]);
			expect(router.state.status).toBe('idle');
		},
	);
});
describe('Router rewrite functionality', () => {
	it('should rewrite URLs using input before router interprets them', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const newPathRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/new-path',
			component: () => <div data-testid="new-path">{'New Path Content'}</div>,
		});
		const routeTree = rootRoute.addChildren([newPathRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({ initialEntries: ['/old-path'] }),
			rewrite: {
				input: ({ url }) => {
					// Rewrite /old-path to /new-path
					if (url.pathname === '/old-path') {
						url.pathname = `/new-path`;
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('new-path')).toBeInTheDocument();
		});
		// Router should have interpreted the rewritten URL
		expect(router.state.location.pathname).toBe('/new-path');
	});
	it('should handle input rewrite with complex URL transformations', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const usersRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/users',
			component: () => <div data-testid="users">{'Users Content'}</div>,
		});
		const routeTree = rootRoute.addChildren([usersRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['/legacy/users?page=1#top'],
			}),
			rewrite: {
				input: ({ url }) => {
					// Rewrite legacy URLs to new format
					if (url.pathname === '/legacy/users') {
						url.pathname = `/users`;
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('users')).toBeInTheDocument();
		});
		// Router should have interpreted the rewritten URL
		expect(router.state.location.pathname).toBe('/users');
		expect(router.state.location.search).toEqual({ page: 1 });
		expect(router.state.location.hash).toBe('top');
	});
	it('should handle multiple input rewrite conditions', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const homeRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div data-testid="home">{'Home Content'}</div>,
		});
		const aboutRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/about',
			component: () => <div data-testid="about">{'About Content'}</div>,
		});
		const routeTree = rootRoute.addChildren([homeRoute, aboutRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({ initialEntries: ['/old-about'] }),
			rewrite: {
				input: ({ url }) => {
					// Multiple rewrite rules
					if (url.pathname === '/old-home' || url.pathname === '/home') {
						url.pathname = '/';
					}
					if (url.pathname === '/old-about' || url.pathname === '/info') {
						url.pathname = '/about';
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('about')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/about');
	});
	it('should handle input rewrite with search params and hash preservation', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const docsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/docs',
			component: () => <div data-testid="docs">{'Documentation'}</div>,
		});
		const routeTree = rootRoute.addChildren([docsRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['/old/documentation?version=v2&lang=en#installation'],
			}),
			rewrite: {
				input: ({ url }) => {
					// Rewrite old docs URL structure
					if (url.pathname === '/old/documentation') {
						url.pathname = `/docs`;
						return url;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('docs')).toBeInTheDocument();
		});
		// Verify the URL was rewritten correctly with search params and hash preserved
		expect(router.state.location.pathname).toBe('/docs');
		expect(router.state.location.search).toEqual({
			version: 'v2',
			lang: 'en',
		});
		expect(router.state.location.hash).toBe('installation');
	});
	it('should handle subdomain to path rewriting with input', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const apiRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/$stage/users',
			component: () => <div data-testid="component">
				{apiRoute.useParams().value.stage}
				{' Users'}
			</div>,
		});
		const routeTree = rootRoute.addChildren([apiRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['https://test.domain.com/users'],
			}),
			rewrite: {
				input: ({ url }) => {
					// Rewrite test.domain.com/path to /test/path (subdomain becomes path segment)
					if (url.hostname.startsWith('test.domain.com')) {
						url.pathname = `/test${url.pathname}`;
						return url;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('component')).toHaveTextContent('test Users');
		});
		// Router should have interpreted the rewritten URL
		expect(router.state.location.pathname).toBe('/test/users');
	});
	it('should handle hostname-based routing with input rewrite', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const appRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/app',
			component: () => <div data-testid="app">{'App Content'}</div>,
		});
		const adminRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/admin',
			component: () => <div data-testid="admin">{'Admin Content'}</div>,
		});
		const routeTree = rootRoute.addChildren([appRoute, adminRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['https://admin.example.com/dashboard'],
			}),
			rewrite: {
				input: ({ url }) => {
					// Route based on subdomain
					if (url.hostname === 'admin.example.com') {
						url.pathname = '/admin';
					}
					if (url.hostname === 'app.example.com') {
						url.pathname = '/app';
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('admin')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/admin');
	});
	it('should handle multiple URL transformation patterns', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const productsRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/products',
			component: () => <div data-testid="products">{'Products'}</div>,
		});
		const blogRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/blog',
			component: () => <div data-testid="blog">{'Blog'}</div>,
		});
		const routeTree = rootRoute.addChildren([productsRoute, blogRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['/old/shop/items?category=electronics'],
			}),
			rewrite: {
				input: ({ url }) => {
					// Multiple transformation patterns
					if (url.pathname === '/old/shop/items') {
						url.pathname = `/products`;
					}
					if (url.pathname.startsWith('/legacy/')) {
						url.pathname = url.pathname.replace('/legacy/', '/blog/');
					}
					if (url.pathname.startsWith('/v1/')) {
						url.pathname = url.pathname.replace('/v1/', '/');
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('products')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/products');
		expect(router.state.location.search).toEqual({ category: 'electronics' });
	});
	it('should handle rewriting subdomain and path', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const apiRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/api/v2',
			component: () => <div data-testid="api-v2">{'API v2'}</div>,
		});
		const routeTree = rootRoute.addChildren([apiRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['https://legacy.example.com/api/v1'],
			}),
			rewrite: {
				input: ({ url }) => {
					if (url.hostname === 'legacy.example.com' && url.pathname === '/api/v1') {
						return 'https://api.example.com/api/v2';
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('api-v2')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/api/v2');
	});
	it('should handle rewriting subdomain, path and search', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const newApiRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/api/v3/users',
			component: () => <div data-testid="api-v3">{'API v3 Users'}</div>,
		});
		const routeTree = rootRoute.addChildren([newApiRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: [
					'https://old-api.company.com/users?limit=10&offset=20',
				],
			}),
			rewrite: {
				input: ({ url }) => {
					if (url.hostname === 'old-api.company.com' && url.pathname === '/users') {
						url.hostname = 'api.company.com';
						url.pathname = '/api/v3/users';
						url.searchParams.set('version', '3');
						return url;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('api-v3')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/api/v3/users');
		expect(router.state.location.search).toEqual({
			limit: 10,
			offset: 20,
			version: 3,
		});
	});
	it('should handle complex URL mutations with hostname and search params', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const blogRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/content/blog',
			component: () => <div data-testid="blog">{'Blog Content'}</div>,
		});
		const routeTree = rootRoute.addChildren([blogRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: [
					'https://blog.oldsite.com/posts?category=tech&year=2024#top',
				],
			}),
			rewrite: {
				input: ({ url }) => {
					// Mutate URL: change subdomain to path, preserve params and hash
					if (url.hostname === 'blog.oldsite.com') {
						url.hostname = 'newsite.com';
						url.pathname = '/content/blog';
						url.searchParams.set('source', 'migration');
						// Keep existing search params and hash
						return url.href;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('blog')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/content/blog');
		expect(router.state.location.search).toEqual({
			category: 'tech',
			year: 2024,
			source: 'migration',
		});
		expect(router.state.location.hash).toBe('top');
	});
	it('should handle returning new URL instance vs mutating existing one', async () => {
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const shopRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/shop/products',
			component: () => <div data-testid="shop">{'Shop Products'}</div>,
		});
		const routeTree = rootRoute.addChildren([shopRoute]);
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({
				initialEntries: ['https://store.example.com/items?id=123'],
			}),
			rewrite: {
				input: ({ url }) => {
					// Alternative pattern: create new URL instance and return it
					if (url.hostname === 'store.example.com' && url.pathname === '/items') {
						const newUrl = new URL('https://example.com/shop/products');
						newUrl.searchParams.set('productId', url.searchParams.get('id') || '');
						newUrl.searchParams.set('migrated', 'true');
						return newUrl;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('shop')).toBeInTheDocument();
		});
		expect(router.state.location.pathname).toBe('/shop/products');
		expect(router.state.location.search).toEqual({
			productId: 123,
			migrated: true,
		});
	});
	it('should handle output rewrite when navigating', async () => {
		// This test demonstrates expected output behavior for programmatic navigation
		const Navigate = () => {
			const navigate = useNavigate();
			return <button
				data-testid="navigate-btn"
				onClick={() => navigate({ to: '/dashboard' })}
			>{'Navigate to Dashboard'}</button>;
		};
		const rootRoute = createRootRoute();
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: Navigate,
		});
		const dashboardRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/dashboard',
			component: () => <div data-testid="dashboard">{'Dashboard'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute]);
		const history = createMemoryHistory({ initialEntries: ['/'] });
		const router = createRouter({
			routeTree,
			history,
			rewrite: {
				output: ({ url }) => {
					if (url.pathname === '/dashboard') {
						url.pathname = '/admin/panel';
						return url;
					}
					return undefined;
				},
				input: ({ url }) => {
					if (url.pathname === '/admin/panel') {
						url.pathname = '/dashboard';
						return url;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		const navigateBtn = await screen.findByTestId('navigate-btn');
		fireEvent.click(navigateBtn);
		await screen.findByTestId('dashboard');
		// Router internal state should show the internal path
		expect(router.state.location.pathname).toBe('/dashboard');
		// History should be updated with the rewritten path due to output
		expect(history.location.pathname).toBe('/admin/panel');
	});
	it('should handle output rewrite with Link navigation', async () => {
		// This test demonstrates expected output behavior for Link-based navigation
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div>
				<Link to="/profile" data-testid="profile-link">{'Go to Profile'}</Link>
			</div>,
		});
		const profileRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/profile',
			component: () => <div data-testid="profile">{'User Profile'}</div>,
		});
		const routeTree = rootRoute.addChildren([indexRoute, profileRoute]);
		const history = createMemoryHistory({ initialEntries: ['/'] });
		const router = createRouter({
			routeTree,
			history,
			rewrite: {
				output: ({ url }) => {
					if (url.pathname === '/profile') {
						url.pathname = '/user';
						return url;
					}
					return undefined;
				},
				input: ({ url }) => {
					if (url.pathname === '/user') {
						url.pathname = '/profile';
						return url;
					}
					return undefined;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		const profileLink = await screen.findByTestId('profile-link');
		fireEvent.click(profileLink);
		expect(await screen.findByTestId('profile')).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/profile');
		expect(history.location.pathname).toBe('/user');
	});
	it('should handle i18n rewriting with navigation between localized routes', async () => {
		// Tests navigation between routes with i18n locale prefix rewriting
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const homeRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div data-testid="home">
				{'Home'}
				<Link to="/about" data-testid="about-link">{'About'}</Link>
			</div>,
		});
		const aboutRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/about',
			component: () => <div data-testid="about">{'About'}</div>,
		});
		const routeTree = rootRoute.addChildren([homeRoute, aboutRoute]);
		// Start at the public-facing locale-prefixed URL
		const history = createMemoryHistory({ initialEntries: ['/en'] });
		const router = createRouter({
			routeTree,
			history,
			rewrite: {
				input: ({ url }) => {
					// Strip locale prefix
					if (url.pathname.startsWith('/en')) {
						url.pathname = url.pathname.replace(/^\/en/, '') || '/';
						return url;
					}
					return url;
				},
				output: ({ url }) => {
					// Add locale prefix
					if (!url.pathname.startsWith('/en')) {
						url.pathname = `/en${url.pathname === '/' ? '' : url.pathname}`;
						return url;
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('home')).toBeInTheDocument();
		});
		// Click the about link
		const aboutLink = screen.getByTestId('about-link');
		fireEvent.click(aboutLink);
		await waitFor(() => {
			expect(screen.getByTestId('about')).toBeInTheDocument();
		});
		// Internal pathname should be /about
		expect(router.state.location.pathname).toBe('/about');
		// Public href should be /en/about
		expect(router.state.location.publicHref).toBe('/en/about');
		// History should show the public-facing path
		expect(history.location.pathname).toBe('/en/about');
	});
	it('should handle i18n rewriting with direct navigation to localized URL', async () => {
		// Tests that navigating directly to a locale-prefixed URL works correctly
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const aboutRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/about',
			component: () => <div data-testid="about">{'About'}</div>,
		});
		const routeTree = rootRoute.addChildren([aboutRoute]);
		// Start at German locale-prefixed URL
		const history = createMemoryHistory({ initialEntries: ['/de/about'] });
		const router = createRouter({
			routeTree,
			history,
			rewrite: {
				input: ({ url }) => {
					// Strip any locale prefix
					const match = url.pathname.match(/^\/(en|de)(.*)$/);
					if (match) {
						url.pathname = match[2] || '/';
						return url;
					}
					return url;
				},
				output: ({ url }) => {
					// Default to German locale
					if (!url.pathname.match(/^\/(en|de)/)) {
						url.pathname = `/de${url.pathname === '/' ? '' : url.pathname}`;
						return url;
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('about')).toBeInTheDocument();
		});
		// Internal pathname should be /about (de-localized)
		expect(router.state.location.pathname).toBe('/about');
		// Public href should include locale
		expect(router.state.location.publicHref).toBe('/de/about');
	});
	it('should maintain consistent publicHref between parseLocation and buildLocation', async () => {
		// This test specifically verifies the fix for the redirect loop bug:
		// parseLocation and buildLocation must compute the same publicHref
		// for the same logical location.
		const rootRoute = createRootRoute({
			component: () => <Outlet />,
		});
		const homeRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => <div data-testid="home">{'Home'}</div>,
		});
		const routeTree = rootRoute.addChildren([homeRoute]);
		// Start at the locale-prefixed URL
		const history = createMemoryHistory({ initialEntries: ['/fr'] });
		const router = createRouter({
			routeTree,
			history,
			rewrite: {
				input: ({ url }) => {
					// De-localize: /fr -> /
					if (url.pathname.startsWith('/fr')) {
						url.pathname = url.pathname.replace(/^\/fr/, '') || '/';
					}
					return url;
				},
				output: ({ url }) => {
					// Re-localize: / -> /fr
					if (!url.pathname.startsWith('/fr')) {
						url.pathname = `/fr${url.pathname === '/' ? '' : url.pathname}`;
					}
					return url;
				},
			},
		});
		render(() => <RouterProvider router={router} />);
		await waitFor(() => {
			expect(screen.getByTestId('home')).toBeInTheDocument();
		});
		// Get the current location's publicHref (computed by parseLocation)
		const parsedPublicHref = router.state.location.publicHref;
		// Build a location to the same path and check its publicHref
		const builtLocation = router.buildLocation({ to: '/' });
		// These must match - if they don't, the router will think it needs
		// to redirect, causing an infinite loop
		expect(parsedPublicHref).toBe(builtLocation.publicHref);
		expect(parsedPublicHref).toBe('/fr');
	});
});
