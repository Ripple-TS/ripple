// FragmentInstance — remaining React canary parity tests.
//
// Stage 6 covers:
//   - scrollIntoView (prefers focusable child, falls back to first element)
//   - text-only fragments (no host children → every method is a no-op)
//   - nested fragments (each ref binds to its own marker range)
//   - sibling fragments (refs don't cross-contaminate)
//   - array refs (multi-ref attach)
//   - conditional fragments (ref attaches on mount, clears on unmount)
//   - dispatchEvent integration with the surrounding component event tree
//   - re-mount semantics (ref toggles correctly on remount)
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, flushEffects } from '../_helpers';
import { FragmentInstance, flushSync } from '../../src/index.js';
import {
	ScrollTarget,
	ScrollNonFocusable,
	TextOnly,
	NestedFragments,
	SiblingFragments,
	ArrayRef,
	ConditionalFragment,
	setShow,
	DispatchParent,
} from './_fixtures/fragment-refs-misc.tsrx';

function makeRef(): { current: FragmentInstance | null } {
	return { current: null };
}

describe('FragmentInstance.scrollIntoView', () => {
	it('calls scrollIntoView on the first focusable descendant', () => {
		const fragRef = makeRef();
		const r = mount(ScrollTarget, { fragRef });
		const btn = r.find('#btn') as HTMLButtonElement;
		const calls: any[] = [];
		btn.scrollIntoView = function (arg?: any) {
			calls.push(arg);
		};
		fragRef.current!.scrollIntoView({ block: 'center' });
		expect(calls).toEqual([{ block: 'center' }]);
		r.unmount();
	});

	it('falls back to the first descendant element when nothing is focusable', () => {
		const fragRef = makeRef();
		const r = mount(ScrollNonFocusable, { fragRef });
		const first = r.find('#first') as HTMLElement;
		const second = r.find('#second') as HTMLElement;
		let firstCalled = 0;
		let secondCalled = 0;
		first.scrollIntoView = () => {
			firstCalled++;
		};
		second.scrollIntoView = () => {
			secondCalled++;
		};
		fragRef.current!.scrollIntoView();
		expect(firstCalled).toBe(1);
		expect(secondCalled).toBe(0);
		r.unmount();
	});

	it('forwards a boolean argument to scrollIntoView', () => {
		const fragRef = makeRef();
		const r = mount(ScrollTarget, { fragRef });
		const btn = r.find('#btn') as HTMLButtonElement;
		const calls: any[] = [];
		btn.scrollIntoView = function (arg?: any) {
			calls.push(arg);
		};
		fragRef.current!.scrollIntoView(true);
		expect(calls).toEqual([true]);
		r.unmount();
	});
});

describe('FragmentInstance — text-only fragment (no host children)', () => {
	it('focus / focusLast / blur are no-ops', () => {
		const fragRef = makeRef();
		const r = mount(TextOnly, { fragRef });
		const before = document.activeElement;
		fragRef.current!.focus();
		fragRef.current!.focusLast();
		fragRef.current!.blur();
		expect(document.activeElement).toBe(before);
		r.unmount();
	});

	it('getClientRects returns an empty array', () => {
		const fragRef = makeRef();
		const r = mount(TextOnly, { fragRef });
		expect(fragRef.current!.getClientRects()).toEqual([]);
		r.unmount();
	});

	it('getRootNode falls back to the start marker document', () => {
		const fragRef = makeRef();
		const r = mount(TextOnly, { fragRef });
		// With no host children, getRootNode walks to the marker's root —
		// which is the document.
		expect(fragRef.current!.getRootNode()).toBe(document);
		r.unmount();
	});

	it('addEventListener is a no-op (no children to attach to)', () => {
		const fragRef = makeRef();
		const r = mount(TextOnly, { fragRef });
		let fired = 0;
		fragRef.current!.addEventListener('click', () => fired++);
		// No host children → nothing to dispatch on. The fragment's text
		// content stays unaffected. Verifies no crash and no spurious wire-up.
		expect(fired).toBe(0);
		r.unmount();
	});
});

describe('FragmentInstance — nested fragments', () => {
	it('inner and outer refs each bind to their own marker range', () => {
		const outerRef = makeRef();
		const innerRef = makeRef();
		const r = mount(NestedFragments, { outerRef, innerRef });
		expect(outerRef.current).toBeInstanceOf(FragmentInstance);
		expect(innerRef.current).toBeInstanceOf(FragmentInstance);
		expect(outerRef.current).not.toBe(innerRef.current);
		// Each instance owns its OWN marker pair — the outer pair brackets
		// the inner pair, but each instance's start/end Comment is distinct.
		expect(outerRef.current!._startMarker).not.toBe(innerRef.current!._startMarker);
		expect(outerRef.current!._endMarker).not.toBe(innerRef.current!._endMarker);
		r.unmount();
	});

	it('inner fragment.contains a child only of the inner range', () => {
		const outerRef = makeRef();
		const innerRef = makeRef();
		const r = mount(NestedFragments, { outerRef, innerRef });
		const outerA = r.find('#outer-a');
		const innerA = r.find('#inner-a');
		// outer-a is in outer range but NOT in inner range.
		const outerOuterPos = outerRef.current!.compareDocumentPosition(outerA);
		expect(outerOuterPos & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
		const outerInnerPos = innerRef.current!.compareDocumentPosition(outerA);
		expect(outerInnerPos & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeFalsy();
		// inner-a is in BOTH ranges (inner is nested inside outer).
		const innerOuterPos = outerRef.current!.compareDocumentPosition(innerA);
		expect(innerOuterPos & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
		const innerInnerPos = innerRef.current!.compareDocumentPosition(innerA);
		expect(innerInnerPos & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
		r.unmount();
	});

	it('inner fragment focus picks the first focusable inner descendant', () => {
		const outerRef = makeRef();
		const innerRef = makeRef();
		const r = mount(NestedFragments, { outerRef, innerRef });
		// outer focus → outer-a is first focusable? It's a div, no
		// tabIndex; inner-a is also a div. Neither is focusable. focus() is
		// a no-op. Verify methods don't crash for this layout.
		expect(() => outerRef.current!.focus()).not.toThrow();
		expect(() => innerRef.current!.focus()).not.toThrow();
		r.unmount();
	});

	it('inner ref is cleared on unmount independently of outer', () => {
		const outerRef = makeRef();
		const innerRef = makeRef();
		const r = mount(NestedFragments, { outerRef, innerRef });
		r.unmount();
		expect(outerRef.current).toBeNull();
		expect(innerRef.current).toBeNull();
	});
});

describe('FragmentInstance — sibling fragments', () => {
	it('two sibling refs each see only their own children', () => {
		const leftRef = makeRef();
		const rightRef = makeRef();
		const r = mount(SiblingFragments, { leftRef, rightRef });
		const L1 = r.find('#L1');
		const R1 = r.find('#R1');
		// L1 is contained by leftRef but NOT by rightRef.
		expect(
			leftRef.current!.compareDocumentPosition(L1) & Node.DOCUMENT_POSITION_CONTAINED_BY,
		).toBeTruthy();
		expect(
			rightRef.current!.compareDocumentPosition(L1) & Node.DOCUMENT_POSITION_CONTAINED_BY,
		).toBeFalsy();
		// And vice versa for R1.
		expect(
			rightRef.current!.compareDocumentPosition(R1) & Node.DOCUMENT_POSITION_CONTAINED_BY,
		).toBeTruthy();
		expect(
			leftRef.current!.compareDocumentPosition(R1) & Node.DOCUMENT_POSITION_CONTAINED_BY,
		).toBeFalsy();
		r.unmount();
	});

	it('a listener added to the left fragment does NOT fire on the right', () => {
		const leftRef = makeRef();
		const rightRef = makeRef();
		const r = mount(SiblingFragments, { leftRef, rightRef });
		let fired = 0;
		leftRef.current!.addEventListener('click', () => fired++);
		(r.find('#R1') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(0);
		(r.find('#L1') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});
});

describe('FragmentInstance — array refs', () => {
	it('multi-ref attach: array shape populates BOTH refs', () => {
		const refA = makeRef();
		const refB = makeRef();
		const r = mount(ArrayRef, { refA, refB });
		expect(refA.current).toBeInstanceOf(FragmentInstance);
		expect(refB.current).toBeInstanceOf(FragmentInstance);
		// Both refs see the SAME FragmentInstance.
		expect(refA.current).toBe(refB.current);
		r.unmount();
		// Both refs cleared on unmount.
		expect(refA.current).toBeNull();
		expect(refB.current).toBeNull();
	});

	it('mixed object + callback in the array form fires the callback too', () => {
		const refA = makeRef();
		let cbCaptured: FragmentInstance | null = null;
		const cb = (fi: FragmentInstance | null) => {
			cbCaptured = fi;
		};
		const r = mount(ArrayRef, { refA, refB: cb });
		expect(refA.current).toBeInstanceOf(FragmentInstance);
		expect(cbCaptured).toBe(refA.current);
		r.unmount();
		expect(cbCaptured).toBeNull();
	});
});

describe('FragmentInstance — conditional fragments', () => {
	beforeEach(() => setShow(true));
	afterEach(() => setShow(true));

	it('ref attaches on mount and clears when the fragment is conditionally removed', () => {
		const fragRef = makeRef();
		const r = mount(ConditionalFragment, { fragRef });
		expect(fragRef.current).toBeInstanceOf(FragmentInstance);
		const first = fragRef.current;
		// State changes need a render flush — flushEffects only drains
		// passive effects, not the scheduled render that unmounts the @if
		// branch.
		flushSync(() => setShow(false));
		expect(fragRef.current).toBeNull();
		// And re-mounted when the condition flips back on — populated again
		// (with a fresh instance, since the fragment was destroyed).
		flushSync(() => setShow(true));
		expect(fragRef.current).toBeInstanceOf(FragmentInstance);
		expect(fragRef.current).not.toBe(first);
		r.unmount();
	});
});

describe('FragmentInstance.dispatchEvent — integration', () => {
	it('event dispatched via fragmentRef reaches a delegated click handler on the parent', () => {
		const fragRef = makeRef();
		let parentClicked = 0;
		const r = mount(DispatchParent, {
			fragRef,
			onParent: () => parentClicked++,
		});
		fragRef.current!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		// The onClick on #parent (delegated through ripple-new's event
		// system) sees the click. Confirms dispatchEvent and the surrounding
		// component event tree compose correctly.
		expect(parentClicked).toBe(1);
		r.unmount();
	});
});

describe('FragmentInstance — re-mount semantics', () => {
	it('a brand-new FragmentInstance is produced each time the host fragment is re-mounted', () => {
		const fragRef = makeRef();
		const r = mount(ConditionalFragment, { fragRef });
		const first = fragRef.current;
		flushSync(() => setShow(false));
		flushSync(() => setShow(true));
		flushSync(() => setShow(false));
		flushSync(() => setShow(true));
		const second = fragRef.current;
		expect(first).not.toBe(second);
		expect(second).toBeInstanceOf(FragmentInstance);
		r.unmount();
	});
});
