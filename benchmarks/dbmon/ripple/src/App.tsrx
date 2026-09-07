import { track } from 'ripple';
import { bindSetData, initialData } from './ops.js';

// dbmon table authored in ripple. `let &[items] = track(...)` is the reactive
// array; the ops driver reassigns it (`items = nextData`) each tick, exactly the
// immutable-newArray + keyed `@for` model the octane/react apps use — so it's a
// like-for-like comparison on the keyed-reconcile + cell-diff update path.

export default function App() @{
	let &[items] = track(initialData());
	bindSetData((d) => {
		items = d;
	});

	<table class="dbmon">
		<tbody>
			@for (const db of items; key db.id) {
				<tr>
					<td class="dbname">{db.name}</td>
					<td class={db.countClass}>{db.count}</td>
					<td class={db.queries[0].className}>{db.queries[0].elapsed}</td>
					<td class={db.queries[1].className}>{db.queries[1].elapsed}</td>
					<td class={db.queries[2].className}>{db.queries[2].elapsed}</td>
					<td class={db.queries[3].className}>{db.queries[3].elapsed}</td>
					<td class={db.queries[4].className}>{db.queries[4].elapsed}</td>
				</tr>
			}
		</tbody>
	</table>
}
