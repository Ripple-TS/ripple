import type { Derived, Tracked } from 'ripple';
import { effect, flushSync, track } from 'ripple';

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

describe('derived release across reruns', () => {
	it('keeps track of deriveds across reruns that stay on the same branch', () => {
		let bump: () => void = () => {};
		let reset: () => void = () => {};
		let source: Tracked<number> | undefined;

		function App() @{
			const count = track(1);
			source = count;
			bump = () => {
				count.value++;
			};
			reset = () => {
				count.value = 0;
			};
			<>
				@if (count.value > 0) {
					const double = track(() => count.value * 2);
					<p class="double">{double.value}</p>
				}
			</>
		}

		render(App);
		flushSync();
		// The if block reads `count` for its condition; the derived is the other subscriber.
		const before = subscribers(source!) - 1;

		// Same branch on every rerun: nothing is created, nothing accumulates.
		for (let i = 0; i < 4; i++) {
			bump();
			flushSync();
			expect(container.querySelector('.double')!.textContent).toBe(String((i + 2) * 2));
			expect(subscribers(source!)).toBe(before + 1);
		}

		// The branch finally goes away: its derived goes with it.
		reset();
		flushSync();
		expect(container.querySelector('.double')).toBeNull();
		expect(subscribers(source!)).toBe(before);
	});

	it('releases a derived a render expression created and read on its previous run', () => {
		let bump: () => void = () => {};
		let source: Tracked<number> | undefined;

		function App() @{
			const count = track(0);
			source = count;
			bump = () => {
				count.value++;
			};
			<p class="value">{track(() => count.value * 10).value}</p>
		}

		render(App);
		flushSync();
		expect(container.querySelector('.value')!.textContent).toBe('0');
		expect(subscribers(source!)).toBe(1);

		// Each rerun creates a new derived and the previous one is released, so
		// the source never sees more than the current one.
		for (let i = 1; i <= 5; i++) {
			bump();
			flushSync();
			expect(container.querySelector('.value')!.textContent).toBe(String(i * 10));
			expect(subscribers(source!)).toBe(1);
		}
	});

	it('releases a chain of deriveds after reruns that kept them, whatever their count', () => {
		let bump: () => void = () => {};
		let reset: () => void = () => {};
		let source: Tracked<number> | undefined;

		function App() @{
			const count = track(1);
			source = count;
			bump = () => {
				count.value++;
			};
			reset = () => {
				count.value = 0;
			};
			<>
				@if (count.value > 0) {
					// `second` reads `first`; a release must visit `second` before
					// `first`, in every pass, or `first` looks alive and survives.
					const first = track(() => count.value * 2);
					const second = track(() => first.value + 1);
					<p class="second">{second.value}</p>
				}
			</>
		}

		render(App);
		flushSync();
		const before = subscribers(source!) - 1;

		for (const same_branch_reruns of [1, 3, 2]) {
			for (let i = 0; i < same_branch_reruns; i++) {
				bump();
				flushSync();
			}
			expect(subscribers(source!)).toBe(before + 1);
			reset();
			flushSync();
			expect(container.querySelector('.second')).toBeNull();
			expect(subscribers(source!)).toBe(before);
			bump();
			flushSync();
			expect(container.querySelector('.second')!.textContent).toBe('3');
		}
	});

	it('releases a derived an effect created and read on its previous run', () => {
		let bump: () => void = () => {};
		let source: Tracked<number> | undefined;
		const seen: number[] = [];

		function App() @{
			const count = track(0);
			source = count;
			bump = () => {
				count.value++;
			};
			effect(() => {
				// On even counts the run makes a derived and reads it; on odd counts
				// it does not, so the block's stale link to the previous run's
				// derived is still in place when that derived is released. It must
				// not count as a live reader.
				const n = count.value;
				if (n % 2 === 0) {
					const tenfold = track(() => count.value * 10);
					seen.push(tenfold.value);
				} else {
					seen.push(-1);
				}
			});
			<p>{count.value}</p>
		}

		render(App);
		flushSync();
		expect(seen).toEqual([0]);
		const before = subscribers(source!);

		for (let i = 1; i <= 6; i++) {
			bump();
			flushSync();
			expect(seen.at(-1)).toBe(i % 2 === 0 ? i * 10 : -1);
			// Only the current run's derived, if any, is subscribed.
			expect(subscribers(source!)).toBe(before - i % 2);
		}
	});

	it('still releases deriveds when the rerun throws into a catch boundary', () => {
		let fail: () => void = () => {};
		let source: Tracked<number> | undefined;

		function App() @{
			const count = track(1);
			const broken = track(false);
			source = count;
			fail = () => {
				broken.value = true;
			};
			<>
				@try {
					@if (broken.value ? boom() : count.value > 0) {
						const double = track(() => count.value * 2);
						<p class="double">{double.value}</p>
					}
				} @catch (error) {
					<p class="error">{'failed'}</p>
				}
			</>
		}

		function boom(): boolean {
			throw new Error('condition failed');
		}

		render(App);
		flushSync();
		expect(container.querySelector('.double')!.textContent).toBe('2');
		const with_branch = subscribers(source!);

		// The if block's rerun throws before it can release anything; the
		// boundary then tears the if block down, which must still find them.
		fail();
		flushSync();
		expect(container.querySelector('.error')).not.toBeNull();
		expect(container.querySelector('.double')).toBeNull();
		expect(subscribers(source!)).toBeLessThan(with_branch);
		expect(subscribers(source!)).toBe(0);
	});
});
