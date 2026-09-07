import { Component } from 'inferno';
import Row from './Row.jsx';
import { bindHandlers, initialItems } from './ops.js';

// Native Inferno parent — same keyed 1k-row table + unrelated `tick` state as the
// octane apps. Bumping tick re-renders every (unmemo'd) Row with all effect
// deps unchanged: the update_nodeps measurement.

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { items: initialItems(), tick: 0 };
		bindHandlers({
			setItems: (update) =>
				this.setState(({ items }) => ({
					items: typeof update === 'function' ? update(items) : update,
				})),
			setTick: (update) =>
				this.setState(({ tick }) => ({
					tick: typeof update === 'function' ? update(tick) : update,
				})),
		});
	}

	render() {
		const { items, tick } = this.state;
		return (
			<div>
				<div className="tick">{tick}</div>
				<table className="test-data">
					<tbody>
						{items.map((item) => (
							<Row key={item.id} item={item} />
						))}
					</tbody>
				</table>
			</div>
		);
	}
}
