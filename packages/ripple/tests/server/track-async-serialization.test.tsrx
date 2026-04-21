import { DEV } from 'esm-env';
import { trackAsync } from 'ripple';

const TRACK_ASYNC_PUBLIC_ERROR_MESSAGE = 'An error occurred during async rendering';

describe('trackAsync serialization (server)', () => {
	it('serializes resolved trackAsync data as a script tag in SSR output', async () => {
		component App() {
			try {
				let &[data] = trackAsync(() => Promise.resolve('hello world'));
				<p class="result">{data}</p>
			} pending {
				<p class="loading">{'loading...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('hello world');
		// Should contain a serialization script tag
		expect(body).toContain('__tsrx_ta_');
		expect(body).toContain('type="application/json"');
	});

	it('serializes numeric trackAsync data correctly', async () => {
		component App() {
			try {
				let &[count] = trackAsync(() => Promise.resolve(42));
				<span class="count">{count}</span>
			} pending {
				<span>{'...'}</span>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('42');
		expect(body).toContain('__tsrx_ta_');
	});

	it('serializes object trackAsync data correctly', async () => {
		component App() {
			try {
				let &[data] = trackAsync(() => Promise.resolve({ name: 'Alice', age: 30 }));
				<p>{data.name}</p>
			} pending {
				<p>{'...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('Alice');
		expect(body).toContain('__tsrx_ta_');
	});

	it('serializes array trackAsync data correctly', async () => {
		component App() {
			try {
				let &[items] = trackAsync(() => Promise.resolve(['a', 'b', 'c']));
				<ul>
					for (let item of items) {
						<li>{item}</li>
					}
				</ul>
			} pending {
				<p>{'...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('<li>a</li>');
		expect(body).toContain('__tsrx_ta_');
	});

	it('serializes rejected trackAsync as error envelope', async () => {
		component App() {
			try {
				let &[data] = trackAsync(() => Promise.reject(new Error('fetch failed')));
				<p class="result">{data}</p>
			} pending {
				<p class="loading">{'loading...'}</p>
			} catch (e) {
				<p class="error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(App);
		const public_message = DEV ? 'fetch failed' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
		expect(body).toContain(`<p class="error">${public_message}</p>`);
		expect(body).toContain('__tsrx_ta_');
		expect(body).toContain('"ok":false');
		expect(body).toContain(`"message":"${public_message}"`);
	});

	it('serializes error when child component error bubbles to parent catch', async () => {
		component Child() {
			try {
				let &[data] = trackAsync(() => Promise.reject(new Error('child error')));
				<p class="result">{data}</p>
			} pending {
				<p class="pending">{'loading...'}</p>
			}
		}

		component Parent() {
			try {
				<Child />
			} catch (e) {
				<p class="parent-error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(Parent);
		const public_message = DEV ? 'child error' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
		expect(body).toContain(`<p class="parent-error">${public_message}</p>`);
		expect(body).toContain('__tsrx_ta_');
		expect(body).toContain('"ok":false');
		expect(body).toContain(`"message":"${public_message}"`);
	});

	it('serializes sync trackAsync throw using original cause message', async () => {
		component App() {
			try {
				let &[data] = trackAsync(() => {
					throw new Error('sync failure');
				});
				<p class="result">{data}</p>
			} pending {
				<p class="loading">{'loading...'}</p>
			} catch (e) {
				<p class="error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(App);
		const public_message = DEV ? 'sync failure' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
		expect(body).toContain(`<p class="error">${public_message}</p>`);
		expect(body).toContain('__tsrx_ta_');
		expect(body).toContain('"ok":false');
		expect(body).toContain(`"message":"${public_message}"`);
		expect(body).not.toContain('Error thrown during trackAsync execution');
	});

	it('escapes serialized error payload to keep script tag safe', async () => {
		component App() {
			try {
				let &[data] = trackAsync(
					() => Promise.reject(new Error('</script><div data-injected="1">boom</div>')),
				);
				<p class="result">{data}</p>
			} pending {
				<p class="loading">{'loading...'}</p>
			} catch (e) {
				<p class="error">{(e as Error).message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('__tsrx_ta_');
		if (DEV) {
			expect(body).toContain('\\u003c/script\\u003e');
			expect(body).not.toContain(
				'type="application/json">{"ok":false,"error":{"message":"</script>',
			);
		}
	});

	it('generates unique hashes for multiple trackAsync calls', async () => {
		component App() {
			try {
				let &[a] = trackAsync(() => Promise.resolve('first'));
				let &[b] = trackAsync(() => Promise.resolve('second'));
				<p>{a}</p>
				<p>{b}</p>
			} pending {
				<p>{'...'}</p>
			}
		}

		const { body } = await render(App);
		// Find all script tag IDs
		const matches = [...body.matchAll(/id="(__tsrx_ta_[a-f0-9]+)"/g)];
		expect(matches.length).toBe(2);
		// Hashes should be different
		expect(matches[0][1]).not.toBe(matches[1][1]);
	});
});
