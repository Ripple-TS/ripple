import type { Derived, Tracked } from 'ripple';
import { flushSync, track } from 'ripple';

/** The runtime's own subscriber list of a tracked value (`sb` / `sn`). */
function subscribers(source: Tracked<number>) {
	let n = 0;
	for (let d = (source as any).sb; d !== null; d = d.sn) n++;
	return n;
}

function Child({ count }: { count: Derived<number> }) @{
	<span class="child">{count.value}</span>
}

describe('derived release', () => {
	it('releases a derived created in an @if branch when the branch toggles off', () => {
		let toggle: () => void = () => {};
		let bump: () => void = () => {};
		let source: Tracked<number> | undefined;

		function App() @{
			const count = track(0);
			const show = track(false);
			source = count;
			toggle = () => {
				show.value = !show.value;
			};
			bump = () => {
				count.value++;
			};
			<>
				<p>{count.value}</p>
				@if (show.value) {
					const label = track(() => 'n=' + count.value);
					<>
						<span class="label">{label.value}</span>
						<Child count={count.readOnly()} />
					</>
				}
			</>
		}

		render(App);
		flushSync();
		const before = subscribers(source!);

		for (let i = 0; i < 5; i++) {
			toggle();
			flushSync();
			expect(container.querySelector('.label')!.textContent).toBe(`n=${i}`);
			expect(subscribers(source!)).toBe(before + 2);
			toggle();
			flushSync();
			// Both deriveds of the old branch are gone before the next write.
			expect(subscribers(source!)).toBe(before);
			bump();
			flushSync();
			expect(subscribers(source!)).toBe(before);
		}
	});

	it('releases deriveds created in keyed @for items when the items are removed', () => {
		let set_rows: (rows: number[]) => void = () => {};
		let source: Tracked<number> | undefined;

		function App() @{
			const count = track(0);
			const rows = track<number[]>([]);
			source = count;
			set_rows = (next) => {
				rows.value = next;
			};
			<ul>
				@for (const row of rows.value; key row) {
					<li>
						<Child count={count.readOnly()} />
					</li>
				}
			</ul>
		}

		render(App);
		flushSync();
		set_rows([1, 2, 3]);
		flushSync();
		expect(subscribers(source!)).toBe(3);

		set_rows([2]);
		flushSync();
		expect(subscribers(source!)).toBe(1);

		set_rows([]);
		flushSync();
		expect(subscribers(source!)).toBe(0);
	});

	it('releases a derived created in component setup when the component unmounts', () => {
		let toggle: () => void = () => {};
		let source: Tracked<number> | undefined;

		function Doubled({ count }: { count: Tracked<number> }) @{
			const double = track(() => count.value * 2);
			<span class="double">{double.value}</span>
		}

		function App() @{
			const count = track(1);
			const show = track(true);
			source = count;
			toggle = () => {
				show.value = !show.value;
			};
			<>
				@if (show.value) {
					<Doubled {count} />
				}
			</>
		}

		render(App);
		flushSync();
		expect(container.querySelector('.double')!.textContent).toBe('2');
		expect(subscribers(source!)).toBe(1);

		toggle();
		flushSync();
		expect(container.querySelector('.double')).toBeNull();
		expect(subscribers(source!)).toBe(0);
	});

	it('keeps a derived that a longer-lived reader still holds', () => {
		let toggle: () => void = () => {};
		let bump: () => void = () => {};

		function App() @{
			const count = track(1);
			const show = track(true);
			const held = track<Derived<number> | null>(null);
			toggle = () => {
				show.value = !show.value;
			};
			bump = () => {
				count.value++;
			};
			<>
				<p class="outer">
					{held.value === null ? '-' : held.value.value}
				</p>
				@if (show.value) {
					const double = track(() => count.value * 2);
					held.value = double;
					<span class="inner">{double.value}</span>
				}
			</>
		}

		render(App);
		flushSync();
		expect(container.querySelector('.outer')!.textContent).toBe('2');

		// The branch that created the derived is gone, but the outer text still
		// reads it, so it stays subscribed and keeps following the source.
		toggle();
		flushSync();
		expect(container.querySelector('.inner')).toBeNull();
		bump();
		flushSync();
		expect(container.querySelector('.outer')!.textContent).toBe('4');
	});
});
