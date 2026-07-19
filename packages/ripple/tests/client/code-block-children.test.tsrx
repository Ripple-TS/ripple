import { describe, it, expect } from 'vitest';
import { flushSync, track } from 'ripple';

describe('code blocks in template children position', () => {
	it('renders a code block child with setup statements and output', () => {
		function App() @{
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					<span class="x">{x}</span>
				}
			</>
		}

		render(App);

		expect(container.querySelector('.a').textContent).toBe('a');
		expect(container.querySelector('.x').textContent).toBe('1');
	});

	it('renders deeply nested code block children in source position', () => {
		function App() @{
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					@{
						const y = 2;
						@{
							<span class="sum">{x + y}</span>
						}
					}
				}
				<span class="b">{'b'}</span>
			</>
		}

		render(App);

		expect(container.textContent).toBe('a3b');
		expect(container.querySelector('.sum').textContent).toBe('3');
	});

	it('renders nothing for empty nested code blocks', () => {
		function App() @{
			<>
				<span>{'a'}</span>
				<span>{'b'}</span>
				@{
					@{
						@{}
					}
				}
			</>
		}

		render(App);

		expect(container.textContent).toBe('ab');
	});

	it('keeps code block render output reactive', () => {
		function App() @{
			const count = track(0);
			<>
				<button onClick={() => count.value++}>{'+'}</button>
				@{
					const doubled = () => count.value * 2;
					<span class="doubled">{doubled()}</span>
				}
			</>
		}

		render(App);

		expect(container.querySelector('.doubled').textContent).toBe('0');

		container.querySelector('button').click();
		flushSync();

		expect(container.querySelector('.doubled').textContent).toBe('2');
	});

	it('renders a code block child inside an @if branch', () => {
		function App() @{
			const show = track(true);
			<>
				<button onClick={() => (show.value = !show.value)}>{'toggle'}</button>
				@if (show.value) {
					@{
						const label = 'shown';
						<span class="label">{label}</span>
					}
				}
			</>
		}

		render(App);

		expect(container.querySelector('.label').textContent).toBe('shown');

		container.querySelector('button').click();
		flushSync();

		expect(container.querySelector('.label')).toBeNull();
	});

	it('gives each code block its own lexical scope', () => {
		function App() @{
			const y = 10;
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					@{
						const x = 2;
						@{
							<span class="sum">{x + y}</span>
						}
					}
				}
			</>
		}

		render(App);

		// The innermost block sees the shadowing `x = 2` and the component's `y`.
		expect(container.querySelector('.sum').textContent).toBe('12');
	});

	it('scopes code-only block statements', () => {
		function App() @{
			const items: number[] = [];
			<>
				@{
					const scoped = 1;
					items.push(scoped);
				}
				@{
					const scoped = 2;
					items.push(scoped);
				}
				<span class="len">{items.join(',')}</span>
			</>
		}

		render(App);

		expect(container.querySelector('.len').textContent).toBe('1,2');
	});

	it('renders nested code block chains without extra component levels', () => {
		function App() @{
			<>
				<span class="a">{'a'}</span>
				@{
					const x = 1;
					@{
						const y = 2;
						@{
							<span class="sum">{x + y}</span>
						}
					}
				}
			</>
		}

		render(App);

		expect(container.textContent).toBe('a3');
		expect(container.querySelector('.sum').textContent).toBe('3');
	});
});
