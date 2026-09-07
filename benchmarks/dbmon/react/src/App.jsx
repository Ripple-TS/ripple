import { useState } from 'react';
import { bindSetData, initialData } from './ops.js';

// React 19 dbmon table — the canonical VDOM baseline. Same dataset + keyed
// list + setState(newArray) model as the octane apps, so the comparison is
// like-for-like on the keyed-reconcile + cell-diff update path.

export default function App() {
	const [data, setData] = useState(initialData());
	bindSetData(setData);

	return (
		<table className="dbmon">
			<tbody>
				{data.map((db) => (
					<tr key={db.id}>
						<td className="dbname">{db.name}</td>
						<td className={db.countClass}>{db.count}</td>
						<td className={db.queries[0].className}>{db.queries[0].elapsed}</td>
						<td className={db.queries[1].className}>{db.queries[1].elapsed}</td>
						<td className={db.queries[2].className}>{db.queries[2].elapsed}</td>
						<td className={db.queries[3].className}>{db.queries[3].elapsed}</td>
						<td className={db.queries[4].className}>{db.queries[4].elapsed}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
