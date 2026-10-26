import { describe, expect, it, vi } from 'vitest';
import { effect, flushSync, track, type Component, type Derived } from 'ripple';
import {
	Link,
	createLink,
	useLinkProps,
	RouterProvider,
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
} from '@ripple-ts/tanstack-router';
import { render, fireEvent, waitFor, advanceTimers } from '../harness.js';

function setup(Links: Component, options: Record<string, any> = {}) {
	const root = createRootRoute({
		component: () => <>
			<Links />
			<Outlet />
		</>,
	});
	const home = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => <h1>Home</h1>,
	});
	const post = createRoute({
		getParentRoute: () => root,
		path: '/posts/$id',
		loader: options.loader,
		component: () => <h1>Post</h1>,
	});
	const router = createRouter({
		routeTree: root.addChildren([home, post]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		...options,
	});
	const view = render(() => <RouterProvider {router} />);
	return { router, view };
}

describe('Ripple link inputs and host behavior', () => {
	it(
		'updates tracked params, search, state and attributes without replacing the anchor',
		async () => {
			let change!: () => void;
			function Links() @{
				const id = track('one');
				const title = track<string | undefined>('first');
				change = () => {
					id.value = 'two';
					title.value = undefined;
				};
				<Link
					to="/posts/$id"
					params={track(() => ({ id: id.value }))}
					search={track(() => ({ value: id.value }))}
					state={track(() => ({ value: id.value }))}
					{title}
					data-testid="link"
				>Read</Link>
			}
			const { view, router } = setup(Links);
			const link = await view.findByTestId('link');
			expect(link.getAttribute('href')).toBe('/posts/one?value=one');
			expect(link.getAttribute('title')).toBe('first');
			change();
			flushSync();
			expect(view.getByTestId('link')).toBe(link);
			expect(link.getAttribute('href')).toBe('/posts/two?value=two');
			expect(link.hasAttribute('title')).toBe(false);
			fireEvent.click(link);
			await view.findByRole('heading', { name: 'Post' });
			expect(router.state.location.state).toMatchObject({ value: 'two' });
			expect(link.getAttribute('aria-current')).toBe('page');
		},
	);

	it('preserves updater functions and plain objects with a value field', async () => {
		const search = vi.fn((previous) => ({ ...previous, value: 'plain' }));
		function Links() {
			return <Link
				to="/posts/$id"
				params={{ id: 'one' }}
				{search}
				state={{ value: 42 }}
				data-testid="link"
			>Read</Link>;
		}
		const { view, router } = setup(Links);
		fireEvent.click(await view.findByTestId('link'));
		await view.findByRole('heading', { name: 'Post' });
		expect(router.state.location.search).toEqual({ value: 'plain' });
		expect(router.state.location.state).toMatchObject({ value: 42 });
		expect(search).toHaveBeenCalled();
	});

	it(
		'merges state class/style, arbitrary attributes, and respects user event prevention',
		async () => {
			const click = vi.fn((event) => event.preventDefault());
			function Links() {
				return <Link
					to="/"
					class="base"
					style={{ color: 'red' }}
					activeProps={{ class: 'selected', style: { fontWeight: 'bold' }, 'data-extra': 'yes' }}
					inactiveProps={{ title: 'away' }}
					onClick={click}
					data-testid="link"
				>Home link</Link>;
			}
			const { view, router } = setup(Links);
			const link = await view.findByTestId('link');
			expect(link.className).toBe('base selected');
			expect(link.getAttribute('data-extra')).toBe('yes');
			expect(link.style.color).toBe('red');
			expect(link.style.fontWeight).toBe('bold');
			const navigate = vi.spyOn(router, 'navigate');
			fireEvent.click(link);
			expect(click).toHaveBeenCalledOnce();
			expect(navigate).not.toHaveBeenCalled();
			await router.navigate({ to: '/posts/$id', params: { id: 'one' } });
			expect(link.className).toBe('base');
			expect(link.hasAttribute('data-extra')).toBe(false);
			expect(link.getAttribute('title')).toBe('away');
			expect(link.style.fontWeight).toBe('');
		},
	);

	it.each([
		{ ctrlKey: true },
		{ metaKey: true },
		{ shiftKey: true },
		{ altKey: true },
		{ button: 1 },
	])('leaves modified click %j to the browser', async (modifiers) => {
		const { view, router } = setup(() => <Link to="/posts/$id" params={{ id: 'one' }}>Read</Link>);
		const link = await view.findByText('Read');
		const navigate = vi.spyOn(router, 'navigate');
		const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });
		link.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(navigate).not.toHaveBeenCalled();
	});

	it.each([
		{ to: 'https://example.com' },
		{ to: 'mailto:a@example.com' },
		{ to: '/posts/one', target: '_blank' },
		{ to: '/posts/one', reloadDocument: true },
		{ to: '/posts/one', download: 'file' },
	])('preserves native navigation for %j', async (props) => {
		const { view, router } = setup(() => <Link {...props}>Native</Link>);
		const navigate = vi.spyOn(router, 'navigate');
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		(await view.findByText('Native')).dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('disables the anchor reactively, including external destinations', async () => {
		let enable!: () => void;
		function Links() @{
			const disabled = track(true);
			enable = () => {
				disabled.value = false;
			};
			<Link to="https://example.com" {disabled}>Disabled</Link>
		}
		const { view } = setup(Links);
		const link = await view.findByText('Disabled');
		expect(link.hasAttribute('href')).toBe(false);
		expect(link.getAttribute('aria-disabled')).toBe('true');
		enable();
		flushSync();
		expect(link.getAttribute('href')).toBe('https://example.com');
		expect(link.hasAttribute('aria-disabled')).toBe(false);
	});

	it(
		'owns callback and tracked refs through custom anchors, with no ref churn on navigation',
		async () => {
			const cleanup = vi.fn();
			const ref = vi.fn(() => cleanup);
			const mounted = vi.fn();
			let getRef!: () => HTMLAnchorElement | null;
			function Anchor({
				linkProps,
				children,
			}: {
				linkProps: Derived<Record<string, any>>;
				children?: any;
			}) @{
				mounted();
				<a {...linkProps.value}>{children}</a>
			}
			const CustomLink = createLink(Anchor);
			function Links() @{
				const trackedRef = track<HTMLAnchorElement | null>(null);
				getRef = () => trackedRef.value;
				<CustomLink to="/posts/$id" params={{ id: 'one' }} ref={[ref, trackedRef]}>
					Custom
				</CustomLink>
			}
			const { view, router } = setup(Links);
			const link = await view.findByText('Custom');
			expect(ref).toHaveBeenCalledOnce();
			expect(getRef()).toBe(link);
			await router.navigate({ to: '/posts/$id', params: { id: 'one' } });
			expect(link.getAttribute('aria-current')).toBe('page');
			expect(mounted).toHaveBeenCalledOnce();
			expect(ref).toHaveBeenCalledOnce();
			view.unmount();
			expect(cleanup).toHaveBeenCalledOnce();
			expect(getRef()).toBe(null);
		},
	);

	it('exposes live host props for useLinkProps', async () => {
		function Links() @{
			const props = useLinkProps({ to: '/posts/$id', params: { id: 'one' } });
			<a {...props.value}>Hook</a>
		}
		const { view, router } = setup(Links);
		const link = await view.findByText('Hook');
		fireEvent.click(link);
		await view.findByRole('heading', { name: 'Post' });
		expect(router.state.location.pathname).toBe('/posts/one');
	});

	it(
		'preloads on intent, cancels on leave and unmount, and reuses the fresh core cache',
		async () => {
			const loader = vi.fn(() => 'data');
			const { view, router } = setup(
				() => <Link to="/posts/$id" params={{ id: 'one' }} preload="intent" preloadDelay={50}>
					Preload
				</Link>,
				{ loader, defaultPreloadStaleTime: 10000 },
			);
			const link = await view.findByText('Preload');
			await waitFor(() => expect(router.state.status).toBe('idle'));
			vi.useFakeTimers();
			fireEvent.mouseOver(link);
			fireEvent.mouseOut(link);
			await advanceTimers(60);
			expect(loader).not.toHaveBeenCalled();
			fireEvent.focus(link);
			await advanceTimers(60);
			expect(loader).toHaveBeenCalledOnce();
			fireEvent.click(link);
			await advanceTimers();
			expect(router.state.location.pathname).toBe('/posts/one');
			expect(loader).toHaveBeenCalledOnce();
			fireEvent.mouseOver(link);
			view.unmount();
			await advanceTimers(60);
			expect(loader).toHaveBeenCalledOnce();
		},
	);

	it('preloads render and viewport links and disconnects viewport observers', async () => {
		let intersect!: IntersectionObserverCallback;
		const disconnect = vi.fn();
		const observe = vi.fn();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(callback: IntersectionObserverCallback) {
					intersect = callback;
				}
				observe = observe;
				disconnect = disconnect;
			},
		);
		try {
			const loader = vi.fn(() => 'data');
			const { view } = setup(
				() => <>
					<Link to="/posts/$id" params={{ id: 'render' }} preload="render">Render</Link>
					<Link to="/posts/$id" params={{ id: 'viewport' }} preload="viewport">Viewport</Link>
				</>,
				{ loader },
			);
			await waitFor(() => expect(loader).toHaveBeenCalledOnce());
			expect(observe).toHaveBeenCalledOnce();
			intersect([{ isIntersecting: true }] as any, {} as any);
			await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
			expect(disconnect).toHaveBeenCalled();
			view.unmount();
			expect(disconnect).toHaveBeenCalledTimes(2);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
