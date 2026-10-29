import { Hydrate, getTrackedStatus, track, trackAsync } from 'ripple';
import { condition } from 'ripple/hydration';

module server {
	export async function* rows(afterId: number) {
		while (afterId < 400) {
			const rows = Array.from({ length: 100 }, (_, i) => ({ id: afterId + i + 1 }));
			afterId += 100;
			yield { cursor: afterId, rows };
			await new Promise((resolve) => setTimeout(resolve, 25));
		}
	}
}
import { rows } from server;

type Snapshot = { cursor: number; rows: Array<{ id: number }> };

async function* accumulate(previous: Snapshot | undefined) {
	let snapshot = previous ?? { cursor: 0, rows: [] };
	await Promise.resolve();
	const batches = await rows(snapshot.cursor);
	// prettier-ignore
	for await (const batch of batches) {
		snapshot = { cursor: batch.cursor, rows: [...snapshot.rows, ...batch.rows] };
		yield snapshot;
	}
}

function Rows() @{
	const result = trackAsync(accumulate);
	<>
		<input id="draft" defaultValue="server" />
		<p id="cursor">{result.value.cursor}</p>
		<p id="status">
			{getTrackedStatus(result).complete ? 'done' : 'open'}
		</p>
		<ul>
			@for (const row of result.value.rows; key row.id) {
				<li>{row.id}</li>
			}
		</ul>
	</>
}

export function App() @{
	const enabled = track(false);
	<>
		<button onClick={() => (enabled.value = true)}>activate</button>
		<Hydrate when={condition(() => enabled.value)}>
			<Rows />
		</Hydrate>
	</>
}
