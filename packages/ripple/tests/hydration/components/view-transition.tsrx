import {
	ViewTransition,
	Activity,
	createViewTransition,
	track,
	trackAsync,
	Hydrate,
	type ViewTransitionController,
	type Tracked,
} from 'ripple';

import { condition } from 'ripple/hydration';

export let transition: ViewTransitionController;
export let count: Tracked<number>;
export let reveal: Tracked<boolean>;
export let mode: Tracked<'visible' | 'hidden'>;
export let pending = Promise.withResolvers<string>();
export function reset() {
	pending = Promise.withResolvers<string>();
}

export function Plain() @{
	<button>hello</button>
}
export function Wrapped() @{
	<ViewTransition>
		<button>hello</button>
	</ViewTransition>
}

export function App() @{
	transition = createViewTransition();
	count = track(0);
	<ViewTransition name="counter" update="counter-update">
		<button class="counter" onClick={() => count.value++}>{count.value}</button>
	</ViewTransition>
}

function AsyncContent() @{
	const data = trackAsync(() => pending.promise);
	<ViewTransition name="result">
		<p class="result">{data.value}</p>
	</ViewTransition>
}
export function Stream() @{
	transition = createViewTransition();
	count = track(0);
	<>
		<button class="counter" onClick={() => count.value++}>{count.value}</button>
		@try {
			<AsyncContent />
		} @pending {
			<p class="loading">loading</p>
		}
	</>
}
export function WrappedStream() @{
	<ViewTransition name="stream">
		<Stream />
	</ViewTransition>
}
export function Deferred() @{
	transition = createViewTransition();
	reveal = track(false);
	<Hydrate when={condition(() => reveal.value)}>
		<ViewTransition>
			<input value="server" />
		</ViewTransition>
	</Hydrate>
}

export function WrappedActivity({ initial = 'visible' }: { initial?: 'visible' | 'hidden' }) @{
	transition = createViewTransition();
	mode = track(initial);
	count = track(0);
	<ViewTransition name="activity">
		<Activity {mode}>
			<input value="draft" />
			<button onClick={() => count.value++}>{count.value}</button>
		</Activity>
	</ViewTransition>
}

export function ActivityAroundTransition({
	initial = 'visible',
}: {
	initial?: 'visible' | 'hidden';
}) @{
	transition = createViewTransition();
	mode = track(initial);
	count = track(0);
	<Activity {mode}>
		<ViewTransition name="activity">
			<input value="draft" />
			<button onClick={() => count.value++}>{count.value}</button>
		</ViewTransition>
	</Activity>
}

export function Scoped({ value = 'auto' }: { value?: 'auto' | 'none' }) @{
	transition = createViewTransition();
	count = track(0);
	<>
		<style>
			::view-transition-group(*) {
				animation-duration: 100ms;
			}
			::view-transition-new(.notice) {
				opacity: 1;
			}
		</style>
		<ViewTransition name="scoped" default={value}>
			<button onClick={() => count.value++}>{count.value}</button>
		</ViewTransition>
	</>
}
