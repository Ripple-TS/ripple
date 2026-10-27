import { track, type Derived } from 'ripple';
import {
	Link,
	useLinkProps,
	linkOptions,
	getRouteApi,
	createLazyRoute,
	lazyRouteComponent,
	useLocation,
	useMatches,
	useParentMatches,
	useChildMatches,
	useMatchRoute,
	Navigate,
	MatchRoute,
	useBlocker,
	Await,
	useAwaited,
} from '@ripple-ts/tanstack-router';

function checkClientApis() {
	const params = track({ postId: '1' });
	Link({
		to: '/posts/$postId',
		params,
		search: { tab: 'details' },
		onClick: (event) => {
			const anchor: HTMLAnchorElement = event.currentTarget;
			void anchor;
		},
	});
	Link({
		to: '/posts/$postId',
		params: { postId: '1' },
		search: { tab: undefined },
		disabled: track(true),
	});
	// @ts-expect-error params remain required for tracked and ordinary links
	Link({ to: '/posts/$postId' });
	// @ts-expect-error wrong path
	Link({ to: '/missing' });
	// @ts-expect-error params are inferred through the tracked input
	Link({ to: '/posts/$postId', params: track({ postId: 123 }) });
	// @ts-expect-error wrong search type
	Link({ to: '/posts/$postId', params, search: { tab: 123 } });
	const props = useLinkProps({ to: '/posts/$postId', params, search: { tab: undefined } });
	const href: string | null | undefined = props.value.href;
	const options = linkOptions({
		to: '/posts/$postId',
		params: { postId: 'one' },
		search: { tab: undefined },
	});
	Link(options);
	const optionList = linkOptions([
		{ to: '/posts/$postId', params: { postId: 'one' }, search: { tab: undefined }, label: 'First' },
		{
			to: '/posts/$postId',
			params: { postId: 'two' },
			search: { tab: undefined },
			label: 'Second',
		},
	]);
	const firstLabel: 'First' = optionList[0].label;
	// @ts-expect-error arrays validate each destination
	linkOptions([{ to: '/missing' }]);
	// @ts-expect-error arrays validate required parameters
	linkOptions([{ to: '/posts/$postId', params: { wrong: 'one' } }]);
	void firstLabel;
	// @ts-expect-error linkOptions validates route parameters too
	linkOptions({ to: '/posts/$postId', params: { wrong: 'one' } });
	const api = getRouteApi('/posts/$postId');
	const user: string = api.useRouteContext().value.user;
	const title: string = api.useLoaderData().value.title;
	const tab: string | undefined = api.useLoaderDeps().value.tab;
	api.Link({ to: '.', params: { postId: 'two' }, search: { tab: undefined } });
	// @ts-expect-error unknown route API
	getRouteApi('/missing');
	const lazy = createLazyRoute('/posts/$postId')({ component: () => null });
	const id: string = lazy.useParams().value.postId;
	const pathname: string = useLocation().value.pathname;
	const selected: number = useLocation({ select: (location) => location.pathname.length }).value;
	const count: number = useMatches({ select: (matches) => matches.length }).value;
	const parentCount: number = useParentMatches({ select: (matches) => matches.length }).value;
	const childCount: number = useChildMatches({ select: (matches) => matches.length }).value;
	const match = useMatchRoute()({ to: '/posts/$postId' });
	if (match.value) {
		const postId: string = match.value.postId;
		void postId;
	}
	Navigate({ to: '/posts/$postId', params, search: { tab: undefined } });
	// @ts-expect-error Navigate preserves required params
	Navigate({ to: '/posts/$postId' });
	MatchRoute({ to: '/posts/$postId', params, render: (match) => (match ? match.postId : 'none') });
	const blocking = useBlocker({
		shouldBlockFn: ({ next }) => next.pathname === '/',
		withResolver: true,
		disabled: track(false),
	});
	if (blocking.value.status === 'blocked') blocking.value.proceed();
	const deferred: Derived<number> = useAwaited({ promise: Promise.resolve(1) });
	Await({ promise: Promise.resolve({ name: 'ready' }), render: (value) => value.name });
	const Page = lazyRouteComponent(
		async () => ({ Page: (_props: { title: string }) => null }),
		'Page',
	);
	Page({ title: 'ready' });
	// @ts-expect-error lazy components preserve props
	Page({ title: 123 });
	void [href, user, title, tab, id, pathname, selected, count, parentCount, childCount, deferred];
}
void checkClientApis;
