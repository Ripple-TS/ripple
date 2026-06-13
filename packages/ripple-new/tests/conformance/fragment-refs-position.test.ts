// FragmentInstance.compareDocumentPosition / dispatchEvent — React canary parity.
//
// compareDocumentPosition uses the platform's bitmask, with CONTAINED_BY
// indicating that the supplied node lives between the fragment's markers
// (and DISCONNECTED indicating the node isn't in the same tree).
//
// dispatchEvent dispatches on the parent host node (the fragment itself
// has no DOM, so the parent is the closest meaningful target) and returns
// the dispatch result.
import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FragmentInstance } from '../../src/index.js';
import {
	SurroundedFragment,
	ParentWithFragmentChild,
} from './_fixtures/fragment-refs-position.tsrx';

function makeRef(): { current: FragmentInstance | null } {
	return { current: null };
}

describe('FragmentInstance.compareDocumentPosition', () => {
	it('returns PRECEDING for a sibling rendered BEFORE the fragment', () => {
		const fragRef = makeRef();
		const r = mount(SurroundedFragment, { fragRef });
		const before = r.find('#before');
		const flags = fragRef.current!.compareDocumentPosition(before);
		expect(flags & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
		expect(flags & Node.DOCUMENT_POSITION_FOLLOWING).toBeFalsy();
		expect(flags & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeFalsy();
		r.unmount();
	});

	it('returns FOLLOWING for a sibling rendered AFTER the fragment', () => {
		const fragRef = makeRef();
		const r = mount(SurroundedFragment, { fragRef });
		const after = r.find('#after');
		const flags = fragRef.current!.compareDocumentPosition(after);
		expect(flags & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(flags & Node.DOCUMENT_POSITION_PRECEDING).toBeFalsy();
		expect(flags & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeFalsy();
		r.unmount();
	});

	it('returns CONTAINED_BY | FOLLOWING for a child inside the fragment', () => {
		const fragRef = makeRef();
		const r = mount(SurroundedFragment, { fragRef });
		const inside = r.find('#inside');
		const flags = fragRef.current!.compareDocumentPosition(inside);
		expect(flags & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy();
		expect(flags & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		// Not PRECEDING — the inside child comes AFTER the start marker.
		expect(flags & Node.DOCUMENT_POSITION_PRECEDING).toBeFalsy();
		r.unmount();
	});

	it('returns DISCONNECTED for a node in a different tree', () => {
		const fragRef = makeRef();
		const r = mount(SurroundedFragment, { fragRef });
		const detached = document.createElement('div');
		const flags = fragRef.current!.compareDocumentPosition(detached);
		expect(flags & Node.DOCUMENT_POSITION_DISCONNECTED).toBeTruthy();
		r.unmount();
	});
});

describe('FragmentInstance.dispatchEvent', () => {
	it('dispatches on the parent host element and bubbles to its listeners', () => {
		const fragRef = makeRef();
		const r = mount(ParentWithFragmentChild, { fragRef });
		const parent = r.find('#parent') as HTMLElement;
		let fired = 0;
		const handler = (e: Event) => {
			fired++;
			expect(e.type).toBe('customping');
		};
		parent.addEventListener('customping', handler);
		const result = fragRef.current!.dispatchEvent(new Event('customping'));
		expect(fired).toBe(1);
		expect(result).toBe(true);
		parent.removeEventListener('customping', handler);
		r.unmount();
	});

	it('returns false when a listener calls preventDefault on a cancellable event', () => {
		const fragRef = makeRef();
		const r = mount(ParentWithFragmentChild, { fragRef });
		const parent = r.find('#parent') as HTMLElement;
		const handler = (e: Event) => e.preventDefault();
		parent.addEventListener('customping', handler);
		const result = fragRef.current!.dispatchEvent(new Event('customping', { cancelable: true }));
		expect(result).toBe(false);
		parent.removeEventListener('customping', handler);
		r.unmount();
	});
});
