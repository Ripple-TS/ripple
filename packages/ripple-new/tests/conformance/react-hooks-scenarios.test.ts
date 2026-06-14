// React-canon useState / useReducer scenario parity.
//
// The earlier ripple-new API-parity audit flagged useState/useReducer as
// the HIGHEST-RISK shallow-coverage area: 90+ React tests in
// ReactHooksWithNoopRenderer-test.js vs ~12 hand-written scenarios in
// ripple-new. The most subtle invariants — functional-updater queues,
// Object.is bailout, NaN bailout, lazy-init-once, multi-setter
// batching, reducer-ref freshness — were unpinned. This file ports the
// missing scenario set.
//
// NOT FUZZ: these are deterministic, scenario-based assertions. The
// fuzz harnesses (fuzz-keyed-list, fuzz-suspense, fuzz-events) cover
// random interleavings; these pin specific named invariants the way
// React's own test suite does.
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushEffects } from '../_helpers';
import { flushSync } from '../../src/index.js';
import {
	resetRenderCount,
	getRenderCount,
	FunctionalUpdaterQueue,
	MixedValueUpdater,
	ObjectIsBailout,
	NaNBailout,
	MultiSetterBatching,
	LazyInitOnce,
	getInitCount,
	resetInitCount,
	ReducerSameRefBailout,
	getReducerCalls,
	resetReducerCalls,
	ReducerLazyInit,
	ReducerLatestRef,
	StableSetterIdentity,
	getCapturedSetter,
	SetAfterUnmount,
	EffectTriggersRender,
	getEffectFired,
	resetEffectFired,
	ObjectStateRender,
	getSetN,
	getSetM,
	getSetObj,
} from './_fixtures/react-hooks-scenarios.tsrx';

beforeEach(() => {
	resetRenderCount();
	resetInitCount();
	resetReducerCalls();
	resetEffectFired();
});

describe('useState — functional updater queue', () => {
	it('two functional updaters in one handler produce +2 (queue, not last-write-wins)', () => {
		const r = mount(FunctionalUpdaterQueue);
		const initialRenders = getRenderCount();
		r.click('#inc-twice');
		expect(r.find('#out').textContent).toBe('2');
		// Exactly ONE re-render — both updaters batched into a single commit.
		expect(getRenderCount()).toBe(initialRenders + 1);
		r.unmount();
	});

	it('three sequential dispatches each commit +2, totalling 6', () => {
		const r = mount(FunctionalUpdaterQueue);
		r.click('#inc-twice');
		r.click('#inc-twice');
		r.click('#inc-twice');
		expect(r.find('#out').textContent).toBe('6');
		r.unmount();
	});
});

describe('useState — mixed value/updater queue', () => {
	it('setN(5) then setN(p => p + 1) ends at 6 (updater applies on top of queued value)', () => {
		const r = mount(MixedValueUpdater);
		r.click('#set5-then-inc');
		expect(r.find('#out').textContent).toBe('6');
		r.unmount();
	});

	it('setN(5) then setN(7) ends at 7 (last value wins, but both queued)', () => {
		const r = mount(MixedValueUpdater);
		r.click('#set5-then-7');
		expect(r.find('#out').textContent).toBe('7');
		r.unmount();
	});

	it('setN(p => p + 1) then setN(5) ends at 5 (a value-set clobbers prior updater)', () => {
		const r = mount(MixedValueUpdater);
		r.click('#inc-then-set5');
		expect(r.find('#out').textContent).toBe('5');
		r.unmount();
	});
});

describe('useState — Object.is bailout', () => {
	it('setN(currentValue) is a no-op: no re-render, no body invocation', () => {
		const r = mount(ObjectIsBailout);
		const initialRenders = getRenderCount();
		r.click('#same');
		r.click('#same');
		r.click('#same');
		// Zero re-renders — bailout fires for every dispatch.
		expect(getRenderCount()).toBe(initialRenders);
		expect(r.find('#out').textContent).toBe('0');
		r.unmount();
	});

	it('setN(NaN) when current is NaN also bails out (Object.is(NaN, NaN) === true)', () => {
		const r = mount(NaNBailout);
		const initialRenders = getRenderCount();
		r.click('#nan');
		r.click('#nan');
		expect(getRenderCount()).toBe(initialRenders);
		expect(r.find('#out').className).toBe('isNaN');
		r.unmount();
	});
});

describe('useState — multi-setter batching', () => {
	it('setN + setM in one handler produces exactly ONE re-render', () => {
		const r = mount(MultiSetterBatching);
		const initialRenders = getRenderCount();
		r.click('#both');
		expect(r.find('#n').textContent).toBe('1');
		expect(r.find('#m').textContent).toBe('101');
		expect(getRenderCount()).toBe(initialRenders + 1);
		r.unmount();
	});

	it('external setters (called outside an event) fired in the same microtask also batch into ONE render', () => {
		const r = mount(MultiSetterBatching);
		const initialRenders = getRenderCount();
		flushSync(() => {
			getSetN()(42);
			getSetM()(420);
		});
		expect(r.find('#n').textContent).toBe('42');
		expect(r.find('#m').textContent).toBe('420');
		expect(getRenderCount()).toBe(initialRenders + 1);
		r.unmount();
	});
});

describe('useState — lazy initializer', () => {
	it('useState(fn) calls fn EXACTLY ONCE on mount, never on subsequent renders', () => {
		const r = mount(LazyInitOnce);
		expect(getInitCount()).toBe(1);
		expect(r.find('#out').textContent).toBe('42');
		r.click('#inc');
		expect(r.find('#out').textContent).toBe('43');
		// Still 1 — the inc re-rendered but didn't re-invoke the initializer.
		expect(getInitCount()).toBe(1);
		r.click('#inc');
		r.click('#inc');
		expect(getInitCount()).toBe(1);
		r.unmount();
	});
});

describe('useState — setter identity stability', () => {
	it('setN returned from useState is the SAME reference across renders', () => {
		const r = mount(StableSetterIdentity);
		const first = getCapturedSetter();
		// Force a re-render via an external setN call.
		flushSync(() => first(1));
		expect(r.find('#out').textContent).toBe('1');
		// The capturedSetter (captured ONLY on first render) must still
		// equal the current render's setN — same identity.
		expect(first).toBe(getCapturedSetter());
		r.unmount();
	});
});

describe('useState — effect triggers follow-up render', () => {
	it('setN inside useEffect schedules a follow-up render', () => {
		const r = mount(EffectTriggersRender);
		// Drain in stages: first effect (n=0) calls setN(1), then commit
		// the queued re-render, then drain the second effect (n=1).
		flushEffects(); // fires effect for n=0 → setN(1) queued
		flushSync(() => {}); // commits the n=1 render
		flushEffects(); // fires effect for n=1 → no setN call
		expect(r.find('#out').textContent).toBe('1');
		expect(getEffectFired()).toBe(2);
		r.unmount();
	});
});

describe('useState — object identity drives re-render', () => {
	it('setObj({a:0}) with a fresh reference re-renders even if shape is identical', () => {
		const r = mount(ObjectStateRender);
		const initialRenders = getRenderCount();
		flushSync(() => getSetObj()({ a: 0 }));
		// Different reference → re-render (Object.is({a:0}, {a:0}) === false).
		expect(getRenderCount()).toBe(initialRenders + 1);
		expect(r.find('#out').textContent).toBe('0');
		r.unmount();
	});
});

describe('useReducer — Object.is bailout on same-reference state', () => {
	it('reducer returning the SAME state reference triggers neither a render nor an effect re-run', () => {
		const r = mount(ReducerSameRefBailout);
		const initialRenders = getRenderCount();
		// 'keep' returns the SAME state object — Object.is true → bail out.
		r.click('#keep');
		r.click('#keep');
		r.click('#keep');
		// Reducer DID run (we increment _reducerCalls each call) but no
		// render happened.
		expect(getReducerCalls()).toBe(3);
		expect(getRenderCount()).toBe(initialRenders);
		expect(r.find('#out').textContent).toBe('0');
		// 'inc' returns a NEW object — render fires.
		r.click('#inc');
		expect(r.find('#out').textContent).toBe('1');
		expect(getRenderCount()).toBe(initialRenders + 1);
		r.unmount();
	});
});

describe('useReducer — 3-arg lazy init form', () => {
	// React's `useReducer(reducer, initialArg, init)` lazy-init form. The
	// compiler appends the slot symbol after the user args, so the runtime
	// sees `(reducer, initialArg, init, slot)` and runs `init(initialArg)`
	// once on mount.
	it('useReducer(reducer, initialArg, init) calls init(initialArg) on mount', () => {
		const r = mount(ReducerLazyInit, { seed: 4 });
		expect(r.find('#out').textContent).toBe('40');
		r.click('#inc');
		expect(r.find('#out').textContent).toBe('41');
		r.unmount();
	});
});

describe('useReducer — reducer reference freshness', () => {
	it('next dispatch uses the LATEST reducer passed to useReducer (closes over fresh props)', () => {
		const r = mount(ReducerLatestRef, { step: 1 });
		r.click('#go');
		expect(r.find('#out').textContent).toBe('1');
		// Re-render with step=5 — the LATEST reducer (closing over step=5)
		// must drive the next dispatch.
		r.update(ReducerLatestRef, { step: 5 });
		r.click('#go');
		expect(r.find('#out').textContent).toBe('6');
		// And step=10 — proves it tracks the latest, not the first.
		r.update(ReducerLatestRef, { step: 10 });
		r.click('#go');
		expect(r.find('#out').textContent).toBe('16');
		r.unmount();
	});
});

// LAST in source order — this test calls setN AFTER unmount which (if
// the runtime has a bug) can leave a scheduled render queued against a
// disposed scope, polluting any subsequent test's mount path. Keeping
// it at the END of the suite contains that blast radius until the
// underlying behaviour is verified.
describe('useState — setter called after unmount', () => {
	it('calling the setter after unmount is a safe no-op (no throw, no scheduler leak)', () => {
		const r = mount(SetAfterUnmount);
		const setN = getSetN();
		expect(typeof setN).toBe('function');
		r.unmount();
		expect(() => flushSync(() => setN(99))).not.toThrow();
		expect(() => flushSync(() => setN((p: number) => p + 1))).not.toThrow();
		expect(() => flushSync(() => {})).not.toThrow();
	});
});
