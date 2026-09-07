import { track, Context } from 'ripple';
import { bindWallA, bindWallB, initialItemsA, initialItemsB, selectRow } from './ops.js';

// Ripple memo-wall twin — two 1000-row walls over the shared ops driver,
// adapted to the fine-grained model the same way as the Solid column:
//
//   THERE IS NO MEMO WALL. Ripple component bodies run ONCE (creation), so a
//   probe in a body counts CREATIONS, and the fine-grained analog of a "Leaf
//   re-render" is the leaf's reactive TEXT EXPRESSION re-running. The leaf
//   probe therefore lives inside that expression (no body increment — the
//   initial run counts the mount), which makes the harness's exact-count gates
//   mean, per op:
//     parent_rerender_equal_* — 0 everywhere: the tick bump updates one header
//       text node; no component body or leaf expression re-runs. That near-
//       zero IS Ripple's honest number (nothing to bail — the wall never
//       re-renders), not a fixture bug.
//     one_change_*  — 1/1/1: the @for keys by row-object IDENTITY (matching
//       the shared ops driver's fresh-object-per-change model), so it disposes
//       the old row and CREATES one row/inner/leaf.
//     ctx_through_wall_* — 1000 leafs: the theme context carries a stable
//       ACCESSOR over the wall's tracked theme, so a bump re-runs exactly the
//       1000 leaf text expressions.
//
// One theme context PER WALL, matching the other fixtures, so each ctx op's
// propagation is confined to the wall it targets. Ripple context is provided
// by Ctx.set(value) in the wall body and read with Ctx.get() in descendants.

interface Item {
	id: number;
	label: string;
	value: number;
}

const ThemeA = new Context<(() => string) | null>(null);
const ThemeB = new Context<(() => string) | null>(null);

function Leaf(props: { wall: string }) @{
	// No body increment — see the probe-contract note above. The comma
	// expression increments the probe on every re-run of the reactive text
	// expression (once at creation, once per theme bump).
	const theme = ((props.wall === 'A' ? ThemeA : ThemeB)).get() as () => string;
	<span class="leaf">
		{((window as any).__renders['leaf' + props.wall]++, theme())}
	</span>
}

function Inner(props: { value: number; wall: string }) @{
	(window as any).__renders['inner' + props.wall]++;
	<span class="inner">
		{props.value}
		<Leaf wall={props.wall} />
	</span>
}

function Row(props: {
	id: number;
	label: string;
	value: number;
	wall: string;
	onSelect: () => void;
}) @{
	(window as any).__renders['row' + props.wall]++;
	<div class="item">
		<span class="id" onClick={props.onSelect}>{props.id}</span>
		<span class="label">{props.label}</span>
		<Inner value={props.value} wall={props.wall} />
	</div>
}

function Wall(props: {
	wall: string;
	title: string;
	initialItems: Item[];
	bind: (setters: {
		setItems: (v: Item[]) => void;
		setTick: (v: number) => void;
		setTheme: (v: string) => void;
	}) => void;
}) @{
	let &[items] = track<Item[]>(props.initialItems);
	let &[tick] = track(0);
	let &[theme] = track('t0');
	props.bind({
		setItems: (v: Item[]) => {
			items = v;
		},
		setTick: (v: number) => {
			tick = v;
		},
		setTheme: (v: string) => {
			theme = v;
		},
	});
	// A stable accessor over the tracked theme: leaf text expressions calling
	// it subscribe individually (the context VALUE never changes identity).
	((props.wall === 'A' ? ThemeA : ThemeB)).set(() => theme);

	<section class="wall" id={'wall-' + props.wall.toLowerCase()}>
		<h2>
			{props.title}
			<span class="tick">{tick}</span>
		</h2>
		<div class="rows">
			@for (const it of items; key it) {
				<Row id={it.id} label={it.label} value={it.value} wall={props.wall} onSelect={selectRow} />
			}
		</div>
	</section>
}

export default function App() @{
	<div class="walls">
		<Wall
			wall="A"
			title="wall A (keyed @for) tick "
			initialItems={initialItemsA()}
			bind={bindWallA}
		/>
		<Wall
			wall="B"
			title="wall B (keyed @for) tick "
			initialItems={initialItemsB()}
			bind={bindWallB}
		/>
	</div>
}
