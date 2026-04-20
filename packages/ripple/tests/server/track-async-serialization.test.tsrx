import { trackAsync } from 'ripple';

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
		expect(body).toContain('"v":1');
		expect(body).toContain('"encoding":"devalue@5.7"');
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
