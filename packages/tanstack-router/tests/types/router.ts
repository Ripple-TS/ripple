import {
	createRootRouteWithContext,
	createRoute,
	createRouter,
	createMemoryHistory,
	RouterProvider,
	useRouterState,
} from '@ripple-ts/tanstack-router';

const root = createRootRouteWithContext<{ user: string }>()({ component: () => null });
const post = createRoute({
	getParentRoute: () => root,
	path: '/posts/$postId',
	validateSearch: (search: Record<string, unknown>) => ({
		tab: typeof search.tab === 'string' ? search.tab : undefined,
	}),
	loaderDeps: ({ search }) => ({ tab: search.tab }),
	loader: ({ params, context }) => ({ title: params.postId, user: context.user }),
});
const router = createRouter({
	routeTree: root.addChildren([post]),
	history: createMemoryHistory(),
	context: { user: 'reader' },
});

declare module '@ripple-ts/tanstack-router' {
	interface Register {
		router: typeof router;
	}
}

void router.navigate({ to: '/posts/$postId', params: { postId: '1' }, search: { tab: 'details' } });
// @ts-expect-error Route parameters are required.
void router.navigate({ to: '/posts/$postId' });
// @ts-expect-error Unknown destinations are rejected.
void router.navigate({ to: '/missing' });
// @ts-expect-error Provider context retains the router context type.
RouterProvider({ router, context: { user: 42 } });

function checkReaders() {
	const params = post.useParams();
	const id: string = params.value.postId;
	// @ts-expect-error Reactive readers are read-only.
	params.value = { postId: '2' };
	const data = post.useLoaderData();
	const title: string = data.value.title;
	// @ts-expect-error Loader data is inferred, not any.
	const wrong: number = data.value.title;
	const context = post.useRouteContext();
	const user: string = context.value.user;
	const selected = useRouterState({ select: (state) => state.location.pathname.length });
	const length: number = selected.value;
	void id;
	void title;
	void wrong;
	void user;
	void length;
}
void checkReaders;
