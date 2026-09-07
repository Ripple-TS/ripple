import { useEffect, useLayoutEffect, useRef } from 'octane';
import { fx, rowRef } from './fx.js';

// Cross-module Row — deliberately its OWN module (not inlined into App) and
// deliberately NOT memo'd: every parent re-render re-invokes all 1000 bodies,
// so the deps-array Object.is churn is part of what's measured.
//
//   * useEffect deps [item.id]   — fires exactly once per keyed-row lifetime
//     (id never changes for a living row); the returned cleanup runs on
//     unmount. mounts/cleanups therefore count row creations/destructions.
//   * useLayoutEffect deps [item.value] — refires whenever the row's value
//     changes; the layout read (offsetHeight) happens ONLY on probe rows
//     (every 10th) so a sample forces 100 reflows, not 1000.
//   * ref={rowRef} — the SHARED module-level callback ref (stable identity,
//     returns a cleanup) on every row root.

export default function Row(props) @{
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

	<tr ref={rowRef}>
		<td class="col-id" ref={cell}>{item.id as string}</td>
		<td class="col-label">{item.label as string}</td>
		<td class="col-value">{item.value as string}</td>
	</tr>
}
