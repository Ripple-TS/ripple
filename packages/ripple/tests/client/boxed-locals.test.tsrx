import { describe, it, expect } from 'vitest';
import { flushSync, track, trackAsync } from 'ripple';

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

	it('boxes a rebound destructured parameter', () => {
		let edit: () => void = () => {};
		let bump: () => void = () => {};

		function Panel({ mode = 'view' }: { mode?: string }) @{
			let &[count] = track(0);
			edit = () => {
				mode = 'edit';
			};
			bump = () => {
				count++;
			};
			@if (count >= 0) {
				<button>{mode + count}</button>
			}
		}

		render(Panel);
		const text = () => container.querySelector('button')?.textContent;
		expect(text()).toBe('view0');

		edit();
		bump();
		flushSync();
		expect(text()).toBe('edit1');
	});

	it('boxes a reassigned props parameter', () => {
		let bump: () => void = () => {};

		function Child(props: { label: string }) @{
			let &[count] = track(0);
			bump = () => {
				count++;
			};
			props = { ...props, label: props.label + '!' };
			<span>{props.label + count}</span>
		}

		function App() @{
			<Child label="hi" />
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('hi!0');

		bump();
		flushSync();
		expect(text()).toBe('hi!1');
	});

	it('boxes rebound names from nested object and array patterns', () => {
		let rename: () => void = () => {};
		let bump: () => void = () => {};

		function Names(props: { user: { first: string; last?: string }; tags: string[] }) @{
			let &[count] = track(0);
			let { user: { first, last = 'none' }, tags: [tag] } = props;
			rename = () => {
				first = 'renamed';
				tag = 't2';
			};
			bump = () => {
				count++;
			};
			<span>{first + ' ' + last + ' ' + tag + count}</span>
		}

		function App() @{
			<Names user={{ first: 'ada' }} tags={['t1']} />
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('ada none t10');

		rename();
		bump();
		flushSync();
		expect(text()).toBe('renamed none t21');
	});

	it('boxes a rebound catch parameter', async () => {
		let clear: () => void = () => {};
		let bump: () => void = () => {};

		function Loader() @{
			let &[n] = track(0);
			bump = () => {
				n++;
			};
			@try {
				let &[data] = trackAsync(() => Promise.reject(new Error('boom')));
				<p>{data}</p>
			} @catch (err) {
				clear = () => {
					err = null;
				};
				<button>{String(err instanceof Error ? err.message : err) + n}</button>
			}
		}

		render(Loader);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
		const text = () => container.querySelector('button')?.textContent;
		expect(text()).toBe('boom0');

		clear();
		bump();
		flushSync();
		expect(text()).toBe('null1');
	});

	it('boxes lets written through destructuring and for-of assignment targets', () => {
		let swap: () => void = () => {};
		let bump: () => void = () => {};

		function Pair() @{
			let &[tick] = track(0);
			let label = 'a';
			let other = 'x';
			let last = '';
			swap = () => {
				[label, other] = ['b', 'y'];
				for (last of ['c', 'd']) {
					// the loop variable is the boxed let
				}
			};
			bump = () => {
				tick++;
			};
			<span>{label + other + last + tick}</span>
		}

		render(Pair);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('ax0');

		swap();
		bump();
		flushSync();
		expect(text()).toBe('byd1');
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
