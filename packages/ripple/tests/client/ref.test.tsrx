import type { PropsWithExtras } from 'ripple';
import { describe, it, expect } from 'vitest';
import { RippleArray, createRefKey, effect, flushSync, track } from 'ripple';
import type { Tracked } from 'ripple';

describe('refs', () => {
	it('capture a <div>', () => {
		let div: HTMLDivElement | undefined;

		component Component() {
			<div
				{ref (node: HTMLDivElement) => {
					div = node;
				}}
			>
				{'Hello World'}
			</div>
		}
		render(Component);
		flushSync();
		expect(div?.textContent).toBe('Hello World');
	});

	it('works with spreading from composite component', () => {
		type Child = typeof Child;
		let _node: Child | undefined;

		component Component() {
			let items = RippleArray.from([1, 2, 3]);

			function componentRef(node: Child) {
				_node = node;
			}

			<Child {ref componentRef} {items} />
		}

		component Child(props: { items: RippleArray<number> }) {
			const { items, ...rest } = props;
			<pre {...rest}>{JSON.stringify(items)}</pre>
			<pre>{items.length}</pre>
		}

		render(Component);
		flushSync();

		expect(_node).toBe(document.querySelector('pre'));
	});

	it('should handle spreading into composite refs', () => {
		let logs: string[] = [];

		component App() {
			let &[value] = track('test');

			function inputRef(node: HTMLInputElement) {
				logs.push('ref called');
			}

			const props = {
				id: 'example',
				value,
				[createRefKey()]: inputRef,
			};

			<input type="text" {...props} />

			<Input {...props} />
		}

		component Input({ id, value, ...rest }: PropsWithExtras<{ id: string; value: string }>) {
			<input type="text" {id} {value} {...rest} />
		}

		render(App);
		flushSync();

		expect(logs).toEqual(['ref called', 'ref called']);
	});

	it('captures a host element into a Tracked via {ref tracker}', () => {
		let captured: Tracked<HTMLDivElement | null> | undefined;

		component Component() {
			const tracker = track<HTMLDivElement | null>(null);
			captured = tracker;

			<div {ref tracker}>{'Hello World'}</div>
		}

		render(Component);
		flushSync();
		expect(captured!.value).toBeInstanceOf(HTMLDivElement);
		expect(captured!.value!.textContent).toBe('Hello World');
	});

	it('forwards a Tracked through a composite component via prop destructuring + spread', () => {
		let captured: Tracked<HTMLInputElement | null> | undefined;

		component Child({ id, ...rest }: PropsWithExtras<{ id: string }>) {
			// Symbol-keyed `ref` prop survives `...rest` destructuring and
			// arrives on the DOM element via spread.
			<input type="text" {id} {...rest} />
		}

		component App() {
			const tracker = track<HTMLInputElement | null>(null);
			captured = tracker;

			<Child id="example" {ref tracker} />
		}

		render(App);
		flushSync();
		expect(captured!.value).toBeInstanceOf(HTMLInputElement);
		expect(captured!.value!.id).toBe('example');
	});

	it('assigns a host element to a plain let variable via {ref var}', () => {
		let captured: HTMLDivElement | null = null;

		component App() {
			let div: HTMLDivElement | undefined;

			<div {ref div}>{'Hello World'}</div>

			// Read the captured element through an effect so the assertion
			// observes the post-mount value (component setup runs before the
			// element is created).
			effect(() => {
				captured = div ?? null;
			});
		}

		render(App);
		flushSync();
		expect(captured).toBeInstanceOf(HTMLDivElement);
		expect(captured!.textContent).toBe('Hello World');
	});

	it(
		'uses the function path even when the variable is an Identifier (function wins over setter)',
		() => {
			let logs: string[] = [];

			component App() {
				let cb = (node: HTMLDivElement) => {
					logs.push(`mount:${node.textContent}`);
				};

				<div {ref cb}>{'Hello'}</div>
			}

			render(App);
			flushSync();
			expect(logs).toEqual(['mount:Hello']);
		},
	);

	it(
		'uses the Tracked path even when the variable is an Identifier (Tracked wins over setter)',
		() => {
			let captured: Tracked<HTMLDivElement | null> | undefined;

			component App() {
				const tracker = track<HTMLDivElement | null>(null);
				let slot = tracker;
				captured = tracker;

				<div {ref slot}>{'Hello'}</div>
			}

			render(App);
			flushSync();
			expect(captured!.value).toBeInstanceOf(HTMLDivElement);
		},
	);

	it('does NOT propagate a plain let variable through a composite component via {...rest}', () => {
		// Assignment-sugar (`let foo; <el {ref foo} />`) only works on
		// host elements, where the setter closure has direct lexical
		// access to the parent's slot. Passing a plain `let` variable
		// through a composite forwards only its current value into the
		// child's local prop bag — there is no slot identity across the
		// component boundary. Use a `Tracked` (object identity) when you
		// need the captured node to be visible in the parent.
		let captured: HTMLInputElement | null = null;

		component Child({ id, ...rest }: PropsWithExtras<{ id: string }>) {
			<input type="text" {id} {...rest} />
		}

		component App() {
			let input: HTMLInputElement | undefined;

			<Child id="example" {ref input} />

			effect(() => {
				captured = input ?? null;
			});
		}

		render(App);
		flushSync();
		// The DOM input was created and exists — but the parent's `input`
		// slot stays unset because there is no setter to forward through
		// the composite boundary.
		expect(container.querySelector('input')).toBeInstanceOf(HTMLInputElement);
		expect(captured).toBeNull();
	});

	it('clears the Tracked when the host element unmounts', () => {
		let captured: Tracked<HTMLDivElement | null> | undefined;
		let toggle: Tracked<boolean> | undefined;

		component Component() {
			const tracker = track<HTMLDivElement | null>(null);
			const show = track(true);
			captured = tracker;
			toggle = show;

			if (show.value) {
				<div {ref tracker}>{'Hello World'}</div>
			}
		}

		render(Component);
		flushSync();
		expect(captured!.value).toBeInstanceOf(HTMLDivElement);

		toggle!.value = false;
		flushSync();
		expect(captured!.value).toBeNull();
	});

	it('should handle spreading props with a static ref', () => {
		let logs: string[] = [];

		component App() {
			let &[value] = track('test');

			function inputRef(node: HTMLInputElement) {
				logs.push('ref called');
			}

			const props = {
				id: 'example',
				value,
			};

			<input type="text" {ref inputRef} {...props} />

			<Input {ref inputRef} {...props} />
		}

		component Input({ id, value, ...rest }: PropsWithExtras<{ id: string; value: string }>) {
			<input type="text" {id} {value} {...rest} />
		}

		render(App);
		flushSync();

		expect(logs).toEqual(['ref called', 'ref called']);
	});
});
