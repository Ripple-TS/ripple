import { track, flushSync, type Tracked } from 'ripple';

// Keyed Ripple implementation, ported from js-framework-benchmark
// frameworks/keyed/ripple to current ripple syntax: `function … @{}` (was
// `component … {}`), `@for (…; key row.id)` (was a plain `for` over `items.value`),
// `{expr}` (was `{text expr}`), and a `let &[…] = track()` reactive proxy for the
// list/selection. Per-row `label` stays a `Tracked<string>` so the `update` op
// mutates each tenth label in place (`row.label.value += …`) — the fine-grained
// write ripple is built for, no list reconcile.
//
// Each handler is wrapped in `flushSync` so the mutation commits synchronously
// inside the discrete click (ripple otherwise batches + flushes on a microtask).
// The run.mjs harness times only the synchronous click handler — same adaptation
// react uses here, and the dbmon ripple app makes via `flushSync(op)`.

const ADJECTIVES = [
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
const COLOURS = [
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
const NOUNS = [
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

interface Row {
	id: number;
	label: Tracked<string>;
}

let rowId = 1;
function _random(max: number) {
	return Math.round(Math.random() * 1000) % max | 0;
}
function buildData(count: number): Row[] {
	const data = new Array(count);
	for (let i = 0; i < count; i++) {
		data[i] = {
			id: rowId++,
			label: track(
				`${ADJECTIVES[_random(ADJECTIVES.length)]} ${COLOURS[_random(
					COLOURS.length,
				)]} ${NOUNS[_random(NOUNS.length)]}`,
			),
		};
	}
	return data;
}

// ── Deterministic shuffle machinery (identical across all eight targets,
// replayed by ../../run-reorder.mjs for its identity gate) ──────────────────
// Every #shuffle click derives a fresh 32-bit seed from a module-level
// mulberry32 stream with a FIXED seed, then runs Fisher–Yates with a PRNG
// seeded by it. The seed stream advances exactly once per click — in the
// click handler, before the flushSync — so identical clicks produce
// identical permutations across all eight targets.
function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = seed + 1831565813 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
const SHUFFLE_SEED = 42;
const shuffleSeeds = mulberry32(SHUFFLE_SEED);
const nextShuffleSeed = () => shuffleSeeds() * 4294967296 >>> 0;
function shuffleWithSeed<T>(d: T[], seed: number): T[] {
	const rand = mulberry32(seed);
	const out = d.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = rand() * (i + 1) | 0;
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}

export default function App() @{
	let &[items] = track<Row[]>([]);
	let &[selected] = track<number | undefined>(undefined);

	const run = () => flushSync(() => {
		items = buildData(1000);
		selected = undefined;
	});
	const runLots = () => flushSync(() => {
		items = buildData(10000);
		selected = undefined;
	});
	const add = () => flushSync(() => {
		items = [...items, ...buildData(1000)];
	});
	const update = () => flushSync(() => {
		for (let i = 0; i < items.length; i += 10) {
			items[i].label.value += ' !!!';
		}
	});
	const clear = () => flushSync(() => {
		items = [];
		selected = undefined;
	});
	const swap = () => flushSync(() => {
		if (items.length > 998) {
			const clone = items.slice();
			const tmp = clone[1];
			clone[1] = clone[998];
			clone[998] = tmp;
			items = clone;
		}
	});
	const select = (id: number) => flushSync(() => {
		selected = id;
	});
	const remove = (row: Row) => flushSync(() => {
		const clone = items.slice();
		clone.splice(clone.indexOf(row), 1);
		items = clone;
	});

	// Keyed-reorder matrix handlers (../../run-reorder.mjs). Every button below
	// binds an IDENTIFIER-callee arrow (`onClick={() => reverseRows()}`) —
	// matching the octane fixtures' handler shape. All ops assign a fresh array
	// to `items` inside a flushSync (synchronous commit); nothing mutates in
	// place.
	const reverseRows = () => flushSync(() => {
		items = items.toReversed();
	});
	const shuffleRows = () => {
		// Seed derived HERE (once per click), before the flush — see the
		// shuffle-machinery comment above.
		const seed = nextShuffleSeed();
		flushSync(() => {
			items = shuffleWithSeed(items, seed);
		});
	};
	const rotateForward = () => flushSync(() => {
		if (items.length > 0) {
			items = [items[items.length - 1], ...items.slice(0, -1)];
		}
	});
	const rotateBackward = () => flushSync(() => {
		if (items.length > 0) {
			items = [...items.slice(1), items[0]];
		}
	});
	const prepend100 = () => flushSync(() => {
		// NOTE: ripple renders this op INTERLEAVED ([new0, old0, new1, old1, …])
		// even though the data array is unambiguously [100 new, then 1000 old].
		// Verified independent of construction (concat / spread / explicit push
		// loop all give identical correct data yet identical interleaved DOM), so
		// this is a genuine ripple keyed-@for reconciler bug for prepend-many-at-
		// head — NOT octane and NOT a fixture defect. Left as the faithful op; the
		// run-reorder identity gate correctly flags ripple/prepend100.
		items = [...buildData(100), ...items];
	});
	const append100 = () => flushSync(() => {
		items = items.concat(buildData(100));
	});
	const insertMid100 = () => flushSync(() => {
		const mid = items.length >> 1;
		items = items.slice(0, mid).concat(buildData(100), items.slice(mid));
	});
	const removeFirst = () => flushSync(() => {
		items = items.slice(1);
	});
	const removeEvery10 = () => flushSync(() => {
		items = items.filter((_, i) => i % 10 !== 0);
	});
	// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
	const displace = (k: number) => flushSync(() => {
		items = items.slice(k).concat(items.slice(0, k));
	});

	<div class="container">
		<div class="jumbotron">
			<div class="row">
				<div class="col-md-6">
					<h1>{'Ripple keyed'}</h1>
				</div>
				<div class="col-md-6">
					<div class="row">
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="run"
								onClick={run}
							>{'Create 1,000 rows'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="runlots"
								onClick={runLots}
							>{'Create 10,000 rows'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="add"
								onClick={add}
							>{'Append 1,000 rows'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="update"
								onClick={update}
							>{'Update every 10th row'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="clear"
								onClick={clear}
							>{'Clear'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="swaprows"
								onClick={swap}
							>{'Swap Rows'}</button>
						</div>
					</div>
					<div class="row">
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="reverse"
								onClick={() => reverseRows()}
							>{'Reverse rows'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="shuffle"
								onClick={() => shuffleRows()}
							>{'Shuffle rows (seeded)'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="rotatef"
								onClick={() => rotateForward()}
							>{'Rotate last to front'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="rotateb"
								onClick={() => rotateBackward()}
							>{'Rotate first to end'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="prepend100"
								onClick={() => prepend100()}
							>{'Prepend 100 rows'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="append100"
								onClick={() => append100()}
							>{'Append 100 rows'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="insertmid100"
								onClick={() => insertMid100()}
							>{'Insert 100 rows at middle'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="removefirst"
								onClick={() => removeFirst()}
							>{'Remove first row'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="removeevery10"
								onClick={() => removeEvery10()}
							>{'Remove every 10th row'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace3"
								onClick={() => displace(3)}
							>{'Displace first 3 to end'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace4"
								onClick={() => displace(4)}
							>{'Displace first 4 to end'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace5"
								onClick={() => displace(5)}
							>{'Displace first 5 to end'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace6"
								onClick={() => displace(6)}
							>{'Displace first 6 to end'}</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace8"
								onClick={() => displace(8)}
							>{'Displace first 8 to end'}</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		<table class="table table-hover table-striped test-data">
			<tbody>
				@for (const row of items; key row.id) {
					<tr class={selected === row.id ? 'danger' : ''}>
						<td class="col-md-1">{row.id}</td>
						<td class="col-md-4">
							<a onClick={() => select(row.id)}>{row.label.value}</a>
						</td>
						<td class="col-md-1">
							<a onClick={() => remove(row)}>
								<span class="glyphicon glyphicon-remove" aria-hidden="true" />
							</a>
						</td>
						<td class="col-md-6" />
					</tr>
				}
			</tbody>
		</table>
		<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
	</div>
}
