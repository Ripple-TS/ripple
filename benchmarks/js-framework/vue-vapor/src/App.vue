<script setup vapor>
// Vue Vapor js-framework-benchmark fixture (keyed) — the OFFICIAL krausest
// entry (frameworks/keyed/vue-vapor/src/App.vue) copied verbatim (only
// formatted to repo style), extended with the suite's keyed-reorder matrix
// (the SECOND jumbotron button row, driven by ../../run-reorder.mjs) exactly
// like the sibling fixtures. The official six-op contract (#run #runlots #add
// #update #clear #swaprows + per-row select/remove) is driven by ../../run.mjs.
//
// Official authoring model (differs from the immutable-newArray columns):
// rows live in a `shallowRef` ARRAY that add/remove/swap mutate IN PLACE and
// then `triggerRef`; each row's `label` is its own shallowRef (see ./data.js),
// so `update` mutates `label.value` fine-grained — only the per-cell vapor
// renderEffect fires, no array diff at all (the same fine-grained shape as the
// ripple column's Tracked<string> labels). The keyed `v-for` (`:key="row.id"`)
// still MOVES surviving <tr> nodes on any permutation, which is what
// run-reorder.mjs's identity gate checks.
//
// Vue batches updates and flushes on a microtask with no public synchronous
// flush, so ./main.js exposes `window.__benchFlush = () => nextTick()` and the
// harnesses await it inside each timed click window (see main.js).
import { ref, shallowRef, triggerRef } from 'vue';
import { buildData } from './data';

const selected = ref();
const rows = shallowRef([]);

function add() {
	rows.value.push(...buildData(1000));
	triggerRef(rows);
}

function remove(id) {
	rows.value.splice(
		rows.value.findIndex((d) => d.id === id),
		1,
	);
	triggerRef(rows);
}

function select(id) {
	selected.value = id;
}

function run() {
	rows.value = buildData();
	selected.value = undefined;
}

function update() {
	const _rows = rows.value;
	for (let i = 0, len = _rows.length; i < len; i += 10) {
		_rows[i].label.value += ' !!!';
	}
}

function runLots() {
	rows.value = buildData(10000);
	selected.value = undefined;
}

function clear() {
	rows.value = [];
	selected.value = undefined;
}

function swapRows() {
	const _rows = rows.value;
	if (_rows.length > 998) {
		const d1 = _rows[1];
		const d998 = _rows[998];
		_rows[1] = d998;
		_rows[998] = d1;
		triggerRef(rows);
	}
}

// ── Suite extension: keyed-reorder matrix (NOT part of the official entry) ──
// Same contract as every sibling fixture: each op replaces the rows ref with a
// fresh array built from the CURRENT one — the permuted array reuses the same
// row objects (same ids), so the keyed v-for moves nodes instead of rebuilding.
//
// Deterministic shuffle machinery (BYTE-IDENTICAL across all bench fixtures,
// replayed by ../../run-reorder.mjs for its identity gate): every #shuffle
// click derives a fresh 32-bit seed from a module-level mulberry32 stream with
// a FIXED seed (42), then runs Fisher–Yates with a PRNG seeded by it. The seed
// stream advances exactly ONCE per click — drawn in the click handler, never
// inside a computed/effect — so every target permutes identically.
// (0x6d2b79f5 === 1831565813, the constant the sibling fixtures write in
// decimal.)
function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const SHUFFLE_SEED = 42;
const shuffleSeeds = mulberry32(SHUFFLE_SEED);
const nextShuffleSeed = () => (shuffleSeeds() * 4294967296) >>> 0;
function shuffleWithSeed(d, seed) {
	const rand = mulberry32(seed);
	const out = d.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = (rand() * (i + 1)) | 0;
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}

function reverseRows() {
	rows.value = rows.value.toReversed();
}
function shuffleRows() {
	// Seed drawn HERE (once per click) — keeps the stream in lockstep with the
	// harness's replayed stream (see the shuffle-machinery comment).
	const seed = nextShuffleSeed();
	rows.value = shuffleWithSeed(rows.value, seed);
}
function rotateForward() {
	const d = rows.value;
	rows.value = d.length === 0 ? d : [d[d.length - 1], ...d.slice(0, -1)];
}
function rotateBackward() {
	const d = rows.value;
	rows.value = d.length === 0 ? d : [...d.slice(1), d[0]];
}
function prepend100() {
	rows.value = buildData(100).concat(rows.value);
}
function append100() {
	rows.value = rows.value.concat(buildData(100));
}
function insertMid100() {
	const d = rows.value;
	const mid = d.length >> 1;
	rows.value = d.slice(0, mid).concat(buildData(100), d.slice(mid));
}
function removeFirst() {
	rows.value = rows.value.slice(1);
}
function removeEvery10() {
	rows.value = rows.value.filter((_, i) => i % 10 !== 0);
}
// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
function displace(k) {
	const d = rows.value;
	rows.value = d.slice(k).concat(d.slice(0, k));
}
</script>

<template>
	<div class="jumbotron">
		<div class="row">
			<div class="col-md-6">
				<h1>Vue.js Vapor (keyed)</h1>
			</div>
			<div class="col-md-6">
				<div class="row">
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="run" @click="run">
							Create 1,000 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="runlots" @click="runLots">
							Create 10,000 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="add" @click="add">
							Append 1,000 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="update" @click="update">
							Update every 10th row
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="clear" @click="clear">
							Clear
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="swaprows" @click="swapRows">
							Swap Rows
						</button>
					</div>
				</div>
				<div class="row">
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="reverse"
							@click="reverseRows"
						>
							Reverse rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="shuffle"
							@click="shuffleRows"
						>
							Shuffle rows (seeded)
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="rotatef"
							@click="rotateForward"
						>
							Rotate last to front
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="rotateb"
							@click="rotateBackward"
						>
							Rotate first to end
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="prepend100"
							@click="prepend100"
						>
							Prepend 100 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="append100"
							@click="append100"
						>
							Append 100 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="insertmid100"
							@click="insertMid100"
						>
							Insert 100 rows at middle
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="removefirst"
							@click="removeFirst"
						>
							Remove first row
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="removeevery10"
							@click="removeEvery10"
						>
							Remove every 10th row
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="displace3"
							@click="displace(3)"
						>
							Displace first 3 to end
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="displace4"
							@click="displace(4)"
						>
							Displace first 4 to end
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="displace5"
							@click="displace(5)"
						>
							Displace first 5 to end
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="displace6"
							@click="displace(6)"
						>
							Displace first 6 to end
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="displace8"
							@click="displace(8)"
						>
							Displace first 8 to end
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<table class="table table-hover table-striped test-data">
		<tbody>
			<tr
				v-for="row of rows"
				:key="row.id"
				:class="{ danger: row.id === selected }"
				:data-label="row.label.value"
			>
				<td class="col-md-1">{{ row.id }}</td>
				<td class="col-md-4">
					<a @click="select(row.id)">{{ row.label.value }}</a>
				</td>
				<td class="col-md-1">
					<a @click="remove(row.id)">
						<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
					</a>
				</td>
				<td class="col-md-6"></td>
			</tr>
		</tbody>
	</table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</template>
