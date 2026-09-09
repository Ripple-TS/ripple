import { DEV } from 'esm-env';
import { setTransport, trackAsync } from 'ripple';
import * as devalue from 'devalue';

const TRACK_ASYNC_PUBLIC_ERROR_MESSAGE = 'An error occurred during async rendering';

describe('trackAsync serialization (server)', () => {
	afterEach(() => setTransport());

	it('serializes resolved trackAsync data as a script tag in SSR output', async () => {
		function App() @{
			@try {
				let &[data] = trackAsync(() => Promise.resolve('hello world'));
				<p class="result">{data}</p>
			} @pending {
				<p class="loading">{'loading...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('hello world');
		// Should contain a serialization script tag
		expect(body).toContain('__ripple_ta_');
		expect(body).toContain('type="application/json"');
	});

	it('serializes numeric trackAsync data correctly', async () => {
		function App() @{
			@try {
				let &[count] = trackAsync(() => Promise.resolve(42));
				<span class="count">{count}</span>
			} @pending {
				<span>{'...'}</span>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('42');
		expect(body).toContain('__ripple_ta_');
	});

	it('serializes object trackAsync data correctly', async () => {
		function App() @{
			@try {
				let &[data] = trackAsync(() => Promise.resolve({ name: 'Alice', age: 30 }));
				<p>{data.name}</p>
			} @pending {
				<p>{'...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('Alice');
		expect(body).toContain('__ripple_ta_');
	});

	it('serializes array trackAsync data correctly', async () => {
		function App() @{
			@try {
				let &[items] = trackAsync(() => Promise.resolve(['a', 'b', 'c']));
				<ul>
					@for (let item of items) {
						<li>{item}</li>
					}
				</ul>
			} @pending {
				<p>{'...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('<li><!--[-->a<!--]--></li>');
		expect(body).toContain('__ripple_ta_');
	});

	it('serializes rejected trackAsync as error envelope', async () => {
		function App() @{
			@try {
				let &[data] = trackAsync(() => Promise.reject(new Error('fetch failed')));
				<p class="result">{data}</p>
			} @pending {
				<p class="loading">{'loading...'}</p>
			} @catch (e) {
				<p class="error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(App);
		const public_message = DEV ? 'fetch failed' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
		expect(body).toContain(`<p class="error"><!--[-->${public_message}<!--]--></p>`);
		expect(body).toContain('__ripple_ta_');
		expect(body).toContain('"ok":false');
		expect(body).toContain(`"message":"${public_message}"`);
	});

	it('serializes error when child component error bubbles to parent catch', async () => {
		function Child() @{
			@try {
				let &[data] = trackAsync(() => Promise.reject(new Error('child error')));
				<p class="result">{data}</p>
			} @pending {
				<p class="pending">{'loading...'}</p>
			}
		}

		function Parent() @{
			@try {
				<Child />
			} @catch (e) {
				<p class="parent-error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(Parent);
		const public_message = DEV ? 'child error' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
		expect(body).toContain(`<p class="parent-error"><!--[-->${public_message}<!--]--></p>`);
		expect(body).toContain('__ripple_ta_');
		expect(body).toContain('"ok":false');
		expect(body).toContain(`"message":"${public_message}"`);
	});

	it('serializes sync trackAsync throw using original cause message', async () => {
		function App() @{
			@try {
				let &[data] = trackAsync(() => {
					throw new Error('sync failure');
				});
				<p class="result">{data}</p>
			} @pending {
				<p class="loading">{'loading...'}</p>
			} @catch (e) {
				<p class="error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(App);
		const public_message = DEV ? 'sync failure' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
		expect(body).toContain(`<p class="error"><!--[-->${public_message}<!--]--></p>`);
		expect(body).toContain('__ripple_ta_');
		expect(body).toContain('"ok":false');
		expect(body).toContain(`"message":"${public_message}"`);
		expect(body).not.toContain('Error thrown during trackAsync execution');
	});

	describe('hydration envelope encoding', () => {
		async function envelope_for(value: unknown) {
			function App() @{
				@try {
					let &[data] = trackAsync(() => Promise.resolve(value));
					<p>{String(data !== undefined)}</p>
				} @pending {
					<p>{'...'}</p>
				}
			}

			const { body } = await render(App);
			const match = body.match(
				/<script id="__ripple_ta_[a-f0-9]+" type="application\/json">(.*?)<\/script>/s,
			);
			expect(match).not.toBeNull();
			const text = /** @type {RegExpMatchArray} */ (match)[1];
			expect(text).not.toContain('<');
			return JSON.parse(text);
		}

		it('ships plain data trees as raw JSON', async () => {
			const value = {
				title: 'Card 0 — "alpha" \\ <b>&</b>',
				count: 3,
				ratio: 0.5,
				ok: true,
				none: null,
				items: [{ label: 'a\nb', value: 'tab\there' }, ['x', 1, false], '😀 '],
				'odd key': { nested: [] },
			};
			const envelope = await envelope_for(value);
			expect(envelope.ok).toBe(true);
			expect(envelope.payload).toBeUndefined();
			expect(envelope.value).toEqual(value);
		});

		it('ships primitives as raw JSON', async () => {
			expect((await envelope_for('hello')).value).toBe('hello');
			expect((await envelope_for('lone � surrogate')).value).toBe('lone � surrogate');
			expect((await envelope_for(42)).value).toBe(42);
			expect((await envelope_for(false)).value).toBe(false);
			expect((await envelope_for(null)).value).toBe(null);
		});

		it('keeps the devalue encoding for values JSON cannot represent', async () => {
			const shared = { n: 1 };
			const cyclic: { self?: unknown } = {};
			cyclic.self = cyclic;
			for (const value of [
				undefined,
				NaN,
				Infinity,
				-0,
				10n,
				new Date(0),
				new Map([[1, 2]]),
				new Set([1]),
				/re/,
				Object.create(null),
				{ a: undefined },
				{ a: shared, b: shared },
				[shared, shared],
				cyclic,
				// eslint-disable-next-line no-sparse-arrays
				[1, , 3],
			]) {
				const envelope = await envelope_for(value);
				expect(envelope.value).toBeUndefined();
				expect(typeof envelope.payload).toBe('string');
			}
		});

		it('keeps the raw JSON path for an empty transport', async () => {
			setTransport({});
			const value = { title: 'Card', items: [1, true, null] };
			expect(await envelope_for(value)).toEqual({ ok: true, value });
		});

		it('serializes custom classes and preserves shared references', async () => {
			class Money {
				amount: number;
				currency: string;
				constructor(amount: number, currency: string) {
					this.amount = amount;
					this.currency = currency;
				}
			}
			const decode = ([amount, currency]: [number, string]) => new Money(amount, currency);
			setTransport({
				Money: {
					encode: (value) => value instanceof Money && [value.amount, value.currency],
					decode,
				},
			});
			const money = new Money(12, '</script><script>injected</script>');
			const envelope = await envelope_for({ first: money, second: money, date: new Date(0) });
			expect(envelope.value).toBeUndefined();
			const restored = devalue.parse(envelope.payload, { Money: decode });
			expect(restored.first).toBeInstanceOf(Money);
			expect(restored.first).toEqual(money);
			expect(restored.second).toBe(restored.first);
			expect(restored.date).toEqual(new Date(0));
		});

		it('lets reducers claim plain objects without first walking the JSON path', async () => {
			const read_amount = vi.fn(() => 12);
			const encode = vi.fn((value: any) => value?.__type === 'Money' && [value.amount]);
			const decode = ([amount]: [number]) => ({ amount, revived: true });
			setTransport({ Money: { encode, decode } });
			const value = {
				nested: {
					__type: 'Money',
					get amount() {
						return read_amount();
					},
				},
			};
			const envelope = await envelope_for(value);
			expect(envelope.value).toBeUndefined();
			expect(devalue.parse(envelope.payload, { Money: decode })).toEqual({
				nested: { amount: 12, revived: true },
			});
			expect(encode.mock.calls.filter(([node]) => node === value.nested)).toHaveLength(1);
			expect(read_amount).toHaveBeenCalledTimes(1);
		});

		it(
			'uses devalue for plain data under an unused transport and restores JSON after reset',
			async () => {
				setTransport({ Unused: { encode: () => undefined, decode: (value) => value } });
				const value = { title: 'Card', items: [1, true, null] };
				const envelope = await envelope_for(value);
				expect(envelope.value).toBeUndefined();
				expect(devalue.parse(envelope.payload)).toEqual(value);
				setTransport();
				expect(await envelope_for(value)).toEqual({ ok: true, value });
			},
		);
	});

	it('escapes serialized error payload to keep script tag safe', async () => {
		function App() @{
			@try {
				let &[data] = trackAsync(
					() => Promise.reject(new Error('</script><div data-injected="1">boom</div>')),
				);
				<p class="result">{data}</p>
			} @pending {
				<p class="loading">{'loading...'}</p>
			} @catch (e) {
				<p class="error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('__ripple_ta_');
		if (DEV) {
			expect(body).toContain('\\u003c/script\\u003e');
			expect(body).not.toContain(
				'type="application/json">{"ok":false,"error":{"message":"</script>',
			);
		}
	});

	it('generates unique hashes for multiple trackAsync calls', async () => {
		function App() @{
			@try {
				let &[a] = trackAsync(() => Promise.resolve('first'));
				let &[b] = trackAsync(() => Promise.resolve('second'));
				<>
					<p>{a}</p>
					<p>{b}</p>
				</>
			} @pending {
				<p>{'...'}</p>
			}
		}

		const { body } = await render(App);
		// Find all script tag IDs
		const matches = [...body.matchAll(/id="(__ripple_ta_[a-f0-9]+)"/g)];
		expect(matches.length).toBe(2);
		// Hashes should be different
		expect(matches[0][1]).not.toBe(matches[1][1]);
	});
});
