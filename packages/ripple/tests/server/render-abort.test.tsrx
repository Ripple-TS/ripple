import { trackAsync } from 'ripple';
import { render } from 'ripple/server';

it('rejects an already aborted render without invoking the component', async () => {
	const controller = new AbortController();
	const reason = new Error('aborted');
	controller.abort(reason);
	const component = vi.fn();
	await expect(render(component, { signal: controller.signal })).rejects.toBe(reason);
	expect(component).not.toHaveBeenCalled();
});

it.each([false, true])('cancels pending rendering and ignores late completion (stream=%s)', async (
	stream,
) => {
	const controller = new AbortController();
	const work = new AbortController();
	let resolve!: (value: string) => void;
	const promise = new Promise<string>((r) => {
		resolve = r;
	});
	function App() @{
		const value = trackAsync(() => ({ promise, abortController: work }));
		<p>{value.value}</p>
	}
	const sink = { push: vi.fn(), close: vi.fn(), error: vi.fn() };
	const done = render(App, { signal: controller.signal, ...(stream ? { stream: sink } : {}) });
	const reason = new Error('connection closed');
	controller.abort(reason);
	await expect(done).rejects.toBe(reason);
	expect(work.signal.aborted).toBe(true);
	const calls = sink.push.mock.calls.length;
	resolve('must not render');
	await Promise.resolve();
	await Promise.resolve();
	expect(sink.push).toHaveBeenCalledTimes(calls);
	expect(sink.close).not.toHaveBeenCalled();
	if (stream) expect(sink.error).toHaveBeenCalledExactlyOnceWith(reason);
});

it('aborts async work started in a catch branch', async () => {
	const controller = new AbortController();
	const work = new AbortController();
	function Pending() @{
		const value = trackAsync(
			() => ({ promise: new Promise<string>(() => {}), abortController: work }),
		);
		<p>{value.value}</p>
	}
	function Broken() @{
		throw new Error('render failed');
		<></>
	}
	function App() @{
		@try {
			<Broken />
		} @catch {
			<Pending />
		}
	}
	const done = render(App, { signal: controller.signal });
	controller.abort();
	await expect(done).rejects.toMatchObject({ name: 'AbortError' });
	expect(work.signal.aborted).toBe(true);
});

it('removes its abort listener after normal completion', async () => {
	const controller = new AbortController();
	const add = vi.spyOn(controller.signal, 'addEventListener');
	const remove = vi.spyOn(controller.signal, 'removeEventListener');
	await render(() => <p>done</p>, { signal: controller.signal });
	expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0][1]);
	controller.abort();
});

it('errors the sink if setup aborts before the shell is sent', async () => {
	const controller = new AbortController();
	const reason = new Error('setup abort');
	const sink = { push: vi.fn(), close: vi.fn(), error: vi.fn() };
	function App() @{
		controller.abort(reason);
		<p>Unsent</p>
	}
	await expect(render(App, { signal: controller.signal, stream: sink })).rejects.toBe(reason);
	expect(sink.push).not.toHaveBeenCalled();
	expect(sink.close).not.toHaveBeenCalled();
	expect(sink.error).toHaveBeenCalledExactlyOnceWith(reason);
});
