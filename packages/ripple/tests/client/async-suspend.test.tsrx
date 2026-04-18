import type { Tracked } from 'ripple';
import { DERIVED_UPDATED, effect, flushSync, track, trackAsync } from 'ripple';

describe('async suspense', () => {
	it('hides child content during re-suspension when tracked dependency changes', async () => {
		let resolve_fn: (() => void) | null = null;

		component Child({ countTracked }: { countTracked: Tracked<number> }) {
			trackAsync(() => {
				countTracked.value;
				return new Promise<void>((resolve) => {
					resolve_fn = resolve;
				});
			});

			<div class="child-content">{'child content'}</div>
			<div class="count">
				{'count is: '}
				{countTracked.value}
			</div>
		}

		component App() {
			let &[count, countTracked] = track(0);

			try {
				<Child {countTracked} />
			} pending {
				<div class="pending">{'pending...'}</div>
			}

			<button onClick={() => count++}>{'Increment'}</button>
		}

		render(App);

		// Initial state: should show pending
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
		expect(container.innerHTML).toContain('pending...');
		expect(container.innerHTML).not.toContain('child content');

		// Resolve the first promise
		(resolve_fn as () => void)?.();
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// After resolution: should show child content, not pending
		expect(container.innerHTML).toContain('child content');
		expect(container.innerHTML).not.toContain('pending...');

		// Changing count should keep the ui in the same state
		const button = container.querySelector('button');
		button?.click();
		flushSync();
		expect(container.innerHTML).toContain('count is: 1');

		// Wait for microtask to process
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// After count change: should still show child content, not pending
		expect(container.innerHTML).not.toContain('pending...');
		expect(container.innerHTML).toContain('child content');
		expect(container.innerHTML).toContain('count is: 1');
	});

	it('ignores settled promises after the surrounding boundary is destroyed', async () => {
		let resolve_value: ((value: string) => void) | null = null;

		component Child() {
			let &[value] = trackAsync(
				() => new Promise<string>((resolve) => {
					resolve_value = resolve;
				}),
			);

			<div class="value">{value}</div>
		}

		component App() {
			let &[show] = track(true);

			<button onClick={() => (show = false)}>{'Hide'}</button>

			if (show) {
				try {
					<Child />
				} pending {
					<div class="pending">{'loading...'}</div>
				}
			} else {
				<div class="hidden">{'hidden'}</div>
			}
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
		expect(container.innerHTML).toContain('loading...');

		(container.querySelector('button') as HTMLButtonElement).click();
		flushSync();
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('hidden');

		(resolve_value as (value: string) => void)('late value');
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('hidden');
		expect(container.innerHTML).not.toContain('late value');
	});

	it('aborts superseded requests with DERIVED_UPDATED without rendering catch', async () => {
		const requests = new Map<
			string,
			{ resolve: (value: string) => void; abortController: AbortController }
		>();

		function createRequest(label: string) {
			const abortController = new AbortController();
			let resolve_value: (value: string) => void = () => {};

			const promise = new Promise<string>((resolve, reject) => {
				resolve_value = resolve;
				abortController.signal.addEventListener('abort', () => {
					reject(abortController.signal.reason);
				});
			});

			requests.set(label, { resolve: resolve_value, abortController });

			return { promise, abortController };
		}

		component App() {
			let &[query] = track('a');

			try {
				let &[value] = trackAsync(() => createRequest(query));
				<div class="value">{value}</div>
			} pending {
				<div class="pending">{'loading...'}</div>
			} catch (error) {
				<div class="error">{String(error)}</div>
			}

			<button
				onClick={() => {
					query = query === 'a' ? 'b' : 'c';
				}}
			>
				{'Next'}
			</button>
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
		expect(container.innerHTML).toContain('loading...');

		(requests.get('a') as { resolve: (value: string) => void }).resolve('value-a');
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('value-a');

		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();
		flushSync();
		button.click();
		flushSync();

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(
			(requests.get('b') as { abortController: AbortController }).abortController.signal.reason,
		).toBe(DERIVED_UPDATED);
		expect(container.innerHTML).not.toContain('class="error"');
		expect(container.innerHTML).toContain('value-a');

		(requests.get('c') as { resolve: (value: string) => void }).resolve('value-c');
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('value-c');
		expect(container.innerHTML).not.toContain('class="error"');
	});

	it(
		'updates the existing reactive graph when tracked dependency triggers re-fetch in child component',
		async () => {
			let pending_render_count = 0;

			component FilteredList({ queryTracked }: { queryTracked: Tracked<string> }) {
				let &[query] = queryTracked;
				let &[items] = trackAsync(
					() => Promise.resolve(
						!query ? ['apple', 'banana', 'cherry'] : ['avocado', 'blueberry', 'citrus'],
					),
				);

				let &[filtered] = track(() => {
					return items.filter((item: string) => item.includes(query));
				});

				<ul>
					for (let item of filtered) {
						<li>{item}</li>
					}
				</ul>

				<pre>{JSON.stringify(items)}</pre>
			}

			component App() {
				let &[query, queryTracked] = track('');

				try {
					<FilteredList {queryTracked} />
				} pending {
					pending_render_count += 1;
					<p class="pending">{'loading...'}</p>
				}

				<button onClick={() => (query = 'a')}>{'Search'}</button>
			}

			render(App);

			// Promise.resolve settles in microtask — wait for it
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();
			expect(pending_render_count).toBe(1);

			// Initial: filtered by '' matches apple, banana (both contain '')
			expect(container.querySelectorAll('li').length).toBe(3);
			expect(container.innerHTML).toContain('apple');
			expect(container.innerHTML).toContain('banana');
			expect(container.innerHTML).toContain('cherry');
			expect(container.querySelectorAll('ul').length).toBe(1);
			expect(container.querySelectorAll('pre').length).toBe(1);
			expect(container.querySelector('pre')!.textContent).toBe('["apple","banana","cherry"]');

			// Change query to 'a' — triggers re-fetch with new items
			(container.querySelector('button') as HTMLButtonElement).click();
			flushSync();
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// The resolved branch should update in place without appending duplicates.
			expect(pending_render_count).toBe(1);
			expect(container.innerHTML).not.toContain('loading...');
			expect(container.querySelectorAll('ul').length).toBe(1);
			expect(container.querySelectorAll('pre').length).toBe(1);
			// After re-fetch, the branch re-runs with the new data.
			expect(container.innerHTML).toContain('avocado');
			expect(container.innerHTML).toContain('blueberry');
			expect(container.innerHTML).toContain('citrus');
			expect(container.querySelector('pre')!.textContent).toBe('["avocado","blueberry","citrus"]');
			expect(container.innerHTML).not.toContain('apple');
			expect(container.innerHTML).not.toContain('banana');
			expect(container.innerHTML).not.toContain('cherry');
		},
	);

	it('updates direct try-block trackAsync consumers and renders pending only once', async () => {
		let pending_render_count = 0;

		component App() {
			let &[query] = track('');

			try {
				let &[items] = trackAsync(
					() => Promise.resolve(
						!query ? ['apple', 'banana', 'cherry'] : ['avocado', 'blueberry', 'citrus'],
					),
				);

				let &[filtered] = track(() => {
					return items.filter((item: string) => item.includes(query));
				});

				<ul>
					for (let item of filtered) {
						<li>{item}</li>
					}
				</ul>

				<pre>{JSON.stringify(items)}</pre>
			} pending {
				pending_render_count += 1;
				<p class="pending">{'loading...'}</p>
			}

			<button onClick={() => (query = 'a')}>{'Search'}</button>
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(pending_render_count).toBe(1);
		expect(container.querySelectorAll('li').length).toBe(3);
		expect(container.querySelector('pre')!.textContent).toBe('["apple","banana","cherry"]');

		(container.querySelector('button') as HTMLButtonElement).click();
		flushSync();
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(pending_render_count).toBe(1);
		expect(container.innerHTML).not.toContain('loading...');
		expect(container.querySelectorAll('ul').length).toBe(1);
		expect(container.querySelectorAll('pre').length).toBe(1);
		// After re-fetch, the branch re-runs with the new data.
		expect(container.innerHTML).toContain('avocado');
		expect(container.innerHTML).toContain('blueberry');
		expect(container.innerHTML).toContain('citrus');
		expect(container.innerHTML).not.toContain('apple');
		expect(container.innerHTML).not.toContain('banana');
		expect(container.innerHTML).not.toContain('cherry');
		expect(container.querySelector('pre')!.textContent).toBe('["avocado","blueberry","citrus"]');
	});

	it(
		'defers paused async consumer blocks until chained async requests settle with render only running once',
		async () => {
			let resolve_double: ((value: number) => void) | null = null;
			let resolve_quadruple: ((value: number) => void) | null = null;
			let double_effect_runs = 0;
			let quadruple_effect_runs = 0;
			let times_rendered = 0;
			component Child(&{ count }: { count: number }) {
				const &[double]: [number] = trackAsync(() => {
					const result = count * 2;

					return new Promise<number>((resolve) => {
						resolve_double = () => resolve(result);
					});
				});

				const &[quadruple]: [number] = trackAsync(() => {
					const result = double * 2;

					return new Promise<number>((resolve) => {
						resolve_quadruple = () => resolve(result);
					});
				});

				effect(() => {
					double;
					double_effect_runs += 1;
				});

				effect(() => {
					quadruple;
					quadruple_effect_runs += 1;
				});

				// this is to make the times_rendered render together with double
				<div class="double">{double + (++times_rendered - times_rendered)}</div>
				<div class="quadruple">{quadruple}</div>
			}

			component App() {
				let &[count] = track(2);

				try {
					<Child {count} />
				} pending {
					<div class="pending">{'Loading...'}</div>
				}

				<button onClick={() => count++}>{'Increment'}</button>
			}

			render(App);

			const button = container.querySelector('button') as HTMLButtonElement;

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).toContain('Loading...');
			expect(double_effect_runs).toBe(0);
			expect(quadruple_effect_runs).toBe(0);

			(resolve_double as (value: number) => void)(4);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).toContain('Loading...');
			expect(double_effect_runs).toBe(0);
			expect(quadruple_effect_runs).toBe(0);

			(resolve_quadruple as (value: number) => void)(8);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).not.toContain('Loading...');
			expect(container.querySelector('.double')!.textContent).toBe('4');
			expect(container.querySelector('.quadruple')!.textContent).toBe('8');
			expect(double_effect_runs).toBe(1);
			expect(quadruple_effect_runs).toBe(1);
			expect(times_rendered).toBe(1);

			button.click();
			flushSync();

			(resolve_double as (value: number) => void)(6);
			await new Promise((resolve) => setTimeout(resolve, 0));
			(resolve_quadruple as (value: number) => void)(12);
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(container.querySelector('.double')!.textContent).toBe('6');
			expect(container.querySelector('.quadruple')!.textContent).toBe('12');
			expect(times_rendered).toBe(2);
		},
	);

	it(
		'chained async requests settle with render only running once when multiple consecutive requests are fired off',
		async () => {
			let resolve_double: ((value: number) => void) | null = null;
			let resolve_quadruple: ((value: number) => void) | null = null;
			let double_effect_runs = 0;
			let quadruple_effect_runs = 0;
			let times_rendered = 0;
			component Child(&{ count }: { count: number }) {
				const &[double]: [number] = trackAsync(() => {
					const result = count * 2;

					return new Promise<number>((resolve) => {
						resolve_double = () => resolve(result);
					});
				});

				const &[quadruple]: [number] = trackAsync(() => {
					const result = double * 2;

					return new Promise<number>((resolve) => {
						resolve_quadruple = () => resolve(result);
					});
				});

				effect(() => {
					double;
					double_effect_runs += 1;
				});

				effect(() => {
					quadruple;
					quadruple_effect_runs += 1;
				});

				// this is to make the times_rendered render together with double
				<div class="double">{double + (++times_rendered - times_rendered)}</div>
				<div class="quadruple">{quadruple}</div>
			}

			component App() {
				let &[count] = track(2);

				try {
					<Child {count} />
				} pending {
					<div class="pending">{'Loading...'}</div>
				}

				<button onClick={() => count++}>{'Increment'}</button>
			}

			render(App);

			const button = container.querySelector('button') as HTMLButtonElement;

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).toContain('Loading...');
			expect(double_effect_runs).toBe(0);
			expect(quadruple_effect_runs).toBe(0);

			(resolve_double as (value: number) => void)(4);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).toContain('Loading...');
			expect(double_effect_runs).toBe(0);
			expect(quadruple_effect_runs).toBe(0);

			(resolve_quadruple as (value: number) => void)(8);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).not.toContain('Loading...');
			expect(container.querySelector('.double')!.textContent).toBe('4');
			expect(container.querySelector('.quadruple')!.textContent).toBe('8');
			expect(double_effect_runs).toBe(1);
			expect(quadruple_effect_runs).toBe(1);
			expect(times_rendered).toBe(1);

			button.click();
			flushSync();
			button.click();
			flushSync();
			button.click();
			flushSync();

			(resolve_double as (value: number) => void)(10);
			await new Promise((resolve) => setTimeout(resolve, 0));
			(resolve_quadruple as (value: number) => void)(12);
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(container.querySelector('.double')!.textContent).toBe('10');
			expect(container.querySelector('.quadruple')!.textContent).toBe('20');
			expect(times_rendered).toBe(2);
		},
	);

	it('resolves chained async values without explicit flushSync', async () => {
		let times_rendered = 0;
		component Child(&{ count }: { count: number }) {
			const &[double]: [number] = trackAsync(() => {
				const result = count * 2;

				return new Promise<number>((resolve) => {
					setTimeout(() => resolve(result), 0);
				});
			});

			const &[quadruple]: [number] = trackAsync(() => {
				const result = double * 2;

				return new Promise<number>((resolve) => {
					setTimeout(() => resolve(result), 0);
				});
			});

			// this is to make the times_rendered render together with double
			<div class="double">{double + (++times_rendered - times_rendered)}</div>
			<div class="quadruple">{quadruple}</div>
		}

		component App() {
			let &[count] = track(0);

			<button onClick={() => count++}>{count}</button>

			try {
				<Child {count} />
			} pending {
				<div class="pending">{'Loading...'}</div>
			}
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(container.innerHTML).not.toContain('Loading...');
		expect(container.querySelector('.double')!.textContent).toBe('0');
		expect(container.querySelector('.quadruple')!.textContent).toBe('0');
		expect(times_rendered).toBe(1);
	});

	it(
		'registers async derived under multiple try/pending boundaries across components',
		async () => {
			let resolve_fn: ((value: string[]) => void) | null = null;

			component Child({ itemsTracked }: { itemsTracked: Tracked<string[]> }) {
				try {
					<div class="child-content">
						{'child: '}
						{itemsTracked.value.join(', ')}
					</div>
				} pending {
					<div class="child-pending">{'child loading...'}</div>
				}
			}

			component App() {
				let &[query] = track('initial');

				try {
					let &[items, itemsTracked] = trackAsync(() => {
						const q = query;
						return new Promise<string[]>((resolve) => {
							resolve_fn = resolve;
						});
					});

					<div class="parent-content">
						{'parent: '}
						{items.join(', ')}
					</div>
					<Child {itemsTracked} />
				} pending {
					<div class="parent-pending">{'parent loading...'}</div>
				}

				<button onClick={() => (query = 'next')}>{'Change'}</button>
			}

			render(App);

			// Initial: parent pending, child not yet rendered
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(container.innerHTML).toContain('parent loading...');
			expect(container.innerHTML).not.toContain('parent-content');
			expect(container.innerHTML).not.toContain('child-content');

			// Resolve first request — both parent and child should show content,
			// child reading the derived registers its own try boundary on the same derived
			(resolve_fn as (value: string[]) => void)(['apple', 'banana']);
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(container.innerHTML).toContain('parent: apple, banana');
			expect(container.innerHTML).toContain('child: apple, banana');
			expect(container.innerHTML).not.toContain('parent loading...');
			expect(container.innerHTML).not.toContain('child loading...');

			// Trigger re-fetch — derived now has entries for both parent and child boundaries
			const button = container.querySelector('button') as HTMLButtonElement;
			button.click();
			flushSync();
			await new Promise((resolve) => setTimeout(resolve, 0));

			// After has_resolved, re-fetch keeps resolved branch visible (no re-suspension)
			expect(container.innerHTML).not.toContain('parent loading...');
			expect(container.innerHTML).not.toContain('child loading...');

			// Resolve second request — both should update in place
			(resolve_fn as (value: string[]) => void)(['cherry', 'date']);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.innerHTML).toContain('parent: cherry, date');
			expect(container.innerHTML).toContain('child: cherry, date');
			expect(container.innerHTML).not.toContain('parent loading...');
			expect(container.innerHTML).not.toContain('child loading...');
		},
	);

	it('throws when trackAsync is used without a try/pending boundary', () => {
		component App() {
			let &[value] = trackAsync(() => Promise.resolve('test'));
			<div>{value}</div>
		}

		expect(() => {
			render(App);
		}).toThrow('Missing parent `try { ... } pending { ... }` statement');
	});
});
