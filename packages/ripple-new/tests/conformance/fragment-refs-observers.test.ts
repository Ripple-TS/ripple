// FragmentInstance.observeUsing / unobserveUsing / getClientRects /
// getRootNode — React canary parity.
//
// observeUsing / unobserveUsing forward the observer call to every direct
// fragment child. getClientRects concatenates each child's rects in tree
// order. getRootNode delegates to the first child (falling back to the
// start marker's document when the fragment has no children) so tooltip
// libraries can resolve the right ownerDocument / ShadowRoot.
import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FragmentInstance } from '../../src/index.js';
import { ThreeSiblings } from './_fixtures/fragment-refs-observers.tsrx';

function makeRef(): { current: FragmentInstance | null } {
	return { current: null };
}

// Mock observer that records observe/unobserve targets. Stand-in for
// IntersectionObserver / ResizeObserver — happy-dom's implementations
// don't fire real callbacks but our contract only requires that the
// .observe()/.unobserve() call routing is correct.
function makeMockObserver() {
	const observed: Element[] = [];
	const unobserved: Element[] = [];
	return {
		observed,
		unobserved,
		observe(t: Element) {
			observed.push(t);
		},
		unobserve(t: Element) {
			unobserved.push(t);
		},
	};
}

describe('FragmentInstance.observeUsing / unobserveUsing', () => {
	it('observeUsing forwards .observe to every direct fragment child', () => {
		const fragRef = makeRef();
		const r = mount(ThreeSiblings, { fragRef });
		const obs = makeMockObserver();
		fragRef.current!.observeUsing(obs);
		expect(obs.observed.map((e) => e.id)).toEqual(['x', 'y', 'z']);
		r.unmount();
	});

	it('unobserveUsing forwards .unobserve to every direct fragment child', () => {
		const fragRef = makeRef();
		const r = mount(ThreeSiblings, { fragRef });
		const obs = makeMockObserver();
		fragRef.current!.observeUsing(obs);
		fragRef.current!.unobserveUsing(obs);
		expect(obs.unobserved.map((e) => e.id)).toEqual(['x', 'y', 'z']);
		r.unmount();
	});
});

describe('FragmentInstance.getClientRects', () => {
	it('returns the concatenated rects of every direct fragment child in tree order', () => {
		const fragRef = makeRef();
		const r = mount(ThreeSiblings, { fragRef });
		// happy-dom returns an empty DOMRectList for un-layouted elements,
		// so to assert ON the concatenation contract we stub each child's
		// getClientRects to return a unique sentinel rect — then verify the
		// wrapper concatenates them in tree order.
		const ids = ['x', 'y', 'z'];
		for (let i = 0; i < ids.length; i++) {
			const el = r.find('#' + ids[i]);
			const sentinel = { __id: ids[i], width: i, height: i } as unknown as DOMRect;
			// Override on the instance — original DOMRectList remains on the
			// prototype, untouched.
			(el as any).getClientRects = () => [sentinel];
		}
		const rects = fragRef.current!.getClientRects();
		expect(rects.map((r) => (r as any).__id)).toEqual(['x', 'y', 'z']);
		r.unmount();
	});
});

describe('FragmentInstance.getRootNode', () => {
	it('returns the document when the fragment is rendered into the main tree', () => {
		const fragRef = makeRef();
		const r = mount(ThreeSiblings, { fragRef });
		expect(fragRef.current!.getRootNode()).toBe(document);
		r.unmount();
	});
});
