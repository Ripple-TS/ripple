import {
	createRenderObserver,
	effect,
	flushSync,
	mount,
	trackAsync,
	type Component,
	type RenderObserver,
	type Tracked,
} from 'ripple';
import { create_library_value } from './library-value.js';

const disposers: Array<() => void> = [];
function mountTest(component: Component) {
	const dispose = mount(component, { target: container });
	disposers.push(dispose);
	flushSync();
	return dispose;
}
afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
});

async function settle() {
	await Promise.resolve();
	flushSync();
	await Promise.resolve();
}

describe('library-owned tracked values', () => {
	it('can be created before mount, retain functions, and outlive the creating component', () => {
		const callback = vi.fn(() => 1);
		const literal = create_library_value(callback);
		expect(literal.value).toBe(callback);
		expect(callback).not.toHaveBeenCalled();
		let shared: Tracked<number>;
		function Creator() @{
			shared = create_library_value(1);
			<p>{shared.value}</p>
		}
		const dispose = mountTest(Creator);
		dispose();
		shared!.value = 2;
		function Reader() {
			return <p>{shared.value}</p>;
		}
		const disposeReader = mountTest(Reader);
		expect(container.textContent).toBe('2');
		shared!.value = 3;
		flushSync();
		expect(container.textContent).toBe('3');
		disposeReader();
		expect(Reflect.get(shared!, 'sb')).toBeNull();
	});

	it('preserves the departing value during a reader teardown', () => {
		const value = create_library_value(1);
		const visible = create_library_value(true);
		const seen: number[] = [];
		function Child() @{
			effect(() => () => seen.push(value.value));
			<p>{value.value}</p>
		}
		function App() @{
			@if (visible.value) {
				<Child />
			}
		}
		mountTest(App);
		flushSync(() => {
			visible.value = false;
			value.value = 2;
		});
		expect(seen).toEqual([1]);
		expect(value.value).toBe(2);
	});
});

describe('render observers', () => {
	it('does not wait for an unrelated sibling that shares its render block', async () => {
		const count = create_library_value(0);
		const pending = Promise.withResolvers<string>();
		let observer: RenderObserver;
		function Observed() @{
			observer = createRenderObserver();
			<p>{count.value}</p>
		}
		function Unrelated() @{
			const data = trackAsync(() => pending.promise);
			<p>{data.value}</p>
		}
		function App() @{
			<>
				<Observed />
				@try {
					<Unrelated />
				} @pending {
					<p>busy</p>
				}
			</>
		}
		mountTest(App);
		expect(
			await observer!.run(() => {
				count.value = 1;
			}),
		).toBe(true);
		expect(container.textContent).toContain('1');
		pending.resolve('done');
		await settle();
	});

	it('removing an async child releases its request in a surviving boundary', async () => {
		const visible = create_library_value(true);
		const pending = Promise.withResolvers<string>();
		let observer: RenderObserver;
		function Child() @{
			const data = trackAsync(() => pending.promise);
			<p>{data.value}</p>
		}
		function App() @{
			observer = createRenderObserver();
			@try {
				@if (visible.value) {
					<Child />
				} @else {
					<p>hidden</p>
				}
			} @pending {
				<p>loading</p>
			}
		}
		mountTest(App);
		await settle();
		expect(container.textContent).toBe('loading');
		expect(
			await observer!.run(() => {
				visible.value = false;
			}),
		).toBe(true);
		expect(container.textContent).toBe('hidden');
		pending.resolve('obsolete');
		await settle();
		expect(container.textContent).toBe('hidden');
	});

	it('acknowledges committed DOM and effects without a timer', async () => {
		const count = create_library_value(0);
		let observer: RenderObserver;
		const seen: number[] = [];
		function App() @{
			observer = createRenderObserver();
			effect(() => {
				seen.push(count.value);
			});
			<p>{count.value}</p>
		}
		mountTest(App);
		expect(
			await observer!.run(() => {
				count.value = 1;
			}),
		).toBe(true);
		expect(container.textContent).toBe('1');
		expect(seen).toEqual([0, 1]);
	});

	it(
		'awaits newly suspended rendering, supersedes old runs, and ignores stale completion',
		async () => {
			const revision = create_library_value(0);
			const first = Promise.withResolvers<number>();
			const second = Promise.withResolvers<number>();
			let observer: RenderObserver;
			function App() @{
				observer = createRenderObserver();
				const data = trackAsync(
					() => revision.value === 1
						? first.promise
						: revision.value === 2
							? second.promise
							: Promise.resolve(0),
				);
				<p>{data.value}</p>
			}
			mountTest(App);
			await settle();
			const one = observer!.run(() => {
				revision.value = 1;
			});
			const two = observer!.run(() => {
				revision.value = 2;
			});
			expect(await one).toBe(false);
			let completed = false;
			void two.then(() => {
				completed = true;
			});
			first.resolve(1);
			await settle();
			expect(completed).toBe(false);
			expect(container.textContent).toBe('0');
			second.resolve(2);
			expect(await two).toBe(true);
			expect(container.textContent).toBe('2');
		},
	);

	it(
		'a successor that does not restart async work still waits for the inherited render',
		async () => {
			const revision = create_library_value(0);
			const pending = Promise.withResolvers<number>();
			let observer: RenderObserver;
			function App() @{
				observer = createRenderObserver();
				const data = trackAsync(() => revision.value ? pending.promise : Promise.resolve(0));
				<p>{data.value}</p>
			}
			mountTest(App);
			await settle();
			const first = observer!.run(() => {
				revision.value = 1;
			});
			const second = observer!.run(() => {});
			expect(await first).toBe(false);
			let completed = false;
			void second.then(() => {
				completed = true;
			});
			await settle();
			expect(completed).toBe(false);
			pending.resolve(1);
			expect(await second).toBe(true);
			expect(container.textContent).toBe('1');
		},
	);

	it('unmount settles pending runs and prevents later updates', async () => {
		const enabled = create_library_value(false);
		const pending = Promise.withResolvers<string>();
		let observer: RenderObserver;
		function App() @{
			observer = createRenderObserver();
			const data = trackAsync(() => enabled.value ? pending.promise : Promise.resolve('ready'));
			<p>{data.value}</p>
		}
		const dispose = mountTest(App);
		await settle();
		const result = observer!.run(() => {
			enabled.value = true;
		});
		dispose();
		expect(await result).toBe(false);
		const update = vi.fn();
		expect(await observer!.run(update)).toBe(false);
		expect(update).not.toHaveBeenCalled();
		pending.resolve('late');
		await settle();
		expect(container.textContent).toBe('');
	});

	it('rejects a failed update and remains usable for a later update', async () => {
		const count = create_library_value(0);
		let observer: RenderObserver;
		function App() @{
			observer = createRenderObserver();
			<p>{count.value}</p>
		}
		mountTest(App);
		await expect(
			observer!.run(() => {
				count.value = 1;
				throw new Error('failed');
			}),
		).rejects.toThrow('failed');
		expect(container.textContent).toBe('1');
		expect(
			await observer!.run(() => {
				count.value = 2;
			}),
		).toBe(true);
		expect(container.textContent).toBe('2');
	});

	it('bubbles an error thrown from a catch branch to its parent boundary', () => {
		function Failing() {
			throw new Error('original');
		}
		function App() @{
			@try {
				@try {
					<Failing />
				} @catch {
					throw new Error('fallback failed');
					<></>
				}
			} @catch (error) {
				<p>{error.message}</p>
			}
		}
		mountTest(App);
		expect(container.textContent).toBe('fallback failed');
	});

	it('waits for asynchronous errors to render through a nested catch boundary', async () => {
		const enabled = create_library_value(false);
		const pending = Promise.withResolvers<string>();
		let observer: RenderObserver;
		function Child() @{
			const data = trackAsync(() => enabled.value ? pending.promise : Promise.resolve('ready'));
			<p>{data.value}</p>
		}
		function App() @{
			observer = createRenderObserver();
			@try {
				<Child />
			} @pending {
				<p>Pending</p>
			} @catch (error) {
				<p>{error.message}</p>
			}
		}
		mountTest(App);
		await settle();
		const result = observer!.run(() => {
			enabled.value = true;
		});
		pending.reject(new Error('failure UI'));
		expect(await result).toBe(true);
		expect(container.textContent).toBe('failure UI');
	});
});
