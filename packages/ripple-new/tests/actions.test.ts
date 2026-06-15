import { describe, it, expect } from 'vitest';
import { mount, flushEffects } from './_helpers';
import { flushSync } from '../src/index.js';
import {
	ActionForm,
	FormWithStatus,
	SelfFormStatus,
	OptimisticForm,
	DirectAction,
	RawForm,
} from './_fixtures/actions.tsrx';

// React 19 Actions: <form action={fn}>, useActionState, useFormStatus, useOptimistic.

function deferred<T = void>() {
	let resolve!: (v: T) => void;
	let reject!: (e: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

// Commit a microtask's worth of scheduled (transition-priority) work — used to
// observe state mid-action (the async action body runs on a microtask after the
// synchronous submit, so optimistic/pending updates land a tick later).
async function tick() {
	await Promise.resolve();
	await Promise.resolve();
	flushSync(() => {});
	flushEffects();
}

// Fully drain the microtask queue + commit all scheduled renders/effects. The
// action chain nests several promise layers (chain → transition → action await),
// so drain generously then commit.
async function settle() {
	for (let i = 0; i < 30; i++) await Promise.resolve();
	flushSync(() => {});
	flushEffects();
}

function submit(container: HTMLElement, selector = 'form', submitter?: HTMLElement) {
	const form = container.querySelector(selector) as HTMLFormElement;
	flushSync(() => {
		form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter }));
	});
	return form;
}

describe('useActionState + <form action>', () => {
	it('runs action(prev, formData), flips isPending, and commits the returned state', async () => {
		const d = deferred();
		const action = (_prev: string, fd: FormData) => d.promise.then(() => 'got:' + fd.get('name'));
		const r = mount(ActionForm, { action, initial: 'init' });
		flushSync(() => {});
		expect(r.find('#state').textContent).toBe('init');
		expect(r.find('#pending').textContent).toBe('idle');

		(r.find('#field') as HTMLInputElement).value = 'alice';
		submit(r.container);
		// isPending flips true synchronously at dispatch; state not yet updated.
		expect(r.find('#pending').textContent).toBe('pending');
		expect(r.find('#state').textContent).toBe('init');

		d.resolve();
		await settle();
		expect(r.find('#pending').textContent).toBe('idle');
		expect(r.find('#state').textContent).toBe('got:alice');
		r.unmount();
	});

	it('queues dispatches sequentially, threading the previous result', async () => {
		const seen: string[] = [];
		// Each action appends the payload to the previous state.
		const action = async (prev: string, fd: FormData) => {
			const v = String(fd.get('name'));
			await Promise.resolve();
			seen.push(prev + '>' + v);
			return prev + '/' + v;
		};
		const r = mount(ActionForm, { action, initial: 'a' });
		flushSync(() => {});
		(r.find('#field') as HTMLInputElement).value = 'b';
		submit(r.container);
		(r.find('#field') as HTMLInputElement).value = 'c';
		submit(r.container);
		await settle();
		// Sequential: second dispatch saw the first's committed result.
		expect(seen).toEqual(['a>b', 'a/b>c']);
		expect(r.find('#state').textContent).toBe('a/b/c');
		r.unmount();
	});
});

describe('useFormStatus', () => {
	it('reports the ancestor form’s pending status to a descendant', async () => {
		const d = deferred();
		const action = (_p: any, _fd: FormData) => d.promise;
		const r = mount(FormWithStatus, { action });
		flushSync(() => {});
		expect(r.find('#status').textContent).toBe('idle');

		submit(r.container);
		expect(r.find('#status').textContent).toBe('pending:post');

		d.resolve();
		await settle();
		expect(r.find('#status').textContent).toBe('idle');
		r.unmount();
	});

	it('ignores a form rendered by the same component (no ancestor form)', () => {
		let captured: any;
		const r = mount(SelfFormStatus, {
			action: () => {},
			expose: (s: any) => (captured = s),
		});
		flushSync(() => {});
		// The hook's component renders the form, so there is NO ancestor form → idle.
		expect(r.find('#self').textContent).toBe('idle');
		expect(captured.pending).toBe(false);
		r.unmount();
	});
});

describe('useOptimistic', () => {
	it('shows the optimistic value during the action, then converges to real state', async () => {
		const d = deferred();
		const r = mount(OptimisticForm, { initial: ['x'], action: () => d.promise });
		flushSync(() => {});
		expect(r.find('#list').textContent).toBe('x');

		(r.find('#field') as HTMLInputElement).value = 'y';
		submit(r.container);
		// The action (and its addOptimistic call) runs on a microtask after submit;
		// once it does, the optimistic value (with the '?' marker) shows while pending.
		await tick();
		expect(r.find('#list').textContent).toBe('x,y?');

		d.resolve();
		await settle();
		// Real committed state (no '?'), optimistic queue cleared.
		expect(r.find('#list').textContent).toBe('x,y');
		r.unmount();
	});
});

describe('direct dispatch (formAction(payload) outside a form)', () => {
	it('runs the action with the raw payload and tracks isPending', async () => {
		const d = deferred();
		const action = (_prev: number, payload: number) => d.promise.then(() => payload * 2);
		const r = mount(DirectAction, { action, initial: 0, payload: 21 });
		flushSync(() => {});
		r.find('#run');
		flushSync(() => (r.find('#run') as HTMLElement).click());
		expect(r.find('#pending').textContent).toBe('pending');

		d.resolve();
		await settle();
		expect(r.find('#state').textContent).toBe('42');
		expect(r.find('#pending').textContent).toBe('idle');
		r.unmount();
	});
});

describe('raw <form action={fn}> auto-reset', () => {
	it('resets uncontrolled fields after a successful submit', async () => {
		const d = deferred();
		let received: string | null = null;
		const action = (fd: FormData) => {
			received = String(fd.get('field'));
			return d.promise;
		};
		const r = mount(RawForm, { action });
		flushSync(() => {});
		const field = r.find('#field') as HTMLInputElement;
		field.value = 'typed';
		submit(r.container);
		expect(received).toBe('typed'); // action got the FormData

		d.resolve();
		await settle();
		// Uncontrolled input reset to its (empty) default on success.
		expect((r.find('#field') as HTMLInputElement).value).toBe('');
		r.unmount();
	});
});
