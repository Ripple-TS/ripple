// React-parity scheduler invariants — locked down so we cannot regress.
//
// (1) Discrete-event sync commit: clicks / keydowns / inputs / etc. must
//     commit their setState updates BEFORE the event handler returns to
//     the browser. Mirrors React's DiscreteEventPriority arm; without it
//     fast double-clicks, autofocus, e.preventDefault+measure, and
//     controlled-input value reads all see stale state.
//
// (2) Effect mount order: useLayoutEffect / useEffect setups fire
//     child-first (post-order). Parent setups depend on child setups
//     having run — react-aria FocusScope, react-redux subscribers,
//     react-spring measurements all rely on this.
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '../_helpers';
import {
	ClickCounter,
	FastClick,
	snapshots,
	resetSnapshots,
	Outer,
	layoutOrder,
	passiveOrder,
	resetEffectOrder,
	SiblingParent,
	siblingOrder,
	resetSiblingOrder,
	CleanupProbe,
	cleanupOrder,
	resetCleanupOrder,
} from './_fixtures/scheduler-priority.tsrx';

describe('Scheduler — discrete event sync commit (React DiscreteEventPriority)', () => {
	it('click handler setState commits BEFORE the dispatch returns', () => {
		const r = mount(ClickCounter);
		const btn = r.find('#b') as HTMLButtonElement;
		expect(btn.textContent).toBe('0');
		// Native dispatchEvent — same path the browser uses.
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		// No flushSync, no act() — the discrete-event sync flush must have
		// already committed.
		expect(btn.textContent).toBe('1');
		r.unmount();
	});

	it('between events: DOM is fully committed before the next event handler runs', () => {
		resetSnapshots();
		const r = mount(FastClick);
		const btn = r.find('#fc') as HTMLButtonElement;
		// Within a SINGLE handler, setState is still queued — the DOM read in
		// that same handler sees the pre-commit value. Mirrors React exactly.
		// Between events though, the discrete-event flush has run, so each
		// handler sees the committed value from the PREVIOUS click.
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		// Click 1: setN queued, DOM still '0'; handler pushes '0'. Commit to '1'.
		// Click 2: setN queued, DOM '1'; pushes '1'. Commit to '2'.
		// Click 3: setN queued, DOM '2'; pushes '2'. Commit to '3'.
		expect(snapshots).toEqual(['0', '1', '2']);
		// And the final DOM must show the LAST committed value — verifies the
		// flush ran between dispatch 3 and our assertion.
		expect(btn.textContent).toBe('3');
		r.unmount();
	});

	it('repeated discrete dispatches accumulate without losing intermediate commits', () => {
		const r = mount(ClickCounter);
		const btn = r.find('#b') as HTMLButtonElement;
		expect(btn.textContent).toBe('0');
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(btn.textContent).toBe('1');
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(btn.textContent).toBe('2');
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(btn.textContent).toBe('3');
		r.unmount();
	});
});

describe('Scheduler — effect mount order is child-first (React post-order commit)', () => {
	beforeEach(() => {
		resetEffectOrder();
		resetSiblingOrder();
		resetCleanupOrder();
	});

	it('useLayoutEffect setup fires child-first across three nested levels', () => {
		const r = mount(Outer);
		// Layout-effect order must be deepest-first (Inner) → middle → outer.
		expect(layoutOrder).toEqual(['inner-layout', 'middle-layout', 'outer-layout']);
		r.unmount();
	});

	it('useEffect (passive) setup also fires child-first', async () => {
		const r = mount(Outer);
		// Flush passive effects deterministically — they're scheduled via
		// rAF → MessageChannel.postMessage; wait one rAF + one task.
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => setTimeout(() => resolve(), 0));
		});
		expect(passiveOrder).toEqual(['inner-passive', 'middle-passive', 'outer-passive']);
		r.unmount();
	});

	it('siblings fire in source order; parent fires LAST', () => {
		const r = mount(SiblingParent);
		// Same-depth siblings keep source order (Array.sort is stable);
		// parent (shallowest depth) fires last.
		expect(siblingOrder).toEqual(['A', 'B', 'parent']);
		r.unmount();
	});

	it('cleanup on unmount stays child-first', () => {
		const r = mount(CleanupProbe);
		// unmountScope recurses into children before running scope.cleanups,
		// so child cleanup ("inner") runs before parent ("outer"). Pin this
		// so any future optimisation that flattens the unmount walk fails
		// loudly here instead of breaking ported React apps silently.
		r.unmount();
		expect(cleanupOrder).toEqual(['inner', 'outer']);
	});
});
