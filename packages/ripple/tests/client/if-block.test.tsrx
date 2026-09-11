import { describe, it, expect } from 'vitest';
import { flushSync, track, type Tracked } from 'ripple';

// `if_block` probes its condition once: a condition that reads no tracked
// state renders its branch with no block, a dynamic one gets a block whose
// own first run subscribes it. The dependencies the probe recorded are never
// handed to the block: a write during the branch's first render (a child's
// setup here) would prune them before the block could take them over.

describe('if block', () => {
	it('keeps re-evaluating when the first branch render writes the condition state', () => {
		let set: (value: number) => void = () => {};

		function Bumper(props: { n: Tracked<number> }) @{
			// Writes the value the parent's condition depends on, while the
			// parent's if is rendering this branch for the first time.
			props.n.value = props.n.value + 1;
			<span>{'bumped ' + props.n.value}</span>
		}

		function App() @{
			const n = track(0);
			set = (value) => {
				n.value = value;
			};
			@if (n.value < 5) {
				<Bumper {n} />
			} @else {
				<p>{'done'}</p>
			}
		}

		render(App);
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('bumped 1');

		set(7);
		flushSync();
		expect(container.querySelector('span')).toBeNull();
		expect(container.querySelector('p')?.textContent).toBe('done');

		set(0);
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('bumped 1');
	});

	it('renders a static condition with no block and keeps a dynamic one live', () => {
		let toggle: () => void = () => {};

		function App(props: { fixed: boolean }) @{
			let &[on] = track(false);
			toggle = () => {
				on = !on;
			};
			<>
				@if (props.fixed) {
					<b>{'fixed'}</b>
				}
				@if (on) {
					<i>{'on'}</i>
				} @else {
					<i>{'off'}</i>
				}
			</>
		}

		function Root() @{
			<App fixed={true} />
		}

		render(Root);
		expect(container.querySelector('b')?.textContent).toBe('fixed');
		expect(container.querySelector('i')?.textContent).toBe('off');

		toggle();
		flushSync();
		expect(container.querySelector('i')?.textContent).toBe('on');
		expect(container.querySelector('b')?.textContent).toBe('fixed');
	});
});
