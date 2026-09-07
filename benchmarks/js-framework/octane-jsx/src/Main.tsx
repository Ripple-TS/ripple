import { useState } from 'octane';

// JSX (React-style `.tsx`) twin of ../../octane-tsrx/src/Main.tsrx. Octane's
// compiler lowers this through the SAME pipeline as the `.tsrx` directive form,
// so it emits identical DOM and the SAME button + table contract the
// Playwright harnesses drive (../../run.mjs for the canonical krausest ops,
// ../../run-reorder.mjs for the second jumbotron row of keyed-reorder
// permutation buttons). The two differ ONLY in authoring dialect:
//   * `@for (const row of items; key row.id) { … }`  →  `items.map((row) => <tr key={row.id}>…)`
//   * `class=` / `{x as string}` casts               →  `className=` / bare `{x}`
//   * `@{ … }` setup-then-output body                →  `return ( … )`
//
// The handlers are unchanged, so the same octane optimizations apply:
//   * Top-level handlers (run / runLots / add / clear / update / swap) only
//     close over setItems / setSelected (stable useState setters) → auto-callback
//     wrapped; the button click slots never reassign across renders.
//   * Per-row `onClick={() => select(row.id)}` / `() => remove(row)` arrows match
//     the event-bundle pattern — a `{ fn, args }` bundle per row that re-renders
//     with the same row identity skip the property write (load-bearing for swap).

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

let nextId = 1;
function _random(max) {
	return (Math.random() * max) | 0;
}

function buildData(count) {
	const data = new Array(count);
	for (let i = 0; i < count; i++) {
		data[i] = {
			id: nextId++,
			label:
				ADJECTIVES[_random(ADJECTIVES.length)] +
				' ' +
				COLOURS[_random(COLOURS.length)] +
				' ' +
				NOUNS[_random(NOUNS.length)],
		};
	}
	return data;
}

// ── Deterministic shuffle machinery (identical across all eight targets,
// replayed by ../../run-reorder.mjs for its identity gate) ──────────────────
// Every #shuffle click derives a fresh 32-bit seed from a module-level
// mulberry32 stream with a FIXED seed, then runs Fisher–Yates with a PRNG
// seeded by it. The seed stream advances exactly once per click — in the
// click handler, never inside the state updater — so a framework that
// re-invokes updaters/reducers cannot skew the sequence. Identical clicks
// therefore produce identical permutations across all eight targets.
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

export default function Main() {
	const [items, setItems] = useState([]);
	const [selected, setSelected] = useState(0);

	const run = () => setItems(buildData(1000));
	const runLots = () => setItems(buildData(10000));
	const add = () => setItems((d) => d.concat(buildData(1000)));
	const update = () =>
		setItems((d) => {
			const out = d.slice();
			for (let i = 0; i < out.length; i += 10) {
				const r = out[i];
				out[i] = { id: r.id, label: r.label + ' !!!' };
			}
			return out;
		});
	const clear = () => setItems([]);
	const swap = () =>
		setItems((d) => {
			if (d.length <= 998) return d;
			const out = d.slice();
			const tmp = out[1];
			out[1] = out[998];
			out[998] = tmp;
			return out;
		});
	const select = (id) => setSelected(id);
	const remove = (row) =>
		setItems((d) => {
			const out = d.slice();
			out.splice(out.indexOf(row), 1);
			return out;
		});

	// Keyed-reorder matrix handlers (../../run-reorder.mjs). Every button below
	// binds an IDENTIFIER-callee arrow (`onClick={() => reverseRows()}`) so it
	// compiles to the same stable event-bundle as the per-row arrows — the
	// fixtures stay on the tuned path. All ops replace `items` with a fresh
	// array via setItems; nothing mutates in place.
	const reverseRows = () => setItems((d) => d.toReversed());
	const shuffleRows = () => {
		// Seed derived HERE (once per click), not inside the updater — see the
		// shuffle-machinery comment above.
		const seed = nextShuffleSeed();
		setItems((d) => shuffleWithSeed(d, seed));
	};
	const rotateForward = () =>
		setItems((d) => (d.length === 0 ? d : [d[d.length - 1], ...d.slice(0, -1)]));
	const rotateBackward = () => setItems((d) => (d.length === 0 ? d : [...d.slice(1), d[0]]));
	const prepend100 = () => setItems((d) => buildData(100).concat(d));
	const append100 = () => setItems((d) => d.concat(buildData(100)));
	const insertMid100 = () =>
		setItems((d) => {
			const mid = d.length >> 1;
			return d.slice(0, mid).concat(buildData(100), d.slice(mid));
		});
	const removeFirst = () => setItems((d) => d.slice(1));
	const removeEvery10 = () => setItems((d) => d.filter((_, i) => i % 10 !== 0));
	// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
	const displace = (k) => setItems((d) => d.slice(k).concat(d.slice(0, k)));

	return (
		<div className="container">
			<div className="jumbotron">
				<div className="row">
					<div className="col-md-6">
						<h1>octane</h1>
					</div>
					<div className="col-md-6">
						<div className="row">
							<div className="col-sm-6 smallpad">
								<button type="button" className="btn btn-primary btn-block" id="run" onClick={run}>
									Create 1,000 rows
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="runlots"
									onClick={runLots}
								>
									Create 10,000 rows
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button type="button" className="btn btn-primary btn-block" id="add" onClick={add}>
									Append 1,000 rows
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="update"
									onClick={update}
								>
									Update every 10th row
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="clear"
									onClick={clear}
								>
									Clear
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="swaprows"
									onClick={swap}
								>
									Swap Rows
								</button>
							</div>
						</div>
						<div className="row">
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="reverse"
									onClick={() => reverseRows()}
								>
									Reverse rows
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="shuffle"
									onClick={() => shuffleRows()}
								>
									Shuffle rows (seeded)
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="rotatef"
									onClick={() => rotateForward()}
								>
									Rotate last to front
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="rotateb"
									onClick={() => rotateBackward()}
								>
									Rotate first to end
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="prepend100"
									onClick={() => prepend100()}
								>
									Prepend 100 rows
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="append100"
									onClick={() => append100()}
								>
									Append 100 rows
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="insertmid100"
									onClick={() => insertMid100()}
								>
									Insert 100 rows at middle
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="removefirst"
									onClick={() => removeFirst()}
								>
									Remove first row
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="removeevery10"
									onClick={() => removeEvery10()}
								>
									Remove every 10th row
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="displace3"
									onClick={() => displace(3)}
								>
									Displace first 3 to end
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="displace4"
									onClick={() => displace(4)}
								>
									Displace first 4 to end
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="displace5"
									onClick={() => displace(5)}
								>
									Displace first 5 to end
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
									id="displace6"
									onClick={() => displace(6)}
								>
									Displace first 6 to end
								</button>
							</div>
							<div className="col-sm-6 smallpad">
								<button
									type="button"
									className="btn btn-primary btn-block"
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
			<table className="table table-hover table-striped test-data">
				<tbody>
					{/* td contents are kept inline: the .tsrx parser trips on a whitespace-only
					    text node between a <td> and its child inside a <tbody>{map → <tr>}; inline
					    children avoid it and emit identical DOM (selectors/innerHTML are whitespace-agnostic). */}
					{items.map((row) => (
						<tr key={row.id} className={selected === row.id ? 'danger' : ''}>
							<td className="col-md-1">{row.id}</td>
							<td className="col-md-4">
								<a onClick={() => select(row.id)}>{row.label}</a>
							</td>
							<td className="col-md-1">
								<a onClick={() => remove(row)}>
									<span className="glyphicon glyphicon-remove" aria-hidden="true" />
								</a>
							</td>
							<td className="col-md-6" />
						</tr>
					))}
				</tbody>
			</table>
			<span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
		</div>
	);
}
