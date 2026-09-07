import { memo, useReducer, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

// Keyed React Hooks implementation (the js-framework-benchmark
// frameworks/keyed/react-hooks reference) — the React column for the same
// create/replace/update/select/swap/remove/runlots/clear ops the octane apps are
// driven through by run.mjs.
//
// One adaptation: dispatch is wrapped in `flushSync` so React commits the update
// SYNCHRONOUSLY inside the discrete click, the way octane flushes on the event
// (and ripple/solid use flushSync/flush). The run.mjs harness times only the
// synchronous click handler; React 18's `createRoot` otherwise schedules the
// commit AFTER the click returns, so the timer would capture ~0ms of scheduling
// instead of the actual render. flushSync forces the same commit work to run in
// the timed window — it doesn't change the work (each op is a single dispatch,
// so there's nothing to batch).

const random = (max) => Math.round(Math.random() * 1000) % max;

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

const buildData = (count) => {
	const data = new Array(count);
	for (let i = 0; i < count; i++) {
		data[i] = {
			id: nextId++,
			label: `${A[random(A.length)]} ${C[random(C.length)]} ${N[random(N.length)]}`,
		};
	}
	return data;
};

// ── Deterministic shuffle machinery (identical across all eight targets,
// replayed by ../../run-reorder.mjs for its identity gate) ──────────────────
// Every #shuffle click derives a fresh 32-bit seed from a module-level
// mulberry32 stream with a FIXED seed, then runs Fisher–Yates with a PRNG
// seeded by it. The seed stream advances exactly once per click — in the
// click handler (the button's cb arrow), never inside the reducer — so
// React re-invoking the reducer (eager bailout evaluation, StrictMode)
// cannot skew the sequence. Identical clicks therefore produce identical
// permutations across all eight targets.
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

const initialState = { data: [], selected: 0 };

const listReducer = (state, action) => {
	const { data, selected } = state;
	switch (action.type) {
		case 'RUN':
			return { data: buildData(1000), selected: 0 };
		case 'RUN_LOTS':
			return { data: buildData(10000), selected: 0 };
		case 'ADD':
			return { data: data.concat(buildData(1000)), selected };
		case 'UPDATE': {
			const newData = data.slice(0);
			for (let i = 0; i < newData.length; i += 10) {
				const r = newData[i];
				newData[i] = { id: r.id, label: r.label + ' !!!' };
			}
			return { data: newData, selected };
		}
		case 'CLEAR':
			return { data: [], selected: 0 };
		case 'SWAP_ROWS': {
			const newdata = [...data];
			if (data.length > 998) {
				const d1 = newdata[1];
				const d998 = newdata[998];
				newdata[1] = d998;
				newdata[998] = d1;
			}
			return { data: newdata, selected };
		}
		case 'REMOVE': {
			const idx = data.findIndex((d) => d.id === action.id);
			return { data: [...data.slice(0, idx), ...data.slice(idx + 1)], selected };
		}
		case 'SELECT':
			return { data, selected: action.id };
		// ── Keyed-reorder matrix ops (../../run-reorder.mjs). All produce a
		// fresh array from the current one — never mutate in place. Semantics
		// are byte-for-byte the same as the octane/ripple fixtures.
		case 'REVERSE':
			return { data: data.toReversed(), selected };
		case 'SHUFFLE':
			// action.seed was drawn in the click handler — see the
			// shuffle-machinery comment above.
			return { data: shuffleWithSeed(data, action.seed), selected };
		case 'ROTATE_F':
			return data.length === 0
				? state
				: { data: [data[data.length - 1], ...data.slice(0, -1)], selected };
		case 'ROTATE_B':
			return data.length === 0 ? state : { data: [...data.slice(1), data[0]], selected };
		case 'PREPEND_100':
			return { data: buildData(100).concat(data), selected };
		case 'APPEND_100':
			return { data: data.concat(buildData(100)), selected };
		case 'INSERT_MID_100': {
			const mid = data.length >> 1;
			return { data: data.slice(0, mid).concat(buildData(100), data.slice(mid)), selected };
		}
		case 'REMOVE_FIRST':
			return { data: data.slice(1), selected };
		case 'REMOVE_EVERY_10':
			return { data: data.filter((_, i) => i % 10 !== 0), selected };
		// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
		case 'DISPLACE':
			return { data: data.slice(action.k).concat(data.slice(0, action.k)), selected };
		default:
			return state;
	}
};

const Row = memo(
	({ selected, item, dispatch }) => (
		<tr className={selected ? 'danger' : ''}>
			<td className="col-md-1">{item.id}</td>
			<td className="col-md-4">
				<a onClick={() => dispatch({ type: 'SELECT', id: item.id })}>{item.label}</a>
			</td>
			<td className="col-md-1">
				<a onClick={() => dispatch({ type: 'REMOVE', id: item.id })}>
					<span className="glyphicon glyphicon-remove" aria-hidden="true" />
				</a>
			</td>
			<td className="col-md-6" />
		</tr>
	),
	(prevProps, nextProps) =>
		prevProps.selected === nextProps.selected && prevProps.item === nextProps.item,
);

const Button = ({ id, cb, title }) => (
	<div className="col-sm-6 smallpad">
		<button type="button" className="btn btn-primary btn-block" id={id} onClick={cb}>
			{title}
		</button>
	</div>
);

const Jumbotron = memo(
	({ dispatch }) => (
		<div className="jumbotron">
			<div className="row">
				<div className="col-md-6">
					<h1>React Hooks keyed</h1>
				</div>
				<div className="col-md-6">
					<div className="row">
						<Button id="run" title="Create 1,000 rows" cb={() => dispatch({ type: 'RUN' })} />
						<Button
							id="runlots"
							title="Create 10,000 rows"
							cb={() => dispatch({ type: 'RUN_LOTS' })}
						/>
						<Button id="add" title="Append 1,000 rows" cb={() => dispatch({ type: 'ADD' })} />
						<Button
							id="update"
							title="Update every 10th row"
							cb={() => dispatch({ type: 'UPDATE' })}
						/>
						<Button id="clear" title="Clear" cb={() => dispatch({ type: 'CLEAR' })} />
						<Button id="swaprows" title="Swap Rows" cb={() => dispatch({ type: 'SWAP_ROWS' })} />
					</div>
					<div className="row">
						<Button id="reverse" title="Reverse rows" cb={() => dispatch({ type: 'REVERSE' })} />
						<Button
							id="shuffle"
							title="Shuffle rows (seeded)"
							cb={() => dispatch({ type: 'SHUFFLE', seed: nextShuffleSeed() })}
						/>
						<Button
							id="rotatef"
							title="Rotate last to front"
							cb={() => dispatch({ type: 'ROTATE_F' })}
						/>
						<Button
							id="rotateb"
							title="Rotate first to end"
							cb={() => dispatch({ type: 'ROTATE_B' })}
						/>
						<Button
							id="prepend100"
							title="Prepend 100 rows"
							cb={() => dispatch({ type: 'PREPEND_100' })}
						/>
						<Button
							id="append100"
							title="Append 100 rows"
							cb={() => dispatch({ type: 'APPEND_100' })}
						/>
						<Button
							id="insertmid100"
							title="Insert 100 rows at middle"
							cb={() => dispatch({ type: 'INSERT_MID_100' })}
						/>
						<Button
							id="removefirst"
							title="Remove first row"
							cb={() => dispatch({ type: 'REMOVE_FIRST' })}
						/>
						<Button
							id="removeevery10"
							title="Remove every 10th row"
							cb={() => dispatch({ type: 'REMOVE_EVERY_10' })}
						/>
						<Button
							id="displace3"
							title="Displace first 3 to end"
							cb={() => dispatch({ type: 'DISPLACE', k: 3 })}
						/>
						<Button
							id="displace4"
							title="Displace first 4 to end"
							cb={() => dispatch({ type: 'DISPLACE', k: 4 })}
						/>
						<Button
							id="displace5"
							title="Displace first 5 to end"
							cb={() => dispatch({ type: 'DISPLACE', k: 5 })}
						/>
						<Button
							id="displace6"
							title="Displace first 6 to end"
							cb={() => dispatch({ type: 'DISPLACE', k: 6 })}
						/>
						<Button
							id="displace8"
							title="Displace first 8 to end"
							cb={() => dispatch({ type: 'DISPLACE', k: 8 })}
						/>
					</div>
				</div>
			</div>
		</div>
	),
	() => true,
);

const Main = () => {
	const [{ data, selected }, rawDispatch] = useReducer(listReducer, initialState);
	// Commit synchronously inside the click so the sync-timed harness captures the
	// real render (see the note up top). Stable identity keeps the memo'd children.
	const dispatch = useCallback((action) => flushSync(() => rawDispatch(action)), []);
	return (
		<div className="container">
			<Jumbotron dispatch={dispatch} />
			<table className="table table-hover table-striped test-data">
				<tbody>
					{data.map((item) => (
						<Row key={item.id} item={item} selected={selected === item.id} dispatch={dispatch} />
					))}
				</tbody>
			</table>
			<span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
		</div>
	);
};

createRoot(document.getElementById('main')).render(<Main />);
