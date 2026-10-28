import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as client from './compiled/client/activity-observer.js';
import * as server from './compiled/server/activity-observer.js';
import * as clientStream from './compiled/client/activity.js';
import * as serverStream from './compiled/server/activity.js';

let dispose;
beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal('scheduler', undefined);
});
afterEach(() => {
	dispose?.();
	dispose = null;
	client.setLoad((version) => Promise.resolve('server:' + version));
	client.calls.length = 0;
	clientStream.calls.length = 0;
	clientStream.setStreamEffects(true);
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
async function setup() {
	container.innerHTML = (await render(server.App)).body;
	dispose = hydrate(client.App, { target: container });
}
async function settle() {
	await Promise.resolve();
	flushSync();
	await Promise.resolve();
	flushSync();
}
async function pendingPanel() {
	const pending = Promise.withResolvers();
	await setup();
	client.setLoad(() => pending.promise);
	flushSync(() => client.controls.version.value++);
	await vi.advanceTimersToNextTimerAsync();
	return pending;
}

it('waits for visible demand hydration and its effects without waiting for background tasks', async () => {
	await setup();
	const rendered = client.controls.observer.run(() => (client.controls.mode.value = 'visible'));
	let snapshot;
	void rendered.then(() => {
		snapshot = [...client.calls];
	});
	expect(await rendered).toBe(true);
	expect(snapshot).toEqual(['initialize', 'effect:server:0']);
	expect(client.calls).not.toContain('background');
	expect(container.querySelector('.panel').style.display).toBe('');
});

it('ignores hidden pending requests for both an ancestor observer and an unrelated sibling', async () => {
	const pending = await pendingPanel();
	expect(client.calls).toEqual(['initialize']);
	expect(await client.controls.observer.run(() => client.controls.count.value++)).toBe(true);
	expect(await client.controls.sibling.run(() => client.controls.count.value++)).toBe(true);
	expect(container.querySelector('.visible').textContent).toBe('2');
	expect(client.calls).not.toContain('background');
	pending.resolve('finished while hidden');
	await settle();
	expect(client.calls).not.toContain('effect:finished while hidden');
});

it('waits for a newly visible pending request and commits its effect before settlement', async () => {
	const pending = await pendingPanel();
	let completed = false;
	const rendered = client.controls.observer.run(() => (client.controls.mode.value = 'visible'));
	void rendered.then(() => (completed = true));
	await settle();
	expect(completed).toBe(false);
	pending.resolve('ready');
	await settle();
	expect(await rendered).toBe(true);
	expect(container.querySelector('.panel').textContent).toBe('ready');
	expect(client.calls).toContain('effect:ready');
});

it('settles when a visible pending Activity becomes hidden, without cancelling its request', async () => {
	const pending = await pendingPanel();
	const rendered = client.controls.observer.run(() => (client.controls.mode.value = 'visible'));
	await settle();
	flushSync(() => (client.controls.mode.value = 'hidden'));
	expect(await rendered).toBe(true);
	pending.resolve('later');
	await settle();
	expect(container.querySelector('.panel').textContent).toBe('later');
	expect(client.calls).not.toContain('effect:later');
});

it('settles after a visible async rejection commits catch content', async () => {
	const pending = await pendingPanel();
	const rendered = client.controls.observer.run(() => (client.controls.mode.value = 'visible'));
	await settle();
	pending.reject(new Error('load failed'));
	await settle();
	expect(await rendered).toBe(true);
	expect(container.querySelector('.caught').textContent).toBe('load failed');
});

it('settles false when its root is disposed during visible async work', async () => {
	const pending = await pendingPanel();
	const rendered = client.controls.observer.run(() => (client.controls.mode.value = 'visible'));
	await settle();
	dispose();
	expect(await rendered).toBe(false);
	pending.resolve('obsolete');
	await settle();
	expect(container.querySelector('.panel')).toBeNull();
});

it.each([true, false])('waits for visible streamed content (user effects: %s)', async (effects) => {
	clientStream.setStreamEffects(effects);
	const pending = Promise.withResolvers();
	serverStream.setStream(pending.promise);
	clientStream.setStream(new Promise(() => {}));
	const chunks = [];
	const done = render(serverStream.Stream, {
		stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} },
	});
	const execute = (html) => {
		for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) (0, eval)(code);
	};
	container.innerHTML = chunks[0];
	execute(chunks[0]);
	dispose = hydrate(clientStream.Stream, { target: container });
	await vi.advanceTimersToNextTimerAsync();
	expect(await clientStream.controls.observer.run(() => {})).toBe(true);
	let completed = false;
	const rendered = clientStream.controls.observer.run(
		() => (clientStream.controls.mode.value = 'visible'),
	);
	void rendered.then(() => (completed = true));
	await settle();
	expect(completed).toBe(false);
	pending.resolve('streamed');
	await done;
	for (const chunk of chunks.slice(1)) {
		document.body.insertAdjacentHTML('beforeend', chunk);
		execute(chunk);
	}
	await settle();
	expect(await rendered).toBe(true);
	expect(container.querySelector('.stream-value').textContent).toBe('streamed');
	expect(clientStream.calls.includes('stream effect')).toBe(effects);
});
