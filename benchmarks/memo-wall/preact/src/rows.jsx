import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { memo } from 'preact/compat';

export const ThemeA = createContext('t0');
export const ThemeB = createContext('t0');

function Leaf({ wall }) {
	window.__renders['leaf' + wall]++;
	const theme = useContext(wall === 'A' ? ThemeA : ThemeB);
	return <span class="leaf">{theme}</span>;
}

const Inner = memo(function Inner({ value, wall }) {
	window.__renders['inner' + wall]++;
	return (
		<span class="inner">
			{value}
			<Leaf wall={wall} />
		</span>
	);
});

export const Row = memo(function Row({ id, label, value, wall, onSelect }) {
	window.__renders['row' + wall]++;
	return (
		<div class="item">
			<span class="id" onClick={onSelect}>
				{id}
			</span>
			<span class="label">{label}</span>
			<Inner value={value} wall={wall} />
		</div>
	);
});
