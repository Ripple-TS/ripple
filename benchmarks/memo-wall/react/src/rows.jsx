import { createContext, memo, useContext } from 'react';

// React twin of the octane rows modules — the same 2-deep memo chain
// (memo(Row) → 3 host elements + memo(Inner) → host element + Leaf) over
// React 19. Same probe contract: every body increments window.__renders as its
// first statement. One theme context PER WALL, matching the octane fixtures,
// so each ctx op's propagation is confined to the wall it targets. The
// useContext argument varies by the `wall` prop — legal in React (the hook
// call itself is unconditional; only the context object differs).

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
