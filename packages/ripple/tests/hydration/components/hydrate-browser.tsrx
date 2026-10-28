import { Hydrate, track, effect, bindChecked, bindValue } from 'ripple';
import { idle, visible, interaction, media, condition, never, load } from 'ripple/hydration';

function record(kind: string, name: string) {
	if (typeof window !== 'undefined') (window as any).hydrateTrace.push({
		kind,
		name,
		time: performance.now(),
	});
}
function Widget({ name }: { name: string }) @{
	record('init', name);
	effect(() => {
		record('effect', name);
	});
	<p data-widget={name}>{name}</p>
}
function Actions() @{
	record('init', 'actions');
	const checked = track(false);
	const value = track('server');
	<div onClick={() => record('event', 'parent')} onClickCapture={() => record('event', 'capture')}>
		<input
			id="checkbox"
			type="checkbox"
			ref={bindChecked(checked)}
			onChange={() => record('event', 'change')}
		/>
		<output id="checked">{String(checked.value)}</output>
		<input id="draft" ref={bindValue(value)} />
		<output id="draft-value">{value.value}</output>
		<button id="button" onClick={() => record('event', 'click')}>button</button>
		<button
			id="stop"
			onClick={(event: Event) => {
				record('event', 'stop');
				event.stopPropagation();
			}}
		>stop</button>
		<a id="link" href="#destination" onClick={() => record('event', 'link')}>navigate</a>
		<a
			id="cancel-link"
			href="#cancelled"
			onClick={(event: Event) => {
				record('event', 'cancel');
				event.preventDefault();
			}}
		>cancel</a>
		<form
			onSubmit={(event: Event) => {
				event.preventDefault();
				record('event', 'submit');
			}}
		>
			<button id="submit">submit</button>
		</form>
	</div>
}
function Key() @{
	record('init', 'key');
	<input id="key" onKeyDown={(event: KeyboardEvent) => record('key', event.key)} />
}
function Focus() @{
	record('init', 'focus');
	<input id="focus" onFocusIn={() => record('event', 'focus')} />
}
function Enter() @{
	record('init', 'enter');
	<button id="enter" onPointerEnter={() => record('event', 'enter')}>hover</button>
}
function Static() @{
	record('init', 'never');
	<>
		<style>
			p {
				color: rgb(17, 34, 51);
			}
		</style>
		<p id="static">styled before hydration</p>
	</>
}
function Row({ index }: { index: number }) @{
	record('row', String(index));
	<li>{String(index)}</li>
}
export function App() @{
	const enabled = track(false);
	if (typeof window !== 'undefined') (window as any).openLarge = () => (enabled.value = true);
	<main>
		<Hydrate when={idle({ timeout: 30 })}>
			<Widget name="idle" />
		</Hydrate>
		<Hydrate when={media('(min-width: 1200px)')}>
			<Widget name="media" />
		</Hydrate>
		<Hydrate when={interaction({ events: 'click' })}>
			<Actions />
		</Hydrate>
		<Hydrate when={condition(false)} onHydrated={() => record('hydrated', 'key-parent')}>
			<Hydrate when={interaction({ events: 'keydown' })}>
				<Key />
			</Hydrate>
		</Hydrate>
		<Hydrate when={interaction({ events: 'focusin' })}>
			<Focus />
		</Hydrate>
		<Hydrate when={interaction({ events: 'pointerenter' })}>
			<Enter />
		</Hydrate>
		<Hydrate when={never()}>
			<Static />
		</Hydrate>
		<div style="height:3000px" />
		<Hydrate when={visible({ rootMargin: '0px', threshold: [0, 0.5] })}>
			<Widget name="visible" />
			<span id="visible-tail">tail</span>
		</Hydrate>
		<Hydrate
			when={() => location.search.includes('eager') ? load() : condition(() => enabled.value)}
		>
			<ul id="large">
				@for (const index of Array.from({ length: 2500 }, (_, index) => index)) {
					<Row {index} />
				}
			</ul>
		</Hydrate>
		<div id="destination">destination</div>
	</main>
}
