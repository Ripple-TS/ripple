import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate, getTrackedStatus } from 'ripple';
import { render } from 'ripple/server';
import { hydrateComponent, container } from '../setup-hydration.js';
import * as server from './compiled/server/async-iterable.js';
import * as client from './compiled/client/async-iterable.js';

beforeEach(() => {
	server.reset();
	client.reset();
});
const settle = async () => {
	await new Promise((resolve) => setTimeout(resolve, 0));
	flushSync();
};

describe('iterable hydration', () => {
	it('adopts first-ready HTML then resumes without replacing nodes or form edits', async () => {
		const { unmount } = await hydrateComponent(server.Deferred, client.Deferred);
		const p = container.querySelector('p');
		const input = container.querySelector('input');
		input.value = 'edited';
		expect(p.textContent).toBe('100');
		expect(client.calls).toEqual([]);
		container.querySelector('.activate').click();
		await vi.waitFor(() => expect(client.release).toBeTypeOf('function'));
		expect(client.calls).toEqual([100]);
		expect(container.querySelector('p')).toBe(p);
		expect(input.value).toBe('edited');
		client.release();
		await vi.waitFor(() => expect(p.textContent).toBe('300'));
		expect(container.querySelector('b')?.textContent).toBe('done');
		await vi.waitFor(() => expect(container.querySelector('em')?.textContent).toBe('done'));
		expect(container.querySelector('p')).toBe(p);
		unmount();
	});

	it('does not duplicate continuation when inputs change immediately after adoption', async () => {
		container.innerHTML = (await render(server.Immediate)).body;
		const unmount = hydrate(client.Immediate, { target: container });
		client.selection.value = 200;
		flushSync();
		expect(getTrackedStatus(client.source).state).toBe('pending');
		await vi.waitFor(() => expect(container.querySelector('p').textContent).toBe('200'));
		expect(client.calls).toEqual([100]);
		unmount();
	});

	it('retains a single-yield snapshot when continuation observes completion', async () => {
		client.reset(true);
		const { unmount } = await hydrateComponent(server.Immediate, client.Immediate);
		await vi.waitFor(() => expect(container.querySelector('b')?.textContent).toBe('done'));
		expect(container.querySelector('p').textContent).toBe('100');
		expect(client.calls).toEqual([100]);
		unmount();
	});

	it.each(['never', 'removed'])('does not start %s component-owned sources', async (mode) => {
		const name = mode === 'never' ? 'Never' : 'Deferred';
		const { unmount } = await hydrateComponent(server[name], client[name]);
		if (mode === 'removed') container.querySelector('.remove').click();
		await settle();
		expect(client.calls).toEqual([]);
		unmount();
	});

	it('reconciles changed inputs after adopting the historical snapshot', async () => {
		const { unmount } = await hydrateComponent(server.Deferred, client.Deferred);
		container.querySelector('.query').click();
		container.querySelector('.activate').click();
		await vi.waitFor(() => expect(container.querySelector('p').textContent).toBe('200'));
		expect(client.calls).toEqual([100]);
		unmount();
	});

	it('reuses an active ancestor source and hydrates historical status before live reconciliation', async () => {
		const { unmount } = await hydrateComponent(server.Shared, client.Shared);
		const input = container.querySelector('input');
		input.value = 'edited';
		await vi.waitFor(() => expect(client.release).toBeTypeOf('function'));
		client.release();
		await vi.waitFor(() => expect(container.querySelector('.active').textContent).toBe('300'));
		expect(container.querySelector('i')?.textContent).toBe('open');
		container.querySelector('.activate').click();
		await vi.waitFor(() => expect(container.querySelector('b')?.textContent).toBe('done'));
		await vi.waitFor(() => expect(container.querySelector('em')?.textContent).toBe('done'));
		expect(container.querySelector('input')).toBe(input);
		expect(input.value).toBe('edited');
		expect(client.calls).toEqual([100]);
		unmount();
	});
	it('preserves early binding writes when reconciling an active source', async () => {
		const { unmount } = await hydrateComponent(server.BoundShared, client.BoundShared);
		const input = container.querySelector('input');
		input.value = '777';
		await vi.waitFor(() => expect(client.release).toBeTypeOf('function'));
		client.release();
		await vi.waitFor(() => expect(container.querySelector('.active').textContent).toBe('300'));
		container.querySelector('.activate').click();
		await vi.waitFor(() => expect(container.querySelector('.bound').textContent).toBe('777'));
		expect(input.value).toBe('777');
		expect(client.source.value.cursor).toBe(777);
		unmount();
	});
});
