// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expect, it, vi } from 'vitest';
import { render, waitFor } from '../../harness.js';
import { Await } from '@ripple-ts/tanstack-router';

it.each([
	['zero', 0],
	['false', false],
	['empty string', ''],
	['null', null],
	['undefined', undefined],
])('renders a resolved %s value', async (_name, value) => {
	const content = vi.fn(() => <span>resolved</span>);
	render(
		() =>
			<Await promise={Promise.resolve(value)} fallback={<span>pending</span>} render={content} />,
	);
	await waitFor(() => expect(content).toHaveBeenCalledOnce());
	expect(content).toHaveBeenCalledWith(value);
});
