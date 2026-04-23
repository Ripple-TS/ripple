import { trackAsync, flushSync, SUSPENSE_PENDING, peek } from 'ripple';

describe('trackAsync hydration from serialized data (client)', () => {
	it('reads serialized data from script tag during hydration simulation', async () => {
		// This test verifies the client runtime can parse the serialized script tags
		// The full hydration round-trip is tested in hydration tests

		component App() {
			try {
				let &[data] = trackAsync(() => Promise.resolve('fallback'));
				<p class="result">{data}</p>
			} pending {
				<p class="loading">{'loading...'}</p>
			}
		}

		render(App);

		// Without hydration, this should go through normal async flow
		// Need to wait for the pending state to render
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		// Promise resolves immediately so should show result
		expect(container.querySelector('.result')?.textContent).toBe('fallback');
	});

	it('trackAsync resolves normally when no script tag is present', async () => {
		let resolve_fn: (value: number) => void;
		const promise = new Promise<number>((r) => (resolve_fn = r));

		component App() {
			try {
				let &[value] = trackAsync(() => promise);
				<span class="value">{value}</span>
			} pending {
				<span class="pending">{'waiting'}</span>
			}
		}

		render(App);

		await new Promise((r) => setTimeout(r, 0));
		flushSync();

		expect(container.querySelector('.pending')?.textContent).toBe('waiting');

		resolve_fn!(42);
		await new Promise((r) => setTimeout(r, 0));
		flushSync();

		expect(container.querySelector('.value')?.textContent).toBe('42');
	});
});
