import { useState } from 'octane';
import { bindSetData, initialData } from './ops.js';

// dbmonster-style table: DB_COUNT rows, each a name cell + a count cell + 5
// query cells. Every cell carries a value (text) AND a threshold class, so a
// tick churns both per cell. Keyed by db.id so a tick reconciles in place
// (rows survive, cells diff) while a remount replaces every key.
//
// Cells are kept single-element (no nested wrappers) so the hot path is the
// pure text + class binding diff — exactly what the compiler's mount/update
// codegen drives.

export default function App() @{
	const [data, setData] = useState(initialData());
	bindSetData(setData);

	<table class="dbmon">
		<tbody>
			@for (const db of data; key db.id) {
				<tr>
					<td class="dbname">{db.name as string}</td>
					<td class={db.countClass}>{db.count as string}</td>
					<td class={db.queries[0].className}>{db.queries[0].elapsed as string}</td>
					<td class={db.queries[1].className}>{db.queries[1].elapsed as string}</td>
					<td class={db.queries[2].className}>{db.queries[2].elapsed as string}</td>
					<td class={db.queries[3].className}>{db.queries[3].elapsed as string}</td>
					<td class={db.queries[4].className}>{db.queries[4].elapsed as string}</td>
				</tr>
			}
		</tbody>
	</table>
}
