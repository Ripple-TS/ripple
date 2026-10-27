// Real Ripple renderer counterpart of Solid's server/renderToStreamRecords.test.tsx
// at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expect, it, vi } from 'vitest';
import { trackAsync } from 'ripple';
import { render } from 'ripple/server';
import { createControlledPromise } from '@ripple-ts/tanstack-router';

it(
	'writes resolved pending patches as complete records while another boundary remains open',
	async () => {
		const first = createControlledPromise<string>(), second = createControlledPromise<string>();
		function Child({ promise }: { promise: Promise<string> }) @{
			const value = trackAsync(() => promise);
			<p>{value.value}</p>
		}
		function App() @{
			<>
				@try {
					<Child promise={first} />
				} @pending {
					<p>First pending</p>
				}
				@try {
					<Child promise={second} />
				} @pending {
					<p>Second pending</p>
				}
			</>
		}
		const records: string[] = [];
		const done = render(App, {
			stream: {
				push: (chunk) => records.push(chunk),
				close() {},
				error(error) {
					throw error;
				},
			},
		});
		first.resolve('First ready');
		await vi.waitFor(() => expect(records.length).toBe(2));
		expect(records[1]).toContain('First ready');
		expect(records[1]).not.toContain('Second ready');
		expect(records[1]).toMatch(
			/<template [\s\S]*<\/template><script>__RIPPLE_S__\([^]*\)<\/script>$/,
		);
		second.resolve('Second ready');
		await done;
		expect(records.at(-1)).toContain('Second ready');
		expect(records.at(-1)).toMatch(/<\/template><script>__RIPPLE_S__\([^]*\)<\/script>$/);
	},
);
