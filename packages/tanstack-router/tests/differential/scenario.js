// The same route policy runs in independently bundled Solid and Ripple apps.
export function scenario(api, components) {
	const {
		createRootRoute,
		createRoute,
		createRouter,
		createMemoryHistory,
		createControlledPromise,
	} = api;
	const events = [];
	const renders = [];
	const loaders = [];
	const gate = createControlledPromise();
	const history = createMemoryHistory({ initialEntries: ['/a?version=1'] });
	let listeners = 0;
	const originalSubscribe = history.subscribe;
	history.subscribe = (listener) => {
		listeners++;
		const off = originalSubscribe(listener);
		return () => {
			listeners--;
			off();
		};
	};
	const root = createRootRoute({ component: components.layout });
	const a = createRoute({
		getParentRoute: () => root,
		path: '/a',
		validateSearch: (search) => ({ version: Number(search.version ?? 1) }),
		loaderDeps: ({ search }) => ({ version: search.version }),
		loader: ({ deps }) => {
			loaders.push(`a:${deps.version}`);
			return `A ${deps.version}`;
		},
		component: () => components.page(a, renders),
	});
	const b = createRoute({
		getParentRoute: () => root,
		path: '/b',
		loader: async () => {
			loaders.push('b:start');
			await gate;
			loaders.push('b:finish');
			return 'B';
		},
		component: () => components.page(b, renders),
	});
	const c = createRoute({
		getParentRoute: () => root,
		path: '/c',
		loader: () => {
			loaders.push('c');
			return 'C';
		},
		component: () => components.page(c, renders),
	});
	const router = createRouter({
		routeTree: root.addChildren([a, b, c]),
		history,
		defaultPendingMs: 100000,
	});
	for (const type of [
		'onBeforeNavigate',
		'onBeforeLoad',
		'onLoad',
		'onBeforeRouteMount',
		'onResolved',
		'onRendered',
	]) {
		router.subscribe(type, (e) => events.push([type, e.toLocation.pathname]));
	}
	return { router, gate, events, renders, loaders, listeners: () => listeners };
}
