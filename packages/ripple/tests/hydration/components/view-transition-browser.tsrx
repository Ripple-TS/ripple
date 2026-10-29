import {
	ViewTransition,
	Activity,
	createViewTransition,
	track,
	trackAsync,
	type ViewTransitionController,
	type ViewTransitionHandle,
	type ViewTransitionCallback,
	type Tracked,
} from 'ripple';

let transition: ViewTransitionController;
let count: Tracked<number>;
let detail: Tracked<boolean>;
let shown: Tracked<boolean>;
let rows: Tracked<number[]>;
export let last: ViewTransitionHandle;
export const events: Array<{
	kind: string;
	name: string;
	names: readonly string[];
	types: readonly string[];
	duration: string;
}> = [];
export const cleanups: string[] = [];
const record = (kind: string): ViewTransitionCallback => (instance, types) => {
	events.push({
		kind,
		name: instance.name,
		names: instance.names,
		types,
		duration: getComputedStyle(
			document.documentElement,
			`::view-transition-${kind === 'exit' ? 'old' : 'new'}(${instance.name})`,
		).animationDuration,
	});
	if (kind === 'update') {
		const animations = instance.new.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 80 });
		return () => {
			cleanups.push(kind);
			animations.forEach((animation) => animation.cancel());
		};
	}
	return () => {
		cleanups.push(kind);
	};
};

export function run(action: string, skip = false) {
	last = transition.run(() => {
		if (action === 'share') detail.value = !detail.value;
		else if (action === 'exit') shown.value = false;
		else if (action === 'enter') shown.value = true;
		else if (action === 'reorder') rows.value = [...rows.value].reverse();
		else count.value++;
	}, { types: ['forward'] });
	if (skip) last.skipTransition();
	return last;
}

export function App() @{
	transition = createViewTransition();
	count = track(0);
	detail = track(false);
	shown = track(true);
	rows = track([1, 2, 3]);
	<>
		<style>
			:global(::view-transition-new(.notice-in)) {
				animation: appear 120ms linear;
			}
			:global(::view-transition-old(.notice-out)) {
				animation: appear 120ms linear reverse;
			}
			:global(::view-transition-new(.change)) {
				animation: appear 100ms linear;
			}
			:global(::view-transition-new(.share)) {
				animation: appear 140ms linear;
			}
			:global(::view-transition-image-pair(.share)) {
				isolation: isolate;
			}
			:global(::view-transition-group(.share)) {
				animation-duration: 140ms;
			}
			@keyframes appear {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}
			@media (prefers-reduced-motion: reduce) {
				:global(::view-transition-group(*)) {
					animation-duration: 0s;
				}
			}
		</style>
		<main>
			<button id="increment" onClick={() => count.value++}>increment</button>
			<ViewTransition name="counter" update="change" onUpdate={record('update')}>
				<section>
					<input id="focus" value="editable" />
					<output>{count.value}</output>
				</section>
			</ViewTransition>
			@if (shown.value) {
				<ViewTransition
					name="notice"
					enter="notice-in"
					exit="notice-out"
					onEnter={record('enter')}
					onExit={record('exit')}
				>
					<p id="notice">Saved</p>
				</ViewTransition>
			}
			@if (detail.value) {
				<article>
					<ViewTransition name="photo" share="share" onShare={record('share')}>
						<h2 id="photo">detail</h2>
					</ViewTransition>
				</article>
			} @else {
				<aside>
					<ViewTransition name="photo" share="share" onShare={record('share')}>
						<h3 id="photo">thumbnail</h3>
					</ViewTransition>
				</aside>
			}
			@for (const row of rows.value; key row) {
				<ViewTransition name={'row-' + row} onUpdate={record('reorder')}>
					<p class="row">{row}</p>
				</ViewTransition>
			}
		</main>
	</>
}

const samples = Array.from({ length: 500 }, (_, index) => index);
export function ManyPlain() @{
	@for (const row of samples) {
		<p>{row}</p>
	}
}
export function ManyWrapped() @{
	@for (const row of samples) {
		<ViewTransition>
			<p>{row}</p>
		</ViewTransition>
	}
}

const pending = Promise.withResolvers<string>();
export function resolveAsync() {
	pending.resolve('loaded content');
}
function AsyncContent() @{
	const data = trackAsync(() => pending.promise);
	<p id="async-result">{data.value}</p>
}
export function AsyncApp() @{
	<ViewTransition name="async-content" update="change" onUpdate={record('reveal')}>
		@try {
			<AsyncContent />
		} @pending {
			<p id="skeleton">loading</p>
		}
	</ViewTransition>
}

export function Gallery() @{
	<>
		<ViewTransition name="photo" share="share">
			<div id="photo">thumbnail</div>
		</ViewTransition>
		<a id="next" href="/document-b">Open photo</a>
	</>
}
export function Detail() @{
	<>
		<ViewTransition name="photo" share="share">
			<div id="photo">large photo</div>
		</ViewTransition>
		<a id="next" href="/document-a">Back to gallery</a>
	</>
}

let activityMode: Tracked<'visible' | 'hidden'>;
export function runActivity(mode: 'visible' | 'hidden') {
	return transition.run(() => {
		activityMode.value = mode;
	});
}
function ActivityPanel() @{
	const value = track(0);
	<section>
		<input id="activity-input" value="draft" />
		<button id="activity-count" onClick={() => value.value++}>{value.value}</button>
	</section>
}
export function ActivityApp() @{
	transition = createViewTransition();
	activityMode = track('visible');
	<ViewTransition
		name="activity"
		enter="notice-in"
		exit="notice-out"
		onEnter={record('enter')}
		onExit={record('exit')}
	>
		<Activity mode={activityMode}>
			<ActivityPanel />
		</Activity>
	</ViewTransition>
}

export function InnerActivityApp() @{
	transition = createViewTransition();
	activityMode = track('visible');
	<Activity mode={activityMode}>
		<ViewTransition
			name="activity"
			enter="notice-in"
			exit="notice-out"
			onEnter={record('enter')}
			onExit={record('exit')}
		>
			<ActivityPanel />
		</ViewTransition>
	</Activity>
}
