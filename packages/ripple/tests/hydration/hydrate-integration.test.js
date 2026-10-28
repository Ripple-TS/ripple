import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { flushSync, hydrate, setTransport } from 'ripple';
import { condition, load, interaction, never } from 'ripple/hydration';
import { render, setTransport as setServerTransport } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as client from './compiled/client/hydrate.js';
import * as server from './compiled/server/hydrate.js';
import * as transportClient from './compiled/client/hydrate-transport.js';
import * as transportServer from './compiled/server/hydrate-transport.js';

import { component } from './hydrate-fixtures.js';
/** @import { ComponentName } from './hydrate-fixtures.js' */

/** @type {(() => void) | null} */
var unmount = null;
afterEach(() => {
	unmount?.();
	unmount = null;
	client.configure();
	server.configure();
	vi.unstubAllGlobals();
	vi.useRealTimers();
	setTransport();
	setServerTransport();
});
/**
 * @param {ComponentName} name
 * @param {import('ripple/hydration').HydrationWhen} [when]
 * @param {() => void} [before]
 */
async function setup(name, when = interaction({ events: 'click' }), before = () => {}) {
	client.configure({ when });
	server.configure({ when });
	container.innerHTML = (await render(component(server[name]))).body;
	before();
	unmount = hydrate(component(client[name]), { target: container });
}
async function flush() {
	await Promise.resolve();
	flushSync();
}
function open() {
	container.querySelector('button, p').dispatchEvent(new Event('click', { bubbles: true }));
}

describe('Hydrate integration', () => {
	it('keeps root-specific async values and dependencies isolated after root cleanup', async () => {
		const when = interaction({ events: 'click' });
		server.configure({ when, initial: 'first' });
		const first = await render(component(server.Async));
		server.configure({ when, initial: 'second' });
		const second = await render(component(server.Async));
		const other = document.createElement('div');
		container.after(other);
		container.innerHTML = first.body;
		other.innerHTML = second.body;
		client.configure({ when, initial: 'second' });
		const disposeOther = hydrate(component(client.Async), { target: other });
		client.configure({ when, initial: 'first' });
		unmount = hydrate(component(client.Async), { target: container });
		try {
			other.querySelector('p').dispatchEvent(new Event('click', { bubbles: true }));
			expect(client.calls).not.toContain('fetch');
			open();
			expect(client.calls).not.toContain('fetch');
			expect(container.querySelector('p').textContent).toBe('first');
			expect(other.querySelector('p').textContent).toBe('second');
			flushSync(() => (client.controls.input.value = 'updated'));
			await flush();
			expect(container.querySelector('p').textContent).toBe('updated');
			expect(other.querySelector('p').textContent).toBe('second');
		} finally {
			disposeOther();
			other.remove();
		}
	});
	it('reconciles async dependencies changed before the trigger', async () => {
		await setup('Async');
		flushSync(() => (client.controls.input.value = 'current'));
		open();
		await flush();
		await flush();
		expect(client.calls).toContain('fetch');
		expect(container.querySelector('p').textContent).toBe('current');
	});
	it('retains the original root transport after the active transport changes', async () => {
		setServerTransport(transportServer.transport);
		setTransport(transportClient.transport);
		container.innerHTML = (await render(component(transportServer.App))).body;
		unmount = hydrate(component(transportClient.App), { target: container });
		setTransport({
			Money: {
				...transportClient.transport.Money,
				decode: () => {
					throw new Error('wrong root transport');
				},
			},
		});
		open();
		await flush();
		expect(transportClient.fetches).toBe(0);
		expect(container.querySelector('button').textContent).toBe('12 USD');
	});
	it.each(['before', 'after'])('adopts streamed data arriving %s the trigger', async (arrival) => {
		/** @type {PromiseWithResolvers<string>} */
		const { promise, resolve } = Promise.withResolvers();
		const when = interaction({ events: 'click' });
		server.configure({ when, stream: promise });
		client.configure({ when, stream: new Promise(() => {}) });
		/** @type {string[]} */
		const chunks = [];
		const done = render(component(server.Stream), {
			stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} },
		});
		/**
		 * @param {string} html
		 */
		const execute = (html) => {
			for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) (0, eval)(code);
		};
		container.innerHTML = chunks[0];
		execute(chunks[0]);
		unmount = hydrate(component(client.Stream), { target: container });
		const trigger = () =>
			container
				.querySelector('.stream-pending, .stream-value')
				.dispatchEvent(new Event('click', { bubbles: true }));
		if (arrival === 'after') trigger();
		resolve('stream result');
		await done;
		for (const chunk of chunks.slice(1)) {
			document.body.insertAdjacentHTML('beforeend', chunk);
			execute(chunk);
		}
		if (arrival === 'before') trigger();
		await flush();
		expect(container.querySelector('.stream-value').textContent).toBe('stream result');
		expect(container.querySelector('footer').textContent).toBe('untouched');
	});
	it('reads current props/context/store and preserves edited bindings through branch divergence', async () => {
		/** @type {HTMLInputElement | undefined} */
		let input;
		await setup('Current', condition(false), () => {
			input = container.querySelector('input');
			input.value = 'edited';
		});
		flushSync(() => {
			client.controls.store.value = { title: 'current' };
			client.controls.provided.value = 'context';
			client.controls.changed.value = true;
		});
		expect(client.calls).toEqual([]);
		expect(container.querySelector('b').textContent).toBe('old:old');
		flushSync(() => (client.controls.enabled.value = true));
		await flush();
		expect(container.querySelector('b').textContent).toBe('current:context');
		expect(container.querySelector('section').textContent).toBe('new');
		expect(container.querySelector('input')).toBe(input);
		assert(input);
		expect(input.value).toBe('edited');
		expect(client.controls.input.value).toBe('edited');
	});
	it('renders never normally on subsequent client navigation without a completion callback', async () => {
		await setup('Navigation');
		flushSync(() => (client.controls.exists.value = true));
		open();
		expect(client.calls).toEqual(['click']);
	});
	it.each([load(), interaction({ events: 'click' })])(
		'runs urgent hydration before unrelated hidden background work',
		async (when) => {
			/** @type {(() => void)[]} */
			const tasks = [];
			vi.stubGlobal('scheduler', {
				/**
				 * @param {() => void} fn
				 */
				postTask(fn) {
					tasks.push(fn);
					return new Promise(() => {});
				},
			});
			await setup('Priority', when);
			if (when.t === 'e') container.querySelector('[data-child="urgent"] button').click();
			await flush();
			expect(client.calls).toContain('init:urgent:context');
			expect(client.calls).not.toContain('init:background:context');
			expect(tasks).toHaveLength(1);
		},
	);
	it('discards queued work when child setup removes its own range', async () => {
		await setup('App');
		client.configure({ duringInit: () => flushSync(() => (client.controls.exists.value = false)) });
		open();
		await flush();
		expect(container.querySelector('button')).toBeNull();
		expect(client.calls).not.toContain('hydrated');
		expect(client.calls).not.toContain('effect:deferred');
	});
	it('honors a client-only nested factory resolving to never', async () => {
		await setup('DynamicFactory', condition(false));
		client.configure({ nested: never() });
		open();
		await flush();
		expect(client.calls).toEqual([]);
	});
	it('handles a queued trigger followed by repeated interactions exactly once each', async () => {
		await setup('App');
		flushSync(() => (client.controls.strategy.value = { value: load() }));
		// A load request is queued; replace its policy before it runs.
		flushSync(() => (client.controls.strategy.value = { value: interaction({ events: 'click' }) }));
		open();
		open();
		await flush();
		expect(client.calls.filter((x) => x.startsWith('init:'))).toHaveLength(1);
		expect(client.calls.filter((x) => x === 'click:deferred')).toHaveLength(2);
	});
	it('routes completion errors to the owning catch', async () => {
		await setup('CallbackError');
		open();
		expect(container.querySelector('strong').textContent).toBe('completion failure');
	});
	it('discards the default action when failed hydration removes the target', async () => {
		await setup('Errors');
		client.configure({ fail: true });
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		container.querySelector('button').dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(client.calls).not.toContain('click:broken');
	});
});

describe('retained conditional choices', () => {
	it.each([
		[1, 1],
		[2, 2],
		[3, 0],
		[3, 2],
		[2, 0],
	])('hydrates SSR choice %i against current choice %i', async (initial, choice) => {
		server.configure({ initial: String(initial) });
		client.configure({ initial: String(initial) });
		container.innerHTML = (await render(component(server.Branches))).body;
		const paragraphs = [...container.querySelectorAll('p')];
		unmount = hydrate(component(client.Branches), { target: container });
		flushSync(() => {
			client.controls.choice.value = choice;
			client.controls.enabled.value = true;
		});
		await flush();
		for (const selector of ['#if-chain', '#switch']) {
			expect(container.querySelector(selector).textContent).toBe(
				['first', 'second', 'third', ''][choice],
			);
		}
		if (initial === choice) {
			const current = container.querySelectorAll('p');
			paragraphs.forEach((node, index) => expect(current[index]).toBe(node));
		}
	});

	it.each([1, 2, 3])('reconciles equal-tag and absent branches for choice %i', async (choice) => {
		await setup('Branches');
		flushSync(() => {
			client.controls.choice.value = choice;
			client.controls.enabled.value = true;
		});
		await flush();
		expect(container.querySelector('#if-chain').textContent).toBe(
			['', 'second', 'third', ''][choice],
		);
		expect(container.querySelector('#switch').textContent).toBe(
			['', 'second', 'third', ''][choice],
		);
		flushSync(() => (client.controls.choice.value = 0));
		expect(container.querySelector('#if-chain').textContent).toBe('first');
		expect(container.querySelector('#switch').textContent).toBe('first');
	});
});

describe('intent through unresolved ancestors', () => {
	it.each([load(), condition(true)])(
		'delivers the original event when a nested factory is immediately eligible',
		async (nested) => {
			const when = condition(false);
			client.configure({ when, nested });
			server.configure({ when, nested });
			container.innerHTML = (await render(component(server.DynamicFactory))).body;
			unmount = hydrate(component(client.DynamicFactory), { target: container });
			open();
			expect(client.calls.filter((x) => x === 'click:dynamic')).toHaveLength(1);
		},
	);
	it('promotes an uninitialized Activity before its nested interaction gate', async () => {
		vi.useFakeTimers();
		await setup('Hidden');
		// A synthetic event lets us exercise hidden preparation before any task.
		// Visible Activity uses the same retained initializer and promotion path.
		open();
		await flush();
		expect(client.calls).toContain('init:hidden:context');
		expect(client.calls).toContain('click:hidden');
		expect(client.calls).not.toContain('effect:hidden');
		await vi.advanceTimersByTimeAsync(1);
		expect(client.calls.filter((x) => x === 'init:hidden:context')).toHaveLength(1);
	});
	it('never lets Activity intent open a static descendant', async () => {
		vi.useFakeTimers();
		await setup('Hidden', never());
		open();
		await flush();
		await vi.advanceTimersToNextTimerAsync();
		expect(client.calls).toEqual([]);
	});
});

describe('lazy child expressions', () => {
	it('does not evaluate derived children before opening and uses their current value', async () => {
		await setup('DerivedChildren');
		expect(client.calls).toEqual([]);
		flushSync(() => (client.controls.value.value = 'current'));
		expect(client.calls).toEqual([]);
		expect(container.textContent).toBe('old');
		flushSync(() => (client.controls.enabled.value = true));
		await flush();
		expect(container.textContent).toBe('current');
		expect(client.calls).toEqual(['children read']);
		flushSync(() => (client.controls.value.value = 'later'));
		expect(container.textContent).toBe('later');
	});
});
