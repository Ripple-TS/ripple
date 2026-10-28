import { Activity, createRenderObserver, effect, track, trackAsync, type Tracked } from 'ripple';

export const calls: string[] = [];
export let controls: any;
let load = (version: number) => Promise.resolve('server:' + version);
export function setLoad(fn: typeof load) {
	load = fn;
}

function Panel({ version }: { version: Tracked<number> }) @{
	const data = trackAsync(() => load(version.value));
	calls.push('initialize');
	effect(() => {
		calls.push(`effect:${data.value}`);
	});
	<p class="panel">{data.value}</p>
}

function Sibling({ count }: { count: Tracked<number> }) @{
	controls.sibling = createRenderObserver();
	<p class="visible">{count.value}</p>
}

function Background() @{
	calls.push('background');
	<aside>background</aside>
}

export function App() @{
	const mode = track<'visible' | 'hidden'>('hidden');
	const version = track(0);
	const count = track(0);
	const exists = track(true);
	controls = { mode, version, count, exists, observer: createRenderObserver() };
	<>
		<Sibling {count} />
		@if (exists.value) {
			<Activity {mode}>
				@try {
					<Panel {version} />
				} @pending {
					<em class="pending">loading</em>
				} @catch (error: Error) {
					<strong class="caught">{error.message}</strong>
				}
			</Activity>
		}
		<Activity mode="hidden">
			<Background />
		</Activity>
	</>
}
