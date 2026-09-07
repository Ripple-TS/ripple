import { createContext, memo, useContext } from 'octane';

// JSX twin of octane-tsrx's rows.tsrx — the same 2-deep memo chain
// (memo(Row) → 3 host elements + memo(Inner) → host element + Leaf) authored
// in React-style .tsx, compiled through the same octane pipeline. See
// rows.tsrx for the full design notes (5 reference-stable props per Row, one
// theme context PER WALL so $$version bumps never cross walls, un-memo'd Leaf
// as the context-refresh endpoint).

export const ThemeA = createContext('t0');
export const ThemeB = createContext('t0');

function Leaf(props) {
	window.__renders['leaf' + props.wall]++;
	const theme = useContext(props.wall === 'A' ? ThemeA : ThemeB);
	return <span className="leaf">{theme}</span>;
}

function InnerImpl(props) {
	window.__renders['inner' + props.wall]++;
	return (
		<span className="inner">
			{props.value}
			<Leaf wall={props.wall} />
		</span>
	);
}
const Inner = memo(InnerImpl);

function RowImpl(props) {
	window.__renders['row' + props.wall]++;
	return (
		<div className="item">
			<span className="id" onClick={props.onSelect}>
				{props.id}
			</span>
			<span className="label">{props.label}</span>
			<Inner value={props.value} wall={props.wall} />
		</div>
	);
}
export const Row = memo(RowImpl);
