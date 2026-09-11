import { describe, it, expect } from 'vitest';
import { flushSync, track } from 'ripple';

// A plain `let` that is written after its declaration (reassigned in the
// source, or assigned by a `ref` setter) and read by template code is
// compiled to a `{ v }` box, so the module-level functions the compiler
// hoists (`@if` and `@switch` conditions and branches, render blocks) share
// the variable with the component exactly as a closure would. None of these
// variables is reactive: the update is always triggered by a tracked value,
// and the box only has to make sure the hoisted code sees the latest value.

describe('boxed locals', () => {
	it('a reassigned let read by an @if condition is current on re-evaluation', () => {
		let disable: () => void = () => {};
		let bump: () => void = () => {};

		function App() @{
			let &[count] = track(0);
			let enabled = true;
			disable = () => {
				enabled = false;
			};
			bump = () => {
				count++;
			};
			@if (enabled && count > 0) {
				<span>on</span>
			} @else {
				<span>off</span>
			}
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('off');

		bump();
		flushSync();
		expect(text()).toBe('on');

		disable();
		bump();
		flushSync();
		expect(text()).toBe('off');
	});

	it('a reassigned let read inside an @if branch is current when the branch renders', () => {
		let rename: () => void = () => {};
		let toggle: () => void = () => {};

		function App() @{
			let &[show] = track(false);
			let title = 'first';
			rename = () => {
				title = 'second';
			};
			toggle = () => {
				show = !show;
			};
			@if (show) {
				<p>{title}</p>
			}
		}

		render(App);
		expect(container.querySelector('p')).toBeNull();

		rename();
		toggle();
		flushSync();
		expect(container.querySelector('p')?.textContent).toBe('second');
	});

	it('a reassigned let read by a text expression is current on re-evaluation', () => {
		let rename: () => void = () => {};
		let bump: () => void = () => {};

		function App() @{
			let &[count] = track(0);
			let unit = 'ms';
			rename = () => {
				unit = 's';
			};
			bump = () => {
				count++;
			};
			<p>{count + unit}</p>
		}

		render(App);
		const text = () => container.querySelector('p')?.textContent;
		expect(text()).toBe('0ms');

		rename();
		bump();
		flushSync();
		expect(text()).toBe('1s');
	});

	it(
		'a let written by a handler inside a hoisted @if branch updates the component variable',
		() => {
			let read: () => number = () => -1;

			function App() @{
				let &[show] = track(true);
				let &[tick] = track(0);
				let clicks = 0;
				read = () => clicks;
				@if (show) {
					<button onClick={() => clicks++}>{'hit ' + tick}</button>
				}
			}

			render(App);
			expect(read()).toBe(0);

			container.querySelector('button')?.click();
			container.querySelector('button')?.click();
			expect(read()).toBe(2);
		},
	);

	it('a let assigned by a ref inside a hoisted @if branch is the element, then null', () => {
		let div: HTMLDivElement | null | undefined;
		let hide: () => void = () => {};

		function App() @{
			let &[show] = track(true);
			let &[label] = track('a');
			hide = () => {
				show = false;
			};
			@if (show) {
				<div ref={div}>{label}</div>
			}
		}

		render(App);
		flushSync();
		expect(div).toBeInstanceOf(HTMLDivElement);

		hide();
		flushSync();
		expect(div).toBeNull();
	});

	it('supports compound assignment and update expressions on a boxed let', () => {
		let step: () => void = () => {};
		let bump: () => void = () => {};

		function App() @{
			let &[count] = track(0);
			let base = 10;
			step = () => {
				base += 5;
				base++;
				base = base * 2;
			};
			bump = () => {
				count++;
			};
			<span>{base + count}</span>
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('10');

		step();
		bump();
		flushSync();
		expect(text()).toBe('33');
	});

	it('boxes a rebound name from a flat destructuring pattern', () => {
		let rename: () => void = () => {};
		let bump: () => void = () => {};

		function Names(props: { user: { first: string; last?: string } }) @{
			let &[count] = track(0);
			let { first, last = 'none' } = props.user;
			rename = () => {
				first = 'renamed';
			};
			bump = () => {
				count++;
			};
			<span>{first + ' ' + last + ' ' + count}</span>
		}

		function App() @{
			<Names user={{ first: 'ada' }} />
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('ada none 0');

		rename();
		bump();
		flushSync();
		expect(text()).toBe('renamed none 1');
	});

	it('a let declared without an initializer starts as undefined', () => {
		let assign: () => void = () => {};
		let bump: () => void = () => {};

		function App() @{
			let &[count] = track(0);
			let later: string | undefined;
			assign = () => {
				later = 'set';
			};
			bump = () => {
				count++;
			};
			<span>{String(later) + '/' + count}</span>
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('undefined/0');

		assign();
		bump();
		flushSync();
		expect(text()).toBe('set/1');
	});
});
