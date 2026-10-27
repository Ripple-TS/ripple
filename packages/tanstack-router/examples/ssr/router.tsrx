import { track, trackAsync } from 'ripple';
import { CspPage } from './csp.tsrx';
import {
	Await,
	HeadContent,
	Scripts,
	Link,
	Outlet,
	createRootRouteWithContext,
	createRoute,
	createRouter,
	lazyRouteComponent,
	useBlocker,
	notFound,
} from '@ripple-ts/tanstack-router';

export function getRouter(origin: string) {
	const root = createRootRouteWithContext<{ origin: string }>()({
		shellComponent: ({ children }) => <>
			<HeadContent />
			{children}
			<Scripts />
		</>,
		component: function Layout() @{
			<>
				<header>
					<nav aria-label="Main">
						<Link to="/">Home</Link>
						<Link to="/posts/$postId" params={{ postId: 'one' }} search={{ page: 1 }}>
							First post
						</Link>
						<Link
							to="/posts/$postId"
							params={{ postId: 'two' }}
							search={{ page: 2 }}
							preload="intent"
						>Second post</Link>
						<Link to="/posts/$postId" params={{ postId: 'slow' }} search={{ page: 1 }}>
							Slow post
						</Link>
						<Link to="/posts/$postId" params={{ postId: 'error' }} search={{ page: 1 }}>
							Broken post
						</Link>
						<Link to="/lazy" preload="intent">Lazy page</Link>
						<Link to="/edit">Editor</Link>
						<Link to="/stream">Stream</Link>
					</nav>
				</header>
				<main>
					<Outlet />
				</main>
			</>
		},
		errorComponent: ({ error }) => <p role="alert">
			{error instanceof Error ? error.message : String(error)}
		</p>,
		notFoundComponent: () => <h1>Page not found</h1>,
		head: () => ({ meta: [{ title: 'Ripple Router example' }] }),
	});
	const home = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => <>
			<h1>Ripple Router example</h1>
			<p>Code-defined routes, server rendering, and native browser navigation.</p>
			<div class="spacer" />
			<h2 id="bottom">Bottom of home</h2>
		</>,
	});
	const posts = createRoute({
		getParentRoute: () => root,
		path: '/posts',
		component: function Posts() @{
			const count = track(0);
			<section>
				<h2>Posts layout</h2>
				<button onClick={() => count.value++}>Layout count: {count.value}</button>
				<Outlet />
			</section>
		},
	});
	const post = createRoute({
		getParentRoute: () => posts,
		path: '$postId',
		validateSearch: (search: Record<string, unknown>) => ({
			page: Math.max(1, Number(search.page) || 1),
		}),
		loaderDeps: ({ search }) => ({ page: search.page }),
		loader: async ({ params, deps, context, abortController }) => {
			const response = await fetch(
				new URL(`${import.meta.env.BASE_URL}api/posts/${params.postId}?page=${deps.page}`, context.origin),
				{ signal: abortController.signal },
			);
			if (!response.ok) throw new Error('Post could not be loaded');
			return await response.json() as { title: string; page: number };
		},
		head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title ?? 'Loading post' }] }),
		pendingComponent: () => <p role="status">Loading post…</p>,
		errorComponent: () => <p role="alert">Post could not be loaded</p>,
		component: function Post() @{
			const params = post.useParams();
			const search = post.useSearch();
			const data = post.useLoaderData();
			<article>
				<h1>{data.value.title}</h1>
				<p data-post>{params.value.postId}: page {search.value.page}</p>
				<Link to="/posts/$postId" params={{ postId: 'two' }} search={{ page: 3 }}>Update post</Link>
				<div class="spacer" />
				<h2 id="bottom">Bottom of post</h2>
			</article>
		},
	});
	const lazy = createRoute({
		getParentRoute: () => root,
		path: '/lazy',
		component: lazyRouteComponent(() => import('./lazy.tsrx')),
		head: () => ({
			styles: [{ children: '.route-style { color: rgb(7, 8, 9); }' }],
			scripts: [
				{
					id: 'lazy-head-script',
					children: 'window.lazyHeadRuns = (window.lazyHeadRuns || 0) + 1',
				},
			],
		}),
		scripts: () => [
			{ id: 'lazy-body-script', children: 'window.lazyBodyRuns = (window.lazyBodyRuns || 0) + 1' },
		],
	});
	const editor = createRoute({
		getParentRoute: () => root,
		path: '/edit',
		component: function Editor() @{
			const dirty = track(false);
			const blocker = useBlocker({
				shouldBlockFn: () => dirty.value,
				withResolver: true,
				enableBeforeUnload: false,
			});
			<>
				<h1>Editor</h1>
				<button onClick={() => (dirty.value = true)}>Make changes</button>
				<p>
					{dirty.value ? 'Unsaved changes' : 'Saved'}
				</p>
				@if (blocker.value.status === 'blocked') {
					<div role="dialog" aria-label="Unsaved changes">
						<button onClick={() => blocker.value.reset?.()}>Stay</button>
						<button onClick={() => blocker.value.proceed?.()}>Leave</button>
					</div>
				}
			</>
		},
	});
	const stream = createRoute({
		getParentRoute: () => root,
		path: '/stream',
		loader: ({ context, abortController }) => ({
			message: fetch(new URL(`${import.meta.env.BASE_URL}api/deferred`, context.origin), {
				signal: abortController.signal,
			}).then((response) => response.text()),
		}),
		component: function Stream() @{
			const data = stream.useLoaderData();
			<>
				<h1>Streaming page</h1>
				<Await
					promise={data.value.message}
					fallback={<p role="status">Waiting for message…</p>}
					render={(message) => <p data-message>{message}</p>}
				/>
			</>
		},
	});
	const csp = createRoute({ getParentRoute: () => root, path: '/csp', component: CspPage });
	const outcome = createRoute({
		getParentRoute: () => root,
		path: '/csp/$outcome',
		errorComponent: ({ error }) => <p role="alert">
			{error instanceof Error ? error.message : String(error)}
		</p>,
		notFoundComponent: () => <h1>Page not found</h1>,
		component: function Outcome() @{
			const params = outcome.useParams();
			const pending = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 100));
			const value = trackAsync(() => pending);
			function Result({ ready }: { ready: boolean }) {
				if (ready) throw params.value.outcome === 'missing'
					? notFound()
					: new Error('Late CSP error');
				return <p>Waiting for outcome</p>;
			}
			@if (params.value.outcome === 'patch-error') {
				<Await
					promise={pending}
					fallback={<p>Waiting for failed patch</p>}
					render={(ready) => <Result {ready} />}
				/>
			} @else {
				<Result ready={value.value} />
			}
		},
	});
	return createRouter({
		routeTree: root.addChildren([
			home,
			posts.addChildren([post]),
			lazy,
			editor,
			stream,
			csp,
			outcome,
		]),
		context: { origin },
		basepath: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
		defaultPendingMs: 30,
		defaultPendingMinMs: 30,
		defaultPreloadStaleTime: 60_000,
		defaultStaleTime: 60_000,
		defaultViewTransition: true,
		scrollRestoration: true,
	});
}

declare module '@ripple-ts/tanstack-router' {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
