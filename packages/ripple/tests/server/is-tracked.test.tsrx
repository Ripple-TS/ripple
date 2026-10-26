import { isTracked, track, trackReadOnly } from 'ripple';

it(
	'recognizes server tracked values without evaluating derived values or ordinary getters',
	async () => {
		let evaluated = 0;
		function App() @{
			const source = track(1);
			const computed = track(() => {
				evaluated++;
				return source.value;
			});
			const writable = track(() => source.value, undefined, true);
			for (const value of [source, computed, writable, trackReadOnly(source)]) expect(
				isTracked(value),
			).toBe(true);
			for (const value of [
				{ get value() {
					throw new Error('must not read');
				} },
				{ f: 1 },
				{},
				null,
				undefined,
				() => 1,
			]) expect(isTracked(value)).toBe(false);
			<p>Ready</p>
		}
		await render(App);
		expect(evaluated).toBe(0);
	},
);
