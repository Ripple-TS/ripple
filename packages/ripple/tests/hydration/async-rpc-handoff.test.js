import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import * as devalue from 'devalue';
import { hydrate, setTransport } from 'ripple';
import { render, executeServerFunction, setTransport as setServerTransport } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as server from './compiled/server/async-rpc-handoff.js';
import * as client from './compiled/client/async-rpc-handoff.js';

const hash = (name) =>
	createHash('sha256')
		.update('async-rpc-handoff.tsrx#' + name)
		.digest('hex')
		.slice(0, 8);
afterEach(() => {
	vi.unstubAllGlobals();
	setTransport();
	setServerTransport();
});
const transport = {
	Snapshot: {
		encode: (value) => value?.cursor !== undefined && [value.cursor],
		decode: ([cursor]) => ({ cursor }),
	},
};

describe('first RPC continuation recovery', () => {
	it.each([
		['Direct', false],
		['Direct', true],
		['Wrapped', false],
		['Wrapped', true],
	])(
		'recovers %s after network and service failures (custom transport: %s)',
		async (component, custom) => {
			if (custom) {
				setTransport(transport);
				setServerTransport(transport);
			}
			const method = component === 'Direct' ? 'rows' : 'promisedRows';
			const { body } = await render(server[component]);
			container.innerHTML = body;
			const envelope = JSON.parse(
				container.querySelector('script[id^="__ripple_ta_"]').textContent,
			);
			expect(envelope.r).toEqual([hash(method)]);
			let attempts = 0;
			const fetch = vi.fn(async (_url, init) => {
				expect(devalue.parse(init.body)).toEqual([100]);
				if (++attempts === 1) throw new TypeError('disconnected');
				if (attempts === 2) return new Response('unavailable', { status: 503 });
				return executeServerFunction(server._$_server_$_[method], init.body, init.signal);
			});
			vi.stubGlobal('fetch', fetch);
			const node = container.querySelector('p');
			const unmount = hydrate(client[component], { target: container });
			try {
				await vi.waitFor(() => expect(attempts).toBe(2));
				expect(node.textContent).toBe('100');
				expect(container.querySelector('i, em')).toBeNull();
				await vi.waitFor(() => expect(container.querySelector('b').textContent).toBe('done'));
				expect(attempts).toBe(3);
				expect(node.textContent).toBe('200');
				expect(container.querySelector('p')).toBe(node);
			} finally {
				unmount();
			}
		},
	);

	it('does not treat a mutation as a known stream read during handoff', async () => {
		const { body } = await render(server.Mutation);
		container.innerHTML = body;
		const envelope = JSON.parse(container.querySelector('script[id^="__ripple_ta_"]').textContent);
		expect(envelope.r).toEqual([hash('promisedRows')]);
		const fetch = vi.fn(async (url) => {
			expect(url).toContain(hash('mutation'));
			throw new TypeError('mutation request failed');
		});
		vi.stubGlobal('fetch', fetch);
		const unmount = hydrate(client.Mutation, { target: container });
		try {
			await vi.waitFor(() => expect(container.querySelector('em')).not.toBeNull());
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(fetch).toHaveBeenCalledTimes(1);
		} finally {
			unmount();
		}
	});
});
