import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { condition, load, never, idle, visible, media, interaction } from 'ripple/hydration';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as client from './compiled/client/hydrate.js';
import * as server from './compiled/server/hydrate.js';

import { component } from './hydrate-fixtures.js';
/** @import { ComponentName, FixtureOptions } from './hydrate-fixtures.js' */
/** @import { HydrationWhen } from 'ripple/hydration' */

/** @type {(() => void) | null} */
var unmount = null;
afterEach(() => {
	unmount?.();
	unmount = null;
	client.configure();
	server.configure();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});
/**
 * @param {HydrationWhen} when
 * @param {ComponentName} [name]
 */
async function setup(when, name = 'App') {
	client.configure({ when });
	server.configure({ when });
	container.innerHTML = (await render(component(server[name]))).body;
	unmount = hydrate(component(client[name]), { target: container });
}
async function flush() {
	await Promise.resolve();
	flushSync();
}
/**
 * @param {HydrationWhen} when
 */
function update(when) {
	flushSync(() => (client.controls.strategy.value = { value: when }));
}
function initialized() {
	return client.calls.filter((x) => x.startsWith('init:'));
}
/** @typedef {(entries: Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>[]) => void} IntersectionCallback */
function observerMock() {
	/** @type {{ observer: MockObserver, callback: IntersectionCallback, options: IntersectionObserverInit }[]} */
	const entries = [];
	class MockObserver {
		/** @type {import('vitest').Mock<(target: Element) => void>} */
		observe = vi.fn();
		/** @type {import('vitest').Mock<(target: Element) => void>} */
		unobserve = vi.fn();
		disconnect = vi.fn();
		/**
		 * @param {IntersectionCallback} callback
		 * @param {IntersectionObserverInit} options
		 */
		constructor(callback, options) {
			entries.push({ observer: this, callback, options });
		}
	}
	vi.stubGlobal('IntersectionObserver', MockObserver);
	return entries;
}

/**
 * @typedef {{
 *   query: string;
 *   matches: boolean;
 *   addEventListener: import('vitest').Mock<(type: 'change', listener: () => void) => void>;
 *   removeEventListener: import('vitest').Mock<(type: 'change', listener: () => void) => void>;
 * }} MockMediaQuery
 */
function mediaMock(matches = false) {
	/** @type {MockMediaQuery[]} */
	const queries = [];
	vi.stubGlobal(
		'matchMedia',
		vi.fn(
			/**
			 * @param {string} query
			 */
			(query) => {
				/** @type {MockMediaQuery} */
				const entry = { query, matches, addEventListener: vi.fn(), removeEventListener: vi.fn() };
				queries.push(entry);
				return entry;
			},
		),
	);
	return queries;
}
describe('Hydrate strategies', () => {
	it.each([load(), condition(true), condition(() => true)])(
		'opens immediate strategy %j once',
		async (when) => {
			await setup(when);
			await flush();
			expect(initialized()).toHaveLength(1);
			expect(client.calls.filter((x) => x === 'hydrated')).toHaveLength(1);
		},
	);
	it.each([condition(false), never(), interaction({ events: [] }), media('')])(
		'leaves unsatisfied strategy %j waiting',
		async (when) => {
			await setup(when);
			container.querySelector('button').click();
			await flush();
			expect(initialized()).toHaveLength(0);
		},
	);
	it.each([undefined, 75])('uses idle timeout %s and releases the callback', async (timeout) => {
		const request = vi.fn(
			/**
			 * @param {() => void} _callback
			 * @param {IdleRequestOptions} _options
			 */
			(_callback, _options) => 42,
		);
		const cancel = vi.fn();
		vi.stubGlobal('requestIdleCallback', request);
		vi.stubGlobal('cancelIdleCallback', cancel);
		await setup(idle(timeout === undefined ? {} : { timeout }));
		expect(request.mock.calls[0][1]).toEqual({ timeout: timeout ?? 2000 });
		request.mock.calls[0][0]();
		request.mock.calls[0][0]();
		await flush();
		expect(initialized()).toHaveLength(1);
		expect(cancel).toHaveBeenCalledWith(42);
	});
	it.each([2000, 51])('falls back to an idle timer at %i ms', async (timeout) => {
		vi.useFakeTimers();
		vi.stubGlobal('requestIdleCallback', undefined);
		await setup(timeout === 2000 ? idle() : idle({ timeout }));
		await vi.advanceTimersByTimeAsync(timeout - 1);
		expect(initialized()).toHaveLength(0);
		await vi.advanceTimersByTimeAsync(1);
		expect(initialized()).toHaveLength(1);
	});
	it('cancels idle timers and disregards callbacks after disposal', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('requestIdleCallback', undefined);
		await setup(idle());
		assert(unmount);
		unmount();
		unmount = null;
		await vi.advanceTimersByTimeAsync(2001);
		expect(initialized()).toHaveLength(0);
	});
	it('reuses visibility observers, observes real roots, and cleans them up', async () => {
		const entries = observerMock();
		await setup(visible(), 'Shapes');
		await flush();
		expect(entries).toHaveLength(1);
		expect(entries[0].options).toEqual({ rootMargin: '600px', threshold: 0 });
		const targets = entries[0].observer.observe.mock.calls.map(([node]) => node);
		expect(targets.map((x) => x.localName)).toEqual(['b', 'b', 'circle', 'tr']);
		entries[0].callback(targets.map((target) => ({ target, isIntersecting: true })));
		await flush();
		expect(entries[0].observer.unobserve).toHaveBeenCalledTimes(4);
		expect(entries[0].observer.disconnect).toHaveBeenCalledTimes(1);
	});
	it('does not replace equivalent inline factories, and replaces changed options', async () => {
		const entries = observerMock();
		await setup(visible({ rootMargin: '20px', threshold: [0, 0.5] }));
		update(() => visible({ rootMargin: '20px', threshold: [0, 0.5] }));
		expect(entries).toHaveLength(1);
		expect(entries[0].observer.disconnect).not.toHaveBeenCalled();
		update(() => visible({ rootMargin: '40px', threshold: 1 }));
		expect(entries).toHaveLength(2);
		expect(entries[0].observer.disconnect).toHaveBeenCalledTimes(1);
		const target = container.querySelector('[data-child]');
		entries[0].callback([{ target, isIntersecting: true }]);
		await flush();
		expect(initialized()).toHaveLength(0);
		entries[1].callback([{ target, isIntersecting: false }]);
		await flush();
		expect(initialized()).toHaveLength(0);
		entries[1].callback([{ target, isIntersecting: true }]);
		await flush();
		expect(initialized()).toHaveLength(1);
	});
	it('releases visibility resources on removal', async () => {
		const [entry] = await (async () => {
			const entries = observerMock();
			await setup(visible());
			return entries;
		})();
		assert(unmount);
		unmount();
		unmount = null;
		expect(entry.observer.unobserve).toHaveBeenCalledTimes(1);
		expect(entry.observer.disconnect).toHaveBeenCalledTimes(1);
	});
	it('opens visible content when IntersectionObserver is unavailable', async () => {
		vi.stubGlobal('IntersectionObserver', undefined);
		await setup(visible());
		await flush();
		expect(initialized()).toHaveLength(1);
	});
	it.each([true, false])(
		'matches media initially/later (%s) and releases its subscription',
		async (matches) => {
			const queries = mediaMock(matches);
			await setup(media('(min-width: 900px)'));
			await flush();
			if (!matches) {
				expect(initialized()).toHaveLength(0);
				queries[0].matches = true;
				queries[0].addEventListener.mock.calls[0][1]();
				await flush();
			}
			expect(initialized()).toHaveLength(1);
			expect(queries[0].removeEventListener).toHaveBeenCalledWith(
				'change',
				queries[0].addEventListener.mock.calls[0][1],
			);
		},
	);
	it('replaces media queries and removes waiting listeners on unmount', async () => {
		const queries = mediaMock();
		await setup(media('screen'));
		update(media('print'));
		expect(queries[0].removeEventListener).toHaveBeenCalledTimes(1);
		assert(unmount);
		unmount();
		unmount = null;
		expect(queries[1].removeEventListener).toHaveBeenCalledTimes(1);
	});
	it('opens media content when matchMedia is unavailable', async () => {
		vi.stubGlobal('matchMedia', undefined);
		await setup(media('screen'));
		await flush();
		expect(initialized()).toHaveLength(1);
	});
	it.each(
		/** @type {const} */ ([
			'auxclick',
			'click',
			'contextmenu',
			'dblclick',
			'focusin',
			'keydown',
			'keyup',
			'mousedown',
			'mouseenter',
			'mouseover',
			'mouseup',
			'pointerdown',
			'pointerenter',
			'pointerover',
			'pointerup',
		]),
	)('accepts %s intent', async (type) => {
		await setup(interaction({ events: type }));
		container
			.querySelector('button')
			.dispatchEvent(new Event(type, { bubbles: !type.endsWith('enter') }));
		expect(initialized()).toHaveLength(1);
	});
	it('deduplicates events, ignores non-matching intent and replaces event options', async () => {
		await setup(interaction({ events: ['focusin', 'focusin'] }));
		container.querySelector('button').click();
		expect(initialized()).toHaveLength(0);
		update(interaction({ events: ['click', 'click'] }));
		container.querySelector('button').click();
		expect(initialized()).toHaveLength(1);
		expect(client.calls.filter((x) => x === 'click:deferred')).toHaveLength(1);
	});
	it.each([
		() => {
			throw new Error('factory failure');
		},
		() => Promise.resolve(load()),
		() => ({}),
		() =>
			condition(() => {
				throw new Error('getter failure');
			}),
	])('routes invalid/thrown factories and getters to catch', async (when) => {
		// @ts-expect-error Deliberately invalid strategy results exercise runtime validation.
		await setup(when, 'Errors');
		await flush();
		expect(container.querySelector('strong')).not.toBeNull();
		expect(client.calls).not.toContain('hydrated');
	});
	it('unsubscribes condition/factory dependencies after opening', async () => {
		const factory = vi.fn(() => condition(client.controls.enabled.value));
		await setup(factory);
		expect(factory).toHaveBeenCalledTimes(1);
		flushSync(() => (client.controls.enabled.value = true));
		await flush();
		expect(factory).toHaveBeenCalledTimes(2);
		flushSync(() => (client.controls.enabled.value = false));
		await flush();
		expect(factory).toHaveBeenCalledTimes(2);
	});
});

describe('trigger disposal', () => {
	it('releases shared intent listeners when the last boundary opens', async () => {
		const added = vi.spyOn(container, 'addEventListener'),
			removed = vi.spyOn(container, 'removeEventListener');
		await setup(interaction({ events: 'click' }));
		const capture = added.mock.calls.filter(([, , options]) => options === true);
		expect(capture).toHaveLength(15);
		container.querySelector('button').click();
		expect(removed.mock.calls.filter(([, , options]) => options === true)).toHaveLength(15);
		added.mockRestore();
		removed.mockRestore();
	});
	it('cancels an immediate condition when its options change before execution', async () => {
		await setup(condition(false));
		update(condition(true));
		update(condition(false));
		await flush();
		expect(initialized()).toHaveLength(0);
	});
	it('propagates nested intent through an empty-list ancestor', async () => {
		await setup(interaction({ events: [] }), 'Nested');
		container.querySelector('[data-child="nested"] button').click();
		expect(initialized()).toEqual(['init:parent:context', 'init:nested:context']);
	});
});
