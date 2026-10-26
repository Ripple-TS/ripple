import { effect, isTracked, mount, track, trackReadOnly, flushSync } from 'ripple';

it('recognizes tracked values and derived views without reading them or subscribing', () => {
	let update!: () => void;
	let runs = 0;
	let evaluated = 0;
	function App() @{
		const source = track(1);
		const computed = track(() => {
			evaluated++;
			return source.value * 2;
		});
		const readonly = trackReadOnly(source);
		const writable = track(() => source.value, undefined, true);
		const plain = {
			get value() {
				throw new Error('must not read value');
			},
		};
		for (const value of [source, computed, readonly, writable]) expect(isTracked(value)).toBe(true);
		for (const value of [plain, { f: 1 }, {}, null, undefined, 1, 'value', () => 1]) expect(
			isTracked(value),
		).toBe(false);
		effect(() => {
			runs++;
			expect(isTracked(computed)).toBe(true);
		});
		update = () => {
			source.value++;
		};
		<p>Ready</p>
	}
	const dispose = mount(App, { target: container });
	flushSync();
	update();
	flushSync();
	expect(evaluated).toBe(0);
	expect(runs).toBe(1);
	dispose();
});
