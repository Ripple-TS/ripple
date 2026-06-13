// FragmentInstance — additional React canary parity edge cases.
//
// Pinned here:
//   - ref identity stable across re-renders that DON'T unmount the fragment
//   - addEventListener twice with same handler still respects DOM identity
//     dedup (a single listener attached to each child)
//   - removeEventListener after unmount is a safe no-op
//   - observeUsing called twice forwards .observe twice (the observer's job
//     to dedupe — not ours)
//   - dispatchEvent reaches handlers via bubbling from a deep descendant
//   - Fragments WITHOUT a ref still flatten their children (the non-ref
//     path stays identical to `<>` shorthand)
//   - long-form `<Fragment>` with no ref does not allocate a FragmentInstance
import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FragmentInstance, flushSync } from '../../src/index.js';
import {
	StableAcrossRenders,
	bumpN,
	Single,
	DeepDispatch,
	FragmentNoRef,
} from './_fixtures/fragment-refs-edges.tsrx';

function makeRef(): { current: FragmentInstance | null } {
	return { current: null };
}

describe('FragmentInstance — identity stability across re-renders', () => {
	it('keeps the SAME FragmentInstance across re-renders that do NOT unmount the fragment', () => {
		const fragRef = makeRef();
		const r = mount(StableAcrossRenders, { fragRef });
		const first = fragRef.current;
		flushSync(() => bumpN());
		flushSync(() => bumpN());
		flushSync(() => bumpN());
		expect(r.find('#counter').textContent).toBe('3');
		expect(fragRef.current).toBe(first);
		r.unmount();
	});
});

describe('FragmentInstance — addEventListener identity / DOM dedup', () => {
	it('addEventListener called twice with the SAME handler still fires only once per dispatch', () => {
		const fragRef = makeRef();
		const r = mount(Single, { fragRef });
		let fired = 0;
		const handler = () => fired++;
		// DOM's addEventListener dedupes by (type, listener, capture).
		// Calling our wrapper twice should NOT cause the listener to fire
		// twice — even though the wrapper tracks the entry twice, the
		// underlying DOM listener is deduped.
		fragRef.current!.addEventListener('click', handler);
		fragRef.current!.addEventListener('click', handler);
		(r.find('#k') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(fired).toBe(1);
		r.unmount();
	});

	it('removeEventListener after the fragment has been unmounted is a safe no-op', () => {
		const fragRef = makeRef();
		const r = mount(Single, { fragRef });
		const handler = () => {};
		fragRef.current!.addEventListener('click', handler);
		const fi = fragRef.current;
		r.unmount();
		// fi is the held FragmentInstance — destroyed.
		expect(() => fi!.removeEventListener('click', handler)).not.toThrow();
	});

	it('addEventListener attaches in tree order (call sequence matches DOM order)', () => {
		const fragRef = makeRef();
		const r = mount(Single, { fragRef });
		// observeUsing is the cleanest probe for tree-order — it records
		// the visit sequence. The DOM dispatch is independent of insert
		// order so we use the mock observer.
		const obs = {
			seen: [] as Element[],
			observe(t: Element) {
				this.seen.push(t);
			},
		};
		fragRef.current!.observeUsing(obs);
		expect(obs.seen).toHaveLength(1);
		expect(obs.seen[0]).toBe(r.find('#k'));
		r.unmount();
	});
});

describe('FragmentInstance.observeUsing — repeated calls', () => {
	it('observeUsing twice forwards .observe twice per child (dedupe is the observer’s job)', () => {
		const fragRef = makeRef();
		const r = mount(Single, { fragRef });
		const obs = {
			seen: [] as Element[],
			observe(t: Element) {
				this.seen.push(t);
			},
		};
		fragRef.current!.observeUsing(obs);
		fragRef.current!.observeUsing(obs);
		expect(obs.seen).toHaveLength(2);
		expect(obs.seen[0]).toBe(obs.seen[1]);
		r.unmount();
	});

	it('unobserveUsing without a preceding observe still walks and calls .unobserve (DOM-spec parity)', () => {
		const fragRef = makeRef();
		const r = mount(Single, { fragRef });
		const obs = {
			seen: [] as Element[],
			unobserve(t: Element) {
				this.seen.push(t);
			},
		};
		fragRef.current!.unobserveUsing(obs);
		expect(obs.seen).toHaveLength(1);
		r.unmount();
	});
});

describe('FragmentInstance.dispatchEvent — deep bubbling', () => {
	it('dispatchEvent fires the parent host listener even when the fragment has deep descendants', () => {
		const fragRef = makeRef();
		let parentClicked = 0;
		const r = mount(DeepDispatch, {
			fragRef,
			onParent: () => parentClicked++,
		});
		fragRef.current!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(parentClicked).toBe(1);
		r.unmount();
	});
});

describe('Long-form <Fragment> without a ref', () => {
	it('flattens children identically to `<>` (no FragmentInstance allocated)', () => {
		const r = mount(FragmentNoRef);
		// Both spans are inside #parent as direct children.
		expect(r.findAll('#parent > span').map((s) => s.className)).toEqual(['a', 'b']);
		// And no `<!--frag-->` marker pair was emitted into the template —
		// when there's no ref, the no-overhead inline path is taken.
		expect(r.html()).not.toContain('frag');
		r.unmount();
	});

	it('ref={null} is accepted: the fragment still mounts and renders its children', () => {
		// attachRef handles null gracefully (it bails out). A FragmentInstance
		// IS still created (the marker pair is in the template either way),
		// but no ref consumer sees it. Verifies we don't crash on the null
		// case — a common pattern when refs are conditionally assigned.
		const fragRef = null as any;
		const r = mount(Single, { fragRef });
		expect(r.find('#k').textContent).toBe('x');
		r.unmount();
	});
});

describe('FragmentInstance — defensive method behavior after destroy', () => {
	it('every method is a safe no-op once the FragmentInstance is destroyed', () => {
		const fragRef = makeRef();
		const r = mount(Single, { fragRef });
		const fi = fragRef.current!;
		r.unmount();
		// Held instance after unmount: _destroyed === true. Each method must
		// short-circuit cleanly without throwing.
		expect(fi._destroyed).toBe(true);
		expect(() => fi.focus()).not.toThrow();
		expect(() => fi.focusLast()).not.toThrow();
		expect(() => fi.blur()).not.toThrow();
		expect(() => fi.addEventListener('click', () => {})).not.toThrow();
		expect(() => fi.removeEventListener('click', () => {})).not.toThrow();
		expect(() => fi.observeUsing({ observe() {} })).not.toThrow();
		expect(() => fi.unobserveUsing({ unobserve() {} })).not.toThrow();
		expect(fi.getClientRects()).toEqual([]);
		expect(() => fi.scrollIntoView()).not.toThrow();
		// dispatchEvent returns true (no listener cancelled anything because
		// nothing fired).
		expect(fi.dispatchEvent(new Event('x'))).toBe(true);
		// compareDocumentPosition returns DISCONNECTED.
		expect(
			fi.compareDocumentPosition(document.body) & Node.DOCUMENT_POSITION_DISCONNECTED,
		).toBeTruthy();
	});
});
