import { DEV } from 'esm-env';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { flushSync, hydrate, setTransport } from 'ripple';
import { executeServerFunction, render, setTransport as setServerTransport } from 'ripple/server';
import * as devalue from 'devalue';
import { hydrateComponent, container } from '../setup-hydration.js';

import * as ServerComponents from './compiled/server/track-async-serialization.js';
import * as ClientComponents from './compiled/client/track-async-serialization.js';

const TRACK_ASYNC_PUBLIC_ERROR_MESSAGE = 'An error occurred during async rendering';
const TRACK_ASYNC_ERROR_MESSAGE = DEV ? 'fetch failed' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;
const TRACK_ASYNC_CHILD_ERROR_MESSAGE = DEV ? 'child error' : TRACK_ASYNC_PUBLIC_ERROR_MESSAGE;

describe('hydration > trackAsync serialization', () => {
	afterEach(() => {
		setTransport();
		setServerTransport();
		vi.unstubAllGlobals();
	});

	it('also accepts string devalue payloads with a registered transport', async () => {
		setServerTransport(ServerComponents.transport);
		setTransport(ClientComponents.transport);
		const { body } = await render(ServerComponents.AsyncCustomType);
		container.innerHTML = body;
		for (const script of container.querySelectorAll('script[id^="__ripple_ta_"]')) {
			const envelope = JSON.parse(script.textContent);
			envelope.payload = JSON.stringify(envelope.payload);
			script.textContent = JSON.stringify(envelope);
		}
		const unmount = hydrate(ClientComponents.AsyncCustomType, { target: container });
		try {
			expect(container.querySelector('.result')?.textContent).toBe('12 USD');
			expect(container.querySelector('script[id^="__ripple_ta_"]')).toBeNull();
		} finally {
			unmount();
		}
	});

	it('revives a custom class during hydration and sends it through RPC in both directions', async () => {
		const serverDecode = vi.fn(ServerComponents.transport.Money.decode);
		const clientDecode = vi.fn(ClientComponents.transport.Money.decode);
		setServerTransport({ Money: { ...ServerComponents.transport.Money, decode: serverDecode } });
		setTransport({ Money: { ...ClientComponents.transport.Money, decode: clientDecode } });
		const fetchMock = vi.fn(async (_url, init) => {
			const body = await executeServerFunction(
				ServerComponents._$_server_$_.doubleMoney,
				init.body,
			);
			return new Response(body, { status: 200 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const { unmount } = await hydrateComponent(
			ServerComponents.AsyncCustomType,
			ClientComponents.AsyncCustomType,
		);
		try {
			// Calling the instance method requires the client decoder, and hydration
			// must adopt the server result without refetching it.
			expect(container.querySelector('.result')?.textContent).toBe('12 USD');
			expect(container.querySelector('.loading')).toBeNull();
			expect(container.querySelector('script[id^="__ripple_ta_"]')).toBeNull();
			expect(fetchMock).not.toHaveBeenCalled();
			expect(clientDecode).toHaveBeenCalledTimes(1);
			expect(serverDecode).not.toHaveBeenCalled();

			container.querySelector('.increment').click();
			flushSync();
			await vi.waitFor(() => {
				expect(container.querySelector('.result')?.textContent).toBe('14 USD');
			});
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(fetchMock.mock.calls[0][0]).toMatch(/\/_\$_ripple_rpc_\$_\//);
			expect(clientDecode).toHaveBeenCalledTimes(2);
			expect(serverDecode).toHaveBeenCalledTimes(1);
		} finally {
			unmount();
		}
	});

	it('hydrates simple string value from serialized trackAsync', async () => {
		await hydrateComponent(ServerComponents.AsyncSimpleValue, ClientComponents.AsyncSimpleValue);

		expect(container.querySelector('.result')?.textContent).toBe('hydrated value');
		expect(container.querySelector('.loading')).toBeNull();

		// Serialization script tags should be removed after hydration
		expect(container.querySelector('script[id^="__ripple_ta_"]')).toBeNull();
	});

	it.each([false, true])(
		'keeps independently rendered roots isolated (detached: %s)',
		async (detached) => {
			const a = await render(() => ServerComponents.AsyncRoot({ label: 'A' }));
			const b = await render(() => ServerComponents.AsyncRoot({ label: 'B' }));
			container.innerHTML = `<div>${a.body}</div><div>${b.body}</div>`;
			const [first, second] = container.children;
			if (detached) second.remove();
			const firstScript = first.querySelector('script');
			const secondScript = second.querySelector('script');
			expect(firstScript.id).toBe(secondScript.id);
			const firstButton = first.querySelector('button');
			const secondButton = second.querySelector('button');
			const onRead = vi.fn();
			const unmountSecond = hydrate(ClientComponents.AsyncRoot, {
				target: second,
				props: { label: 'client B', onRead },
			});
			let unmountFirst;
			try {
				expect(second.querySelector('button')).toBe(secondButton);
				expect(secondButton.textContent).toBe('B');
				secondButton.click();
				expect(onRead).toHaveBeenLastCalledWith('B');
				expect(first.querySelector('script')).toBe(firstScript);
				expect(second.querySelector('script')).toBeNull();
				expect(firstButton.textContent).toBe('A');

				unmountFirst = hydrate(ClientComponents.AsyncRoot, {
					target: first,
					props: { label: 'client A', onRead },
				});
				expect(first.querySelector('button')).toBe(firstButton);
				firstButton.click();
				expect(onRead).toHaveBeenLastCalledWith('A');
				expect(first.querySelector('script')).toBeNull();
			} finally {
				unmountFirst?.();
				unmountSecond();
			}
		},
	);

	it("does not consume another root's data when its own envelope is missing", async () => {
		const a = await render(() => ServerComponents.AsyncRoot({ label: 'A' }));
		const b = await render(() => ServerComponents.AsyncRoot({ label: 'B' }));
		container.innerHTML = `<div>${a.body}</div><div>${b.body}</div>`;
		const [first, second] = container.children;
		const firstScript = first.querySelector('script');
		second.querySelector('script').remove();
		const onRead = vi.fn();
		const unmount = hydrate(ClientComponents.AsyncRoot, {
			target: second,
			props: { label: 'client B', onRead },
		});
		try {
			await vi.waitFor(() => {
				expect(second.querySelector('button')?.textContent).toBe('client B');
			});
			second.querySelector('button').click();
			expect(onRead).toHaveBeenCalledWith('client B');
			expect(first.querySelector('script')).toBe(firstScript);
			expect(first.querySelector('button').textContent).toBe('A');
		} finally {
			unmount();
		}
	});

	it('restores the outer root after hydrating another root during initialization', async () => {
		const a = await render(() => ServerComponents.AsyncRoot({ label: 'A' }));
		const b = await render(() => ServerComponents.AsyncRoot({ label: 'B' }));
		container.innerHTML = `<div>${a.body}</div><div>${b.body}</div>`;
		const [first, second] = container.children;
		const onRead = vi.fn();
		let unmountFirst;
		const unmountSecond = hydrate(ClientComponents.AsyncRoot, {
			target: second,
			props: {
				label: 'client B',
				onRead,
				before() {
					unmountFirst = hydrate(ClientComponents.AsyncRoot, {
						target: first,
						props: { label: 'client A', onRead },
					});
				},
			},
		});
		try {
			second.querySelector('button').click();
			expect(onRead).toHaveBeenLastCalledWith('B');
			first.querySelector('button').click();
			expect(onRead).toHaveBeenLastCalledWith('A');
			expect(container.querySelector('script')).toBeNull();
		} finally {
			unmountFirst?.();
			unmountSecond();
		}
	});

	it('hydrates numeric value from serialized trackAsync', async () => {
		await hydrateComponent(ServerComponents.AsyncNumericValue, ClientComponents.AsyncNumericValue);

		expect(container.querySelector('.count')?.textContent).toBe('42');
		expect(container.querySelector('.pending')).toBeNull();
	});

	it('hydrates object value from serialized trackAsync', async () => {
		await hydrateComponent(ServerComponents.AsyncObjectValue, ClientComponents.AsyncObjectValue);

		expect(container.querySelector('.name')?.textContent).toBe('Alice');
		expect(container.querySelector('.age')?.textContent).toBe('30');
		expect(container.querySelector('.loading')).toBeNull();
	});

	it('hydrates rejected trackAsync and shows catch content', async () => {
		await hydrateComponent(ServerComponents.AsyncWithCatch, ClientComponents.AsyncWithCatch);

		expect(container.querySelector('.error')?.textContent).toBe(TRACK_ASYNC_ERROR_MESSAGE);
		expect(container.querySelector('.result')).toBeNull();
		expect(container.querySelector('.loading')).toBeNull();
		expect(container.querySelector('script[id^="__ripple_ta_"]')).toBeNull();
	});

	it('hydrates child trackAsync error bubbled to parent catch', async () => {
		await hydrateComponent(ServerComponents.ParentWithCatch, ClientComponents.ParentWithCatch);

		expect(container.querySelector('.parent-error')?.textContent).toBe(
			TRACK_ASYNC_CHILD_ERROR_MESSAGE,
		);
		expect(container.querySelector('.result')).toBeNull();
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('script[id^="__ripple_ta_"]')).toBeNull();
	});

	it('reruns trackAsync when a dependency changes after hydration', async () => {
		await hydrateComponent(
			ServerComponents.AsyncWithReactiveDependency,
			ClientComponents.AsyncWithReactiveDependency,
		);

		// Hydrated value from SSR should match `count-0`
		expect(container.querySelector('.result')?.textContent).toBe('count-0');
		expect(container.querySelector('.loading')).toBeNull();

		/** @type {any} */ (container.querySelector('.increment'))?.click();
		flushSync();
		// Wait for the trackAsync promise to resolve
		await Promise.resolve();
		await Promise.resolve();
		flushSync();

		expect(container.querySelector('.result')?.textContent).toBe('count-1');
	});

	it('reruns trackAsync when a dependency read through trackReadOnly() changes after hydration', async () => {
		await hydrateComponent(
			ServerComponents.AsyncWithReadOnlyDependency,
			ClientComponents.AsyncWithReadOnlyDependency,
		);

		expect(container.querySelector('.result')?.textContent).toBe('count-0');

		/** @type {any} */ (container.querySelector('.increment'))?.click();
		flushSync();
		await Promise.resolve();
		await Promise.resolve();
		flushSync();

		expect(container.querySelector('.result')?.textContent).toBe('count-1');
	});

	it('reruns trackAsync via module server RPC call when a dependency changes', async () => {
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn(async (_url, init) => {
			const args = devalue.parse(init.body);
			const result = `server-${args[0]}`;
			return new Response(devalue.stringify({ value: result }), {
				status: 200,
				headers: { 'Content-Type': 'text/plain' },
			});
		});
		globalThis.fetch = /** @type {any} */ (fetchMock);

		try {
			await hydrateComponent(
				ServerComponents.AsyncWithServerCall,
				ClientComponents.AsyncWithServerCall,
			);

			// Hydrated value comes from the SSR-serialized trackAsync output
			expect(container.querySelector('.result')?.textContent).toBe('server-0');
			expect(container.querySelector('.loading')).toBeNull();
			expect(fetchMock).not.toHaveBeenCalled();

			/** @type {any} */ (container.querySelector('.increment'))?.click();
			flushSync();
			// Wait for the RPC fetch + devalue parse chain to resolve
			await vi.waitFor(() => {
				expect(container.querySelector('.result')?.textContent).toBe('server-1');
			});

			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(fetchMock.mock.calls[0][0]).toMatch(/\/_\$_ripple_rpc_\$_\//);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('hydrates multiple trackAsync values independently', async () => {
		await hydrateComponent(
			ServerComponents.AsyncMultipleValues,
			ClientComponents.AsyncMultipleValues,
		);

		expect(container.querySelector('.first')?.textContent).toBe('alpha');
		expect(container.querySelector('.second')?.textContent).toBe('beta');
		expect(container.querySelector('.loading')).toBeNull();
	});
});
