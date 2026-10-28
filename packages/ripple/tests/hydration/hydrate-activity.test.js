import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate } from 'ripple';
import { condition, interaction, load, never } from 'ripple/hydration';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import { component } from './hydrate-fixtures.js';
import * as client from './compiled/client/hydrate.js';
import * as server from './compiled/server/hydrate.js';

/** @import { HydrationWhen } from 'ripple/hydration' */
/** @import { ComponentName } from './hydrate-fixtures.js' */
/** @type {(() => void) | null} */
let unmount = null;
/** @type {(() => void)[]} */
let background = [];

afterEach(() => {
	unmount?.();
	unmount = null;
	background = [];
	client.configure();
	server.configure();
	vi.unstubAllGlobals();
});

/**
 * @param {ComponentName} name
 * @param {HydrationWhen} [when]
 * @param {'hidden' | 'visible'} [initial]
 * @param {HydrationWhen} [nested]
 */
async function setup(
	name,
	when = condition(() => client.controls.enabled.value),
	initial = 'hidden',
	nested = interaction(),
) {
	vi.stubGlobal('scheduler', {
		/**
		 * @param {() => void} task
		 */
		postTask(task) {
			background.push(task);
			return new Promise(() => {});
		},
	});
	client.configure({ when, initial, nested });
	server.configure({ when, initial, nested });
	container.innerHTML = (await render(component(server[name]))).body;
	const input = container.querySelector('input');
	input.value = 'edited before hydration';
	unmount = hydrate(component(client[name]), { target: container });
	return input;
}

async function flush() {
	await Promise.resolve();
	flushSync();
}

async function prepare() {
	for (const task of background.splice(0)) task();
	await flush();
}

/**
 * @param {string} call
 */
function count(call) {
	return client.calls.filter((entry) => entry === call).length;
}

describe.each(/** @type {const} */ (['ActivityOutsideHydrate', 'HydrateOutsideActivity']))(
	'Activity/Hydrate composition: %s',
	(name) => {
		it.each(/** @type {const} */ (['hidden', 'visible']))(
			'preserves DOM and edits and reconnects effects once (initially %s)',
			async (initial) => {
				const input = await setup(name, undefined, initial);
				const content = container.querySelector('[data-child="composed"]');
				expect(content.style.display).toBe(initial === 'hidden' ? 'none' : '');
				await prepare();
				expect(client.calls).toEqual([]);
				flushSync(() => (client.controls.enabled.value = true));
				await flush();
				await prepare();
				expect(count('init:composed:context')).toBe(1);
				expect(count('hydrated')).toBe(1);
				expect(count('effect:composed')).toBe(initial === 'hidden' ? 0 : 1);
				expect(container.querySelector('input')).toBe(input);
				expect(input.value).toBe('edited before hydration');
				expect(container.querySelector('span').textContent).toBe('edited before hydration');
				expect(container.querySelector('[data-child="composed"]')).toBe(content);
				expect(content.style.display).toBe(initial === 'hidden' ? 'none' : '');

				flushSync(() => (client.controls.mode.value = 'visible'));
				await flush();
				expect(content.style.display).toBe('');
				expect(count('effect:composed')).toBe(1);
				flushSync(() => (client.controls.mode.value = 'hidden'));
				expect(count('cleanup:composed')).toBe(1);
				expect(content.style.display).toBe('none');
				flushSync(() => (client.controls.mode.value = 'visible'));
				expect(count('effect:composed')).toBe(2);
				expect(count('init:composed:context')).toBe(1);
				expect(count('hydrated')).toBe(1);
				expect(container.querySelector('input')).toBe(input);
				flushSync(() => (client.controls.mode.value = 'hidden'));
				expect(count('cleanup:composed')).toBe(2);
				assert(unmount);
				unmount();
				unmount = null;
				expect(count('cleanup:composed')).toBe(2);
			},
		);

		it('uses the current Activity mode without opening the Hydrate gate early', async () => {
			await setup(name);
			await prepare();
			flushSync(() => (client.controls.mode.value = 'visible'));
			await flush();
			await prepare();
			expect(client.calls).toEqual([]);
			flushSync(() => (client.controls.enabled.value = true));
			await flush();
			await prepare();
			expect(count('init:composed:context')).toBe(1);
			expect(count('effect:composed')).toBe(1);
			expect(container.querySelector('[data-child="composed"]').style.display).toBe('');
		});

		it('keeps never content static through visibility changes', async () => {
			await setup(name, never());
			await prepare();
			for (const mode of ['visible', 'hidden', 'visible']) {
				flushSync(() => (client.controls.mode.value = mode));
				await flush();
				await prepare();
			}
			expect(client.calls).toEqual([]);
			const footer = container.querySelector('footer');
			flushSync(() => (client.controls.exists.value = false));
			await prepare();
			expect(container.querySelector('input')).toBeNull();
			expect(container.querySelector('footer')).toBe(footer);
			expect(client.calls).toEqual([]);
		});

		it.each(['waiting', 'queued'])(
			'removes %s work without initializing children',
			async (phase) => {
				await setup(name);
				const footer = container.querySelector('footer');
				if (phase === 'queued') {
					await prepare();
					flushSync(() => (client.controls.enabled.value = true));
				}
				flushSync(() => (client.controls.exists.value = false));
				await flush();
				await prepare();
				expect(client.calls).toEqual([]);
				expect(container.querySelector('input')).toBeNull();
				expect(container.querySelector('footer')).toBe(footer);
			},
		);

		it.each(/** @type {const} */ (['hidden', 'visible']))(
			'delivers the triggering click through both ranges once (initially %s)',
			async (initial) => {
				await setup(name, interaction({ events: 'click' }), initial);
				const button = container.querySelector('button');
				button.click();
				expect(count('init:composed:context')).toBe(1);
				expect(count('click:composed')).toBe(1);
				await flush();
				await prepare();
				button.click();
				expect(count('click:composed')).toBe(2);
				expect(count('effect:composed')).toBe(initial === 'hidden' ? 0 : 1);
				expect(count('init:composed:context')).toBe(1);
				expect(count('hydrated')).toBe(1);
			},
		);
	},
);

describe('Hydrate around Activity', () => {
	it.each([load(), condition(true)])(
		'opens an eligible nested %j gate before delivering intent',
		async (nested) => {
			await setup('HydrateActivityHydrate', interaction({ events: 'click' }), 'visible', nested);
			container.querySelector('button').click();
			expect(count('init:composed:context')).toBe(1);
			expect(count('click:composed')).toBe(1);
			expect(count('outer hydrated')).toBe(1);
			expect(count('inner hydrated')).toBe(1);
		},
	);

	it('cancels queued Activity preparation after the outer gate has opened', async () => {
		await setup('HydrateOutsideActivity');
		flushSync(() => (client.controls.enabled.value = true));
		await flush();
		expect(client.calls).toEqual(['hydrated']);
		expect(background).toHaveLength(1);
		flushSync(() => (client.controls.exists.value = false));
		await prepare();
		expect(client.calls).toEqual(['hydrated']);
		expect(container.querySelector('input')).toBeNull();
	});

	it.each([condition(false), never()])(
		'respects a nested %j Hydrate gate during intent',
		async (nested) => {
			await setup('HydrateActivityHydrate', interaction({ events: 'click' }), 'visible', nested);
			container.querySelector('button').click();
			await flush();
			await prepare();
			expect(count('init:composed:context')).toBe(0);
			expect(count('inner hydrated')).toBe(0);
		},
	);
});
