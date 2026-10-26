import { flushSync, mount, track } from 'ripple';
import { ComponentCallCleanup } from '../hydration/components/component-call-cleanup.tsrx';

function Leaf({ label }) @{
	<button class="child">{label}</button>
}

function Child({ items }) @{
	@for (const key of items.value; key key) {
		<>
			{Leaf({ label: key })}
		</>
	}
}

function Example({ native, initial, state }) @{
	const shown = track(false);
	const items = track(initial);
	state.items = items;
	<section>
		<button id="toggle" onClick={() => (shown.value = !shown.value)}>Toggle</button>
		@if (shown.value) {
			@try {
				@if (native) {
					<Child {items} />
				} @else {
					<>
						{Child({ items })}
					</>
				}
			} @catch {
				<button>Error</button>
			}
		}
	</section>
}

describe('component call DOM ownership (#1570)', () => {
	it.each([false, true])('removes the reported nested component call (native: %s)', (native) => {
		const unmount = mount(ComponentCallCleanup, {
			target: container,
			props: { native, initialShown: false },
		});
		const toggle = container.querySelector<HTMLButtonElement>('#toggle')!;
		const counts = [container.querySelectorAll('.child').length];
		try {
			for (let i = 0; i < 3; i++) {
				toggle.click();
				flushSync();
				counts.push(container.querySelectorAll('.child').length);
			}
			expect(counts).toEqual([0, 1, 0, 1]);
		} finally {
			unmount();
		}
		expect(container.childNodes.length).toBe(0);
	});

	it.each([false, true])('removes keyed children when hidden (native: %s)', (native) => {
		const unmount = mount(Example, {
			target: container,
			props: { native, initial: ['Child'], state: {} },
		});
		const toggle = container.querySelector<HTMLButtonElement>('#toggle')!;
		const counts = [container.querySelectorAll('.child').length];

		for (let i = 0; i < 3; i++) {
			toggle.click();
			flushSync();
			counts.push(container.querySelectorAll('.child').length);
		}

		expect(counts).toEqual([0, 1, 0, 1]);
		unmount();
		expect(container.childNodes.length).toBe(0);
	});

	it.each([{ initial: [] }, { initial: ['a'] }])(
		'keeps the range valid as keyed children change from $initial',
		({ initial }) => {
			const state = {};
			const unmount = mount(Example, {
				target: container,
				props: { native: false, initial, state },
			});
			const toggle = container.querySelector<HTMLButtonElement>('#toggle')!;
			toggle.click();
			flushSync();

			for (const next of [['b', 'c'], ['c', 'b'], [], ['d']]) {
				state.items.value = next;
				flushSync();
				expect([...container.querySelectorAll('.child')].map((node) => node.textContent)).toEqual(
					next,
				);
			}

			toggle.click();
			flushSync();
			expect(container.querySelectorAll('button').length).toBe(1);
			toggle.click();
			flushSync();
			expect([...container.querySelectorAll('.child')].map((node) => node.textContent)).toEqual([
				'd',
			]);
			unmount();
			expect(container.childNodes.length).toBe(0);
		},
	);

	it('moves nested component calls with their keyed item', () => {
		let items;
		function App() @{
			items = track(['a', 'b', 'c']);
			@for (const key of items.value; key key) {
				<>
					{Child({ items: { value: [key] } })}
				</>
			}
		}
		const unmount = mount(App, { target: container });

		for (const next of [['c', 'b', 'a'], ['b'], []]) {
			items.value = next;
			flushSync();
			expect([...container.querySelectorAll('.child')].map((node) => node.textContent)).toEqual(
				next,
			);
		}

		unmount();
		expect(container.childNodes.length).toBe(0);
	});
});
