import { useState } from 'octane';
import { bindSetData, initialData } from './ops.js';

// JSX twin of octane-tsrx's App.tsrx — same dbmon table over the same octane
// core, authored in React-style `.tsx` (className, `{items.map(... key=)}`,
// number children coerced to text). Both compile through octane/compiler/vite,
// so the two octane columns read the JSX backwards-compat path's cost on this
// update-heavy keyed-table workload.

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
