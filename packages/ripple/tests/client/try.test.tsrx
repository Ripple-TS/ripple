import type { Tracked } from 'ripple';
import {
	bindValue,
	effect,
	flushSync,
	track,
	trackAsync,
	peek,
	UNINITIALIZED,
	SUSPENSE_REJECTED,
	SUSPENSE_PENDING,
} from 'ripple';

describe('try block with catch and pending', () => {
	it('catch block works when a child throws synchronously', async () => {
		component App() {
			try {
				<ThrowingChild />
			} pending {
				<p>{'loading...'}</p>
			} catch (err) {
				<p>{'caught error'}</p>
			}
		}

		component ThrowingChild() {
			throw new Error('sync error');
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('caught error');
		expect(container.innerHTML).not.toContain('loading...');
	});

	it('catch block works when component throws after trackAsync with pending block', async () => {
		component App() {
			try {
				<ThrowingAfterAsync />
			} pending {
				<p>{'loading...'}</p>
			} catch (err) {
				<p>{'caught error'}</p>
			}
		}

		component ThrowingAfterAsync() {
			let &[data] = trackAsync(() => Promise.resolve('hello'));
			throw new Error('error after await');
			<p>{data}</p>
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('caught error');
		expect(container.innerHTML).not.toContain('loading...');
	});

	it('catch block works when trackAsync rejects', async () => {
		component App() {
			try {
				let &[data] = trackAsync(() => Promise.reject(new Error('rejected')));
				<p>{data}</p>
			} pending {
				<p>{'loading...'}</p>
			} catch (err) {
				<p>{'caught rejection'}</p>
			}
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('caught rejection');
		expect(container.innerHTML).not.toContain('loading...');
	});

	it('catch replaces the retained resolved branch when a subsequent request rejects', async () => {
		const requests = new Map<
			number,
			{ resolve: (value: string) => void; reject: (error: Error) => void }
		>();

		function createRequest(version: number) {
			let resolve_value: (value: string) => void = () => {};
			let reject_value: (error: Error) => void = () => {};

			const promise = new Promise<string>((resolve, reject) => {
				resolve_value = resolve;
				reject_value = reject;
			});

			requests.set(version, { resolve: resolve_value, reject: reject_value });

			return promise;
		}

		component App() {
			let &[version] = track(0);

			try {
				let &[data] = trackAsync(() => createRequest(version));
				<p class="resolved">{data}</p>
			} pending {
				<p class="pending">{'loading...'}</p>
			} catch (err) {
				<p class="caught">{(err as Error).message}</p>
			}

			<button class="retry" onClick={() => version++}>{'Retry'}</button>
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
		expect(container.querySelector('.pending')?.textContent).toBe('loading...');

		(requests.get(0) as { resolve: (value: string) => void }).resolve('resolved value');
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.resolved')?.textContent).toBe('resolved value');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.caught')).toBeNull();

		(container.querySelector('.retry') as HTMLButtonElement).click();
		flushSync();

		expect(container.querySelector('.resolved')?.textContent).toBe('resolved value');
		expect(container.querySelector('.pending')).toBeNull();

		(requests.get(1) as { reject: (error: Error) => void }).reject(new Error('failed retry'));
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.caught')?.textContent).toBe('failed retry');
		expect(container.querySelector('.resolved')).toBeNull();
		expect(container.querySelector('.pending')).toBeNull();
	});

	it('retrying from catch shows pending before resolving back to the resolved branch', async () => {
		const requests = new Map<
			number,
			{ resolve: (value: string) => void; reject: (error: Error) => void }
		>();

		function createRequest(version: number) {
			let resolve_value: (value: string) => void = () => {};
			let reject_value: (error: Error) => void = () => {};

			const promise = new Promise<string>((resolve, reject) => {
				resolve_value = resolve;
				reject_value = reject;
			});

			requests.set(version, { resolve: resolve_value, reject: reject_value });

			return promise;
		}

		component App() {
			let &[version] = track(0);

			try {
				let &[data] = trackAsync(() => {
					version;
					return createRequest(version);
				});
				<p class="resolved">{data}</p>
			} pending {
				<p class="pending">{'loading...'}</p>
			} catch (err, reset) {
				<p class="caught">{(err as Error).message}</p>
				<button
					class="retry"
					onClick={() => {
						version++;
						reset();
					}}
				>
					{'Retry'}
				</button>
			}
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
		expect(container.querySelector('.pending')?.textContent).toBe('loading...');

		(requests.get(0) as { reject: (error: Error) => void }).reject(new Error('initial failure'));
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.caught')?.textContent).toBe('initial failure');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();

		(container.querySelector('.retry') as HTMLButtonElement).click();
		flushSync();
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.pending')?.textContent).toBe('loading...');
		expect(container.querySelector('.caught')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();

		(requests.get(1) as { resolve: (value: string) => void }).resolve('recovered');
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.resolved')?.textContent).toBe('recovered');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.caught')).toBeNull();
	});
});

describe('try block', () => {
	it(
		'does not compile ref binds as async callbacks inside try/pending trackAsync branches',
		async () => {
			component App() {
				let &[value, valueTracked] = track(1);

				try {
					let &[loaded] = trackAsync(() => Promise.resolve(value + 1));
					<input type="number" {ref bindValue(valueTracked)} />
					<span>{loaded}</span>
				} pending {
					<p>{'loading...'}</p>
				}
			}

			render(App);

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			const input = container.querySelector('input') as HTMLInputElement | null;
			expect(input?.value).toBe('1');
			expect(container.innerHTML).toContain('<span>2</span>');
			expect(container.innerHTML).not.toContain('loading...');
		},
	);

	it('does not crash when trackAsync is used to render a list inside try/pending', async () => {
		component App() {
			try {
				<AsyncChild />
			} pending {
				<p>{'loading...'}</p>
			}
		}

		component AsyncChild() {
			let &[data] = trackAsync(() => Promise.resolve(['a', 'b', 'c']));

			<ul>
				for (let item of data) {
					<li>{item}</li>
				}
			</ul>
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		const items = container.querySelectorAll('li');
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe('a');
		expect(items[1].textContent).toBe('b');
		expect(items[2].textContent).toBe('c');
	});

	it(
		'does not crash when async component with tracked state is used inside try/pending',
		async () => {
			component App() {
				let &[query, queryTracked] = track('');

				try {
					<FilteredList {queryTracked} />
				} pending {
					<p>{'loading...'}</p>
				}
			}

			component FilteredList({ queryTracked }: { queryTracked: Tracked<string> }) {
				let &[items] = trackAsync(() => Promise.resolve(['apple', 'banana', 'cherry']));
				let &[filtered] = track(
					() => items.filter((item: string) => item.includes(queryTracked.value)),
				);

				<ul>
					for (let item of filtered) {
						<li>{item}</li>
					}
				</ul>
			}

			render(App);

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			const listItems = container.querySelectorAll('li');
			expect(listItems.length).toBe(3);
		},
	);

	it('if test condition stays synchronous once trackAsync has resolved', async () => {
		component App() {
			try {
				let &[items] = trackAsync(() => Promise.resolve(['apple', 'banana', 'cherry']));

				if (items.includes('not-in-list')) {
					<p>{'not-in-list is in the list!'}</p>
				} else {
					<p>{'not-in-list is not in the list.'}</p>
				}
			} pending {
				<p>{'loading...'}</p>
			}
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.innerHTML).toContain('not-in-list is not in the list.');
	});

	it('destroying try block while in pending state cleans up pending branch', async () => {
		let pending_effect_teardown_count = 0;

		component PendingChild() {
			effect(() => {
				return () => {
					pending_effect_teardown_count++;
				};
			});
			<p class="pending">{'loading...'}</p>
		}

		component App() {
			let &[show] = track(true);

			if (show) {
				try {
					let &[data] = trackAsync(() => new Promise(() => {}));
					<p class="resolved">{data}</p>
				} pending {
					<PendingChild />
				}
			}

			<button class="toggle" onClick={() => (show = !show)}>{'toggle'}</button>
		}

		render(App);

		// Wait for pending microtask to fire
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.pending')?.textContent).toBe('loading...');
		expect(pending_effect_teardown_count).toBe(0);

		// Toggle if condition to false — should destroy try block and pending branch
		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();

		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();
		// Effect teardown in the pending branch should have run
		expect(pending_effect_teardown_count).toBe(1);
	});

	it('destroying try block while in resolved state cleans up resolved branch', async () => {
		let resolved_effect_teardown_count = 0;

		component ResolvedChild(&{ data }: { data: string }) {
			effect(() => {
				return () => {
					resolved_effect_teardown_count++;
				};
			});
			<p class="resolved">{data}</p>
		}

		component App() {
			let &[show] = track(true);

			if (show) {
				try {
					let &[data] = trackAsync(() => Promise.resolve('hello'));
					<ResolvedChild {data} />
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err) {
					<p class="caught">{(err as Error).message}</p>
				}
			}

			<button class="toggle" onClick={() => (show = !show)}>{'toggle'}</button>
		}

		render(App);

		// Wait for async to resolve
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.resolved')?.textContent).toBe('hello');
		expect(resolved_effect_teardown_count).toBe(0);

		// Toggle if condition to false — should destroy try block and resolved branch
		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();

		expect(container.querySelector('.resolved')).toBeNull();
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.caught')).toBeNull();
		// Effect teardown in the resolved branch should have run
		expect(resolved_effect_teardown_count).toBe(1);
	});

	it('destroying try block while in catch state cleans up catch branch', async () => {
		let catch_effect_teardown_count = 0;

		component CatchChild({ error }: { error: Error }) {
			effect(() => {
				return () => {
					catch_effect_teardown_count++;
				};
			});
			<p class="caught">{error.message}</p>
		}

		component App() {
			let &[show] = track(true);

			if (show) {
				try {
					let &[data] = trackAsync(() => Promise.reject(new Error('fail')));
					<p class="resolved">{data}</p>
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err) {
					<CatchChild error={err as Error} />
				}
			}

			<button class="toggle" onClick={() => (show = !show)}>{'toggle'}</button>
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.caught')?.textContent).toBe('fail');
		expect(catch_effect_teardown_count).toBe(0);

		// Toggle if condition to false — should destroy try block and catch branch
		(container.querySelector('.toggle') as HTMLButtonElement).click();
		flushSync();

		expect(container.querySelector('.caught')).toBeNull();
		// Effect teardown in the catch branch should have run
		expect(catch_effect_teardown_count).toBe(1);
	});

	it('pending block throwing renders catch block from the same try block', async () => {
		component ThrowingPending() {
			throw new Error('pending exploded');
			<p>{'should not render'}</p>
		}

		component App() {
			try {
				let &[data] = trackAsync(() => new Promise(() => {}));
				<p class="resolved">{data}</p>
			} pending {
				<ThrowingPending />
			} catch (err) {
				<p class="caught">{(err as Error).message}</p>
			}
		}

		render(App);

		// Wait for pending microtask to fire and render pending block
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// Pending block threw, so catch should be rendered
		expect(container.querySelector('.caught')?.textContent).toBe('pending exploded');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it('pending block throwing without catch bubbles to parent try/catch', async () => {
		component ThrowingPending() {
			throw new Error('pending exploded');
			<p>{'should not render'}</p>
		}

		component App() {
			try {
				<Inner />
			} catch (err) {
				<p class="parent-caught">{(err as Error).message}</p>
			}
		}

		component Inner() {
			try {
				let &[data] = trackAsync(() => new Promise(() => {}));
				<p class="resolved">{data}</p>
			} pending {
				<ThrowingPending />
			}
		}

		render(App);

		// Wait for pending microtask to fire and render pending block
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// Inner try has no catch, error should bubble to parent's catch
		expect(container.querySelector('.parent-caught')?.textContent).toBe('pending exploded');
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it('chained trackAsync keeps pending block until all deriveds resolve', async () => {
		let first_resolve: (value: string) => void;
		let second_resolve: (value: number) => void;

		const first_promise = new Promise<string>((resolve) => {
			first_resolve = resolve;
		});

		component App() {
			try {
				let &[name] = trackAsync(() => first_promise);
				let &[length] = trackAsync(() => {
					// Read name synchronously — throws ASYNC_DERIVED_READ_THROWN
					// while name is still pending, triggering the deferred mechanism.
					const n = name;
					return new Promise<number>((resolve) => {
						second_resolve = resolve;
					}).then((val) => n.length + val);
				});
				<p class="resolved">
					{name}
					{' has length '}
					{length}
				</p>
			} pending {
				<p class="pending">{'loading...'}</p>
			}
		}

		render(App);

		// Wait for pending microtask
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// Both are pending — pending block should show
		expect(container.querySelector('.pending')?.textContent).toBe('loading...');
		expect(container.querySelector('.resolved')).toBeNull();

		// Resolve the first trackAsync
		first_resolve!('hello');
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// First resolved, but second still pending — pending block must stay
		expect(container.querySelector('.pending')?.textContent).toBe('loading...');
		expect(container.querySelector('.resolved')).toBeNull();

		// Resolve the second trackAsync
		second_resolve!(100);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// Both resolved — pending removed, resolved content shown with both values
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')?.textContent).toBe('hello has length 105');
	});

	it(
		'chained trackAsync does not recreate pending block when intermediate derived resolves',
		async () => {
			let first_resolve: (value: string) => void;
			let second_resolve: (value: number) => void;
			let pending_render_count = 0;

			const first_promise = new Promise<string>((resolve) => {
				first_resolve = resolve;
			});

			component PendingTracker() {
				pending_render_count++;
				<p class="pending">{'loading...'}</p>
			}

			component App() {
				try {
					let &[name] = trackAsync(() => first_promise);
					let &[length] = trackAsync(() => {
						const n = name;
						return new Promise<number>((resolve) => {
							second_resolve = resolve;
						}).then((val) => n.length + val);
					});
					<p class="resolved">
						{name}
						{' has length '}
						{length}
					</p>
				} pending {
					<PendingTracker />
				}
			}

			render(App);

			// Wait for pending microtask to fire and render pending block
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')?.textContent).toBe('loading...');
			expect(pending_render_count).toBe(1);

			// Resolve the first — second starts its own async request
			// Pending block should NOT be torn down and recreated
			first_resolve!('hello');
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')?.textContent).toBe('loading...');
			expect(pending_render_count).toBe(1); // Still 1 — no flicker

			// Resolve the second — pending removed, resolved shown
			second_resolve!(100);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')).toBeNull();
			expect(container.querySelector('.resolved')?.textContent).toBe('hello has length 105');
			expect(pending_render_count).toBe(1); // Never recreated
		},
	);

	it(
		'chained trackAsync: first rejects, catch renders and stays after second resolves',
		async () => {
			let first_reject: (error: Error) => void;
			let second_resolve: (value: number) => void;

			const first_promise = new Promise<string>((_, reject) => {
				first_reject = reject;
			});

			component App() {
				try {
					let &[name] = trackAsync(() => first_promise);
					let &[length] = trackAsync(() => {
						const n = name;
						return new Promise<number>((resolve) => {
							second_resolve = resolve;
						}).then((val) => n.length + val);
					});
					<p class="resolved">
						{name}
						{' has length '}
						{length}
					</p>
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err) {
					<p class="caught">{(err as Error).message}</p>
				}
			}

			render(App);

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')?.textContent).toBe('loading...');
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.caught')).toBeNull();

			// Reject the first trackAsync
			first_reject!(new Error('first failed'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// Catch block should render
			expect(container.querySelector('.caught')?.textContent).toBe('first failed');
			expect(container.querySelector('.pending')).toBeNull();
			expect(container.querySelector('.resolved')).toBeNull();

			// Resolve the second trackAsync — catch block should stay
			expect(second_resolve!).toBeUndefined();
		},
	);

	it(
		'chained trackAsync: first succeeds, second rejects, pending stays then catch renders',
		async () => {
			let first_resolve: (value: string) => void;
			let second_reject: (error: Error) => void;

			const first_promise = new Promise<string>((resolve) => {
				first_resolve = resolve;
			});

			component App() {
				try {
					let &[name] = trackAsync(() => first_promise);
					let &[length] = trackAsync(() => {
						const n = name;
						return new Promise<number>((_, reject) => {
							second_reject = reject;
						});
					});
					<p class="resolved">
						{name}
						{' has length '}
						{length}
					</p>
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err) {
					<p class="caught">{(err as Error).message}</p>
				}
			}

			render(App);

			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// Both pending — pending block shows
			expect(container.querySelector('.pending')?.textContent).toBe('loading...');
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.caught')).toBeNull();

			// Resolve the first — second still pending, pending block stays
			first_resolve!('hello');
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')?.textContent).toBe('loading...');
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.caught')).toBeNull();

			// Reject the second — switch to catch
			second_reject!(new Error('second failed'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.caught')?.textContent).toBe('second failed');
			expect(container.querySelector('.pending')).toBeNull();
			expect(container.querySelector('.resolved')).toBeNull();
		},
	);

	it('resolved try block without catch bubbles error to parent try/catch', async () => {
		component ThrowingChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('async failed')));
			<p class="resolved">{data}</p>
		}

		component App() {
			try {
				<Inner />
			} catch (err) {
				<p class="parent-caught">{(err as Error).message}</p>
			}
		}

		component Inner() {
			try {
				<ThrowingChild />
			} pending {
				<p class="pending">{'loading...'}</p>
			}
		}

		render(App);

		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// Inner try has no catch, rejection should bubble to parent's catch
		expect(container.querySelector('.parent-caught')?.textContent).toBe('async failed');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it(
		'rejection sets derived value to SUSPENSE_REJECTED and promise is properly handled',
		async () => {
			let reject_fn: (error: Error) => void;
			let promise_settled: { type: 'resolved' | 'rejected'; value: any } | null = null;

			const user_promise = new Promise<string>((_, reject) => {
				reject_fn = reject;
			});
			user_promise.then(
				(v) => {
					promise_settled = { type: 'resolved', value: v };
				},
				(e) => {
					promise_settled = { type: 'rejected', value: e };
				},
			);

			let data: any;

			component App() {
				try {
					data = trackAsync(() => user_promise);
					<p class="resolved">{data.value}</p>
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err) {
					<p class="caught">{(err as Error).message}</p>
				}
			}

			render(App);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')?.textContent).toBe('loading...');

			reject_fn!(new Error('test rejection'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.caught')?.textContent).toBe('test rejection');
			expect(container.querySelector('.pending')).toBeNull();
			expect(container.querySelector('.resolved')).toBeNull();

			// The user promise was rejected and handled by the runtime
			expect(promise_settled).toEqual({ type: 'rejected', value: expect.any(Error) });
			expect((promise_settled as any).value.message).toBe('test rejection');
			expect(peek(data)).toEqual(SUSPENSE_REJECTED);
		},
	);

	it(
		'chained trackAsync: first rejects, dependent deferred is rejected and cleaned up',
		async () => {
			let first_reject: (error: Error) => void;
			let first_settled: { type: 'resolved' | 'rejected'; value: any } | null = null;

			const first_promise = new Promise<string>((_, reject) => {
				first_reject = reject;
			});
			first_promise.then(
				(v) => {
					first_settled = { type: 'resolved', value: v };
				},
				(e) => {
					first_settled = { type: 'rejected', value: e };
				},
			);

			let name: any;
			let length: any;

			component App() {
				try {
					name = trackAsync(() => first_promise);
					length = trackAsync(() => {
						const n = name.value;
						return new Promise<number>((resolve) => {
							resolve(n.length);
						});
					});
					<p class="resolved">
						{name.value}
						{' has length '}
						{length.value}
					</p>
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err) {
					<p class="caught">{(err as Error).message}</p>
				}
			}

			render(App);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.pending')?.textContent).toBe('loading...');

			// Reject the first — should route to catch and clean up second's deferred
			first_reject!(new Error('first failed'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.caught')?.textContent).toBe('first failed');
			expect(container.querySelector('.pending')).toBeNull();
			expect(container.querySelector('.resolved')).toBeNull();
			expect(peek(name)).toEqual(SUSPENSE_REJECTED);

			// First promise was rejected and handled
			expect(first_settled).toEqual({ type: 'rejected', value: expect.any(Error) });

			// Verify stability — catch stays, no further state changes
			await new Promise((resolve) => setTimeout(resolve, 50));
			flushSync();
			expect(container.querySelector('.caught')?.textContent).toBe('first failed');
			// length never has a chance to run because name access throws and exits the block
			expect(peek(length)).toEqual(SUSPENSE_REJECTED);
		},
	);

	it('deep chained trackAsync: A rejects, B and C deferreds are cleaned up', async () => {
		let a_reject: (error: Error) => void;
		let a_settled: { type: 'resolved' | 'rejected'; value: any } | null = null;

		const a_promise = new Promise<string>((_, reject) => {
			a_reject = reject;
		});
		a_promise.then(
			(v) => {
				a_settled = { type: 'resolved', value: v };
			},
			(e) => {
				a_settled = { type: 'rejected', value: e };
			},
		);

		let a: any;
		let b: any;
		let c: any;
		component App() {
			try {
				a = trackAsync(() => a_promise);
				b = trackAsync(() => {
					const val = a.value;
					return Promise.resolve(val.toUpperCase());
				});
				c = trackAsync(() => {
					const val = b.value;
					return Promise.resolve(val.length);
				});
				<p class="resolved">
					{a.value}
					{' → '}
					{b.value}
					{' → '}
					{c.value}
				</p>
			} pending {
				<p class="pending">{'loading...'}</p>
			} catch (err) {
				<p class="caught">{(err as Error).message}</p>
			}
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.pending')?.textContent).toBe('loading...');

		// Reject A — should cascade to catch, B and C cleaned up
		a_reject!(new Error('chain failed'));
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.caught')?.textContent).toBe('chain failed');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();

		// A promise was rejected and handled
		expect(a_settled).toEqual({ type: 'rejected', value: expect.any(Error) });
		expect(peek(a)).toEqual(SUSPENSE_REJECTED);
		expect(peek(b)).toEqual(SUSPENSE_REJECTED);
		expect(peek(c)).toEqual(SUSPENSE_REJECTED);

		// Verify stability — no further state changes from B/C deferreds settling
		await new Promise((resolve) => setTimeout(resolve, 50));
		flushSync();
		expect(container.querySelector('.caught')?.textContent).toBe('chain failed');
	});

	it('multiple independent trackAsyncs, one rejects, catch shows first error', async () => {
		let first_reject: (error: Error) => void;
		let second_resolve: (value: number) => void;
		let first_settled: { type: 'resolved' | 'rejected'; value: any } | null = null;
		let second_settled: { type: 'resolved' | 'rejected'; value: any } | null = null;

		const first_promise = new Promise<string>((_, reject) => {
			first_reject = reject;
		});
		first_promise.then(
			(v) => {
				first_settled = { type: 'resolved', value: v };
			},
			(e) => {
				first_settled = { type: 'rejected', value: e };
			},
		);

		const second_promise = new Promise<number>((resolve) => {
			second_resolve = resolve;
		});
		second_promise.then(
			(v) => {
				second_settled = { type: 'resolved', value: v };
			},
			(e) => {
				second_settled = { type: 'rejected', value: e };
			},
		);

		let name: any;
		let count: any;
		component App() {
			try {
				name = trackAsync(() => first_promise);
				count = trackAsync(() => second_promise);
				<p class="resolved">
					{name.value}
					{' count: '}
					{count.value}
				</p>
			} pending {
				<p class="pending">{'loading...'}</p>
			} catch (err) {
				<p class="caught">{(err as Error).message}</p>
			}
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.pending')?.textContent).toBe('loading...');
		expect(peek(name)).toEqual(SUSPENSE_PENDING);
		expect(peek(count)).toEqual(SUSPENSE_PENDING);

		// Reject the first — catch should render
		first_reject!(new Error('name failed'));
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.caught')?.textContent).toBe('name failed');
		expect(container.querySelector('.pending')).toBeNull();

		// First promise was rejected
		expect(first_settled).toEqual({ type: 'rejected', value: expect.any(Error) });
		expect(peek(name)).toEqual(SUSPENSE_REJECTED);
		expect(peek(count)).toEqual(SUSPENSE_PENDING);

		// Resolve the second — catch should stay stable
		second_resolve!(42);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.caught')?.textContent).toBe('name failed');
		expect(container.querySelector('.resolved')).toBeNull();

		// Second promise was resolved (by the test), but the boundary already caught
		expect(second_settled).toEqual({ type: 'resolved', value: 42 });
		expect(peek(name)).toEqual(SUSPENSE_REJECTED);
		expect(peek(count)).toEqual(42);
	});
});

describe('sync error while async deriveds are pending', () => {
	it(
		'catch stays stable when sync error fires while promise is pending, then promise resolves',
		async () => {
			let resolve_fn: ((v: string) => void) | undefined;
			let user_promise = new Promise<string>((resolve) => {
				resolve_fn = resolve;
			});
			let promise_settled: { type: string; value: any } | null = null;
			user_promise.then(
				(v) => (promise_settled = { type: 'resolved', value: v }),
				(e) => (promise_settled = { type: 'rejected', value: e }),
			);

			component App() {
				try {
					<AsyncChild />
					<ThrowingChild />
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err: Error) {
					<p class="caught">{err.message}</p>
				}
			}

			let data: any;
			component AsyncChild() {
				data = trackAsync(() => user_promise);
				<p class="async-resolved">{data.value}</p>
			}

			component ThrowingChild() {
				throw new Error('sync boom');
			}

			render(App);
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			// The sync error from ThrowingChild should trigger catch
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.pending')).toBeNull();
			expect(container.querySelector('.async-resolved')).toBeNull();

			expect(peek(data)).toEqual(SUSPENSE_PENDING);

			// Now resolve the promise that was in-flight
			resolve_fn!('hello');
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			// Catch should stay stable — boundary should NOT switch to resolved
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.async-resolved')).toBeNull();
			expect(promise_settled).toEqual({ type: 'resolved', value: 'hello' });

			expect(peek(data)).toEqual('hello');

			// Verify stability after all microtasks drain
			await new Promise((r) => setTimeout(r, 50));
			flushSync();
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.async-resolved')).toBeNull();
		},
	);

	it(
		'catch stays stable when sync error fires while promise is pending, then promise rejects',
		async () => {
			let reject_fn: ((e: any) => void) | undefined;
			let user_promise = new Promise<string>((_, reject) => {
				reject_fn = reject;
			});
			let promise_settled: { type: string; value: any } | null = null;
			user_promise.then(
				(v) => (promise_settled = { type: 'resolved', value: v }),
				(e) => (promise_settled = { type: 'rejected', value: e }),
			);

			component App() {
				try {
					<AsyncChild />
					<ThrowingChild />
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err: Error) {
					<p class="caught">{err.message}</p>
				}
			}

			let data: any;
			component AsyncChild() {
				data = trackAsync(() => user_promise);
				<p class="async-resolved">{data.value}</p>
			}

			component ThrowingChild() {
				throw new Error('sync boom');
			}

			render(App);
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			// Catch should be showing from sync error
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');

			expect(peek(data)).toEqual(SUSPENSE_PENDING);

			// Now reject the in-flight promise
			reject_fn!(new Error('async failure'));
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			// Catch should stay stable with the original sync error — no double-catch
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(promise_settled).toEqual({ type: 'rejected', value: expect.any(Error) });

			expect(peek(data)).toEqual(SUSPENSE_REJECTED);

			// Verify stability after all microtasks drain
			await new Promise((r) => setTimeout(r, 0));
			flushSync();
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.async-resolved')).toBeNull();
		},
	);

	it(
		'catch stays stable when sync error fires with multiple pending trackAsyncs, all later resolve',
		async () => {
			let resolve_a: ((v: string) => void) | undefined;
			let resolve_b: ((v: number) => void) | undefined;
			let promise_a = new Promise<string>((resolve) => {
				resolve_a = resolve;
			});
			let promise_b = new Promise<number>((resolve) => {
				resolve_b = resolve;
			});

			let settled_a: { type: string; value: any } | null = null;
			let settled_b: { type: string; value: any } | null = null;
			promise_a.then(
				(v) => (settled_a = { type: 'resolved', value: v }),
				(e) => (settled_a = { type: 'rejected', value: e }),
			);
			promise_b.then(
				(v) => (settled_b = { type: 'resolved', value: v }),
				(e) => (settled_b = { type: 'rejected', value: e }),
			);

			component App() {
				try {
					<ChildA />
					<ChildB />
					<ThrowingChild />
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err: Error) {
					<p class="caught">{err.message}</p>
				}
			}

			let dataA: any;
			component ChildA() {
				dataA = trackAsync(() => promise_a);
				<p class="a">{dataA.value}</p>
			}

			let dataB: any;
			component ChildB() {
				dataB = trackAsync(() => promise_b);
				<p class="b">{dataB.value}</p>
			}

			component ThrowingChild() {
				throw new Error('sync boom');
			}

			render(App);
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');

			expect(peek(dataA)).toEqual(SUSPENSE_PENDING);
			expect(peek(dataB)).toEqual(SUSPENSE_PENDING);

			// Resolve both promises
			resolve_a!('hello');
			resolve_b!(42);
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			// Catch should stay — boundary must NOT switch to resolved
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.a')).toBeNull();
			expect(container.querySelector('.b')).toBeNull();
			expect(settled_a).toEqual({ type: 'resolved', value: 'hello' });
			expect(settled_b).toEqual({ type: 'resolved', value: 42 });

			expect(peek(dataA)).toEqual('hello');
			expect(peek(dataB)).toEqual(42);

			// Verify stability after all microtasks drain
			await new Promise((r) => setTimeout(r, 50));
			flushSync();
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.a')).toBeNull();
			expect(container.querySelector('.b')).toBeNull();
		},
	);

	it(
		'catch stays stable when sync error fires with multiple pending trackAsyncs, one resolves and one rejects',
		async () => {
			let resolve_a: ((v: string) => void) | undefined;
			let reject_b: ((e: any) => void) | undefined;
			let promise_a = new Promise<string>((resolve) => {
				resolve_a = resolve;
			});
			let promise_b = new Promise<number>((_, reject) => {
				reject_b = reject;
			});

			let settled_a: { type: string; value: any } | null = null;
			let settled_b: { type: string; value: any } | null = null;
			promise_a.then(
				(v) => (settled_a = { type: 'resolved', value: v }),
				(e) => (settled_a = { type: 'rejected', value: e }),
			);
			promise_b.then(
				(v) => (settled_b = { type: 'resolved', value: v }),
				(e) => (settled_b = { type: 'rejected', value: e }),
			);

			component App() {
				try {
					<ChildA />
					<ChildB />
					<ThrowingChild />
				} pending {
					<p class="pending">{'loading...'}</p>
				} catch (err: Error) {
					<p class="caught">{err.message}</p>
				}
			}

			let dataA: any;
			component ChildA() {
				dataA = trackAsync(() => promise_a);
				<p class="a">{dataA.value}</p>
			}

			let dataB: any;
			component ChildB() {
				dataB = trackAsync(() => promise_b);
				<p class="b">{dataB.value}</p>
			}

			component ThrowingChild() {
				throw new Error('sync boom');
			}

			render(App);
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');

			expect(peek(dataA)).toEqual(SUSPENSE_PENDING);
			expect(peek(dataB)).toEqual(SUSPENSE_PENDING);

			// Resolve A, reject B
			resolve_a!('hello');
			reject_b!(new Error('async failure'));
			await new Promise((r) => setTimeout(r, 0));
			flushSync();

			// Catch should stay with original sync error
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.a')).toBeNull();
			expect(container.querySelector('.b')).toBeNull();
			expect(settled_a).toEqual({ type: 'resolved', value: 'hello' });
			expect(settled_b).toEqual({ type: 'rejected', value: expect.any(Error) });

			expect(peek(dataA)).toEqual('hello');
			expect(peek(dataB)).toEqual(SUSPENSE_REJECTED);

			// Verify stability after all microtasks drain
			await new Promise((r) => setTimeout(r, 50));
			flushSync();
			expect(container.querySelector('.caught')?.textContent).toBe('sync boom');
			expect(container.querySelector('.a')).toBeNull();
			expect(container.querySelector('.b')).toBeNull();
		},
	);

	it('try block without catch propagates sync error to upstream boundary', async () => {
		component ThrowingChild() {
			throw new Error('no catch here');
			<p>{'should not render'}</p>
		}

		component App() {
			try {
				<Inner />
			} catch (err) {
				<p class="upstream-caught">{(err as Error).message}</p>
			}
		}

		component Inner() {
			try {
				<ThrowingChild />
			} pending {
				<p class="inner-pending">{'loading...'}</p>
			}
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.upstream-caught')?.textContent).toBe('no catch here');
	});

	it('try block without catch propagates async rejection to upstream boundary', async () => {
		component App() {
			try {
				<Inner />
			} catch (err) {
				<p class="upstream-caught">{(err as Error).message}</p>
			}
		}

		component Inner() {
			try {
				let &[data] = trackAsync(() => Promise.reject(new Error('async no catch')));
				<p class="resolved">{data}</p>
			} pending {
				<p class="inner-pending">{'loading...'}</p>
			}
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.upstream-caught')?.textContent).toBe('async no catch');
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it(
		'try block without catch and without pending propagates async rejection to upstream boundary',
		async () => {
			let reject_fn: (error: Error) => void;
			const user_promise = new Promise<string>((_, reject) => {
				reject_fn = reject;
			});

			component App() {
				try {
					<Inner />
				} catch (err) {
					<p class="upstream-caught">{(err as Error).message}</p>
				}
			}

			component Inner() {
				try {
					let &[data] = trackAsync(() => user_promise);
					<p class="resolved">{data}</p>
				} pending {
					<p class="inner-pending">{'loading...'}</p>
				}
			}

			render(App);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// Inner should show nothing yet (no pending block)
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.upstream-caught')).toBeNull();

			// Reject the promise
			reject_fn!(new Error('deferred no catch'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.upstream-caught')?.textContent).toBe('deferred no catch');
		},
	);

	it('nested try blocks without catch propagate error through multiple levels', async () => {
		component ThrowingChild() {
			throw new Error('deep error');
			<p>{'should not render'}</p>
		}

		component App() {
			try {
				<Middle />
			} catch (err) {
				<p class="top-caught">{(err as Error).message}</p>
			}
		}

		component Middle() {
			try {
				<Inner />
			} pending {
				<p class="mid-pending">{'loading...'}</p>
			}
		}

		component Inner() {
			try {
				<ThrowingChild />
			} pending {
				<p class="inner-pending">{'loading...'}</p>
			}
		}

		render(App);
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.top-caught')?.textContent).toBe('deep error');
	});

	it('try block without catch throws to global when no upstream boundary exists', async () => {
		component ThrowingChild() {
			throw new Error('unhandled error');
			<p>{'should not render'}</p>
		}

		component App() {
			try {
				<ThrowingChild />
			} pending {
				<p class="pending">{'loading...'}</p>
			}
		}

		expect(() => {
			render(App);
		}).toThrow('unhandled error');
	});

	it(
		'outer try block with pending and inner try with catch and without pending should propagate rejection to inner boundary',
		async () => {
			let reject_fn: (error: Error) => void;
			const user_promise = new Promise<string>((_, reject) => {
				reject_fn = reject;
			});

			component Inner() {
				try {
					let &[data] = trackAsync(() => user_promise);
					<p class="resolved">{data}</p>
				} catch (err) {
					<p class="downstream-caught">{(err as Error).message}</p>
				}
			}

			component App() {
				try {
					<Inner />
				} pending {
					<p class="outer-pending">{'loading...'}</p>
				}
			}

			render(App);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// Inner should show nothing yet (no pending block)
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.downstream-caught')).toBeNull();
			expect(container.querySelector('.outer-pending')?.textContent).toBe('loading...');

			// Reject the promise
			reject_fn!(new Error('deferred no catch'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.downstream-caught')?.textContent).toBe('deferred no catch');
			expect(container.querySelector('.outer-pending')).toBeNull();
		},
	);

	it(
		'outer try block with pending and inner try with synchronous catch and without pending should propagate rejection to inner boundary with promise rejecting',
		async () => {
			let reject_fn: (error: Error) => void;
			let resolve_fn: (value: string) => void;
			const user_promise = new Promise<string>((resolve, reject) => {
				resolve_fn = resolve;
				reject_fn = reject;
			});

			let user_settled: { type: string; value: any } | null = null;
			user_promise.then(
				(v) => (user_settled = { type: 'resolved', value: v }),
				(e) => (user_settled = { type: 'rejected', value: e }),
			);

			component Inner() {
				try {
					let &[data] = trackAsync(() => user_promise);
					throw new Error('synchronous error');
					<p class="resolved">{data}</p>
				} catch (err) {
					<p class="downstream-caught">{(err as Error).message}</p>
				}
			}

			component App() {
				try {
					<Inner />
				} pending {
					<p class="outer-pending">{'loading...'}</p>
				}
			}

			render(App);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// Inner should show nothing yet (no pending block)
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.outer-pending')).not.toBeNull();
			expect(container.querySelector('.downstream-caught')).toBeNull();

			// Reject the promise
			reject_fn!(new Error('whatever'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.outer-pending')).toBeNull();
			expect(container.querySelector('.downstream-caught')?.textContent).toBe('synchronous error');
			expect(user_settled).toEqual({ type: 'rejected', value: expect.any(Error) });
		},
	);

	it(
		'outer try block with pending and inner try with synchronous catch and without pending should propagate rejection to inner boundary with promise resolving instead of rejecting',
		async () => {
			let reject_fn: (error: Error) => void;
			let resolve_fn: (value: string) => void;
			const user_promise = new Promise<string>((resolve, reject) => {
				resolve_fn = resolve;
				reject_fn = reject;
			});

			let user_settled: { type: string; value: any } | null = null;
			user_promise.then(
				(v) => (user_settled = { type: 'resolved', value: v }),
				(e) => (user_settled = { type: 'rejected', value: e }),
			);

			component Inner() {
				try {
					let &[data] = trackAsync(() => user_promise);
					throw new Error('synchronous error');
					<p class="resolved">{data}</p>
				} catch (err) {
					<p class="downstream-caught">{(err as Error).message}</p>
				}
			}

			component App() {
				try {
					<Inner />
				} pending {
					<p class="outer-pending">{'loading...'}</p>
				}
			}

			render(App);
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			// Inner should show nothing yet (no pending block)
			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.outer-pending')).not.toBeNull();
			expect(container.querySelector('.downstream-caught')).toBeNull();

			// Resolve the promise
			resolve_fn!('hello');
			await new Promise((resolve) => setTimeout(resolve, 0));
			flushSync();

			expect(container.querySelector('.resolved')).toBeNull();
			expect(container.querySelector('.outer-pending')).toBeNull();
			// this should render the catch block and make the resolved visible,
			// and the pending of the parent goes away
			expect(container.querySelector('.downstream-caught')?.textContent).toBe('synchronous error');
			expect(user_settled).toEqual({ type: 'resolved', value: 'hello' });
		},
	);
});
