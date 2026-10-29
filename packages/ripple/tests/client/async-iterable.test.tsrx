import {
	effect,
	flushSync,
	getTrackedStatus,
	mount,
	track,
	trackAsync,
	type Tracked,
} from 'ripple';
import { RpcTransportError } from '../../src/utils/rpc-stream.js';

function source<T>() {
	let resolve: (value: IteratorResult<T>) => void;
	let reject: (error: unknown) => void;
	const close = vi.fn(async () => ({ done: true as const, value: undefined }));
	return {
		close,
		get started() {
			return resolve !== undefined;
		},
		yield: (value: T) => resolve({ done: false, value }),
		end: () => resolve({ done: true, value: undefined }),
		fail: (error: unknown) => reject(error),
		[Symbol.asyncIterator]() {
			return {
				next: () => new Promise<IteratorResult<T>>((yes, no) => {
					resolve = yes;
					reject = no;
				}),
				return: close,
			};
		},
	};
}
const settle = async () => {
	await new Promise((resolve) => setTimeout(resolve, 0));
	flushSync();
};

describe('trackAsync iterables', () => {
	it(
		'publishes replacements, keeps reads available, and completes without a data publication',
		async () => {
			const stream = source<number | undefined>();
			let result: Tracked<number | undefined>;
			let setups = 0;
			const values: unknown[] = [];
			const statuses: unknown[] = [];
			function App() @{
				setups++;
				result = trackAsync(() => stream);
				effect(() => {
					values.push(result.value);
				});
				effect(() => {
					statuses.push(getTrackedStatus(result));
				});
				<p>{String(result.value)}</p>
			}
			const unmount = mount(App, { target: container });
			await settle();
			expect(getTrackedStatus(result!)).toEqual({ state: 'pending', complete: false });
			await vi.waitFor(() => expect(stream.started).toBe(true));
			stream.yield(undefined);
			await settle();
			expect(result!.value).toBeUndefined();
			expect(getTrackedStatus(result!)).toEqual({ state: 'ready', complete: false });
			const node = container.querySelector('p');
			stream.yield(2);
			await settle();
			expect(result!.value).toBe(2);
			expect(container.querySelector('p')).toBe(node);
			expect(node?.textContent).toBe('2');
			stream.end();
			await settle();
			expect(getTrackedStatus(result!)).toEqual({ state: 'ready', complete: true });
			expect(values).toEqual([undefined, 2]);
			expect(statuses.at(-1)).toEqual({ state: 'ready', complete: true });
			expect(setups).toBe(1);
			unmount();
		},
	);

	it(
		'uses accepted checkpoints, ignores obsolete yields, and allows A to B to A selection',
		async () => {
			const streams = [source<string>(), source<string>(), source<string>()];
			const previous: unknown[] = [];
			let selection: Tracked<string>;
			let value: Tracked<string>;
			function App() @{
				selection = track('A');
				value = trackAsync<string>((last) => {
					selection.value;
					previous.push(last);
					return streams[previous.length - 1];
				});
				<p>{value.value}</p>
			}
			const unmount = mount(App, { target: container });
			await settle();
			streams[0].yield('A:100');
			await settle();
			value!.value = 'optimistic';
			selection!.value = 'B';
			await settle();
			expect(previous).toEqual([undefined, 'A:100']);
			expect(getTrackedStatus(value!).state).toBe('pending');
			streams[0].yield('obsolete');
			streams[1].yield('B:100');
			await settle();
			expect(value!.value).toBe('B:100');
			selection!.value = 'A';
			await settle();
			streams[2].yield('A:300');
			await settle();
			expect(previous).toEqual([undefined, 'A:100', 'B:100']);
			expect(streams[0].close).toHaveBeenCalledTimes(1);
			unmount();
			streams[2].yield('late');
			await settle();
			expect(value!.value).toBe('A:300');
			expect(streams[2].close).toHaveBeenCalledTimes(1);
		},
	);

	it('treats empty completion of a replacement query as unavailable', async () => {
		const streams = [source<number>(), source<number>()];
		let query: Tracked<number>;
		let value: Tracked<number>;
		function App() @{
			query = track(0);
			@try {
				value = trackAsync(() => streams[query.value]);
				<p>{value.value}</p>
			} @catch {
				<p class="error">empty query</p>
			}
		}
		const unmount = mount(App, { target: container });
		await vi.waitFor(() => expect(streams[0].started).toBe(true));
		streams[0].yield(100);
		await settle();
		query!.value++;
		await vi.waitFor(() => expect(streams[1].started).toBe(true));
		streams[1].end();
		await settle();
		expect(getTrackedStatus(value!).state).toBe('error');
		expect(container.querySelector('.error')).not.toBeNull();
		unmount();
	});

	it('reports synchronous replacement failures as error status', async () => {
		let query: Tracked<boolean>;
		let value: Tracked<number>;
		function App() @{
			query = track(false);
			@try {
				value = trackAsync(() => {
					if (query.value) throw new Error('failed query');
					return Promise.resolve(1);
				});
				<p>{value.value}</p>
			} @catch {
				<p class="error">failed</p>
			}
		}
		const unmount = mount(App, { target: container });
		await settle();
		query!.value = true;
		flushSync();
		expect(getTrackedStatus(value!)).toEqual({ state: 'error', complete: false });
		unmount();
	});

	it('aggregates only current derived dependencies, including ready fallbacks', async () => {
		const stream = source<number>();
		let choose: Tracked<boolean>;
		let result: ReturnType<typeof track<number>>;
		let fallback: ReturnType<typeof track<number>>;
		function App() @{
			choose = track(true);
			const pending = trackAsync(() => stream);
			const completed = track(7);
			result = track(() => choose.value ? pending.value : completed.value);
			fallback = track(() => getTrackedStatus(pending).state === 'ready' ? pending.value : 0);
			<>
				<p>{getTrackedStatus(result).state}</p>
				<span>{fallback.value}</span>
			</>
		}
		const unmount = mount(App, { target: container });
		await settle();
		expect(getTrackedStatus(result!)).toEqual({ state: 'pending', complete: false });
		expect(getTrackedStatus(fallback!)).toEqual({ state: 'ready', complete: false });
		stream.yield(5);
		await settle();
		expect(getTrackedStatus(result!)).toEqual({ state: 'ready', complete: false });
		choose!.value = false;
		await settle();
		expect(getTrackedStatus(result!)).toEqual({ state: 'ready', complete: true });
		stream.end();
		await settle();
		expect(getTrackedStatus(fallback!)).toEqual({ state: 'ready', complete: true });
		unmount();
	});

	it('recovers with accepted state and accepts a changed first yield', async () => {
		const streams = [source<number>(), source<number>(), source<number>()];
		const previous: unknown[] = [];
		let value: Tracked<number>;
		function App() @{
			value = trackAsync<number>((last) => {
				previous.push(last);
				return streams[previous.length - 1];
			});
			<p>{value.value}</p>
		}
		const unmount = mount(App, { target: container });
		await settle();
		streams[0].yield(100);
		await settle();
		streams[0].fail(new RpcTransportError('disconnected'));
		await settle();
		expect(value!.value).toBe(100);
		await vi.waitFor(() => expect(previous.length).toBe(2));
		expect(value!.value).toBe(100);
		streams[1].yield(300);
		await settle();
		expect(value!.value).toBe(300);
		streams[1].fail(new RpcTransportError('disconnected again'));
		await vi.waitFor(() => expect(previous.length).toBe(3));
		streams[2].end();
		await settle();
		expect(previous).toEqual([undefined, 100, 300]);
		expect(value!.value).toBe(300);
		expect(getTrackedStatus(value!)).toEqual({ state: 'ready', complete: true });
		unmount();
	});

	it.each(['empty', 'application'])('reports %s failure without retrying', async (failure) => {
		let value: Tracked<number>;
		const compute = vi.fn(async function* () {
			if (failure === 'application') throw new Error('failed');
		});
		function App() @{
			@try {
				value = trackAsync(compute);
				<p>{value.value}</p>
			} @pending {
				<p>pending</p>
			} @catch (error: Error) {
				<p class="error">{error.message}</p>
			}
		}
		const unmount = mount(App, { target: container });
		await settle();
		expect(getTrackedStatus(value!)).toEqual({ state: 'error', complete: false });
		expect(container.querySelector('.error')).not.toBeNull();
		expect(compute).toHaveBeenCalledTimes(1);
		unmount();
	});

	it('keeps synchronous iterables as promise values and supports chaining', async () => {
		function App() @{
			const values = trackAsync(() => Promise.resolve([1, 2]));
			const sum = trackAsync(() => Promise.resolve(values.value.reduce((a, b) => a + b, 0)));
			<p>{sum.value}</p>
		}
		const unmount = mount(App, { target: container });
		await settle();
		expect(container.querySelector('p')?.textContent).toBe('3');
		unmount();
	});
});

module server {
	export async function* rpcRead(cursor: number) {
		yield cursor;
	}
	export async function rpcMutation() {
		return 1;
	}
}
import { rpcRead, rpcMutation } from server;

const rpcFrame = (sequence: number, kind: string, data: unknown = null) =>
	JSON.stringify([1, sequence, kind, data]) + '\n';

describe('iterable RPC ownership', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('aborts a reader blocked after await on query change and disposal', async () => {
		const signals: AbortSignal[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_url, init) => {
				signals.push(init.signal);
				return new Response(new ReadableStream({}), {
					headers: { 'Content-Type': 'application/x-ripple-stream;v=1' },
				});
			}),
		);
		let query: Tracked<number>;
		function App() @{
			query = track(0);
			const value = trackAsync(() => {
				const cursor = query.value;
				return (async function* () {
					await Promise.resolve();
					const stream = await rpcRead(cursor);
					// prettier-ignore
					for await (const next of stream) yield next;
				})();
			});
			<p>{value.value}</p>
		}
		const unmount = mount(App, { target: container });
		await vi.waitFor(() => expect(signals.length).toBe(1));
		query!.value++;
		await vi.waitFor(() => expect(signals.length).toBe(2));
		expect(signals[0].aborted).toBe(true);
		unmount();
		expect(signals[1].aborted).toBe(true);
	});

	it('does not recover a failed mutation inside an iterable read', async () => {
		let calls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				if (++calls === 1) return new Response(rpcFrame(0, 'v', '[1]') + rpcFrame(1, 'c'), {
					headers: { 'Content-Type': 'application/x-ripple-stream;v=1' },
				});
				throw new TypeError('network unavailable');
			}),
		);
		async function* compute() {
			const stream = await rpcRead(0);
			// prettier-ignore
			for await (const next of stream) yield next;
			await rpcMutation();
		}
		function App() @{
			@try {
				const value = trackAsync(compute);
				<p>{value.value}</p>
			} @catch {
				<p class="error">failed</p>
			}
		}
		const unmount = mount(App, { target: container });
		await vi.waitFor(() => expect(container.querySelector('.error')).not.toBeNull());
		await new Promise((resolve) => setTimeout(resolve, 150));
		expect(calls).toBe(2);
		unmount();
	});

	it('bounds recovery and lets catch reset recreate the source', async () => {
		let calls = 0;
		let failed = true;
		function App() @{
			@try {
				const value = trackAsync(async function* () {
					calls++;
					yield 1;
					if (failed) throw new RpcTransportError('interrupted');
				});
				<p>{value.value}</p>
			} @catch (_error, reset) {
				<button onClick={reset}>retry</button>
			}
		}
		const unmount = mount(App, { target: container });
		await vi.waitFor(() => expect(container.querySelector('button')).not.toBeNull(), {
			timeout: 2000,
		});
		expect(calls).toBe(4);
		failed = false;
		container.querySelector('button')!.click();
		await settle();
		expect(calls).toBe(5);
		expect(container.querySelector('p')?.textContent).toBe('1');
		unmount();
	});
});
