import {
	Hydrate,
	bindValue,
	getTrackedStatus,
	track,
	trackAsync,
	trackReadOnly,
	type Tracked,
} from 'ripple';
import { condition, never } from 'ripple/hydration';

export const calls: Array<number | undefined> = [];
export let complete = false;
export let release: (() => void) | undefined;
export let selection: Tracked<number>;
export let source: Tracked<{ cursor: number }>;
export function reset(done = false) {
	calls.length = 0;
	complete = done;
	release = undefined;
}

function makeSource() {
	return trackAsync<{ cursor: number }>((previous) => {
		const query = selection.value;
		calls.push(previous?.cursor);
		return (async function* () {
			if (previous === undefined || query !== 0) yield { cursor: query || 100 };
			else if (!complete) {
				await new Promise<void>((resolve) => {
					release = resolve;
				});
				yield { cursor: 300 };
			}
		})();
	});
}
function StatusSummary({ value }: { value: Tracked<{ cursor: number }> }) @{
	const view = trackReadOnly(value);
	const status = trackAsync(
		() => Promise.resolve(getTrackedStatus(view).complete ? 'done' : 'open'),
	);
	<em>{status.value}</em>
}

function View({ value }: { value: Tracked<{ cursor: number }> }) @{
	<>
		@if (getTrackedStatus(value).complete) {
			<b>done</b>
		} @else {
			<i>open</i>
		}
		<input defaultValue="server" />
		<p>{value.value.cursor}</p>
		<StatusSummary {value} />
	</>
}
function Owned() @{
	source = makeSource();
	<View value={source} />
}
export function Deferred() @{
	selection = track(0);
	const enabled = track(false);
	const show = track(true);
	<>
		<button class="activate" onClick={() => (enabled.value = true)}>activate</button>
		<button class="remove" onClick={() => (show.value = false)}>remove</button>
		<button class="query" onClick={() => (selection.value = 200)}>query</button>
		@if (show.value) {
			<Hydrate when={condition(() => enabled.value)}>
				<Owned />
			</Hydrate>
		}
	</>
}
export function Shared() @{
	selection = track(0);
	source = makeSource();
	const enabled = track(false);
	<>
		<p class="active">{source.value.cursor}</p>
		<button class="activate" onClick={() => (enabled.value = true)}>activate</button>
		<Hydrate when={condition(() => enabled.value)}>
			<View value={source} />
		</Hydrate>
	</>
}
export function Never() @{
	selection = track(0);
	<Hydrate when={never()}>
		<Owned />
	</Hydrate>
}
export function Immediate() @{
	selection = track(0);
	<Owned />
}

export function BoundShared() @{
	selection = track(0);
	source = makeSource();
	const enabled = track(false);
	<>
		<p class="active">{source.value.cursor}</p>
		<button class="activate" onClick={() => (enabled.value = true)}>activate</button>
		<Hydrate when={condition(() => enabled.value)}>
			<input
				value="100"
				ref={bindValue(
					() => String(source.value.cursor),
					(value) => (source.value = { cursor: Number(value) }),
				)}
			/>
			<p class="bound">{source.value.cursor}</p>
		</Hydrate>
	</>
}
