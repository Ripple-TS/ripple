import type { PropsWithExtras } from 'ripple';
import { describe, it, expect } from 'vitest';
import { RippleArray, createRefKey, flushSync, track } from 'ripple';
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
