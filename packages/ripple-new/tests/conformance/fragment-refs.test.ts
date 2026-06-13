// React canary `enableFragmentRefs` parity tests for ripple-new.
//
// Stage 1 — basic attach contract: `<Fragment ref={r}>` populates the ref
// with a FragmentInstance bound to its owning Block (sentinel field
// `_ownerBlock`, our name for React's `_fragmentFiber`). Object, callback,
// and effect-visibility shapes are covered. Subsequent stages layer on
// imperative methods (focus, listeners, observers, etc.).
import { describe, it, expect } from 'vitest';
import { mount, flushEffects } from '../_helpers';
import { FragmentInstance } from '../../src/index.js';
import {
	FragmentObjectRef,
	FragmentCallbackRef,
	FragmentEffectVisibility,
} from './_fixtures/fragment-refs.tsrx';

describe('Fragment refs — basic attach (React enableFragmentRefs parity)', () => {
	it('attaches a FragmentInstance to an object ref', () => {
		const fragRef: { current: FragmentInstance | null } = { current: null };
		const r = mount(FragmentObjectRef, { fragRef });
		expect(fragRef.current).not.toBeNull();
		expect(fragRef.current).toBeInstanceOf(FragmentInstance);
		// `_ownerBlock` is the ripple-new analogue of React's `_fragmentFiber`
		// sanity check — proves the instance is bound to its owning Block.
		expect((fragRef.current as FragmentInstance)._ownerBlock).toBeTruthy();
		// The fragment is logically nested inside #parent — the parent div
		// still renders normally and contains the fragment's child.
		expect(r.find('#parent #child').textContent).toBe('hi');
		r.unmount();
		// Object refs are nulled on unmount.
		expect(fragRef.current).toBeNull();
	});

	it('accepts a callback ref and fires it with the FragmentInstance', () => {
		let captured: FragmentInstance | null | undefined;
		const log: Array<FragmentInstance | null> = [];
		const cb = (fi: FragmentInstance | null) => {
			captured = fi;
			log.push(fi);
		};
		const r = mount(FragmentCallbackRef, { cb });
		expect(captured).not.toBeNull();
		expect(captured).toBeInstanceOf(FragmentInstance);
		expect((captured as FragmentInstance)._ownerBlock).toBeTruthy();
		r.unmount();
		// Callback refs fire once with the instance on mount and once with
		// null on unmount, matching React's contract.
		expect(log[0]).toBeInstanceOf(FragmentInstance);
		expect(log[log.length - 1]).toBeNull();
	});

	it('is populated by the time useLayoutEffect AND useEffect run', () => {
		const fragRef: { current: FragmentInstance | null } = { current: null };
		let layoutSeen: FragmentInstance | null | undefined;
		let passiveSeen: FragmentInstance | null | undefined;
		const r = mount(FragmentEffectVisibility, {
			fragRef,
			onLayout: (v: FragmentInstance | null) => {
				layoutSeen = v;
			},
			onPassive: (v: FragmentInstance | null) => {
				passiveSeen = v;
			},
		});
		// useLayoutEffect is sync at commit, so layoutSeen is already populated.
		expect(layoutSeen).toBeInstanceOf(FragmentInstance);
		// useEffect (passive) runs after the macrotask boundary; flush it
		// synchronously through the test helper.
		flushEffects();
		expect(passiveSeen).toBeInstanceOf(FragmentInstance);
		// Both effects see the SAME instance — mounted once.
		expect(layoutSeen).toBe(passiveSeen);
		expect(layoutSeen).toBe(fragRef.current);
		r.unmount();
	});
});
