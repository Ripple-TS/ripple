import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as client from './compiled/client/activity.js';
import * as server from './compiled/server/activity.js';
import * as hydration from '../../src/runtime/internal/client/hydration.js';

describe.each(['postTask', 'timer'])('Activity scheduler: %s', (kind) => {
	let dispose;
	let tasks;
	let postTask;
	beforeEach(() => {
		vi.useFakeTimers();
		tasks = [];
		postTask = vi.fn((callback, options) => {
			tasks.push({ callback, options });
			return new Promise((resolve, reject) => {
				const abort = () => {
					clearTimeout(timer);
					reject(new DOMException('Aborted', 'AbortError'));
				};
				const timer = setTimeout(() => {
					options.signal.removeEventListener('abort', abort);
					try {
						resolve(callback());
					} catch (error) {
						reject(error);
					}
				}, 0);
				options.signal.addEventListener('abort', abort, { once: true });
			});
		});
		vi.stubGlobal('scheduler', kind === 'postTask' ? { postTask } : undefined);
	});
	afterEach(() => {
		dispose?.();
		dispose = null;
		client.setDuringInit();
		client.setFail(false);
		client.calls.length = 0;
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});
	async function setup(name = 'App') {
		container.innerHTML = (await render(server[name])).body;
		client.calls.length = 0;
		dispose = hydrate(client[name], { target: container });
	}
	function context() {
		return [hydration.hydrating, hydration.hydrate_node, hydration.hydration_context];
	}

	it('runs one boundary per task and restores hydration context', async () => {
		await setup();
		const previous = context();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:first:context');
		expect(client.calls).not.toContain('init:second:context');
		expect(client.calls).not.toContain('effect:first');
		expect(context()).toEqual(previous);
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:second:context');
		expect(context()).toEqual(previous);
	});

	it('continues after thrown hydration and restores context on the error path', async () => {
		await setup('Errors');
		const previous = context();
		client.setFail(true);
		await vi.advanceTimersToNextTimerAsync();
		expect(container.querySelector('strong').textContent).toBe('deferred failure');
		expect(context()).toEqual(previous);
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:after-error:context');
		expect(client.calls).not.toContain('effect:after-error');
	});

	it('reports an uncaught hydration error once without consuming the next task twice', async () => {
		await setup();
		const previous = context();
		client.setDuringInit(() => {
			client.setDuringInit();
			throw new Error('uncaught initialization');
		});
		const errors = [];
		// postTask reports callback rejection through a following timer; fake
		// timers may deliver that timer in the same advancement or the next.
		for (let turn = 0; turn < 3; turn++) {
			try {
				await vi.advanceTimersToNextTimerAsync();
			} catch (error) {
				errors.push(error.message);
			}
		}
		expect(errors).toEqual(['uncaught initialization']);
		expect(context()).toEqual(previous);
		expect(client.calls.filter((x) => x === 'init:second:context')).toHaveLength(1);
		expect(client.calls).not.toContain('effect:second');
	});

	it('disposes queued roots and permits a new root to schedule work', async () => {
		await setup();
		const stale = tasks[0];
		dispose();
		stale?.callback();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).not.toContain('init:first:context');
		if (stale) expect(stale.options.signal.aborted).toBe(true);
		await setup();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls.filter((x) => x === 'init:first:context')).toHaveLength(1);
	});

	it('survives disposal from inside initialization and progresses to its sibling', async () => {
		await setup();
		client.setDuringInit(() => flushSync(() => (client.controls.exists.value = false)));
		await vi.advanceTimersToNextTimerAsync();
		expect(container.querySelector('[data-name="first"]')).toBeNull();
		expect(client.calls).not.toContain('effect:first');
		client.setDuringInit();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:second:context');
	});

	it('promotes a sibling during initialization without hydrating it twice', async () => {
		await setup();
		client.setDuringInit(() => {
			client.setDuringInit();
			flushSync(() => (client.controls.second.value = 'visible'));
		});
		await vi.advanceTimersToNextTimerAsync();
		flushSync();
		expect(client.calls.filter((x) => x.startsWith('init:'))).toEqual([
			'init:sibling:context',
			'init:first:context',
			'init:second:context',
		]);
		expect(client.calls.filter((x) => x === 'effect:second')).toHaveLength(1);
		for (const task of tasks) task.callback();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls.filter((x) => x === 'init:second:context')).toHaveLength(1);
	});

	it('keeps effects inactive when visibility is revoked before demand hydration runs', async () => {
		await setup();
		flushSync(() => (client.controls.first.value = 'visible'));
		flushSync(() => (client.controls.first.value = 'hidden'));
		await Promise.resolve();
		expect(client.calls).not.toContain('init:first:context');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toContain('init:first:context');
		expect(client.calls).not.toContain('effect:first');
	});

	it('queues nested work for a later task', async () => {
		await setup('Nested');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toEqual(['init:parent:context']);
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toEqual(['init:parent:context', 'init:nested:context']);
	});

	if (kind === 'postTask') {
		it.each([
			['throw', 'promote'],
			['reject', 'promote'],
			['throw', 'remove'],
			['reject', 'remove'],
		])(
			'does not transfer a failed %s submission to a sibling after %s',
			async (failure, action) => {
				postTask.mockImplementationOnce(() => {
					const error = new Error('stale submission');
					if (failure === 'throw') throw error;
					return Promise.reject(error);
				});
				await setup();
				if (action === 'promote') {
					flushSync(() => (client.controls.first.value = 'visible'));
					await Promise.resolve();
					flushSync();
					expect(client.calls).toContain('init:first:context');
				} else {
					flushSync(() => (client.controls.exists.value = false));
				}
				await vi.advanceTimersToNextTimerAsync();
				expect(client.calls).not.toContain('init:second:context');
				await vi.advanceTimersToNextTimerAsync();
				expect(client.calls.filter((x) => x === 'init:second:context')).toHaveLength(1);
				flushSync(() => (client.controls.second.value = 'visible'));
				await Promise.resolve();
				flushSync();
				expect(client.calls.filter((x) => x === 'effect:second')).toHaveLength(1);
				expect(container.querySelector('[data-name="second"]').style.display).toBe('');
			},
		);

		it.each(['throw', 'reject'])(
			'recovers when submission fails by %s before the callback',
			async (failure) => {
				postTask.mockImplementationOnce(() => {
					const error = new Error('submission failed');
					if (failure === 'throw') throw error;
					return Promise.reject(error);
				});
				await setup('Errors');
				await vi.advanceTimersToNextTimerAsync();
				expect(container.querySelector('strong').textContent).toBe('submission failed');
				expect(client.calls).not.toContain('init:after-error:context');
				await vi.advanceTimersToNextTimerAsync();
				expect(client.calls).toContain('init:after-error:context');
				expect(postTask).toHaveBeenCalledTimes(2);
			},
		);

		it('cancels a rejected submission before its error-reporting task runs', async () => {
			postTask.mockRejectedValueOnce(new Error('stale submission'));
			await setup('Errors');
			dispose();
			await vi.advanceTimersToNextTimerAsync();
			expect(container.querySelector('strong')).toBeNull();
			await setup();
			await vi.advanceTimersToNextTimerAsync();
			expect(client.calls).toContain('init:first:context');
		});
	}
});
