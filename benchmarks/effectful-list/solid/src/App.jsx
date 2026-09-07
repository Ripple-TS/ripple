import { For, createSignal, createStore, reconcile } from 'solid-js';
import Row from './Row.jsx';
import { bindHandlers, initialItems } from './ops.js';

// Solid 2.0 parent, following the dbmon solid adapter: a `createStore` of the
// rows + `reconcile(next, 'id')` on every items op. The shared ops driver
// produces fresh plain arrays (same seeded data as every other target);
// reconcile diffs them into the store by id so same-id rows keep identity (no
// row re-creation — only changed leaf signals like item.value update) while
// new/removed ids create/dispose rows. That preserves the suite's analytic
// __fx expectations: mounts/cleanups count row lifetimes, exactly like the
// keyed VDOM targets. `tick` is an unrelated signal read only in the parent
// text — update_nodeps touches no row.

export default function App() {
	const [state, setState] = createStore({ items: initialItems() });
	const [tick, setTick] = createSignal(0);
	bindHandlers({
		setItems: (next) =>
			setState((s) => {
				reconcile(next, 'id')(s.items);
			}),
		setTick,
	});

	return (
		<div>
			<div class="tick">{tick()}</div>
			<table class="test-data">
				<tbody>
					<For each={state.items}>{(item) => <Row item={item} />}</For>
				</tbody>
			</table>
		</div>
	);
}
