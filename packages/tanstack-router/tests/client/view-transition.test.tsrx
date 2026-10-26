import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createRootRoute,
	createRoute,
	createRouter,
	createMemoryHistory,
	createControlledPromise,
	RouterProvider,
	Outlet,
} from '@ripple-ts/tanstack-router';
import { render, waitFor } from '../harness.js';

type Update = () => Promise<void>;
type TransitionInput = Update | { update: Update; types: string[] };
const original = Object.getOwnPropertyDescriptor(document, 'startViewTransition');
afterEach(() => {
	if (original) Object.defineProperty(document, 'startViewTransition', original);
	else Reflect.deleteProperty(document, 'startViewTransition');
	vi.unstubAllGlobals();
});

function stubTransition(start: (input: TransitionInput) => unknown) {
	Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
}

async function setup(defaultViewTransition = false) {
	const root = createRootRoute({ component: () => <Outlet /> });
	const a = createRoute({ getParentRoute: () => root, path: '/a', component: () => <p>A</p> });
	const b = createRoute({ getParentRoute: () => root, path: '/b', component: () => <p>B</p> });
	const c = createRoute({ getParentRoute: () => root, path: '/c', component: () => <p>C</p> });
	const router = createRouter({
		routeTree: root.addChildren([a, b, c]),
		history: createMemoryHistory({ initialEntries: ['/a'] }),
	});
	function App() {
		return <RouterProvider {router} />;
	}
	const view = render(App);
	await view.findByText('A');
	await waitFor(() => expect(router.state.status).toBe('idle'));
	// Enable after initial rendering so each test isolates a navigation.
	router.update({ ...router.options, defaultViewTransition });
	return { router, view };
}

describe('core-owned native view transitions', () => {
	it('commits inside the update callback and does not wait for animation finished', async () => {
		const { router, view } = await setup();
		const finished = createControlledPromise<void>();
		const snapshots: string[] = [];
		const start = vi.fn((input: TransitionInput) => {
			const update =
				typeof input === 'function' ? input : input.update;
			snapshots.push(view.container.textContent!);
			const updateCallbackDone = Promise.resolve().then(update).then(() => {
				snapshots.push(view.container.textContent!);
			});
			return { updateCallbackDone, finished };
		});
		stubTransition(start);
		await router.navigate({ to: '/b', viewTransition: true });
		expect(snapshots).toEqual(['A', 'B']);
		expect(start).toHaveBeenCalledTimes(1);
		expect(finished.status).toBe('pending');
		finished.resolve();
	});

	it('ignores a superseded navigation when the browser delays its callback', async () => {
		const { router, view } = await setup(true);
		const calls: Array<{
			update: Update;
			done: ReturnType<typeof createControlledPromise<void>>;
		}> = [];
		stubTransition((input) => {
			const done = createControlledPromise<void>();
			calls.push({ update: typeof input === 'function' ? input : input.update, done });
			return { updateCallbackDone: done, finished: Promise.resolve() };
		});
		const obsolete = router.navigate({ to: '/b' });
		await waitFor(() => expect(calls).toHaveLength(1));
		const latest = router.navigate({ to: '/c' });
		await waitFor(() => expect(calls).toHaveLength(2));
		await calls[1].update();
		calls[1].done.resolve();
		await latest;
		await calls[0].update();
		calls[0].done.resolve();
		await obsolete;
		expect(view.getByText('C')).toBeTruthy();
		expect(view.queryByText('B')).toBeNull();
	});

	it('supports typed transitions and per-navigation opt-out', async () => {
		const { router, view } = await setup(true);
		vi.stubGlobal('CSS', { supports: () => true });
		const start = vi.fn(
			(input: TransitionInput) => ({
				updateCallbackDone: (typeof input === 'function' ? input : input.update)(),
			}),
		);
		stubTransition(start);
		await router.navigate({ to: '/b', viewTransition: { types: ['forward'] } });
		expect(start.mock.calls[0][0]).toMatchObject({ types: ['forward'] });
		await router.navigate({ to: '/c', viewTransition: false });
		expect(start).toHaveBeenCalledTimes(1);
		expect(view.getByText('C')).toBeTruthy();
	});

	it('falls back when native transitions or transition types are unavailable', async () => {
		const { router, view } = await setup(true);
		Reflect.deleteProperty(document, 'startViewTransition');
		await router.navigate({ to: '/b' });
		expect(view.getByText('B')).toBeTruthy();
		vi.stubGlobal('CSS', { supports: () => false });
		const start = vi.fn(
			(input: TransitionInput) => ({
				updateCallbackDone: (typeof input === 'function' ? input : input.update)(),
			}),
		);
		stubTransition(start);
		await router.navigate({ to: '/c', viewTransition: { types: ['forward'] } });
		expect(typeof start.mock.calls[0][0]).toBe('function');
		expect(view.getByText('C')).toBeTruthy();
	});

	it('recovers from a throwing types callback on a later navigation', async () => {
		const { router, view } = await setup();
		vi.stubGlobal('CSS', { supports: () => true });
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const start = vi.fn();
		stubTransition(start);
		const failed = router.navigate({
			to: '/b',
			viewTransition: {
				types: () => {
					throw new Error('types failed');
				},
			},
		});
		await waitFor(() => expect(error).toHaveBeenCalled());
		expect(start).not.toHaveBeenCalled();
		await router.navigate({ to: '/c', viewTransition: false });
		await failed;
		expect(view.getByText('C')).toBeTruthy();
	});
});
