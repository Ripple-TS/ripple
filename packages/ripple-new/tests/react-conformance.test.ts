/**
 * React core conformance — these tests are direct ports of behaviors from
 * facebook/react's ReactHooksWithNoopRenderer-test.js. Each test cites the
 * source `it(...)` title and approximate line so future drift can be tracked.
 *
 * The goal: validate that hook semantics (effect ordering, dep comparison,
 * setter identity, layout-vs-passive timing) match React's contract so users
 * can treat ripple-new as a drop-in alternative.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount, act } from './_helpers';
import {
	SetterIdentity,
	EffectDepsObjectIs,
	AllDestroysBeforeCreates,
	SiblingCleanupOrder,
	LayoutVsPassive,
} from './_fixtures/react-conformance.tsrx';

// ---------------------------------------------------------------------------
// 1. setter identity stable
// ---------------------------------------------------------------------------
describe('React conformance — setter identity', () => {
	it('returns the same updater function every time', () => {
		// Per ReactHooksWithNoopRenderer-test.js:311 — useState's setter is a
		// stable reference so consumers can safely include it in dep arrays.
		const observe = vi.fn();
		const r = mount(SetterIdentity, { observe });
		const first = observe.mock.calls[0][0];
		r.click('#bump');
		r.click('#bump');
		for (const call of observe.mock.calls) expect(call[0]).toBe(first);
		expect(observe.mock.calls.length).toBeGreaterThan(1);
		r.unmount();
	});
});

// ---------------------------------------------------------------------------
// 2. useEffect deps Object.is comparison
// ---------------------------------------------------------------------------
describe('React conformance — useEffect deps', () => {
	it('skips effect when deps unchanged; fires destroy(prev)+create(next) when changed', async () => {
		// Per ReactHooksWithNoopRenderer-test.js:1800.
		const log: string[] = [];
		const r = mount(EffectDepsObjectIs, { log, label: 'Count', count: 0 });
		await act(() => {});
		expect(log).toEqual(['create Count0']);

		// Change `count` → destroy prev, create next.
		log.length = 0;
		await act(() => r.update(EffectDepsObjectIs, { log, label: 'Count', count: 1 }));
		expect(log).toEqual(['destroy Count0', 'create Count1']);

		// Same deps → nothing fires.
		log.length = 0;
		await act(() => r.update(EffectDepsObjectIs, { log, label: 'Count', count: 1 }));
		expect(log).toEqual([]);

		// Change `label` (different dep position) → destroy + create.
		log.length = 0;
		await act(() => r.update(EffectDepsObjectIs, { log, label: 'Total', count: 1 }));
		expect(log).toEqual(['destroy Count1', 'create Total1']);
		r.unmount();
	});
});

// ---------------------------------------------------------------------------
// 3. All destroys before all creates (within one component)
// ---------------------------------------------------------------------------
describe('React conformance — effect ordering within a component', () => {
	it('unmounts all previous effects before creating any new ones', async () => {
		// Per ReactHooksWithNoopRenderer-test.js:1885 — order must be ALL destroys
		// first, THEN all creates. Not interleaved per-hook.
		const log: string[] = [];
		const r = mount(AllDestroysBeforeCreates, { log, count: 0 });
		await act(() => {});
		expect(log).toEqual(['Mount A 0', 'Mount B 0']);

		log.length = 0;
		await act(() => r.update(AllDestroysBeforeCreates, { log, count: 1 }));
		// Strict order: BOTH unmounts before EITHER mount.
		expect(log).toEqual(['Unmount A 0', 'Unmount B 0', 'Mount A 1', 'Mount B 1']);
		r.unmount();
	});
});

// ---------------------------------------------------------------------------
// 4. Sibling cleanup ordering
// ---------------------------------------------------------------------------
describe('React conformance — effect ordering across siblings', () => {
	it('all sibling destroys run before any sibling creates in a commit', async () => {
		// Per ReactHooksWithNoopRenderer-test.js:1926 — the destroy-then-create
		// invariant is GLOBAL across the commit, not per-component.
		const log: string[] = [];
		const r = mount(SiblingCleanupOrder, { log, count: 0 });
		await act(() => {});
		expect(log).toEqual(['Mount A0', 'Mount B0']);

		log.length = 0;
		await act(() => r.update(SiblingCleanupOrder, { log, count: 1 }));
		// The two siblings' destroys both fire before either's create.
		expect(log).toEqual(['Unmount A0', 'Unmount B0', 'Mount A1', 'Mount B1']);
		r.unmount();
	});
});

// ---------------------------------------------------------------------------
// 5. useLayoutEffect runs before useEffect; both observe committed DOM
// ---------------------------------------------------------------------------
describe('React conformance — layout vs passive timing', () => {
	it('layout effect runs sync after DOM mutation; passive effect runs after layout', async () => {
		// Per ReactHooksWithNoopRenderer-test.js:3092 + 3124.
		const log: string[] = [];
		const r = mount(LayoutVsPassive, { log, count: 0 });
		// After mount: layout already fired (committed sync); passive has not.
		expect(log).toEqual(['layout 0 (0)']);

		// Drain passive — fires AFTER layout, observing same committed DOM.
		await act(() => {});
		expect(log).toEqual(['layout 0 (0)', 'passive 0 (0)']);

		// Update: prior commit's passive already fired; new commit cleans up
		// layout first, then runs new layout (sync), then queues passive.
		log.length = 0;
		r.update(LayoutVsPassive, { log, count: 1 });
		// Synchronously after update: layout cleanup + new layout fired, but
		// passive has not yet drained.
		expect(log).toEqual(['cleanup layout 0', 'layout 1 (1)']);

		await act(() => {});
		expect(log).toEqual(['cleanup layout 0', 'layout 1 (1)', 'cleanup passive 0', 'passive 1 (1)']);
		r.unmount();
	});
});
