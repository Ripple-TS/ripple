import { createContext, useContext } from 'solid-js';

// Solid twin of the memo-wall rows — the same Row → Inner → Leaf chain with
// the same window.__renders probe contract, adapted to the fine-grained model:
//
//   THERE IS NO MEMO WALL. Solid component bodies run ONCE (creation), so a
//   probe in a body counts CREATIONS, and the fine-grained analog of a "Leaf
//   re-render" is the leaf's reactive TEXT EXPRESSION re-running. The leaf
//   probe therefore lives inside that expression (no body increment — the
//   initial run counts the mount), which makes the harness's exact-count gates
//   mean, per op:
//     parent_rerender_equal_* — 0 everywhere: the tick bump updates one header
//       text node; no component body or leaf expression re-runs. That near-
//       zero IS Solid's honest number (nothing to bail — the wall never
//       re-renders), not a fixture bug.
//     one_change_*  — 1/1/1: the keyed <For> (keyed by row-object identity,
//       matching the shared ops driver's fresh-object-per-change model)
//       disposes the old row and CREATES one row/inner/leaf.
//     ctx_through_wall_* — 1000 leafs: the theme context carries the theme
//       ACCESSOR, so a bump re-runs exactly the 1000 leaf text expressions.
//
// One theme context PER WALL, matching the other fixtures, so each ctx op's
// propagation is confined to the wall it targets.

export const ThemeA = createContext();
export const ThemeB = createContext();

export function Leaf(props) {
	// No body increment — see the probe-contract note above. The comma
	// expression increments the probe on every re-run of the reactive text
	// expression (once at creation, once per theme bump).
	const theme = useContext(props.wall === 'A' ? ThemeA : ThemeB);
	return <span class="leaf">{(window.__renders['leaf' + props.wall]++, theme())}</span>;
}

export function Inner(props) {
	window.__renders['inner' + props.wall]++;
	return (
		<span class="inner">
			{props.value}
			<Leaf wall={props.wall} />
		</span>
	);
}

export function Row(props) {
	window.__renders['row' + props.wall]++;
	return (
		<div class="item">
			<span class="id" onClick={props.onSelect}>
				{props.id}
			</span>
			<span class="label">{props.label}</span>
			<Inner value={props.value} wall={props.wall} />
		</div>
	);
}
