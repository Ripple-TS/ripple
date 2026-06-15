import { describe, it, expect, vi } from 'vitest';
import { mount, flushEffects } from './_helpers';
import { flushSync, setFormAction } from '../src/index.js';
import {
	ActionForm,
	FormWithStatus,
	RawFormWithStatus,
	StatusProbe,
	SelfFormStatus,
	OptimisticForm,
	BareOptimistic,
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

	it('keeps the form pending until ALL queued submits drain', async () => {
		// useActionState runs dispatches sequentially; each dispatch's promise
		// resolves when THAT action finishes, not when the whole queue drains. A
		// rapid second submit must keep the form's status pending until both
		// actions complete — not flip to idle after the first.
		const d1 = deferred();
		const d2 = deferred();
		const promises = [d1.promise, d2.promise];
		const action = (_p: any, _fd: FormData) => promises.shift();
		const r = mount(FormWithStatus, { action });
		flushSync(() => {});
		submit(r.container); // submit 1 (action 1 runs)
		submit(r.container); // submit 2 (action 2 queued behind action 1)
		expect(r.find('#status').textContent).toBe('pending:post');

		// Drain fully with action 2's promise STILL unresolved: action 1's settle
		// has fired, but action 2 is in flight → status MUST stay pending.
		d1.resolve();
		await settle();
		expect(r.find('#status').textContent).toBe('pending:post');

		d2.resolve();
		await settle();
		expect(r.find('#status').textContent).toBe('idle');
		r.unmount();
	});

	it('re-resolves an ancestor form that appears after the first render', async () => {
		// First render has no ancestor form (idle). After we wrap the probe in a
		// <form> and re-render, the hook must re-resolve + subscribe to it — not
		// stay stuck on the cached null from the first render.
		let force!: () => void;
		const r = mount(StatusProbe, { expose: (f: () => void) => (force = f) });
		flushSync(() => {});
		expect(r.find('#probe').textContent).toBe('idle');

		// Insert a <form> between the root container and #wrap, so it becomes the
		// probe's nearest ANCESTOR form (and submit events bubble to the root).
		const wrap = r.find('#wrap');
		const form = document.createElement('form');
		r.container.insertBefore(form, wrap);
		form.appendChild(wrap);
		const d = deferred();
		setFormAction(form as any, 'action', () => d.promise, undefined);

		// Re-render → useFormStatus re-resolves + subscribes to the new ancestor form.
		flushSync(() => force());
		// A submit flips the form's status; the now-subscribed probe reflects it.
		flushSync(() =>
			form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true })),
		);
		expect(r.find('#probe').textContent).toBe('pending');

		// Resolve + drain so the in-flight transition doesn't leak into later tests.
		d.resolve();
		await settle();
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

	it('clears pending when a raw form action throws synchronously', async () => {
		// A synchronously-throwing action must still reset the form status — it must
		// not leave useFormStatus stuck on pending — and report the error.
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const err = new Error('boom');
		const action = () => {
			throw err;
		};
		const r = mount(RawFormWithStatus, { action });
		flushSync(() => {});
		expect(r.find('#status').textContent).toBe('idle');

		submit(r.container);
		await tick();
		expect(r.find('#status').textContent).toBe('idle'); // not stuck on pending
		expect(spy).toHaveBeenCalledWith(err);
		spy.mockRestore();
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

	it('shows briefly then reverts when addOptimistic is called OUTSIDE a transition', async () => {
		// Bare addOptimistic (no Action): the value shows for one render, then the
		// queue self-clears on a microtask — it must NOT stay stuck waiting for a
		// transition that never comes.
		const r = mount(BareOptimistic, { initial: ['a'] });
		flushSync(() => {});
		expect(r.find('#list').textContent).toBe('a');

		flushSync(() => (r.find('#add') as HTMLElement).click());
		expect(r.find('#list').textContent).toBe('a,x'); // shown briefly

		await tick();
		expect(r.find('#list').textContent).toBe('a'); // reverted, not stuck
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

	it('clears isPending when a useActionState action throws synchronously', async () => {
		// A synchronously-throwing action inside useActionState's dispatch must not
		// leave isPending stuck true (the throw escaping startTransition before
		// `finish` runs would otherwise wedge pendingCount forever) — and it reports
		// the error.
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const err = new Error('boom');
		const action = () => {
			throw err;
		};
		const r = mount(DirectAction, { action, initial: 0, payload: 1 });
		flushSync(() => {});
		expect(r.find('#pending').textContent).toBe('idle');

		flushSync(() => (r.find('#run') as HTMLElement).click());
		// isPending flips true synchronously at dispatch…
		expect(r.find('#pending').textContent).toBe('pending');

		// …then the action runs on a microtask and throws; pending must clear.
		await settle();
		expect(r.find('#pending').textContent).toBe('idle'); // not stuck on pending
		expect(spy).toHaveBeenCalledWith(err);
		spy.mockRestore();
		r.unmount();
	});

	it('keeps the dispatch queue threading after a synchronous throw', async () => {
		// The chain must not reject-and-stall: a second dispatch after a throwing
		// one still runs and commits (the throw resolved the chain with prior state).
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		let calls = 0;
		const action = (prev: number, payload: number) => {
			calls++;
			if (calls === 1) throw new Error('first blows up');
			return prev + payload; // second dispatch threads prior (unchanged) state
		};
		const r = mount(DirectAction, { action, initial: 10, payload: 5 });
		flushSync(() => {});
		flushSync(() => (r.find('#run') as HTMLElement).click()); // throws
		flushSync(() => (r.find('#run') as HTMLElement).click()); // must still run
		await settle();
		expect(calls).toBe(2);
		expect(r.find('#state').textContent).toBe('15'); // 10 + 5 committed
		expect(r.find('#pending').textContent).toBe('idle');
		spy.mockRestore();
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
