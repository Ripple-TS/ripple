import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as client from './compiled/client/activity.js';
import * as server from './compiled/server/activity.js';

var unmount;
afterEach(() => {
	unmount?.();
	unmount = null;
	vi.unstubAllGlobals();
	vi.useRealTimers();
	client.calls.length = 0;
	client.setFail(false);
	client.setDuringInit();
	client.setInitial('value');
	server.setInitial('value');
});

async function setup(name = 'App', before = () => {}) {
	const { body } = await render(server[name]);
	container.innerHTML = body;
	client.calls.length = 0;
	before();
	unmount = hydrate(client[name], { target: container });
	return body;
}

describe('Activity deferred hydration', () => {
	it('preserves empty text updates through nested hidden ownership after hydration', async () => {
		vi.useFakeTimers();
		await setup('ClearedText');
		await vi.advanceTimersToNextTimerAsync();
		await vi.advanceTimersToNextTimerAsync();
		flushSync(() => (client.controls.value.value = ''));
		flushSync(() => (client.controls.mode.value = 'visible'));
		expect(container.textContent).toBe('');
		flushSync(() => (client.controls.inner.value = 'visible'));
		expect(container.textContent).toBe('');
		flushSync(() => (client.controls.value.value = 'new'));
		expect(container.textContent).toBe('new');
	});
	it('does not revive children when setup removes its own deferred boundary', async () => {
		vi.useFakeTimers();
		await setup();
		client.setDuringInit(() => flushSync(() => (client.controls.exists.value = false)));
		await vi.advanceTimersToNextTimerAsync();
		flushSync();
		expect(container.querySelector('[data-name="first"]')).toBeNull();
		expect(client.calls).not.toContain('effect:first');
		client.setDuringInit();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:second:context');
	});

	it('recovers changed branches locally and keeps its visibility controller', async () => {
		vi.useFakeTimers();
		await setup('Recovery');
		const footer = container.querySelector('footer');
		flushSync(() => (client.controls.changed.value = true));
		await vi.advanceTimersToNextTimerAsync();
		expect(container.querySelector('section').textContent).toBe('new');
		expect(container.querySelector('footer')).toBe(footer);
		flushSync(() => (client.controls.mode.value = 'visible'));
		expect(container.querySelector('section').style.display).toBe('');
	});

	it('routes deferred errors to the owner and keeps the queue progressing', async () => {
		vi.useFakeTimers();
		await setup('Errors');
		client.setFail(true);
		await vi.advanceTimersToNextTimerAsync();
		expect(container.querySelector('strong').textContent).toBe('deferred failure');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:after-error:context');
		expect(client.calls).not.toContain('effect:after-error');
	});

	it('keeps deferred async data and dependencies isolated between roots', async () => {
		vi.useFakeTimers();
		server.setInitial('first');
		const first = await render(server.Async);
		server.setInitial('second');
		const second = await render(server.Async);
		const other = document.createElement('div');
		container.innerHTML = first.body;
		other.innerHTML = second.body;
		container.after(other);
		client.calls.length = 0;
		client.setInitial('second');
		const disposeOther = hydrate(client.Async, { target: other });
		client.setInitial('first');
		unmount = hydrate(client.Async, { target: container });
		try {
			await vi.advanceTimersToNextTimerAsync();
			await vi.advanceTimersToNextTimerAsync();
			expect(container.querySelector('p').textContent).toBe('first');
			expect(other.querySelector('p').textContent).toBe('second');
			expect(client.calls).not.toContain('fetch');
		} finally {
			disposeOther();
			other.remove();
		}
	});

	it('reconciles async dependencies changed before background initialization', async () => {
		vi.useFakeTimers();
		await setup('Async');
		flushSync(() => (client.controls.input.value = 'changed early'));
		await vi.advanceTimersToNextTimerAsync();
		await Promise.resolve();
		flushSync();
		expect(client.calls).toContain('fetch');
		expect(container.querySelector('p').textContent).toBe('changed early');
	});

	it.each(['before', 'after'])(
		'adopts streamed content arriving %s background hydration',
		async (arrival) => {
			vi.useFakeTimers();
			let resolve;
			server.setStream(
				new Promise((r) => {
					resolve = r;
				}),
			);
			client.setStream(new Promise(() => {}));
			const chunks = [];
			const done = render(server.Stream, {
				stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} },
			});
			const execute = (html) => {
				for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) (0, eval)(code);
			};
			container.innerHTML = chunks[0];
			execute(chunks[0]);
			unmount = hydrate(client.Stream, { target: container });
			if (arrival === 'after') await vi.advanceTimersToNextTimerAsync();
			resolve('stream result');
			await done;
			for (const chunk of chunks.slice(1)) {
				document.body.insertAdjacentHTML('beforeend', chunk);
				execute(chunk);
			}
			if (arrival === 'before') await vi.advanceTimersToNextTimerAsync();
			flushSync();
			expect(container.querySelector('.stream-value').textContent).toBe('stream result');
			expect(container.querySelector('.stream-value').style.display).toBe('none');
			expect(client.calls).not.toContain('stream effect');
			flushSync(() => (client.controls.mode.value = 'visible'));
			expect(container.querySelector('.stream-value').style.display).toBe('');
			expect(client.calls).toContain('stream effect');
		},
	);
	it('hydrates ordinary siblings first and only one hidden boundary per task', async () => {
		vi.useFakeTimers();
		await setup();
		expect(client.calls.filter((x) => x.startsWith('init:'))).toEqual(['init:sibling:context']);
		flushSync();
		expect(client.calls).toContain('effect:sibling');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:first:context');
		expect(client.calls).not.toContain('init:second:context');
		expect(client.calls).not.toContain('effect:first');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:second:context');
		expect(client.calls).not.toContain('effect:second');
	});

	it('promotes visible work, retains edited inputs and never hydrates twice', async () => {
		vi.useFakeTimers();
		let input;
		await setup('App', () => {
			input = container.querySelector('[data-name="second"] input');
			input.value = 'edited';
		});
		flushSync(() => (client.controls.second.value = 'visible'));
		await Promise.resolve();
		flushSync();
		expect(client.calls).toContain('init:second:context');
		expect(client.calls).not.toContain('init:first:context');
		expect(container.querySelector('[data-name="second"] input')).toBe(input);
		expect(input.value).toBe('edited');
		expect(input.nextElementSibling.textContent).toBe('edited');
		await vi.advanceTimersToNextTimerAsync();
		flushSync(() => (client.controls.second.value = 'hidden'));
		flushSync(() => (client.controls.second.value = 'visible'));
		expect(client.calls.filter((x) => x === 'init:second:context')).toHaveLength(1);
	});

	it('initially visible work starts after the synchronous sibling walk', async () => {
		await setup('Visible');
		await Promise.resolve();
		flushSync();
		expect(client.calls.slice(0, 2)).toEqual(['init:sibling:context', 'init:visible:context']);
	});

	it('cancels removed boundaries without initializing children', async () => {
		vi.useFakeTimers();
		await setup();
		flushSync(() => (client.controls.exists.value = false));
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).not.toContain('init:first:context');
		expect(container.querySelector('[data-name="first"]')).toBeNull();
		expect(client.calls).toContain('init:second:context');
	});

	it('prepares nested boundaries parent first in separate tasks', async () => {
		vi.useFakeTimers();
		await setup('Nested');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toEqual(['init:parent:context']);
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toEqual(['init:parent:context', 'init:nested:context']);
		flushSync(() => (client.controls.mode.value = 'visible'));
		expect(client.calls.slice(2)).toEqual(['effect:parent', 'effect:nested']);
	});

	it('uses postTask background priority and handles cancellation', async () => {
		const tasks = [];
		vi.stubGlobal('scheduler', {
			postTask: vi.fn((fn, options) => {
				tasks.push({ fn, options });
				return new Promise((resolve, reject) =>
					options.signal.addEventListener('abort', () =>
						reject(new DOMException('Aborted', 'AbortError')),
					),
				);
			}),
		});
		await setup();
		expect(tasks).toHaveLength(1);
		expect(tasks[0].options.priority).toBe('background');
		tasks[0].fn();
		expect(tasks).toHaveLength(2);
		expect(client.calls).toContain('init:first:context');
		expect(client.calls).not.toContain('init:second:context');
		unmount();
		expect(tasks[1].options.signal.aborted).toBe(true);
		tasks[1].fn();
		expect(client.calls).not.toContain('init:second:context');
		await Promise.resolve();
	});

	it('retains text and authored display through SSR and activation', async () => {
		vi.useFakeTimers();
		await setup('Text', () => {
			expect(container.textContent).not.toContain('a < b');
			expect(container.querySelector('span').style.display).toBe('none');
		});
		await vi.advanceTimersToNextTimerAsync();
		flushSync(() => (client.controls.mode.value = 'visible'));
		expect(container.textContent).toBe('a < b & cgrid');
		expect(container.querySelector('span').style.display).toBe('grid');
		expect(container.querySelector('span').style.getPropertyPriority('display')).toBe('important');
	});

	it('retains serialized async dependencies beyond the root walk', async () => {
		vi.useFakeTimers();
		await setup('Async');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).not.toContain('fetch');
		expect(container.querySelector('p').textContent).toBe('value');
		flushSync(() => (client.controls.input.value = 'updated'));
		await Promise.resolve();
		flushSync();
		expect(client.calls).toContain('fetch');
		expect(container.querySelector('p').textContent).toBe('updated');
	});
});
