import { useState } from 'octane';
import { Row, ThemeA, ThemeB } from './rows.tsrx';
import { buildValueRows } from './wall-b';
import { bindWallA, bindWallB, initialItemsA, initialItemsB, selectRow } from './ops.js';

// Two 1000-row memo walls, mounted side by side over the SAME Row/Inner/Leaf
// chain — only the mechanism that puts <Row> on screen differs:
//
//   wall A — compiled: `@for (…; key it.id) { <Row …/> }` inside RowsA. Each
//     row is a compiled component position → componentSlot → the componentSlot
//     arm of tryMemoBail. Production autoMemo first witnesses Row's default
//     memo contract and promotes unchanged keyed survivors to the existing PURE
//     item path. It then caches the pure RowsA call by `items`, stopping before
//     the loop entirely on an unrelated parent update.
//     The list lives in its own RowsA component (host-element root) rather
//     than inline in the Provider children so the .tsx twin's `.map` lowers to
//     the same compiled forBlock — the JSX dialect only folds a keyed `.map`
//     to forBlock under host-only ancestors, and all three fixtures keep the
//     identical component structure.
//
//   wall B — value-position: the plain-.ts wall-b helper builds
//     `createElement(Row, props)` descriptors that reach the DOM through the
//     `{rows}` children hole → childSlot's keyed de-opt list → the childSlot
//     arm of tryMemoBail. autoMemo does not reach through an imported helper's
//     returned descriptors (that calculation/output phase ships together with
//     per-key descriptor reuse), so every parent render rebuilds all 1000
//     descriptors and the bail must succeed on prop VALUES, not object
//     identity. This is the shape every @octanejs binding produces.
//
// Each wall owns its items, an unrelated `tick`, and its theme. The theme
// provider sits ABOVE the rows inside the wall, so a ctx op re-renders the
// wall body, bails all 1000 rows on props, and refreshes only the leaves.
// RowsA is deliberately NOT wrapped in memo(): the automatic compiler region,
// not a source-level wrapper, owns the equal-items bailout. Changed items still
// enter the original 1000-row memo wall, preserving the one-change workload.

function RowsA(props) @{
	<div class="rows">
		@for (const it of props.items; key it.id) {
			<Row id={it.id} label={it.label} value={it.value} wall="A" onSelect={selectRow} />
		}
	</div>
}

export function WallA() @{
	const [items, setItems] = useState(initialItemsA());
	const [tick, setTick] = useState(0);
	const [theme, setTheme] = useState('t0');
	bindWallA({ setItems, setTick, setTheme });

	<section class="wall" id="wall-a">
		<h2>
			{'wall A (compiled @for) tick '}
			<span class="tick">{tick as string}</span>
		</h2>
		<ThemeA.Provider value={theme}>
			<RowsA items={items} />
		</ThemeA.Provider>
	</section>
}

export function WallB() @{
	const [items, setItems] = useState(initialItemsB());
	const [tick, setTick] = useState(0);
	const [theme, setTheme] = useState('t0');
	bindWallB({ setItems, setTick, setTheme });
	const rows = buildValueRows(items);

	<section class="wall" id="wall-b">
		<h2>
			{'wall B (value-position createElement) tick '}
			<span class="tick">{tick as string}</span>
		</h2>
		<ThemeB.Provider value={theme}>
			<div class="rows">{rows}</div>
		</ThemeB.Provider>
	</section>
}

export default function App() @{
	<div class="walls">
		<WallA />
		<WallB />
	</div>
}
