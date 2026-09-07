import { createSignal, For, flush } from 'solid-js';
import { render } from '@solidjs/web';

// Solid 2.0 js-framework-benchmark fixture (keyed). Same DOM contract as the
// react / octane / ripple columns: the six create/update/clear/swap buttons
// (#run #runlots #add #update #clear #swaprows) plus the per-row select/remove
// <a> tags are driven by ../../run.mjs; the SECOND jumbotron button row
// (#reverse #shuffle #rotatef #rotateb #prepend100 #append100 #insertmid100
// #removefirst #removeevery10 #displace{3,4,5,6,8}) is the keyed-reorder matrix
// driven by ../../run-reorder.mjs.
//
// Authored idiomatically for Solid (Ryan Carniato's krausest entry): a plain
// `createSignal` of the row array rendered through a keyed `<For each={rows()}>`.
// `<For>` keys by the referential identity of each array element, so every
// reorder op — which replaces the signal with a PERMUTATION of the SAME row
// objects (toReversed / seeded Fisher–Yates / rotate / slice+concat) — makes
// `<For>` MOVE the existing <tr> nodes rather than rebuild them. That preserves
// node identity across the permutation (what run-reorder.mjs's identity gate
// checks) while exercising Solid's keyed reconciler, which is the whole point.
// prepend/append/insert introduce brand-new objects → brand-new <tr> nodes,
// exactly as the gate expects for those ops.
//
// Solid 2.0-beta batches updates and flushes on a microtask, but the harness
// reads the DOM synchronously right after `el.click()`. Each handler therefore
// calls `flush()` after the signal set to force the commit to complete inside
// the timed, synchronous click (the same reason react/ripple use flushSync and
// the dbmon Solid fixture calls flush()).

const A = [
	'pretty',
	'large',
	'big',
	'small',
	'tall',
	'short',
	'long',
	'handsome',
	'plain',
	'quaint',
	'clean',
	'elegant',
	'easy',
	'angry',
	'crazy',
	'helpful',
	'mushy',
	'odd',
	'unsightly',
	'adorable',
	'important',
	'inexpensive',
	'cheap',
	'expensive',
	'fancy',
];
const C = [
	'red',
	'yellow',
	'blue',
	'green',
	'pink',
	'brown',
	'purple',
	'brown',
	'white',
	'black',
	'orange',
];
const N = [
	'table',
	'chair',
	'house',
	'bbq',
	'desk',
	'car',
	'pony',
	'cookie',
	'sandwich',
	'burger',
	'pizza',
	'mouse',
	'keyboard',
];

let nextId = 1;
const random = (max) => (Math.random() * max) | 0;

function buildData(count) {
	const data = new Array(count);
	for (let i = 0; i < count; i++) {
		data[i] = {
			id: nextId++,
			label: `${A[random(A.length)]} ${C[random(C.length)]} ${N[random(N.length)]}`,
		};
	}
	return data;
}

// ── Deterministic shuffle machinery (BYTE-IDENTICAL across all bench fixtures,
// replayed by ../../run-reorder.mjs for its identity gate) ──────────────────
// Every #shuffle click derives a fresh 32-bit seed from a module-level
// mulberry32 stream with a FIXED seed (42), then runs Fisher–Yates with a PRNG
// seeded by it. The seed stream advances exactly ONCE per click — drawn in the
// click handler, never inside a state updater — so every target permutes
// identically. (0x6d2b79f5 === 1831565813, the constant the sibling fixtures
// write in decimal.)
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

function Main() {
	const [rows, setRows] = createSignal([]);
	const [selected, setSelected] = createSignal(0);

	// Force Solid to commit synchronously inside the discrete click so the
	// harness (which reads the DOM immediately after el.click()) sees the update.
	const commit = (next) => {
		setRows(next);
		flush();
	};

	const run = () => commit(buildData(1000));
	const runLots = () => commit(buildData(10000));
	const add = () => commit((d) => d.concat(buildData(1000)));
	const update = () =>
		commit((d) => {
			const out = d.slice();
			for (let i = 0; i < out.length; i += 10) {
				const r = out[i];
				out[i] = { id: r.id, label: r.label + ' !!!' };
			}
			return out;
		});
	const clear = () => commit([]);
	const swap = () =>
		commit((d) => {
			if (d.length <= 998) return d;
			const out = d.slice();
			const tmp = out[1];
			out[1] = out[998];
			out[998] = tmp;
			return out;
		});
	const select = (id) => {
		setSelected(id);
		flush();
	};
	const remove = (row) =>
		commit((d) => {
			const out = d.slice();
			out.splice(out.indexOf(row), 1);
			return out;
		});

	// ── Keyed-reorder matrix. Each op replaces the rows signal with a fresh
	// array built from the CURRENT one (never in-place) — the permuted array
	// reuses the same row objects so <For> moves nodes instead of rebuilding.
	const reverseRows = () => commit((d) => d.toReversed());
	const shuffleRows = () => {
		// Seed drawn HERE (once per click) — keeps the stream in lockstep with
		// the harness's replayed stream (see the shuffle-machinery comment).
		const seed = nextShuffleSeed();
		commit((d) => shuffleWithSeed(d, seed));
	};
	const rotateForward = () =>
		commit((d) => (d.length === 0 ? d : [d[d.length - 1], ...d.slice(0, -1)]));
	const rotateBackward = () => commit((d) => (d.length === 0 ? d : [...d.slice(1), d[0]]));
	const prepend100 = () => commit((d) => buildData(100).concat(d));
	const append100 = () => commit((d) => d.concat(buildData(100)));
	const insertMid100 = () =>
		commit((d) => {
			const mid = d.length >> 1;
			return d.slice(0, mid).concat(buildData(100), d.slice(mid));
		});
	const removeFirst = () => commit((d) => d.slice(1));
	const removeEvery10 = () => commit((d) => d.filter((_, i) => i % 10 !== 0));
	// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
	const displace = (k) => commit((d) => d.slice(k).concat(d.slice(0, k)));

	return (
		<div class="container">
			<div class="jumbotron">
				<div class="row">
					<div class="col-md-6">
						<h1>Solid keyed</h1>
					</div>
					<div class="col-md-6">
						<div class="row">
							<div class="col-sm-6 smallpad">
								<button type="button" class="btn btn-primary btn-block" id="run" onClick={run}>
									Create 1,000 rows
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="runlots"
									onClick={runLots}
								>
									Create 10,000 rows
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button type="button" class="btn btn-primary btn-block" id="add" onClick={add}>
									Append 1,000 rows
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="update"
									onClick={update}
								>
									Update every 10th row
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button type="button" class="btn btn-primary btn-block" id="clear" onClick={clear}>
									Clear
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="swaprows"
									onClick={swap}
								>
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
									onClick={reverseRows}
								>
									Reverse rows
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="shuffle"
									onClick={shuffleRows}
								>
									Shuffle rows (seeded)
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="rotatef"
									onClick={rotateForward}
								>
									Rotate last to front
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="rotateb"
									onClick={rotateBackward}
								>
									Rotate first to end
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="prepend100"
									onClick={prepend100}
								>
									Prepend 100 rows
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="append100"
									onClick={append100}
								>
									Append 100 rows
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="insertmid100"
									onClick={insertMid100}
								>
									Insert 100 rows at middle
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="removefirst"
									onClick={removeFirst}
								>
									Remove first row
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="removeevery10"
									onClick={removeEvery10}
								>
									Remove every 10th row
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="displace3"
									onClick={() => displace(3)}
								>
									Displace first 3 to end
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="displace4"
									onClick={() => displace(4)}
								>
									Displace first 4 to end
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="displace5"
									onClick={() => displace(5)}
								>
									Displace first 5 to end
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="displace6"
									onClick={() => displace(6)}
								>
									Displace first 6 to end
								</button>
							</div>
							<div class="col-sm-6 smallpad">
								<button
									type="button"
									class="btn btn-primary btn-block"
									id="displace8"
									onClick={() => displace(8)}
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
					<For each={rows()}>
						{(row) => (
							<tr class={selected() === row.id ? 'danger' : ''}>
								<td class="col-md-1">{row.id}</td>
								<td class="col-md-4">
									<a onClick={() => select(row.id)}>{row.label}</a>
								</td>
								<td class="col-md-1">
									<a onClick={() => remove(row)}>
										<span class="glyphicon glyphicon-remove" aria-hidden="true" />
									</a>
								</td>
								<td class="col-md-6" />
							</tr>
						)}
					</For>
				</tbody>
			</table>
			<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
		</div>
	);
}

render(() => <Main />, document.getElementById('main'));
