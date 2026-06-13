// FragmentInstance.addEventListener / removeEventListener — React canary parity.
//
// Rules pinned by these tests:
//   - listeners attach to every direct host child of the fragment, in
//     tree order, not to the fragment's start/end Comment markers
//   - descendants bubble up to the direct child, so the listener fires
//     for nested events too
//   - sibling elements OUTSIDE the fragment are NEVER touched
//   - remove matches on (type, listener, options.capture) — same identity
//     rule as the platform's removeEventListener
//   - options.once / options.capture / options.passive forward to the
//     underlying addEventListener call
//   - object listeners ({ handleEvent }) are supported
//   - empty fragments are a no-op
import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FragmentInstance } from '../../src/index.js';
import {
	TwoChildren,
	DeepNested,
	OutsideSibling,
	EmptyFragment,
	SingleChild,
} from './_fixtures/fragment-refs-events.tsrx';

function makeRef(): { current: FragmentInstance | null } {
	return { current: null };
}

describe('FragmentInstance.addEventListener / removeEventListener', () => {
	it('addEventListener attaches the listener to ALL direct fragment children', () => {
		const fragRef = makeRef();
		const r = mount(TwoChildren, { fragRef });
		const targets: Element[] = [];
		fragRef.current!.addEventListener('click', (e) => targets.push(e.currentTarget as Element));
		(r.find('#a') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		(r.find('#b') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(targets).toHaveLength(2);
		expect(targets[0]).toBe(r.find('#a'));
		expect(targets[1]).toBe(r.find('#b'));
		r.unmount();
	});

	it('listener fires when an event bubbles up from a descendant of a direct child', () => {
		const fragRef = makeRef();
		const r = mount(DeepNested, { fragRef });
		let fired = 0;
		fragRef.current!.addEventListener('click', () => fired++);
		(r.find('#inner') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('the event passed to the listener has the original target reference', () => {
		const fragRef = makeRef();
		const r = mount(TwoChildren, { fragRef });
		let capturedTarget: EventTarget | null = null;
		let capturedCurrentTarget: EventTarget | null = null;
		fragRef.current!.addEventListener('click', (e) => {
			// currentTarget is cleared back to null AFTER dispatch returns, so
			// snapshot inside the handler — not after the dispatch call.
			capturedTarget = e.target;
			capturedCurrentTarget = e.currentTarget;
		});
		(r.find('#a') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(capturedTarget).toBe(r.find('#a'));
		// currentTarget is the element the listener was attached to (the
		// direct fragment child) — same as target here since the dispatch
		// originated at #a itself.
		expect(capturedCurrentTarget).toBe(r.find('#a'));
		r.unmount();
	});

	it('removeEventListener detaches the listener from every direct child', () => {
		const fragRef = makeRef();
		const r = mount(TwoChildren, { fragRef });
		let fired = 0;
		const handler = () => fired++;
		fragRef.current!.addEventListener('click', handler);
		(r.find('#a') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		fragRef.current!.removeEventListener('click', handler);
		(r.find('#a') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		(r.find('#b') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('addEventListener does NOT attach to siblings outside the fragment', () => {
		const fragRef = makeRef();
		const r = mount(OutsideSibling, { fragRef });
		let fired = 0;
		fragRef.current!.addEventListener('click', () => fired++);
		(r.find('#outside') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		(r.find('#after') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(0);
		// The inside child still receives it though — sanity that the
		// listener was added at all.
		(r.find('#inside') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('addEventListener honours `once: true`', () => {
		const fragRef = makeRef();
		const r = mount(SingleChild, { fragRef });
		let fired = 0;
		fragRef.current!.addEventListener('click', () => fired++, { once: true });
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('addEventListener honours `capture: true`', () => {
		const fragRef = makeRef();
		const r = mount(DeepNested, { fragRef });
		const phases: number[] = [];
		fragRef.current!.addEventListener(
			'click',
			(e) => {
				// Capture handlers run in phase 1 (CAPTURING_PHASE = 1) while the
				// event is travelling DOWN the tree. Bubble handlers see phase 3.
				phases.push(e.eventPhase);
			},
			{ capture: true },
		);
		(r.find('#inner') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		// outer (the direct fragment child) saw the event during the capture
		// phase, BEFORE it reached #inner.
		expect(phases).toEqual([1]);
		r.unmount();
	});

	it('addEventListener supports object listeners ({ handleEvent })', () => {
		const fragRef = makeRef();
		const r = mount(SingleChild, { fragRef });
		let fired = 0;
		const handler = {
			handleEvent() {
				fired++;
			},
		};
		fragRef.current!.addEventListener('click', handler);
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		fragRef.current!.removeEventListener('click', handler);
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('removeEventListener with mismatched capture flag is a no-op', () => {
		const fragRef = makeRef();
		const r = mount(SingleChild, { fragRef });
		let fired = 0;
		const handler = () => fired++;
		fragRef.current!.addEventListener('click', handler, { capture: true });
		// Wrong capture flag — should NOT detach the original listener.
		fragRef.current!.removeEventListener('click', handler, { capture: false });
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		// Now match — listener gone.
		fragRef.current!.removeEventListener('click', handler, { capture: true });
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('addEventListener on an empty fragment is a no-op (no children to attach to)', () => {
		const fragRef = makeRef();
		const r = mount(EmptyFragment, { fragRef });
		// Must not throw, must not crash on remove either.
		expect(() => {
			fragRef.current!.addEventListener('click', () => {});
			fragRef.current!.removeEventListener('click', () => {});
		}).not.toThrow();
		r.unmount();
	});

	it('listeners are detached automatically on fragment destroy (unmount)', () => {
		const fragRef = makeRef();
		const r = mount(SingleChild, { fragRef });
		let fired = 0;
		const handler = () => fired++;
		const button = r.find('#k') as HTMLElement;
		fragRef.current!.addEventListener('click', handler);
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		// Hold a reference to the button BEFORE unmount so we can dispatch
		// to it after the fragment is destroyed. Verifies the listener was
		// detached at unmount — not just orphaned in a dead reference.
		r.unmount();
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
	});
});
