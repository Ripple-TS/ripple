// Regression for a reconcileKeyed bug surfaced by fuzz-keyed-list
// (seed=-1491785866 on FuzzListNested, action 4).
//
// REPRO
// Start with a 3-item list, each item rendered as a multi-node Block
// (start marker + <span><b/><i/></span> + end marker). Swap the head and
// the tail (positions 0 and 2). The DOM should end up with the keys in
// the new order ["5","3","2"] — but reconcileKeyed leaves an extra Block
// at the tail, producing ["5","3","2","5"].
//
// Pinned here as a standalone test so the fix has a fast iteration loop;
// the broader fuzz will keep running as a regression net.
import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FuzzListNested } from './_fixtures/fuzz-keyed-list.tsrx';

function keys(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll('[data-k]')).map(
		(e) => e.getAttribute('data-k') || '',
	);
}

describe('regression — reconcileKeyed head/tail swap on multi-node Blocks', () => {
	it('swap positions 0 and 2 on a length-3 list leaves the DOM with exactly 3 rows', () => {
		const initial = [
			{ id: 2, label: 'L2', tag: 'x' },
			{ id: 3, label: 'L3', tag: 'y' },
			{ id: 5, label: 'L5', tag: 'y' },
		];
		const r = mount(FuzzListNested, { items: initial });
		expect(keys(r.container as HTMLElement)).toEqual(['2', '3', '5']);

		// Swap head and tail.
		const after = [
			{ id: 5, label: 'L5', tag: 'y' },
			{ id: 3, label: 'L3', tag: 'y' },
			{ id: 2, label: 'L2', tag: 'x' },
		];
		r.update(FuzzListNested, { items: after });
		expect(keys(r.container as HTMLElement)).toEqual(['5', '3', '2']);
		r.unmount();
	});

	// The above isolated step (3 items, single swap) reproduces the bug
	// when run AFTER the full prior action stream from the fuzz. The
	// minimal-prior-stream tests below establish whether the head/tail
	// swap alone is buggy or whether prior moves left the state in a
	// shape that only surfaces on the next swap.
	it('replays the full fuzz action stream and expects 3 rows after the final swap', () => {
		// Action 0 (initial): 6 items.
		let items = [
			{ id: 1, label: 'L1', tag: 'y' },
			{ id: 2, label: 'L2', tag: 'x' },
			{ id: 3, label: 'L3', tag: 'y' },
			{ id: 4, label: 'L4', tag: 'y' },
			{ id: 5, label: 'L5', tag: 'y' },
			{ id: 6, label: 'L6', tag: 'z' },
		];
		const r = mount(FuzzListNested, { items });
		expect(keys(r.container as HTMLElement)).toEqual(['1', '2', '3', '4', '5', '6']);

		// Action 1: swap a=5,b=4 → [1,2,3,4,6,5]
		[items[5], items[4]] = [items[4], items[5]];
		r.update(FuzzListNested, { items });
		expect(keys(r.container as HTMLElement)).toEqual(['1', '2', '3', '4', '6', '5']);

		// Action 2: reverse-slice lo=2,hi=6 → reverse [3,4,6,5] → [5,6,4,3]
		const slice = items.slice(2, 6).reverse();
		items.splice(2, 4, ...slice);
		r.update(FuzzListNested, { items });
		expect(keys(r.container as HTMLElement)).toEqual(['1', '2', '5', '6', '4', '3']);

		// Action 3: replace-all → [2,3,5] (shrink — exercises the bug that
		// left state.tail pointing at a deleted block and the last survivor's
		// .nextSibling pointing at a now-removed neighbour).
		items = [
			{ id: 2, label: 'L2', tag: 'x' },
			{ id: 3, label: 'L3', tag: 'y' },
			{ id: 5, label: 'L5', tag: 'y' },
		];
		r.update(FuzzListNested, { items });
		expect(keys(r.container as HTMLElement)).toEqual(['2', '3', '5']);

		// Action 4: swap a=2,b=0 → [5,3,2]. Pre-fix this produced
		// ["5","3","2","5"] because the stale tail pointer caused the new
		// head=5 to be re-mounted as a fresh block instead of recognised as
		// the surviving block(5).
		[items[2], items[0]] = [items[0], items[2]];
		r.update(FuzzListNested, { items });
		expect(keys(r.container as HTMLElement)).toEqual(['5', '3', '2']);
		r.unmount();
	});
});
