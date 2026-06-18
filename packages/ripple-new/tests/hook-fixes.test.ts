import { describe, it, expect } from 'vitest';
import { mount, flushEffects } from './_helpers';
import { flushSync } from '../src/index.js';
import {
	CleanupLifecycle,
	NoDeps,
	ReducerFnInitialArg,
	ReducerLazyInit,
	MemoObjectIs,
	MemoComparator,
	MemoContext,
	MemoContextDeep,
	StoreConsumer,
	DepsAsArgs,
} from './_fixtures/hook-fixes.tsrx';

// Regression tests for the hook-parity fixes triaged against ripple-new.

describe('#1 effect cleanup lifecycle', () => {
	it('fires the old cleanup exactly once on dep change, then once on unmount', () => {
		const log: string[] = [];
		const push = (s: string) => log.push(s);
		const r = mount(CleanupLifecycle, { n: 0, log: push });
		flushEffects();
		expect(log).toEqual(['setup:0']);

		// Dep change: old cleanup (n=0) fires before the new setup (n=1).
		r.update(CleanupLifecycle, { n: 1, log: push });
		flushEffects();
		expect(log).toEqual(['setup:0', 'cleanup:0', 'setup:1']);

		// Unmount: the CURRENT cleanup fires exactly once — no stale 'cleanup:0' replay.
		r.unmount();
		expect(log).toEqual(['setup:0', 'cleanup:0', 'setup:1', 'cleanup:1']);
	});
});

describe('#2 omitted deps', () => {
	it('useEffect(fn) / useMemo(fn) without a deps array run every commit (no throw)', () => {
		const log: string[] = [];
		const push = (s: string) => log.push(s);
		const r = mount(NoDeps, { log: push });
		flushEffects();
		// memo ran during the mount render; effect ran after commit.
		expect(log).toContain('memo');
		expect(log).toContain('effect:0');

		log.length = 0;
		r.click('#bump');
		flushEffects();
		// Both re-run because neither declared deps.
		expect(log).toContain('memo');
		expect(log).toContain('effect:1');
		r.unmount();
	});
});

describe('#3 useReducer init', () => {
	it('2-arg form stores a function initialArg verbatim (does not call it)', () => {
		let observed: unknown;
		const r = mount(ReducerFnInitialArg, { observe: (v: unknown) => (observed = v) });
		// The function was stored as state, not invoked.
		expect(typeof observed).toBe('function');
		expect((observed as () => string)()).toBe('fn-value');
		expect(r.find('div').textContent).toBe('function');
		r.unmount();
	});

	it('3-arg form lazily computes the initial state via init(initialArg)', () => {
		const r = mount(ReducerLazyInit, undefined);
		expect(r.find('#v').textContent).toBe('10');
		r.unmount();
	});
});

describe('#4 memo', () => {
	it('uses Object.is for shallow prop equality (NaN prop skips re-render)', () => {
		const log: string[] = [];
		const r = mount(MemoObjectIs, { log: (s: string) => log.push(s) });
		expect(log).toEqual(['render']);
		// Parent re-renders; child props are {value: NaN, log} — Object.is(NaN, NaN)
		// is true, so the memo skips. (=== would treat NaN as changed and re-render.)
		r.click('#rerender');
		expect(log).toEqual(['render']);
		r.unmount();
	});

	it('honors a custom arePropsEqual comparator', () => {
		const log: string[] = [];
		const r = mount(MemoComparator, { log: (s: string) => log.push(s) });
		expect(log).toEqual(['render:1']);
		// `noise` changes but the comparator only checks `id` → skip.
		r.click('#noise');
		expect(log).toEqual(['render:1']);
		// `id` changes → comparator returns false → re-render.
		r.click('#id');
		expect(log).toEqual(['render:1', 'render:2']);
		r.unmount();
	});

	it('re-renders a memo’d consumer when a context it reads changes (stable props)', () => {
		const log: string[] = [];
		const r = mount(MemoContext, { log: (s: string) => log.push(s) });
		expect(log).toEqual(['render:light']);
		// Provider value changes; ThemedChild's props are unchanged but it consumes
		// the context — a correct memo must NOT skip.
		r.click('#toggle');
		expect(log).toEqual(['render:light', 'render:dark']);
		r.unmount();
	});

	it('propagates a context change to a consumer nested behind a memo boundary', () => {
		const log: string[] = [];
		const r = mount(MemoContextDeep, { log: (s: string) => log.push(s) });
		expect(log).toEqual(['deep:light']);
		// MemoWrapper doesn't read the context itself, but its descendant does.
		// The memo must still re-render so the cascade reaches the consumer.
		r.click('#toggle');
		expect(log).toEqual(['deep:light', 'deep:dark']);
		r.unmount();
	});
});

describe('#5 useSyncExternalStore', () => {
	function makeStore(initial: string) {
		let value = initial;
		const listeners = new Set<() => void>();
		return {
			subscribe: (cb: () => void) => {
				listeners.add(cb);
				return () => listeners.delete(cb);
			},
			getSnapshot: () => value,
			set: (v: string) => {
				value = v;
				listeners.forEach((l) => l());
			},
			notify: () => listeners.forEach((l) => l()),
		};
	}

	it('reads the snapshot, re-renders on change, and dedups unchanged notifications', () => {
		const store = makeStore('a');
		const log: string[] = [];
		const r = mount(StoreConsumer, { store, log: (s: string) => log.push(s) });
		flushEffects(); // run the passive subscribe
		expect(log).toEqual(['render:a']);
		expect(r.find('.store').textContent).toBe('a');

		// Snapshot changes → re-render.
		flushSync(() => store.set('b'));
		flushEffects();
		expect(r.find('.store').textContent).toBe('b');
		expect(log).toContain('render:b');

		// Notify with an unchanged snapshot → Object.is dedup → NO re-render.
		const before = log.length;
		flushSync(() => store.notify());
		flushEffects();
		expect(log.length).toBe(before);
		r.unmount();
	});
});

describe('deps-as-args (Ripple superset, retained)', () => {
	it('spreads the deps array as positional arguments to effect/memo bodies', () => {
		const log: string[] = [];
		const r = mount(DepsAsArgs, { n: 5, label: 'hi', log: (s: string) => log.push(s) });
		flushEffects();
		// useMemo((x) => x * 2, [n]) → 10; useCallback((label) => label, [label]) → 'hi'.
		expect(r.find('.out').textContent).toBe('10:hi');
		// useEffect((n, log) => …, [n, log]) received the deps positionally.
		expect(log).toContain('eff:5');
		r.unmount();
	});
});
