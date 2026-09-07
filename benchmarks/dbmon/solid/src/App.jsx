import { For, createStore, reconcile } from 'solid-js';
import { bindSetData } from './ops.js';
import { makeData, DB_COUNT } from './data.js';

// dbmon table authored idiomatically for Solid 2.0, following Ryan Carniato's
// solid-dbmon: a plain `createStore` of the rows + `reconcile` on each tick.
// `reconcile(next, "id")(draft.rows)` diffs the next dataset into the store by id
// inside the setter's draft callback, so unchanged rows keep their identity (no
// row re-render) and only the changed leaf signals (count / class / a query's
// elapsed+class) update — Solid's fine-grained model. `<For>` keys the list and
// moves nodes on a sort. dbmon is a known worst case for fine-grained reconcile
// (every tick is a fresh, non-reference-checkable object graph it must deep-diff).
// The shared ops driver feeds `reconcile` the same seeded data, so the rendered
// DOM matches the other frameworks exactly.

export default function App() {
	// Seed value-identical to the shared ops `_current` (same makeData(…, 0, 1)).
	const [state, setState] = createStore({ rows: makeData(DB_COUNT, 0, 1) });
	bindSetData((d) =>
		setState((s) => {
			reconcile(d, 'id')(s.rows);
		}),
	);

	return (
		<table class="dbmon">
			<tbody>
				<For each={state.rows}>
					{(db) => (
						<tr>
							<td class="dbname">{db.name}</td>
							<td class={db.countClass}>{db.count}</td>
							<td class={db.queries[0].className}>{db.queries[0].elapsed}</td>
							<td class={db.queries[1].className}>{db.queries[1].elapsed}</td>
							<td class={db.queries[2].className}>{db.queries[2].elapsed}</td>
							<td class={db.queries[3].className}>{db.queries[3].elapsed}</td>
							<td class={db.queries[4].className}>{db.queries[4].elapsed}</td>
						</tr>
					)}
				</For>
			</tbody>
		</table>
	);
}
