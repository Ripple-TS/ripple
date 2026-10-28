import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { condition, load, never, interaction } from 'ripple/hydration';
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
 * @param {ComponentName} [name]
 * @param {FixtureOptions} [options]
 * @param {() => void} [before]
 */
async function setup(name = 'App', options = {}, before = () => {}) {
	client.configure(options);
	server.configure(options);
	const { body } = await render(component(server[name]));
	container.innerHTML = body;
	before();
	unmount = hydrate(component(client[name]), { target: container });
	return body;
}
async function flush() {
	await Promise.resolve();
	flushSync();
}

describe('Hydrate', () => {
	it('retains HTML and avoids child initialization until triggered, once', async () => {
		/** @type {HTMLInputElement | undefined} */
		let input;
		const body = await setup('App', {}, () => {
			input = container.querySelector('input');
			input.value = 'edited';
		});
		expect(client.calls).toEqual([]);
		expect(container.querySelector('input')).toBe(input);
		expect(container.textContent).toBe('serverpressuntouched');
		expect(body.match(/<!--\[h/g)).toHaveLength(1);
		flushSync(() => (client.controls.strategy.value = { value: load() }));
		await flush();
		expect(container.querySelector('input')).toBe(input);
		assert(input);
		expect(input.value).toBe('edited');
		expect(container.querySelector('span').textContent).toBe('edited');
		expect(client.calls).toEqual(['init:deferred:context', 'hydrated', 'effect:deferred']);
		flushSync(() => (client.controls.strategy.value = { value: never() }));
		await flush();
		container.querySelector('button').click();
		expect(client.calls.at(-1)).toBe('click:deferred');
	});
	it('tracks condition getters while waiting', async () => {
		await setup('Condition');
		expect(client.calls).toEqual([]);
		flushSync(() => (client.controls.enabled.value = true));
		await flush();
		flushSync(() => (client.controls.enabled.value = false));
		await flush();
		expect(client.calls.filter((x) => x === 'hydrated')).toHaveLength(1);
	});
	it('removes waiting HTML without creating the subtree', async () => {
		await setup();
		flushSync(() => (client.controls.exists.value = false));
		await flush();
		expect(client.calls).toEqual([]);
		expect(container.querySelector('input')).toBeNull();
	});
	it('cancels queued work when destroyed or replaced by never', async () => {
		await setup();
		flushSync(() => (client.controls.strategy.value = { value: load() }));
		flushSync(() => (client.controls.strategy.value = { value: never() }));
		await flush();
		expect(client.calls).toEqual([]);
	});
	it.each(['click', 'focusin', 'pointerenter'])(
		'delivers native %s once through nested boundaries, parent first',
		async (type) => {
			await setup('Nested', { when: condition(false), nested: interaction() });
			const button = container.querySelector('[data-child="nested"] button');
			const event = new Event(type, { bubbles: type !== 'pointerenter', cancelable: true });
			button.dispatchEvent(event);
			expect(client.calls.filter((x) => x.startsWith('init:'))).toEqual([
				'init:parent:context',
				'init:nested:context',
			]);
			expect(
				client.calls.filter(
					(x) =>
						x === `${type === 'click' ? 'click' : type === 'focusin' ? 'focus' : 'enter'}:nested`,
				),
			).toHaveLength(1);
			expect(event.defaultPrevented).toBe(false);
		},
	);
	it.each(
		/** @type {const} */ ([
			['outer', never(), interaction()],
			['inner', interaction(), never()],
		]),
	)('respects a never %s', async (_, when, nested) => {
		await setup('Nested', { when, nested });
		container.querySelector('[data-child="nested"] button').click();
		await flush();
		expect(client.calls).toEqual([]);
	});
	it('does not open a nested Hydrate from Activity background preparation', async () => {
		vi.useFakeTimers();
		await setup('Hidden');
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toEqual([]);
		flushSync(() => (client.controls.mode.value = 'visible'));
		await flush();
		expect(client.calls).toEqual([]);
	});
	it('suppresses effects when Hydrate opens inside hidden Activity', async () => {
		vi.useFakeTimers();
		await setup('Hidden', { when: load() });
		await vi.advanceTimersToNextTimerAsync();
		await flush();
		expect(client.calls).toEqual(['init:hidden:context', 'hydrated']);
		flushSync(() => (client.controls.mode.value = 'visible'));
		expect(client.calls.at(-1)).toBe('effect:hidden');
	});
	it('reconciles current branches locally', async () => {
		await setup('Recovery', { when: condition(() => client.controls.changed.value) });
		const footer = container.querySelector('footer');
		flushSync(() => (client.controls.changed.value = true));
		await flush();
		expect(container.querySelector('section').textContent).toBe('new');
		expect(container.querySelector('footer')).toBe(footer);
	});
	it.each([false, true])(
		'hydrates early for children replacement, except never (%s)',
		async (isNever) => {
			await setup('Replacement', { when: isNever ? never() : condition(false) });
			flushSync(() => (client.controls.children.value = 'current'));
			await flush();
			expect(container.textContent).toBe(isNever ? 'old' : 'current');
		},
	);
	it('handles fragments, empty/text output, SVG and table ranges', async () => {
		await setup('Shapes', { when: load() });
		await flush();
		expect(container.textContent).toBe('textonetwocell');
		expect(container.querySelector('circle').namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(container.querySelector('tbody').children[0].tagName).toBe('TR');
		assert(unmount);
		unmount();
		unmount = null;
		expect(container.textContent).toBe('');
	});
	it('routes errors to the owning catch without completion', async () => {
		await setup('Errors', { when: interaction() });
		client.configure({ fail: true });
		container.querySelector('button').click();
		expect(container.querySelector('strong').textContent).toBe('hydrate failure');
		expect(client.calls).not.toContain('hydrated');
	});
});
