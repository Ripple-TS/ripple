import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { CleanupRef, LegacyRef } from './_fixtures/ref-cleanup.tsrx';

describe('callback ref cleanup-return (React 19)', () => {
	it('runs the returned cleanup with the captured node on detach (not ref(null))', () => {
		const attaches: any[] = [];
		const cleanups: any[] = [];
		const r = mount(CleanupRef, {
			onAttach: (el: any) => attaches.push(el),
			onCleanup: (el: any) => cleanups.push(el),
		});

		// Attached on mount; cleanup hasn't run.
		expect(attaches).toHaveLength(1);
		expect(attaches[0]).toBeInstanceOf(HTMLElement);
		expect(cleanups).toHaveLength(0);
		const node = attaches[0];

		// Hide the span → @if detaches the ref → the returned cleanup runs with
		// the node it captured. Critically NOT called with null.
		r.click('#toggle');
		expect(r.findAll('#target')).toHaveLength(0);
		expect(cleanups).toEqual([node]);
		expect(cleanups).not.toContain(null);
		expect(attaches).toHaveLength(1); // no spurious re-attach

		// Show again → fresh attach + fresh cleanup registered (new node).
		r.click('#toggle');
		expect(attaches).toHaveLength(2);
		expect(cleanups).toHaveLength(1); // re-attach must not fire a cleanup

		// Unmount → the latest cleanup runs with the latest node.
		r.unmount();
		expect(cleanups).toHaveLength(2);
		expect(cleanups[1]).toBe(attaches[1]);
	});

	it('legacy callback refs (no cleanup return) still receive null on detach', () => {
		const calls: any[] = [];
		const r = mount(LegacyRef, { observe: (el: any) => calls.push(el) });
		expect(calls).toHaveLength(1);
		expect(calls[0]).toBeInstanceOf(HTMLElement);

		r.click('#toggle');
		expect(r.findAll('#target')).toHaveLength(0);
		expect(calls).toContain(null); // legacy detach contract preserved
		r.unmount();
	});
});
