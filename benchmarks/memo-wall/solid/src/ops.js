// Shared op driver for the memo-wall bench — framework-agnostic (identical
// file in every fixture app). Each wall binds its state setters via
// bindWallA/B on mount; main.js wires the exported ops to the window.__op
// hooks the harness drives. All op state (current item arrays, tick/theme
// counters) lives at module scope so the timed ops are pure setState calls.
//
// PROP STABILITY IS THE WHOLE BENCHMARK: rows receive primitives read straight
// off these module-level item objects plus the module-level selectRow handler.
// parent_rerender_equal_* bumps ONLY the unrelated `tick` state, so every Row
// prop is Object.is-identical across the re-render and all 1000 memo(Row)
// boundaries MUST bail — the harness asserts 0 row-body invocations and exits
// 1 otherwise (a single reference-unstable prop would silently turn the whole
// suite into a full-re-render measurement).

import { makeItems, ROW_COUNT } from './data.js';

const MID = ROW_COUNT >> 1; // 0-based index of the row one_change_* touches

let itemsA = makeItems();
let itemsB = makeItems();
let tickA = 0;
let tickB = 0;
let themeA = 0;
let themeB = 0;
let wallA = null;
let wallB = null;

export function bindWallA(setters) {
	wallA = setters;
}
export function bindWallB(setters) {
	wallB = setters;
}
export function initialItemsA() {
	return itemsA;
}
export function initialItemsB() {
	return itemsB;
}

// Module-level handler — the onSelect prop of every row. Its identity never
// changes, so it can never break the memo bail (an inline arrow allocated in
// the wall body would).
export function selectRow() {
	window.__hits = (window.__hits || 0) + 1;
}

// parent_rerender_equal_* — bump unrelated parent state. Every row prop stays
// reference-identical, so all 1000 memo boundaries in the targeted wall must
// bail; the timed work is the wall body + the per-row shallow prop compare.
export function parentRerenderA() {
	wallA.setTick(++tickA);
}
export function parentRerenderB() {
	wallB.setTick(++tickB);
}

// one_change_* — exactly ONE row's props change (a fresh item object with the
// value bumped); the other 999 rows keep identical prop values and bail.
export function oneChangeA() {
	const next = itemsA.slice();
	const it = next[MID];
	next[MID] = { id: it.id, label: it.label, value: it.value + 1 };
	itemsA = next;
	wallA.setItems(next);
}
export function oneChangeB() {
	const next = itemsB.slice();
	const it = next[MID];
	next[MID] = { id: it.id, label: it.label, value: it.value + 1 };
	itemsB = next;
	wallB.setItems(next);
}

// ctx_through_wall_* — bump the wall's theme: the provider above the rows
// commits a new context value, every memo(Row)/memo(Inner) boundary bails on
// props, and ONLY the 1000 Leaf consumers re-render (0 row bodies, 0 inner
// bodies — the lazy context-refresh walk through stacked bailed boundaries).
export function ctxA() {
	wallA.setTheme('t' + ++themeA);
}
export function ctxB() {
	wallB.setTheme('t' + ++themeB);
}

// Snapshot for the harness's DOM assertions (leaf text must equal the current
// theme; the changed row's inner cell must show the bumped value).
export function currentState() {
	return {
		mid: MID,
		themeA: 't' + themeA,
		themeB: 't' + themeB,
		midValueA: itemsA[MID].value,
		midValueB: itemsB[MID].value,
	};
}
