import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { hydrate, flushSync } from 'ripple';
import { render } from 'ripple/server';
import { container } from '../setup-hydration.js';
import * as client from './compiled/client/view-transition.js';
import * as server from './compiled/server/view-transition.js';
import { installViewTransitions } from '../view-transition/native.js';

let unmount;
let native;
beforeEach(() => {
	native = installViewTransitions();
});
afterEach(() => {
	unmount?.();
	unmount = null;
	vi.restoreAllMocks();
	Reflect.deleteProperty(document, 'startViewTransition');
	for (const child of [...document.body.children]) if (child !== container) child.remove();
});

it('adds no server markers or metadata and preserves all hydrated node identities', async () => {
	const plain = await render(server.Plain);
	const wrapped = await render(server.Wrapped);
	expect(wrapped.body).toBe(plain.body);
	const { body } = await render(server.App);
	expect(body).toContain('view-transition-name:counter');
	container.innerHTML = body;
	const nodes = [...container.childNodes];
	unmount = hydrate(client.App, { target: container });
	flushSync();
	expect([...container.childNodes]).toEqual(nodes);
	expect(native.start).not.toHaveBeenCalled();
	const handle = client.transition.run(() => {
		client.count.value++;
	});
	expect(await handle.ready).toBe(true);
	native.transitions[0].finish();
	await handle.finished;
	expect(container.querySelector('button').textContent).toBe('1');
	expect(
		[...container.querySelectorAll('[style]')].every(
			(element) => element.style.getPropertyPriority('view-transition-name') === '',
		),
	).toBe(true);
});

it('waits for demand hydration without animating initial adoption or overwriting edits', async () => {
	container.innerHTML = (await render(server.Deferred)).body;
	const input = container.querySelector('input');
	input.value = 'edited';
	unmount = hydrate(client.Deferred, { target: container });
	const handle = client.transition.run(() => {
		client.reveal.value = true;
	});
	expect(await handle.rendered).toBe(true);
	await handle.ready;
	native.transitions[0].finish();
	await handle.finished;
	expect(container.querySelector('input')).toBe(input);
	expect(input.value).toBe('edited');
});

function scripts(html) {
	for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) (0, eval)(code);
}
it.each(['before', 'after'])(
	'keeps wrapped streaming adoption unanimated %s hydration and permits pending updates',
	async (arrival) => {
		server.reset();
		client.reset();
		delete window.__RIPPLE_B__;
		delete window.__RIPPLE_S__;
		const chunks = [];
		const done = render(server.WrappedStream, {
			stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} },
		});
		container.innerHTML = chunks[0];
		scripts(chunks[0]);
		if (arrival === 'after') {
			unmount = hydrate(client.WrappedStream, { target: container });
			client.count.value++;
			flushSync();
			expect(container.querySelector('.counter').textContent).toBe('1');
		}
		server.pending.resolve('streamed');
		await done;
		for (const chunk of chunks.slice(1)) {
			document.body.insertAdjacentHTML('beforeend', chunk);
			scripts(chunk);
		}
		if (arrival === 'before') unmount = hydrate(client.WrappedStream, { target: container });
		flushSync();
		expect(container.querySelector('.result').textContent).toBe('streamed');
		expect(native.start).not.toHaveBeenCalled();
		const handle = client.transition.run(() => {
			client.count.value++;
		});
		await handle.ready;
		native.transitions[0].finish();
		await handle.finished;
		expect(
			[...container.querySelectorAll('[style]')].every(
				(element) => element.style.getPropertyPriority('view-transition-name') === '',
			),
		).toBe(true);
	},
);

it.each([
	['WrappedActivity', 'visible'],
	['WrappedActivity', 'hidden'],
	['ActivityAroundTransition', 'visible'],
	['ActivityAroundTransition', 'hidden'],
])(
	'hydrates %s starting %s without initial animation or replacing nodes',
	async (component, initial) => {
		container.innerHTML = (await render(server[component], { props: { initial } })).body;
		const input = container.querySelector('input');
		const button = container.querySelector('button');
		input.value = 'edited before hydration';
		unmount = hydrate(client[component], { target: container, props: { initial } });
		flushSync();
		await Promise.resolve();
		flushSync();
		expect(native.start).not.toHaveBeenCalled();
		for (const next of initial === 'visible'
			? ['hidden', 'visible']
			: ['visible', 'hidden', 'visible']) {
			const handle = client.transition.run(() => {
				client.mode.value = next;
			});
			expect(await handle.rendered).toBe(true);
			expect(await handle.ready).toBe(true);
			native.transitions.at(-1).finish();
			await handle.finished;
		}
		expect(container.querySelector('input')).toBe(input);
		expect(container.querySelector('button')).toBe(button);
		expect(input.value).toBe('edited before hydration');
		button.click();
		flushSync();
		expect(button.textContent).toBe('1');
		expect(input.style.getPropertyPriority('view-transition-name')).toBe('');
	},
);
