import { track } from 'ripple';
import {
	Await,
	ClientOnly,
	HeadContent,
	Scripts,
	Link,
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	notFound,
	redirect,
	lazyRouteComponent,
} from '@ripple-ts/tanstack-router';

export function makeSsrRouter(
	{
		path = '/',
		value = 'server',
		onLoad = () => {},
		deferred,
		transport,
		ssr = true,
		hydrate,
		lazy,
		lazyError,
		onImport = () => {},
		boundary,
		outcome,
		context = () => ({}),
	}: any = {},
) {
	const root = createRootRoute({
		context,
		component: function Layout() @{
			const count = track(0);
			<>
				<HeadContent />
				<Scripts />
				<button onClick={() => count.value++}>Count: {count.value}</button>
				<Link to="/">Home</Link>
				<Link to="/next">Next</Link>
				<Link to="/" hash="section" activeOptions={{ includeHash: true }} data-hash>Hash</Link>
				<Outlet />
			</>
		},
		errorComponent: ({ error }) => <p role="alert">
			{error instanceof Error ? error.message : String(error)}
		</p>,
		notFoundComponent: () => <p>Missing page</p>,
		head: () => ({
			meta: [{ title: 'Root title' }, { name: 'description', content: 'root description' }],
		}),
	});
	if (lazyError) {
		const errorComponent = root.options.errorComponent;
		root.update({
			errorComponent: lazyRouteComponent(async () => {
				onImport();
				return { default: errorComponent };
			}),
		});
	}
	const home = createRoute({
		getParentRoute: () => root,
		path: '/',
		ssr,
		pendingMinMs: 20,
		loader: () => {
			onLoad();
			return { value, deferred, transport };
		},
		head: () => ({
			meta: [{ title: 'Home title' }, { name: 'description', content: 'home description' }],
		}),
		scripts: () => [
			{ type: 'application/json', id: 'route-data', children: '{"page":"home"}' },
		],
		pendingComponent: () => <p role="status">Pending home</p>,
		component: function Home() @{
			const data = home.useLoaderData();
			<>
				<h1>{data.value.value}</h1>
				@if (data.value.deferred) {
					<Await
						promise={data.value.deferred}
						fallback={<p>Waiting for data</p>}
						render={(text) => <>
							<p data-deferred>{text}</p>
							<Link to="/" hash="section" activeOptions={{ includeHash: true }} data-late-hash>
								Late hash
							</Link>
						</>}
					/>
				}
				<ClientOnly fallback={<p>Server fallback</p>}>
					<p>Client ready</p>
				</ClientOnly>
			</>
		},
	});
	if (lazy) {
		const component = home.options.component;
		home.update({
			component: lazyRouteComponent(
				typeof lazy === 'function'
					? lazy
					: async () => {
							onImport();
							return { default: component };
						},
			),
		});
	}
	const next = createRoute({
		getParentRoute: () => root,
		path: '/next',
		component: () => <h1>Next page</h1>,
		head: () => ({ meta: [{ title: 'Next title' }] }),
		scripts: () => [
			{ type: 'application/json', id: 'route-data', children: '{"page":"next"}' },
		],
	});
	const error = createRoute({
		getParentRoute: () => root,
		path: '/error',
		loader: () => {
			throw new Error('Loader failed');
		},
	});
	const missing = createRoute({
		getParentRoute: () => root,
		path: '/not-found',
		loader: () => {
			throw notFound();
		},
	});
	const moved = createRoute({
		getParentRoute: () => root,
		path: '/redirect',
		beforeLoad: () => {
			throw redirect({ to: '/next', statusCode: 307 });
		},
	});
	const boundaryOptions = {
		beforeLoad: () => {
			throw outcome === 'notFound' ? notFound() : new Error('Boundary error');
		},
		pendingComponent: () => <p>Boundary pending</p>,
		errorComponent: () => <p data-boundary>Boundary error</p>,
		notFoundComponent: () => <p data-boundary>Boundary not found</p>,
	};
	if (boundary === 'root') root.update(boundaryOptions);
	const parent = createRoute({
		getParentRoute: () => root,
		path: '/parent',
		component: Outlet,
		...(boundary === 'parent' ? boundaryOptions : {}),
	});
	const child = createRoute({
		getParentRoute: () => parent,
		path: '/child',
		loader: onLoad,
		component: () => <p>Child</p>,
	});
	const explicitMissing = createRoute({
		getParentRoute: () => root,
		path: '/404',
		component: () => <p>Missing page</p>,
	});
	return createRouter({
		routeTree: root.addChildren([
			home,
			next,
			error,
			missing,
			moved,
			parent.addChildren([child]),
			explicitMissing,
		]),
		history: createMemoryHistory({ initialEntries: [path] }),
		hydrate,
	});
}
