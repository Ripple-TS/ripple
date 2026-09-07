import { useEffect, useState } from 'preact/hooks';
import Row from './Row.jsx';
import { bindHandlers, initialItems } from './ops.js';
import { flushPassiveWaiters } from './passive.js';

// Preact parent — same keyed 1k-row table + unrelated `tick` state as the
// octane apps. Bumping tick re-renders every (unmemo'd) Row with all effect
// deps unchanged: the update_nodeps measurement.

export default function App() {
	const [items, setItems] = useState(initialItems());
	const [tick, setTick] = useState(0);
	bindHandlers({ setItems, setTick });
	// This parent effect is enqueued after all child row effects for the commit.
	useEffect(flushPassiveWaiters);

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
