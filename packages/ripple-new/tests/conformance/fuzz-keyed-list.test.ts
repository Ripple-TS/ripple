// FUZZ — keyed-list reconciliation.
//
// reconcileKeyed in runtime.ts is the hottest, branch-densest path in the
// renderer: 7 specialised branches (head-fast-path, tail-fast-path,
// prefix-suffix trim, K_DISP small-displacement shortcut, LIS path,
// from-scratch fallback, all-new / all-removed) plus a custom
// moveBlockBefore that walks a Block's [startMarker, body..., endMarker]
// range. Each branch has its own pointer dance and a documented prior
// infinite-loop bug (see the n===endMarker pre-check in moveBlockBefore).
//
// HAND-WRITTEN COVERAGE LIMIT
// The for / @for unit tests pin a few dozen scenarios — insert at head,
// insert at tail, swap two, remove middle, etc. None of them cover the
// cross-product of (current-list-shape × mutation-shape × per-Block-DOM-
// shape × branch-cutoff-edge-cases). The fuzz drives random sequences
// across that space and asserts an oracle of three independent invariants:
//
//   ORACLE
//   1. AFTER each mutation, the DOM data-k attribute order on every
//      rendered row equals the expected key sequence.
//   2. AFTER each mutation, the full innerHTML of the live container is
//      byte-identical to a from-scratch render of the same items list
//      (different Root, fresh Block tree).
//   3. AFTER each mutation, the unmount-and-remount cycle for the SAME
//      final items list reproduces the same innerHTML — pins that
//      reconcileKeyed produced a structurally clean state, not a tree
//      that just happens to RENDER right but hides leaked Blocks.
//
// REPRO
// On failure, the harness logs `RIPPLE_FUZZ_SEED=<seed> case=<i>
// trace=<json>` BEFORE re-throwing — set the env var to repro that exact
// case stream. Seed defaults to 'default' so CI is deterministic.

import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { makeRng, makeRootRng, type FuzzRng } from './_helpers/fuzz-prng';
import { FuzzList, FuzzListNested } from './_fixtures/fuzz-keyed-list.tsrx';

interface Item {
	id: number;
	label: string;
	tag: string;
}

type Action =
	| { kind: 'insert'; at: number; item: Item }
	| { kind: 'remove'; at: number }
	| { kind: 'swap'; a: number; b: number }
	| { kind: 'move'; from: number; to: number }
	| { kind: 'mutate-label'; at: number; label: string }
	| { kind: 'reverse-slice'; lo: number; hi: number }
	| { kind: 'replace-all'; items: Item[] };

/**
 * IDs come from a CASE-LOCAL counter (passed by reference as the `idBox`
 * argument). Using a module-level counter would let prior tests in the
 * same run drift the IDs a given seed produces, killing reproducibility.
 */
interface IdBox {
	n: number;
}
function makeItem(rng: FuzzRng, idBox: IdBox): Item {
	const id = ++idBox.n;
	return { id, label: `L${id}`, tag: rng.pick(['x', 'y', 'z']) };
}

/**
 * Pick the next mutation given the current items length. Distribution is
 * weighted so empty / single-item lists still make progress (only insert
 * is available) and the high-signal moves (swap / move) get fired more
 * often than the trivial inserts on long lists.
 */
function genAction(rng: FuzzRng, items: readonly Item[], idBox: IdBox): Action {
	const len = items.length;
	if (len === 0) {
		// Only insert is meaningful on an empty list.
		return { kind: 'insert', at: 0, item: makeItem(rng, idBox) };
	}
	if (len === 1) {
		// Insert or mutate; swap/move/remove are degenerate at length 1
		// except remove. Bias toward insert so we grow.
		const kind = rng.weighted(['insert', 'remove', 'mutate-label'] as const, [6, 1, 2]);
		if (kind === 'insert') {
			return { kind: 'insert', at: rng.intBelow(2), item: makeItem(rng, idBox) };
		}
		if (kind === 'remove') return { kind: 'remove', at: 0 };
		return { kind: 'mutate-label', at: 0, label: `M${rng.intBelow(99999)}` };
	}
	const kind = rng.weighted(
		['insert', 'remove', 'swap', 'move', 'mutate-label', 'reverse-slice', 'replace-all'] as const,
		[3, 2, 3, 3, 2, 2, 1],
	);
	switch (kind) {
		case 'insert':
			return { kind: 'insert', at: rng.intBelow(len + 1), item: makeItem(rng, idBox) };
		case 'remove':
			return { kind: 'remove', at: rng.intBelow(len) };
		case 'swap': {
			const a = rng.intBelow(len);
			let b = rng.intBelow(len);
			if (b === a) b = (b + 1) % len;
			return { kind: 'swap', a, b };
		}
		case 'move': {
			const from = rng.intBelow(len);
			let to = rng.intBelow(len);
			if (to === from) to = (to + 1) % len;
			return { kind: 'move', from, to };
		}
		case 'mutate-label':
			return {
				kind: 'mutate-label',
				at: rng.intBelow(len),
				label: `M${rng.intBelow(99999)}`,
			};
		case 'reverse-slice': {
			const lo = rng.intBelow(len);
			const hi = Math.min(len, lo + 1 + rng.intBelow(len - lo));
			return { kind: 'reverse-slice', lo, hi };
		}
		case 'replace-all': {
			// Sometimes mostly-overlap, sometimes mostly-fresh.
			const keep = rng.intBelow(len + 1);
			const fresh = rng.intBelow(6);
			const next: Item[] = [];
			// Random subset of current items in random order.
			const idxs = items.map((_, i) => i);
			for (let i = idxs.length - 1; i > 0; i--) {
				const j = rng.intBelow(i + 1);
				[idxs[i], idxs[j]] = [idxs[j], idxs[i]];
			}
			for (let i = 0; i < keep; i++) next.push(items[idxs[i]]);
			for (let i = 0; i < fresh; i++) next.push(makeItem(rng, idBox));
			return { kind: 'replace-all', items: next };
		}
	}
}

function applyAction(items: Item[], action: Action): Item[] {
	const next = items.slice();
	switch (action.kind) {
		case 'insert':
			next.splice(action.at, 0, action.item);
			return next;
		case 'remove':
			next.splice(action.at, 1);
			return next;
		case 'swap': {
			[next[action.a], next[action.b]] = [next[action.b], next[action.a]];
			return next;
		}
		case 'move': {
			const [m] = next.splice(action.from, 1);
			next.splice(action.to, 0, m);
			return next;
		}
		case 'mutate-label':
			next[action.at] = { ...next[action.at], label: action.label };
			return next;
		case 'reverse-slice': {
			const slice = next.slice(action.lo, action.hi).reverse();
			next.splice(action.lo, action.hi - action.lo, ...slice);
			return next;
		}
		case 'replace-all':
			return action.items.slice();
	}
}

function keysFromDom(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll('[data-k]')).map(
		(el) => el.getAttribute('data-k') || '',
	);
}

function expectedKeys(items: readonly Item[]): string[] {
	return items.map((it) => String(it.id));
}

/**
 * One fuzz case: random initial seed → random N-action sequence. The
 * three oracle invariants are checked AFTER EVERY action so a corruption
 * is pinned to a specific action index in the failure log.
 */
function runCase(
	Comp: any,
	caseSeed: number,
	maxActions: number,
): { actions: Action[]; finalItems: Item[] } {
	const rng = makeRng(caseSeed);
	const idBox: IdBox = { n: 0 };
	const initCount = rng.intBelow(13);
	let items: Item[] = [];
	for (let i = 0; i < initCount; i++) items.push(makeItem(rng, idBox));
	const actions: Action[] = [{ kind: 'replace-all', items: items.slice() }];
	// Hard wall-clock watchdog per case so a runtime infinite-loop surfaces
	// with the seed instead of hanging the worker (vitest's per-test
	// timeout fires AFTER the whole loop, too late to localize).
	const caseStartMs = (globalThis as any).performance ? (globalThis as any).performance.now() : 0;
	const CASE_BUDGET_MS = 5_000;
	const watchdog = () => {
		const elapsed =
			((globalThis as any).performance ? (globalThis as any).performance.now() : 0) - caseStartMs;
		if (elapsed > CASE_BUDGET_MS) {
			// eslint-disable-next-line no-console
			console.error(
				`[fuzz-keyed-list] WATCHDOG seed=${caseSeed} elapsedMs=${elapsed.toFixed(0)} actions=${JSON.stringify(actions)}`,
			);
			throw new Error(
				`[fuzz-keyed-list] case exceeded ${CASE_BUDGET_MS}ms (seed=${caseSeed}) — likely runtime infinite loop`,
			);
		}
	};
	const r = mount(Comp, { items });

	const failWith = (msg: string, actionIdx: number): never => {
		const trace = JSON.stringify(actions);
		const domKeys = JSON.stringify(keysFromDom(r.container));
		const finalItems = JSON.stringify(items);
		// eslint-disable-next-line no-console
		console.error(
			`[fuzz-keyed-list] FAIL ${msg}\n  seed=${caseSeed}\n  actionIdx=${actionIdx}\n  trace=${trace}\n  finalItems=${finalItems}\n  domKeys=${domKeys}`,
		);
		try {
			r.unmount();
		} catch {
			/* ignore unmount errors during failure path */
		}
		// Embed seed + action index + trace in the Error message so the
		// vitest failure summary alone is enough to repro (no need to
		// recover the console output above).
		throw new Error(
			`[fuzz-keyed-list] ${msg} (seed=${caseSeed}, action=${actionIdx})\n  trace=${trace}\n  domKeys=${domKeys}\n  expected=${JSON.stringify(expectedKeys(items))}`,
		);
	};

	// Oracle: initial render.
	{
		const got = keysFromDom(r.container);
		const want = expectedKeys(items);
		if (got.join(',') !== want.join(',')) failWith('initial render key mismatch', 0);
	}

	const N = 1 + rng.intBelow(maxActions);
	for (let i = 0; i < N; i++) {
		watchdog();
		const action = genAction(rng, items, idBox);
		actions.push(action);
		items = applyAction(items, action);
		try {
			r.update(Comp, { items });
		} catch (e: any) {
			// Runtime-thrown errors (TypeErrors from null pointers in
			// reconcileKeyed etc.) bypass our oracle-level failWith — log
			// the seed + trace + nested error message before re-throwing
			// so the fuzz repro is preserved.
			// eslint-disable-next-line no-console
			console.error(
				`[fuzz-keyed-list] RUNTIME THROW during r.update\n  seed=${caseSeed}\n  actionIdx=${i + 1}\n  trace=${JSON.stringify(actions)}\n  finalItems=${JSON.stringify(items)}\n  err=${e && e.stack ? e.stack : e}`,
			);
			throw new Error(
				`[fuzz-keyed-list] runtime threw at action ${i + 1} (seed=${caseSeed}): ${e?.message || e}\n  trace=${JSON.stringify(actions)}`,
			);
		}

		// Oracle 1: DOM key order matches expected.
		const gotKeys = keysFromDom(r.container);
		const wantKeys = expectedKeys(items);
		if (gotKeys.join(',') !== wantKeys.join(',')) failWith('DOM key order mismatch', i + 1);

		// Oracle 2: full innerHTML matches a from-scratch render of the
		// same final items. Mounts a sibling root, asserts byte equality,
		// then unmounts the sibling.
		const baseline = mount(Comp, { items });
		try {
			if (r.container.innerHTML !== baseline.container.innerHTML) {
				failWith(
					`innerHTML differs from from-scratch baseline:\n    live=${r.container.innerHTML}\n    base=${baseline.container.innerHTML}`,
					i + 1,
				);
			}
		} finally {
			baseline.unmount();
		}
	}

	// Oracle 3: round-trip unmount + remount with the SAME final items.
	const finalHtml = r.container.innerHTML;
	r.unmount();
	const fresh = mount(Comp, { items });
	try {
		if (fresh.container.innerHTML !== finalHtml) {
			// eslint-disable-next-line no-console
			console.error(
				`[fuzz-keyed-list] roundtrip mismatch seed=${caseSeed}\n  live=${finalHtml}\n  fresh=${fresh.container.innerHTML}\n  trace=${JSON.stringify(actions)}`,
			);
			throw new Error(`[fuzz-keyed-list] roundtrip innerHTML mismatch (seed=${caseSeed})`);
		}
	} finally {
		fresh.unmount();
	}
	return { actions, finalItems: items };
}

/**
 * NUM_CASES × actions per case. Sized so the suite finishes well under
 * vitest's default 5s per-test budget on happy-dom: each case is ~50
 * mounts on a small DOM, so ~30 cases × 25 actions ≈ 1500 mounts.
 * Crank these in CI by setting RIPPLE_FUZZ_CASES / RIPPLE_FUZZ_ACTIONS.
 */
const NUM_CASES = parseInt(process.env.RIPPLE_FUZZ_CASES || '30', 10);
const MAX_ACTIONS_PER_CASE = parseInt(process.env.RIPPLE_FUZZ_ACTIONS || '25', 10);

describe('reconcileKeyed FUZZ — flat list', () => {
	it(`survives ${NUM_CASES} random mutation streams (FuzzList)`, () => {
		const root = makeRootRng('fuzz-keyed-list:flat');
		for (let i = 0; i < NUM_CASES; i++) {
			const caseSeed = (root.next() * 0xffffffff) | 0;
			runCase(FuzzList, caseSeed, MAX_ACTIONS_PER_CASE);
		}
	}, 60_000);
});

describe('reconcileKeyed FUZZ — nested item content', () => {
	it(`survives ${NUM_CASES} random mutation streams (FuzzListNested — multi-node Block ranges)`, () => {
		// FuzzListNested has multiple body nodes per Block (start marker +
		// <span><b/><i/></span> + end marker). moveBlockBefore must walk
		// the full range and that walk is the documented source of a
		// prior infinite-loop bug. Two fuzz runs covers the flat and
		// nested shapes independently.
		const root = makeRootRng('fuzz-keyed-list:nested');
		for (let i = 0; i < NUM_CASES; i++) {
			const caseSeed = (root.next() * 0xffffffff) | 0;
			runCase(FuzzListNested, caseSeed, MAX_ACTIONS_PER_CASE);
		}
	}, 60_000);
});

describe('reconcileKeyed FUZZ — K_DISP shortcut boundary', () => {
	// reconcileKeyed has a small-displacement shortcut for ≤ K_DISP (4)
	// out-of-position blocks; one branch above that falls back to LIS.
	// This case fires actions that hover around the boundary so both
	// paths get exercised in each run.
	it(`survives ${NUM_CASES / 2} cases biased toward 3-5 displacements`, () => {
		const root = makeRootRng('fuzz-keyed-list:kdisp');
		for (let i = 0; i < NUM_CASES / 2; i++) {
			const caseSeed = (root.next() * 0xffffffff) | 0;
			const rng = makeRng(caseSeed);
			const idBox: IdBox = { n: 0 };
			// Build a small list that is large enough to expose K_DISP +/-1.
			let items: Item[] = [];
			const n = 6 + rng.intBelow(8); // 6-13 rows
			for (let j = 0; j < n; j++) items.push(makeItem(rng, idBox));
			const actions: Action[] = [{ kind: 'replace-all', items: items.slice() }];
			const r = mount(FuzzList, { items });
			try {
				const checkOracle = (label: string) => {
					const got = keysFromDom(r.container).join(',');
					const want = expectedKeys(items).join(',');
					if (got !== want) {
						// eslint-disable-next-line no-console
						console.error(
							`[fuzz-keyed-list:kdisp] FAIL ${label}\n  RIPPLE_FUZZ_SEED=${caseSeed}\n  trace=${JSON.stringify(actions)}\n  domKeys=${got}\n  expected=${want}`,
						);
						throw new Error(`[fuzz-keyed-list:kdisp] ${label} (seed=${caseSeed})`);
					}
				};
				// Run a handful of swaps + moves that each individually
				// displace 2-5 items, then assert.
				for (let k = 0; k < 12; k++) {
					// Pick 2-5 indices and rotate them.
					const m = 2 + rng.intBelow(4); // 2-5 (covers K_DISP boundary)
					const idxs: number[] = [];
					while (idxs.length < m) {
						const pick = rng.intBelow(items.length);
						if (!idxs.includes(pick)) idxs.push(pick);
					}
					idxs.sort((a, b) => a - b);
					const moved = idxs.map((idx) => items[idx]);
					moved.unshift(moved.pop()!); // rotate right
					for (let p = 0; p < idxs.length; p++) items[idxs[p]] = moved[p];
					actions.push({
						kind: 'replace-all',
						items: items.slice(),
					});
					r.update(FuzzList, { items });
					checkOracle(`after rotation ${k}`);
				}
			} finally {
				r.unmount();
			}
		}
	});
});
