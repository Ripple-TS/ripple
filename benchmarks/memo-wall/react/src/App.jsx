import { useState } from 'react';
import { Row, ThemeA, ThemeB } from './rows.jsx';
import { buildValueRows } from './wall-b.js';
import { bindWallA, bindWallB, initialItemsA, initialItemsB, selectRow } from './ops.js';

// React twin of the octane memo-wall apps: two 1000-row memo(Row) walls side
// by side, each owning its items + an unrelated `tick` + a theme provider
// above the rows. Wall A renders rows via JSX `.map` inside RowsA (the same
// component structure the octane fixtures need to stay on their compiled
// list path); wall B via the wall-b helper's createElement descriptors. For
// React the two mechanisms are identical (JSX IS createElement) — noted in
// the README; both walls are kept for op-list symmetry with octane.
// RowsA is deliberately NOT memo'd: it must re-render on every wall op so the
// per-row memo boundaries (not a wrapper bail) absorb the re-render.

function RowsA(props) {
	return (
		<div className="rows">
			{props.items.map((it) => (
				<Row
					key={it.id}
					id={it.id}
					label={it.label}
					value={it.value}
					wall={'A'}
					onSelect={selectRow}
				/>
			))}
		</div>
	);
}

export function WallA() {
	const [items, setItems] = useState(initialItemsA());
	const [tick, setTick] = useState(0);
	const [theme, setTheme] = useState('t0');
	bindWallA({ setItems, setTick, setTheme });

	return (
		<section className="wall" id="wall-a">
			<h2>
				{'wall A (JSX .map) tick '}
				<span className="tick">{tick}</span>
			</h2>
			<ThemeA.Provider value={theme}>
				<RowsA items={items} />
			</ThemeA.Provider>
		</section>
	);
}

export function WallB() {
	const [items, setItems] = useState(initialItemsB());
	const [tick, setTick] = useState(0);
	const [theme, setTheme] = useState('t0');
	bindWallB({ setItems, setTick, setTheme });
	const rows = buildValueRows(items);

	return (
		<section className="wall" id="wall-b">
			<h2>
				{'wall B (value-position createElement) tick '}
				<span className="tick">{tick}</span>
			</h2>
			<ThemeB.Provider value={theme}>
				<div className="rows">{rows}</div>
			</ThemeB.Provider>
		</section>
	);
}

export default function App() {
	return (
		<div className="walls">
			<WallA />
			<WallB />
		</div>
	);
}
