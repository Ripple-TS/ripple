import { useState } from 'octane';
import { Row, ThemeA, ThemeB } from './rows.tsx';
import { buildValueRows } from './wall-b';
import { bindWallA, bindWallB, initialItemsA, initialItemsB, selectRow } from './ops.js';

// JSX twin of octane-tsrx's App.tsrx. Wall A's keyed `.map` lives in RowsA —
// a component whose root is a HOST element — because the compiler only folds
// a keyed `.map` to the compiled forBlock fast path under host-only ancestors
// (a `.map` directly inside <Provider> children lowers to createElement
// descriptors, i.e. the value-position path wall B already covers). With the
// indirection, wall A hits forBlock → componentSlot → the componentSlot arm
// of tryMemoBail, same as the .tsrx `@for`, and all three fixtures keep the
// identical component structure. Wall B is byte-identical to the tsrx app's
// wall B: the plain-.ts helper's createElement descriptors through a children
// hole (the childSlot arm — the @octanejs bindings shape).
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
				{'wall A (compiled .map) tick '}
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
