import { For, createSignal } from 'solid-js';
import { Row, ThemeA, ThemeB } from './rows.jsx';
import { bindWallA, bindWallB, initialItemsA, initialItemsB, selectRow } from './ops.js';

// Solid memo-wall twin — two 1000-row walls over the shared ops driver. Solid
// has no memo walls and no value-position descriptor mechanism, so the A/B
// distinction collapses structurally (both walls are the same keyed <For>);
// both are kept so the op list and DOM stay identical across all targets. The
// <For> keys by row-object IDENTITY: one_change_* replaces exactly one item
// object, so exactly one row is disposed + recreated (the fine-grained
// equivalent of React's single re-render — see rows.jsx for the full probe
// contract). The theme provider passes the theme ACCESSOR so leaf text
// expressions subscribe individually.

function Wall(props) {
	const [items, setItems] = createSignal(props.initialItems);
	const [tick, setTick] = createSignal(0);
	const [theme, setTheme] = createSignal('t0');
	props.bind({ setItems, setTick, setTheme });
	// Solid 2.0: createContext() returns the provider FUNCTION directly —
	// no `.Provider` wrapper. <Theme value={...}> IS the provider.
	const Theme = props.wall === 'A' ? ThemeA : ThemeB;

	return (
		<section class="wall" id={'wall-' + props.wall.toLowerCase()}>
			<h2>
				{props.title}
				<span class="tick">{tick()}</span>
			</h2>
			<Theme value={theme}>
				<div class="rows">
					<For each={items()}>
						{(it) => (
							<Row
								id={it.id}
								label={it.label}
								value={it.value}
								wall={props.wall}
								onSelect={selectRow}
							/>
						)}
					</For>
				</div>
			</Theme>
		</section>
	);
}

export default function App() {
	return (
		<div class="walls">
			<Wall
				wall="A"
				title={'wall A (keyed <For>) tick '}
				initialItems={initialItemsA()}
				bind={bindWallA}
			/>
			<Wall
				wall="B"
				title={'wall B (keyed <For>) tick '}
				initialItems={initialItemsB()}
				bind={bindWallB}
			/>
		</div>
	);
}
