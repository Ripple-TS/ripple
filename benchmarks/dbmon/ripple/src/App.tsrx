import { track } from 'ripple';
import { bindSetData, initialData } from './ops.js';

// dbmon table authored in ripple. `const items = track(...)` is the reactive
// array; the ops driver reassigns it (`items.value = nextData`) each tick, exactly the
// immutable-newArray + keyed `@for` model the octane/react apps use — so it's a
// like-for-like comparison on the keyed-reconcile + cell-diff update path.
//
// The row shape is declared here: the shared JS data generator builds rows
// with `new Array(n)`, which TypeScript infers as `any[]`, so neither the
// checker nor the compiler's syntax inference can see that every cell is a
// primitive without it. Typed cells lower to direct text and class writes in
// one render block per row instead of one value-aware block per cell.

interface Query {
	elapsed: string;
	className: string;
}

interface Db {
	id: number;
	name: string;
	count: number;
	countClass: string;
	queries: Query[];
}

export default function App() @{
	const items = track<Db[]>(initialData());
	bindSetData((d: Db[]) => {
		items.value = d;
	});

	<table class="dbmon">
		<tbody>
			@for (const db of items.value; key db.id) {
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
