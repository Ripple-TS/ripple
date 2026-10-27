// Adapted from TanStack/solid-router tests/server/Await.test.tsx at
// da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ripple/server';
import { Await, createControlledPromise } from '@ripple-ts/tanstack-router';

describe('Await (server)', () => {
	it('flushes blank content while an Await without a fallback is pending', async () => {
		const promise = createControlledPromise<string>();
		const records: string[] = [];
		const completed = render(() => <Await {promise} render={(value) => <span>{value}</span>} />, {
			stream: {
				push: (chunk) => records.push(chunk),
				close() {},
				error(error) {
					throw error;
				},
			},
		});
		expect(records.length).toBeGreaterThan(0);
		expect(records.join('')).not.toContain('resolved');
		promise.resolve('resolved');
		await completed;
		expect(records.join('')).toContain('resolved');
	});
	it('renders an error boundary when an Await without a fallback rejects', async () => {
		function App() @{
			@try {
				@try {
					<Await
						promise={Promise.reject(new Error('rejected'))}
						render={(value) => <span>{value}</span>}
					/>
				} @pending {
					<span>inner pending</span>
				}
			} @pending {
				<span>outer pending</span>
			} @catch (error: Error) {
				<span>{error.message}</span>
			}
		}
		const { body } = await render(App);
		expect(body).toContain('rejected');
		expect(body).not.toContain('pending');
	});
	it.each([
		['zero', 0],
		['false', false],
		['empty string', ''],
		['null', null],
		['undefined', undefined],
	])('renders a resolved %s value', async (_, value) => {
		const children = vi.fn(() => <span>resolved</span>);
		const { body } = await render(
			() =>
				<Await
					promise={Promise.resolve(value)}
					fallback={<span>pending</span>}
					render={children}
				/>,
		);
		expect(children).toHaveBeenCalledOnce();
		expect(children).toHaveBeenCalledWith(value);
		expect(body).toContain('resolved');
		expect(body).not.toContain('pending');
	});
});
