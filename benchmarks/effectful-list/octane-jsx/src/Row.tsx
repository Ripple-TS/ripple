import { useEffect, useLayoutEffect, useRef } from 'octane';
import { fx, rowRef } from './fx.js';

// JSX twin of octane-tsrx's Row.tsrx — IDENTICAL hook code to the react
// fixture's Row.jsx (only the import source differs), compiled through
// octane/compiler/vite's React-style .tsx path. Cross-module, not memo'd.
//
//   * useEffect deps [item.id]   — fires once per keyed-row lifetime; the
//     returned cleanup runs on unmount.
//   * useLayoutEffect deps [item.value] — refires per value change; layout
//     read (offsetHeight) only on probe rows (every 10th).
//   * ref={rowRef} — SHARED module-level callback ref returning a cleanup.

export default function Row(props) {
	const item = props.item;
	const cell = useRef(null);

	useEffect(() => {
		fx.mounts++;
		return () => {
			fx.cleanups++;
		};
	}, [item.id]);

	useLayoutEffect(() => {
		if (item.probe) {
			fx.h += cell.current.offsetHeight;
			fx.layouts++;
		}
	}, [item.value]);

	return (
		<tr ref={rowRef}>
			<td className="col-id" ref={cell}>
				{item.id}
			</td>
			<td className="col-label">{item.label}</td>
			<td className="col-value">{item.value}</td>
		</tr>
	);
}
