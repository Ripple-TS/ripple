// FUZZ — event dispatch × scheduler interleave.
//
// SURFACE
// dispatchDelegated in runtime.ts × DISCRETE_EVENTS × _dispatchDepth ×
// syncFlush × TRANSITION_DEPTH × actScopeDepth — the densest
// cross-product in the runtime, surfacing only when a handler
// interleaves setState + nested dispatch + flushSync.
//
// ORACLE
// After each random dispatch stream:
//   1. The DOM text content equals the FINAL state value implied by the
//      stream (sum of expected increments from the dispatched handlers).
//   2. Subsequent dispatches still drain — proves _dispatchDepth was
//      restored to zero even after nested flushSync re-entries.
//   3. Snapshots taken INSIDE a handler reveal the PRE-COMMIT DOM
//      (React DiscreteEventPriority parity).
import { describe, it, expect } from 'vitest';
import { makeRng, makeRootRng } from './_helpers/fuzz-prng';
import { mount } from '../_helpers';
import { FuzzCounter, resetSnapshots, getSnapshots } from './_fixtures/fuzz-events.tsrx';

const NUM_CASES = parseInt(process.env.RIPPLE_FUZZ_EVENT_CASES || '60', 10);

type ButtonKind = 'one' | 'two' | 'three' | 'flush';

// How much each handler is expected to ADD to the state counter on one
// click. The fuzz harness sums these for the run; the DOM should match.
const INCREMENT: Record<ButtonKind, number> = {
	one: 1,
	two: 2,
	three: 2, // see fixture comment: collapsed-value-set + updater = +2
	flush: 1,
};

function pickKind(rng: ReturnType<typeof makeRng>): ButtonKind {
	return rng.weighted(['one', 'two', 'three', 'flush'] as const, [4, 3, 2, 2]);
}

function clickKind(r: ReturnType<typeof mount>, kind: ButtonKind): void {
	const sel = '#b-' + kind;
	const target = (r.container as HTMLElement).querySelector(sel) as HTMLElement | null;
	if (!target) throw new Error('missing selector ' + sel);
	target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

describe('Event dispatch FUZZ — discrete commits + nested flushSync', () => {
	it(`survives ${NUM_CASES} random click streams across 4 handler shapes`, () => {
		const root = makeRootRng('fuzz-events');
		for (let caseI = 0; caseI < NUM_CASES; caseI++) {
			const caseSeed = (root.next() * 0xffffffff) | 0;
			const rng = makeRng(caseSeed);
			resetSnapshots();
			const r = mount(FuzzCounter);
			const stream: ButtonKind[] = [];
			let expected = 0;
			const N = 1 + rng.intBelow(20);
			for (let i = 0; i < N; i++) {
				const kind = pickKind(rng);
				stream.push(kind);
				clickKind(r, kind);
				expected += INCREMENT[kind];
				const got = (r.find('#out') as HTMLElement).textContent;
				if (got !== String(expected)) {
					// eslint-disable-next-line no-console
					console.error(
						`[fuzz-events] DOM-vs-state divergence\n  seed=${caseSeed}\n  stepIdx=${i}\n  stream=${JSON.stringify(stream)}\n  domText=${got}\n  expected=${expected}\n  snapshots=${JSON.stringify(getSnapshots())}`,
					);
					throw new Error(
						`[fuzz-events] DOM "${got}" !== expected "${expected}" (seed=${caseSeed}, step=${i}, stream=${JSON.stringify(stream)})`,
					);
				}
			}
			expect((r.find('#out') as HTMLElement).textContent).toBe(String(expected));
			r.unmount();
		}
	}, 60_000);

	it('snapshots inside a discrete click handler see PRIOR-commit DOM (React parity)', () => {
		resetSnapshots();
		const r = mount(FuzzCounter);
		// 3 clicks on #b-one — handlerOne does setN(n+1) then reads DOM
		// before returning. React DiscreteEventPriority parity: each
		// handler sees the COMMITTED value from the prior dispatch, but
		// its OWN setN's commit happens AFTER its return.
		clickKind(r, 'one');
		clickKind(r, 'one');
		clickKind(r, 'one');
		expect(getSnapshots()).toEqual(['0', '1', '2']);
		expect((r.find('#out') as HTMLElement).textContent).toBe('3');
		r.unmount();
	});

	it('two functional updates in one handler land as a single +2 commit', () => {
		resetSnapshots();
		const r = mount(FuzzCounter);
		clickKind(r, 'two');
		// "two:" prefix is snapshot taken INSIDE the handler — DOM still
		// pre-commit (== "0"). After return, DOM shows "2".
		expect(getSnapshots()).toEqual(['two:0']);
		expect((r.find('#out') as HTMLElement).textContent).toBe('2');
		r.unmount();
	});

	it('flushSync inside a handler commits before the handler returns', () => {
		resetSnapshots();
		const r = mount(FuzzCounter);
		clickKind(r, 'flush');
		// flushSync inside the handler eagerly committed — the snapshot
		// pushed AFTER flushSync sees the committed value "1".
		expect(getSnapshots()).toEqual(['flush:1']);
		expect((r.find('#out') as HTMLElement).textContent).toBe('1');
		r.unmount();
	});
});
