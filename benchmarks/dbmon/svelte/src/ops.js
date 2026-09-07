// Shared op driver for the dbmon bench — framework-agnostic. The App binds its
// state setter via bindSetData() on mount; main.js wires the exported ops to
// window.__tick / __tickPartial / __remount / __sort. State (current dataset,
// frame counter, id base, sort direction) lives here at module scope so the
// timed ops are pure setState calls. Copied verbatim into each app's src/.

import { makeData, DB_COUNT } from './data.js';

let _setData = null;
let _current = makeData(DB_COUNT, 0, 1);
let _idBase = 0;
let _frame = 1;
let _sortDir = 1;

export function bindSetData(fn) {
	_setData = fn;
}
export function initialData() {
	return _current;
}

// FULL tick — every row's count + 5 queries churn (same ids → keyed reconcile
// survives all rows; every cell's text + threshold class diffs). The core
// dbmon update metric.
export function tickFull() {
	_frame++;
	_current = makeData(DB_COUNT, _idBase, _frame);
	if (_setData) _setData(_current);
}

// PARTIAL tick — only the first ~10% of rows get new values; the rest reuse
// their current row objects. Exercises the per-binding diff-skip on unchanged
// rows (their cell values are identical, so no DOM writes).
export function tickPartial() {
	_frame++;
	const fresh = makeData(DB_COUNT, _idBase, _frame);
	const n = Math.max(1, (DB_COUNT / 10) | 0);
	_current = _current.map((row, i) => (i < n ? fresh[i] : row));
	if (_setData) _setData(_current);
}

// REMOUNT — advance the id base so EVERY key is new: all current rows unmount
// and a fresh set mounts. Stresses the keyed reconciler's bulk add/remove plus
// per-row mount/unmount at table scale ("remount the entire table").
export function remount() {
	_frame++;
	_idBase += DB_COUNT;
	_current = makeData(DB_COUNT, _idBase, _frame);
	if (_setData) _setData(_current);
}

// SORT — toggle sort direction each call so the order actually reverses every
// time (worst-case keyed reorder / LIS moves), rather than no-opping once sorted.
export function sortRows() {
	_sortDir = -_sortDir;
	_current = _current.slice().sort((a, b) => _sortDir * (b.count - a.count) || a.id - b.id);
	if (_setData) _setData(_current);
}
