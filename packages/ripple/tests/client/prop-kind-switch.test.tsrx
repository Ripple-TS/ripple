import { describe, it, expect } from 'vitest';
import { flushSync, track, type Derived, type Tracked } from 'ripple';

// What happens when a value that reaches a sink (attribute, text, child
// props) changes kind at runtime: plain value first, tracked or derived later.

describe('prop kind switches at runtime', () => {
	it('element spread: a plain attribute value replaced by a derived is followed', () => {
		let swap: () => void = () => {};
		let bump: () => void = () => {};

		function App() @{
			let &[n] = track(0);
			let &[attrs] = track<{ class: string | Derived<string> }>({ class: 'plain' });
			swap = () => {
				attrs = { class: track(() => 'live-' + n) };
			};
			bump = () => {
				n++;
			};
			<div {...attrs}>{'x'}</div>
		}

		render(App);
		const div = () => container.querySelector('div');
		expect(div()?.className).toBe('plain');

		swap();
		flushSync();
		expect(div()?.className).toBe('live-0');

		// The spread subscribed to the derived when it unwrapped it.
		bump();
		flushSync();
		expect(div()?.className).toBe('live-1');
	});

	it('plain attribute and text: a tracked prop is read through .value', () => {
		let bump: () => void = () => {};

		function Child(props: { cls: Tracked<string>; title: Tracked<string> }) @{
			<div class={props.cls.value}>{props.title.value}</div>
		}

		function App() @{
			const cls = track('a');
			const title = track('t');
			bump = () => {
				cls.value = 'b';
				title.value = 'u';
			};
			<Child {cls} {title} />
		}

		render(App);
		const div = container.querySelector('div');
		expect(div?.className).toBe('a');
		expect(div?.textContent).toBe('t');

		bump();
		flushSync();
		expect(div?.className).toBe('b');
		expect(div?.textContent).toBe('u');
	});

	it(
		'dynamic component: props are re-evaluated when the component changes, not when their inputs do',
		() => {
			let switchComponent: () => void = () => {};
			let bump: () => void = () => {};

			function A(props: { n: number }) @{
				<span class="a">{props.n}</span>
			}
			function B(props: { n: number }) @{
				<span class="b">{props.n}</span>
			}

			function App() @{
				// A function value is a derived: hold the component in a writable one.
				let &[Comp] = track(() => A, undefined, true);
				let &[n] = track(0);
				switchComponent = () => {
					Comp = Comp === A ? B : A;
				};
				bump = () => {
					n++;
				};
				<Comp n={n} />
			}

			render(App);
			expect(container.querySelector('span.a')?.textContent).toBe('0');

			// A prop is a value: the existing instance keeps the number it got.
			bump();
			flushSync();
			expect(container.querySelector('span.a')?.textContent).toBe('0');

			// A new instance reads the literal again.
			switchComponent();
			flushSync();
			expect(container.querySelector('span.b')?.textContent).toBe('1');
		},
	);

	it('a tracked prop whose value becomes a derived: the child must unwrap both levels', () => {
		let swap: () => void = () => {};
		let bump: () => void = () => {};

		function Child(props: { v: Tracked<string | Derived<string>> }) @{
			<span>
				{typeof props.v.value === 'string' ? props.v.value : props.v.value.value}
			</span>
		}

		function App() @{
			let &[n] = track(0);
			const v = track<string | Derived<string>>('plain');
			swap = () => {
				v.value = track(() => 'live-' + n);
			};
			bump = () => {
				n++;
			};
			<Child {v} />
		}

		render(App);
		const span = () => container.querySelector('span');
		expect(span()?.textContent).toBe('plain');

		swap();
		flushSync();
		expect(span()?.textContent).toBe('live-0');

		bump();
		flushSync();
		expect(span()?.textContent).toBe('live-1');
	});
});
