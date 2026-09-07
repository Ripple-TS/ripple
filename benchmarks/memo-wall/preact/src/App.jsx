import { useState } from 'preact/hooks';
import { Row, ThemeA, ThemeB } from './rows.jsx';
import { buildValueRows } from './wall-b.js';
import { bindWallA, bindWallB, initialItemsA, initialItemsB, selectRow } from './ops.js';

// Preact's A and B paths both ultimately produce native Preact VNodes. Both
// walls remain so their memo/context behavior is gated independently and the
// DOM/operation contract remains identical to every other target.
function RowsA({ items }) {
	return (
		<div class="rows">
			{items.map((item) => (
				<Row
					key={item.id}
					id={item.id}
					label={item.label}
					value={item.value}
					wall="A"
					onSelect={selectRow}
				/>
			))}
		</div>
	);
}

function WallA() {
	const [items, setItems] = useState(initialItemsA);
	const [tick, setTick] = useState(0);
	const [theme, setTheme] = useState('t0');
	bindWallA({ setItems, setTick, setTheme });
	return (
		<section class="wall" id="wall-a">
			<h2>
				wall A (JSX .map) tick <span class="tick">{tick}</span>
			</h2>
			<ThemeA.Provider value={theme}>
				<RowsA items={items} />
			</ThemeA.Provider>
		</section>
	);
}

function WallB() {
	const [items, setItems] = useState(initialItemsB);
	const [tick, setTick] = useState(0);
	const [theme, setTheme] = useState('t0');
	bindWallB({ setItems, setTick, setTheme });
	const rows = buildValueRows(items);
	return (
		<section class="wall" id="wall-b">
			<h2>
				wall B (value-position createElement) tick <span class="tick">{tick}</span>
			</h2>
			<ThemeB.Provider value={theme}>
				<div class="rows">{rows}</div>
			</ThemeB.Provider>
		</section>
	);
}

export default function App() {
	return (
		<div class="walls">
			<WallA />
			<WallB />
		</div>
	);
}
