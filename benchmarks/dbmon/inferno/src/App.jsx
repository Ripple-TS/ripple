import { Component } from 'inferno';
import { bindSetData, initialData } from './ops.js';

// Native Inferno dbmon table. Same dataset + keyed
// list + setState(newArray) model as the octane apps, so the comparison is
// like-for-like on the keyed-reconcile + cell-diff update path.

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { data: initialData() };
		bindSetData((update) =>
			this.setState(({ data }) => ({ data: typeof update === 'function' ? update(data) : update })),
		);
	}

	render() {
		const { data } = this.state;
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
}
