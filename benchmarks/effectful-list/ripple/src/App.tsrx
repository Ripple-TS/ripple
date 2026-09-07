import { track } from 'ripple';
import Row from './Row.tsrx';
import { bindHandlers, initialItems } from './ops.js';

// Ripple parent — `let &[items] = track(...)` is the reactive array; the
// shared ops driver reassigns it wholesale (immutable next-arrays), exactly
// the model the octane/react apps use, and the keyed `@for` reconciles rows
// by id so same-id rows survive in place. `tick` is an unrelated tracked
// value read only in the parent text — update_nodeps touches no row (rows
// don't re-render in a fine-grained framework).

export default function App() @{
	let &[items] = track(initialItems());
	let &[tick] = track(0);
	bindHandlers({
		setItems: (next) => {
			items = next;
		},
		setTick: (f) => {
			tick = typeof f === 'function' ? f(tick) : f;
		},
	});

	<div>
		<div class="tick">{tick}</div>
		<table class="test-data">
			<tbody>
				@for (const item of items; key item.id) {
					<Row item={item} />
				}
			</tbody>
		</table>
	</div>
}
