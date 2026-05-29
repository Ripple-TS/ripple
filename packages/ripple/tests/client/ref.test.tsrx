import type { PropsWithExtras } from 'ripple';
import { describe, it, expect } from 'vitest';
import { RippleArray, createRefKey, effect, flushSync, isRefProp, track } from 'ripple';
import type { Tracked } from 'ripple';

describe('refs', () => {
	it('reports ordinary functions and ref objects as non named-ref props', () => {
		expect(isRefProp(() => {})).toBe(false);
		expect(isRefProp({ current: null })).toBe(false);
		expect(isRefProp({ value: null })).toBe(false);
	});

	it('captures a host element with ref={...}', () => {
		let captured: HTMLInputElement | null = null;

		function App() {
			return <>
				let input: HTMLInputElement | undefined;
				<input type="text" ref={input} />
				effect(() => {
					captured = input ?? null;
				});
			</>;
		}

		render(App);
		flushSync();

		expect(captured).toBeInstanceOf(HTMLInputElement);
	});

	it('forwards a named ref prop explicitly through a component', () => {
		let captured: HTMLInputElement | null = null;

		function Child(props: PropsWithExtras<{}>) {
			return <><input type="text" ref={props.input_ref} /></>;
		}

		function App() {
			return <><Child input_ref={(node: HTMLInputElement | null) => (captured = node)} /></>;
		}

		render(App);
		flushSync();

		expect(captured).toBeInstanceOf(HTMLInputElement);
	});

	it('forwards an ordinary named prop explicitly from a host spread', () => {
		let captured: HTMLInputElement | null = null;

		function Child(props: PropsWithExtras<{}>) {
			return <>
				const { input_ref, ...rest } = props;
				<input type="text" ref={input_ref} {...rest} />
			</>;
		}

		function App() {
			return <><Child input_ref={(node: HTMLInputElement | null) => (captured = node)} /></>;
		}

		render(App);
		flushSync();

		expect(captured).toBeInstanceOf(HTMLInputElement);
	});

	it('capture a <div>', () => {
		let div: HTMLDivElement | undefined;

		function Component() {
			return <>
				<div
					ref={(node: HTMLDivElement) => {
						div = node;
					}}
				>
					{'Hello World'}
				</div>
			</>;
		}
		render(Component);
		flushSync();
		expect(div?.textContent).toBe('Hello World');
	});

	it('works with spreading from composite component', () => {
		type Child = typeof Child;
		let _node: Child | undefined;

		function Component() {
			return <>
				let items = RippleArray.from([1, 2, 3]);
				function componentRef(node: Child) {
					_node = node;
				}
				<Child ref={componentRef} {items} />
			</>;
		}

		function Child(props: { items: RippleArray<number> }) {
			return <>
				const { items, ...rest } = props;
				<pre {...rest}>{JSON.stringify(items)}</pre>
				<pre>{items.length}</pre>
			</>;
		}

		render(Component);
		flushSync();

		expect(_node).toBe(document.querySelector('pre'));
	});

	it('should handle spreading into composite refs', () => {
		let logs: string[] = [];

		function App() {
			return <>
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
			</>;
		}

		function Input({ id, value, ...rest }: PropsWithExtras<{ id: string; value: string }>) {
			return <><input type="text" {id} {value} {...rest} /></>;
		}

		render(App);
		flushSync();

		expect(logs).toEqual(['ref called', 'ref called']);
	});

	it('captures a host element into a Tracked via ref={tracker}', () => {
		let captured: Tracked<HTMLDivElement | null> | undefined;

		function Component() {
			return <>
				const tracker = track<HTMLDivElement | null>(null);
				captured = tracker;
				<div ref={tracker}>{'Hello World'}</div>
			</>;
		}

		render(Component);
		flushSync();
		expect(captured!.value).toBeInstanceOf(HTMLDivElement);
		expect(captured!.value!.textContent).toBe('Hello World');
	});

	it('forwards a Tracked through a composite component via prop destructuring + spread', () => {
		let captured: Tracked<HTMLInputElement | null> | undefined;

		function Child({ id, ...rest }: PropsWithExtras<{ id: string }>) {
			return <><input type="text" {id} {...rest} /></>;
		}

		function App() {
			return <>
				const tracker = track<HTMLInputElement | null>(null);
				captured = tracker;
				<Child id="example" ref={tracker} />
			</>;
		}

		render(App);
		flushSync();
		expect(captured!.value).toBeInstanceOf(HTMLInputElement);
		expect(captured!.value!.id).toBe('example');
	});

	it('assigns a host element to a plain let variable via ref={var}', () => {
		let captured: HTMLDivElement | null = null;

		function App() {
			return <>
				let div: HTMLDivElement | undefined;
				<div ref={div}>{'Hello World'}</div>
				// Read the captured element through an effect so the assertion
				// observes the post-mount value (component setup runs before the
				// element is created).
				effect(() => {
					captured = div ?? null;
				});
			</>;
		}

		render(App);
		flushSync();
		expect(captured).toBeInstanceOf(HTMLDivElement);
		expect(captured!.textContent).toBe('Hello World');
	});

	it('assigns a host element to a plain let variable via ref={var}', () => {
		let captured: HTMLDivElement | null = null;

		function App() {
			return <>
				let div: HTMLDivElement | undefined;
				<div ref={div}>{'Hello ref attr'}</div>
				effect(() => {
					captured = div ?? null;
				});
			</>;
		}

		render(App);
		flushSync();
		expect(captured).toBeInstanceOf(HTMLDivElement);
		expect(captured!.textContent).toBe('Hello ref attr');
	});

	it('clears a plain let variable via ref={var} when the host element unmounts', () => {
		let div: HTMLDivElement | null | undefined;

		function App() {
			return <>
				let &[show] = track(true);
				if (show) {
					<div ref={div}>{'Hello cleanup'}</div>
				}
				<button class="toggle" onClick={() => (show = false)}>{'hide'}</button>
			</>;
		}

		render(App);
		flushSync();
		expect(div).toBeInstanceOf(HTMLDivElement);

		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();
		expect(div).toBeNull();
	});

	it('assigns a host element to a member expression via ref={state.var}', () => {
		let captured: HTMLInputElement | null = null;

		function App() {
			return <>
				const state: { input?: HTMLInputElement } = {};
				<input type="text" ref={state.input} />
				effect(() => {
					captured = state.input ?? null;
				});
			</>;
		}

		render(App);
		flushSync();
		expect(captured).toBeInstanceOf(HTMLInputElement);
	});

	it('clears a plain let variable via component ref={var} when the host element unmounts', () => {
		let input: HTMLInputElement | null | undefined;
		let previous: HTMLInputElement | undefined;

		function Child(props: PropsWithExtras<{}>) {
			return <><input type="text" value="keep" {...props} /></>;
		}

		function App() {
			return <>
				let &[show] = track(true);
				if (show) {
					<Child ref={input} />
				}
				<button class="toggle" onClick={() => (show = false)}>{'hide'}</button>
			</>;
		}

		render(App);
		flushSync();
		expect(input).toBeInstanceOf(HTMLInputElement);
		previous = input!;
		expect(previous.value).toBe('keep');

		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();
		expect(input).toBeNull();
		expect(previous.value).toBe('keep');
	});

	it(
		'uses the function path even when the variable is an Identifier (function wins over setter)',
		() => {
			let logs: string[] = [];

			function App() {
				return <>
					let cb = (node: HTMLDivElement) => {
						logs.push(`mount:${node.textContent}`);
					};
					<div ref={cb}>{'Hello'}</div>
				</>;
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

			function App() {
				return <>
					const tracker = track<HTMLDivElement | null>(null);
					let slot = tracker;
					captured = tracker;
					<div ref={slot}>{'Hello'}</div>
				</>;
			}

			render(App);
			flushSync();
			expect(captured!.value).toBeInstanceOf(HTMLDivElement);
		},
	);

	it('propagates a plain let variable through a composite component via {...rest}', () => {
		let captured: HTMLInputElement | null = null;

		function Child({ id, ...rest }: PropsWithExtras<{ id: string }>) {
			return <><input type="text" {id} {...rest} /></>;
		}

		function App() {
			return <>
				let input: HTMLInputElement | undefined;
				<Child id="example" ref={input} />
				effect(() => {
					captured = input ?? null;
				});
			</>;
		}

		render(App);
		flushSync();
		expect(container.querySelector('input')).toBeInstanceOf(HTMLInputElement);
		expect(captured).toBeInstanceOf(HTMLInputElement);
		expect(captured!.id).toBe('example');
	});

	it(
		'clears a plain let variable forwarded through a component ref prop when the host element unmounts',
		() => {
			let input: HTMLInputElement | null | undefined;
			let previous: HTMLInputElement | undefined;

			function Child(props: PropsWithExtras<{}>) {
				return <><input type="text" value="keep" {...props} /></>;
			}

			function App() {
				return <>
					let &[show] = track(true);
					if (show) {
						<Child
							ref={(node: HTMLInputElement | null) => {
								input = node;
								return () => {
									input = null;
								};
							}}
						/>
					}
					<button class="toggle" onClick={() => (show = false)}>{'hide'}</button>
				</>;
			}

			render(App);
			flushSync();
			expect(input).toBeInstanceOf(HTMLInputElement);
			previous = input!;
			expect(previous.value).toBe('keep');

			(container.querySelector('.toggle') as HTMLButtonElement).click();
			flushSync();
			expect(input).toBeNull();
			expect(previous.value).toBe('keep');
		},
	);

	it('clears a component ref prop when a host spread changes it to a regular prop', () => {
		let input: HTMLInputElement | null | undefined;
		let previous: HTMLInputElement | undefined;

		function Child(props: PropsWithExtras<{}>) {
			return <>
				let &[as_ref] = track(true);
				<input
					type="text"
					value="keep"
					{...(as_ref ? { ref: props.ref } : { input_ref: 'regular prop' })}
				/>
				<button class="toggle" onClick={() => (as_ref = false)}>{'toggle'}</button>
			</>;
		}

		function App() {
			return <>
				<Child
					ref={(node: HTMLInputElement | null) => {
						input = node;
						return () => {
							input = null;
						};
					}}
				/>
			</>;
		}

		render(App);
		flushSync();
		expect(input).toBeInstanceOf(HTMLInputElement);
		previous = input!;
		expect(previous.value).toBe('keep');
		expect(previous.getAttribute('input_ref')).toBeNull();

		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();
		expect(input).toBeNull();
		expect(previous.value).toBe('keep');
		expect(previous.getAttribute('input_ref')).toBe('regular prop');
	});

	it('removes a regular spread attribute when the key changes to a component ref prop', () => {
		let input: HTMLInputElement | null | undefined;
		let previous: HTMLInputElement | undefined;

		function Child(props: PropsWithExtras<{}>) {
			return <>
				let &[as_ref] = track(false);
				<input
					type="text"
					value="keep"
					{...(as_ref ? { ref: props.ref } : { input_ref: 'regular prop' })}
				/>
				<button class="toggle" onClick={() => (as_ref = true)}>{'toggle'}</button>
			</>;
		}

		function App() {
			return <>
				<Child
					ref={(node: HTMLInputElement | null) => {
						input = node;
						return () => {
							input = null;
						};
					}}
				/>
			</>;
		}

		render(App);
		flushSync();
		expect(input).toBeUndefined();
		previous = container.querySelector('input') as HTMLInputElement;
		expect(previous.value).toBe('keep');
		expect(previous.getAttribute('input_ref')).toBe('regular prop');

		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();
		expect(input).toBe(previous);
		expect(previous.value).toBe('keep');
		expect(previous.getAttribute('input_ref')).toBeNull();
	});

	it('clears the Tracked when the host element unmounts', () => {
		let captured: Tracked<HTMLDivElement | null> | undefined;
		let toggle: Tracked<boolean> | undefined;

		function Component() {
			return <>
				const tracker = track<HTMLDivElement | null>(null);
				const show = track(true);
				captured = tracker;
				toggle = show;
				if (show.value) {
					<div ref={tracker}>{'Hello World'}</div>
				}
			</>;
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

		function App() {
			return <>
				let &[value] = track('test');
				function inputRef(node: HTMLInputElement) {
					logs.push('ref called');
				}
				const props = {
					id: 'example',
					value,
				};
				<input type="text" ref={inputRef} {...props} />
				<Input ref={inputRef} {...props} />
			</>;
		}

		function Input({ id, value, ...rest }: PropsWithExtras<{ id: string; value: string }>) {
			return <><input type="text" {id} {value} {...rest} /></>;
		}

		render(App);
		flushSync();

		expect(logs).toEqual(['ref called', 'ref called']);
	});
});
