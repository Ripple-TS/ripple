import { describe, it, expect } from 'vitest';
import { flushSync, track } from 'ripple';

// A plain `let` that is reassigned after declaration and read by template
// code (a component prop, an `@if` condition or branch, a text expression) is
// compiled to a `{ v }` box, so the module-level functions the compiler hoists
// still read its current value. None of these variables is reactive: the
// update is always triggered by a tracked value, and the box only has to
// make sure the re-evaluation sees the latest assignment, exactly as the old
// closure getters did.

describe('boxed locals', () => {
	it('a reassigned let read by a component prop is current on re-evaluation', () => {
		let publish: () => void = () => {};
		let bump: () => void = () => {};

		function Child(props: { text: string }) @{
			<span>{props.text}</span>
		}

		function App() @{
			let &[count] = track(0);
			let label = 'draft';
			publish = () => {
				label = 'published';
			};
			bump = () => {
				count++;
			};
			<Child text={label + ':' + count} />
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('draft:0');

		// Changing the untracked variable alone does nothing, as before.
		publish();
		flushSync();
		expect(text()).toBe('draft:0');

		// The tracked change re-evaluates the prop with the current `label`.
		bump();
		flushSync();
		expect(text()).toBe('published:1');
	});

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

	it('supports compound assignment and update expressions on a boxed let', () => {
		let step: () => void = () => {};
		let bump: () => void = () => {};

		function Child(props: { total: number }) @{
			<span>{props.total}</span>
		}

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
			<Child total={base + count} />
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

		function Child(props: { text: string }) @{
			<span>{props.text}</span>
		}

		function Names(props: { user: { first: string; last?: string } }) @{
			let &[count] = track(0);
			let { first, last = 'none' } = props.user;
			rename = () => {
				first = 'renamed';
			};
			bump = () => {
				count++;
			};
			<Child text={first + ' ' + last + ' ' + count} />
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

		function Child(props: { text: string }) @{
			<span>{String(props.text)}</span>
		}

		function App() @{
			let &[count] = track(0);
			let later: string | undefined;
			assign = () => {
				later = 'set';
			};
			bump = () => {
				count++;
			};
			<Child text={later + '/' + count} />
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('undefined/0');

		assign();
		bump();
		flushSync();
		expect(text()).toBe('set/1');
	});

	it('reads the box from handlers and nested closures in the component', () => {
		let read: () => string = () => '';
		let write: () => void = () => {};

		function Child(props: { text: string }) @{
			<span>{props.text}</span>
		}

		function App() @{
			let &[count] = track(0);
			let note = 'a';
			const readers = [() => note, () => note + note];
			read = () => readers[0]() + readers[1]();
			write = () => {
				note = 'b';
				count++;
			};
			<Child text={note + count} />
		}

		render(App);
		expect(read()).toBe('aaa');
		write();
		flushSync();
		expect(read()).toBe('bbb');
		expect(container.querySelector('span')?.textContent).toBe('b1');
	});
});
