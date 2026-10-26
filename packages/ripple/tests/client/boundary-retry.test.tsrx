import { effect, flushSync, mount } from 'ripple';

it('recovers after repeated synchronous failures during catch resets', () => {
	let attempts = 0;
	let cleanups = 0;
	let retry!: () => void;
	function Content() @{
		effect(
			() => () => {
				cleanups++;
			},
		);
		if (++attempts < 3) throw new Error('Try again');
		<p>Recovered</p>
	}
	function App() @{
		@try {
			<Content />
		} @catch (error, reset) {
			retry = reset;
			<p>{(error as Error).message}</p>
		}
	}
	const dispose = mount(App, { target: container });
	flushSync();
	expect(container.textContent).toBe('Try again');
	retry();
	flushSync();
	expect(container.textContent).toBe('Try again');
	retry();
	flushSync();
	expect(container.textContent).toBe('Recovered');
	expect(attempts).toBe(3);
	dispose();
	expect(cleanups).toBe(1);
});
