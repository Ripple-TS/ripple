import { effect, track } from 'ripple';
import { fx, rowRef } from './fx.js';

// Ripple Row — the effect() equivalents of the hook-based rows (ripple has no
// layout/passive split; both effects run in the same post-render effect phase):
//
//   * mount/cleanup: an effect that reads NOTHING tracked runs exactly once
//     per row block; its returned teardown runs when the keyed row is
//     destroyed — the useEffect-[item.id] equivalent (keyed rows never change
//     id in place, so id-keyed deps === row lifetime).
//   * useLayoutEffect-[item.value] equivalent: the second effect reads
//     props.item (the row's tracked binding), so it re-runs when update_deps
//     replaces the item object (ids stable, value bumped). Ripple has no deps
//     arrays — the dependency is the item reference, which the ops driver only
//     replaces when value actually changes. `cell` is tracked so the first
//     COUNTED run happens once the ref has attached, whatever order ripple
//     runs its internal ref effects vs deferred component effects.
//   * ref={rowRef} — the SHARED module-level callback ref; ripple function
//     refs support the React-19-style cleanup-return (the teardown runs on
//     row destruction).

export default function Row(props) @{
	let &[cell] = track(null);

	effect(() => {
		fx.mounts++;
		return () => {
			fx.cleanups++;
		};
	});

	effect(() => {
		const item = props.item;
		const el = cell;
		if (el !== null && item.probe) {
			fx.h += el.offsetHeight;
			fx.layouts++;
		}
	});

	<tr ref={(el) => rowRef(el)}>
		<td
			class="col-id"
			ref={(el) => {
				cell = el;
			}}
		>{props.item.id}</td>
		<td class="col-label">{props.item.label}</td>
		<td class="col-value">{props.item.value}</td>
	</tr>
}
