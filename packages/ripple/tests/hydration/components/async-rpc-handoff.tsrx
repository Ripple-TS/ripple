import { getTrackedStatus, trackAsync } from 'ripple';

module server {
	export async function* rows(afterId: number) {
		for (let cursor = afterId + 100; cursor <= 200; cursor += 100) yield { cursor };
	}
	export async function promisedRows(afterId: number) {
		return (async function* () {
			for (let cursor = afterId + 100; cursor <= 200; cursor += 100) yield { cursor };
		})();
	}
	export async function mutation() {
		return 'ok';
	}
}
import { rows, promisedRows, mutation } from server;

type Snapshot = { cursor: number };

export function Direct() @{
	@try {
		const result = trackAsync<Snapshot>((previous) => rows(previous?.cursor ?? 0));
		<>
			<p>{result.value.cursor}</p>
			<b>
				{getTrackedStatus(result).complete ? 'done' : 'open'}
			</b>
		</>
	} @pending {
		<i>pending</i>
	} @catch (error: Error) {
		<em>{error.message}</em>
	}
}

export function Wrapped({ mutate = false }: { mutate?: boolean }) @{
	@try {
		const result = trackAsync<Snapshot>(
			(previous) => (async function* () {
				await Promise.resolve();
				if (mutate) await mutation();
				const stream = await promisedRows(previous?.cursor ?? 0);
				// prettier-ignore
				for await (const value of stream) yield value;
			})(),
		);
		<>
			<p>{result.value.cursor}</p>
			<b>
				{getTrackedStatus(result).complete ? 'done' : 'open'}
			</b>
		</>
	} @pending {
		<i>pending</i>
	} @catch (error: Error) {
		<em>{error.message}</em>
	}
}

export function Mutation() {
	return <Wrapped mutate={true} />;
}
