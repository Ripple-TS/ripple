// Shared op driver for the effectful-list bench — framework-agnostic. The App
// binds its state setters via bindHandlers() on mount; main.js wires the
// exported ops to the window.__op* hooks the Playwright harness drives. State
// (current dataset + id base) lives here at module scope so the timed ops are
// pure setter calls over immutable next-arrays. Copied verbatim into each
// app's src/.
//
// Op → window hook mapping (see main.js):
//   toFresh1k    → __opMount1k (pre: empty) and __opRemount (pre: 1000 rows —
//                  every id is new, so all rows unmount + a fresh set mounts)
//   toEmpty      → __opClear (1000 → 0: cleanup-bearing bulk teardown)
//   updateNodeps → __opUpdateNodeps (bump the unrelated `tick` — all rows
//                  re-render in the VDOM targets, every effect dep unchanged)
//   updateDeps   → __opUpdateDeps (bump every item.value with stable ids —
//                  1000 layout-effect refires; mount effects stay quiet)
//   remove100    → __opRemove100 (drop every 10th row — 100 scattered unmounts)

import { buildItems } from './data.js';

let _setItems = null;
let _setTick = null;
let _current = [];
let _idBase = 0;

export function bindHandlers({ setItems, setTick }) {
	_setItems = setItems;
	_setTick = setTick;
}

export function initialItems() {
	return _current;
}

function apply(next) {
	_current = next;
	if (_setItems) _setItems(next);
}

export function toEmpty() {
	apply([]);
}

// Fresh 1000 rows with all-new ids. Used both as mount_1k (from empty) and as
// remount (from 1000 rows — the all-new-keys teardown+mount storm).
export function toFresh1k() {
	_idBase += 1000;
	apply(buildItems(1000, _idBase));
}

// Bump the unrelated parent `tick` state. Row identities, props, and every
// effect deps-array stay unchanged — this isolates the per-row re-render +
// deps-diff (Object.is churn) cost with zero effect bodies actually firing.
export function updateNodeps() {
	if (_setTick) _setTick((t) => t + 1);
}

// Replace every item with a same-id object whose `value` is bumped: every
// row's layout effect (deps [item.value]) cleans up + refires; the mount
// effect (deps [item.id]) stays quiet.
export function updateDeps() {
	apply(_current.map((it) => ({ ...it, value: it.value + 1 })));
}

// Drop every 10th row (current index % 10 === 0) — 100 scattered
// cleanup-bearing unmounts while 900 neighbours survive in place.
export function remove100() {
	apply(_current.filter((_, i) => i % 10 !== 0));
}
