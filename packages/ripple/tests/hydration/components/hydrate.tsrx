import {
	Hydrate,
	Activity,
	Context,
	bindValue,
	effect,
	track,
	trackAsync,
	type HydrationWhen,
} from 'ripple';
import { condition, interaction, never, load } from 'ripple/hydration';

export const calls: string[] = [];
export let controls: any;
export let initial = 'server';
export let when: HydrationWhen = condition(false);
export let nested: HydrationWhen = interaction();
export let fail = false;
export let duringInit: (() => void) | undefined;
export let stream: Promise<string> = Promise.resolve('streamed');
export function configure(
	options: {
		when?: HydrationWhen;
		nested?: HydrationWhen;
		initial?: string;
		fail?: boolean;
		duringInit?: () => void;
		stream?: Promise<string>;
	} = {},
) {
	when = options.when ?? condition(false);
	nested = options.nested ?? interaction();
	initial = options.initial ?? 'server';
	fail = options.fail ?? false;
	duringInit = options.duringInit;
	stream = options.stream ?? Promise.resolve('streamed');
	calls.length = 0;
}
const context = new Context<string>();
function Child({ name }: { name: string }) @{
	calls.push('init:' + name + ':' + context.get());
	duringInit?.();
	if (fail) throw new Error('hydrate failure');
	const value = track('server');
	effect(() => {
		calls.push('effect:' + name);
		return () => {
			calls.push('cleanup:' + name);
		};
	});
	<div data-child={name}>
		<input ref={bindValue(value)} />
		<span>{value.value}</span>
		<button
			onClick={() => calls.push('click:' + name)}
			onFocusIn={() => calls.push('focus:' + name)}
			onPointerEnter={() => calls.push('enter:' + name)}
		>press</button>
	</div>
}
export function App() @{
	const strategy = track({ value: when });
	const enabled = track(false);
	const exists = track(true);
	context.set('context');
	controls = { strategy, enabled, exists };
	<main>
		@if (exists.value) {
			<Hydrate
				when={() => {
					const value = strategy.value.value;
					return typeof value === 'function' ? value() : value;
				}}
				onHydrated={() => calls.push('hydrated')}
			>
				<Child name="deferred" />
			</Hydrate>
		}
		<footer>untouched</footer>
	</main>
}
export function Condition() @{
	const enabled = track(false);
	context.set('context');
	controls = { enabled };
	<Hydrate when={condition(() => enabled.value)} onHydrated={() => calls.push('hydrated')}>
		<Child name="condition" />
	</Hydrate>
}
export function Nested() @{
	context.set('context');
	<Hydrate {when} onHydrated={() => calls.push('outer hydrated')}>
		<Child name="parent" />
		<Hydrate when={nested} onHydrated={() => calls.push('inner hydrated')}>
			<Child name="nested" />
		</Hydrate>
	</Hydrate>
}
export function Hidden() @{
	context.set('context');
	const mode = track<'hidden' | 'visible'>('hidden');
	controls = { mode };
	<Activity {mode}>
		<Hydrate {when} onHydrated={() => calls.push('hydrated')}>
			<Child name="hidden" />
		</Hydrate>
	</Activity>
}
export function Async() @{
	const input = track(initial);
	controls = { input };
	function Data() @{
		const value = trackAsync(async () => {
			calls.push('fetch');
			return input.value;
		});
		<p>{value.value}</p>
	}
	<Hydrate {when}>
		<Data />
	</Hydrate>
}
export function Stream() @{
	function Data() @{
		const value = trackAsync(() => stream);
		<p class="stream-value">{value.value}</p>
	}
	<>
		<Hydrate {when}>
			@try {
				<Data />
			} @pending {
				<span class="stream-pending">waiting</span>
			}
		</Hydrate>
		<footer>untouched</footer>
	</>
}
export function Recovery() @{
	const changed = track(false);
	controls = { changed };
	<main>
		<Hydrate {when}>
			@if (changed.value) {
				<section>new</section>
			} @else {
				<p>old</p>
			}
		</Hydrate>
		<footer>untouched</footer>
	</main>
}
export function Errors() @{
	context.set('context');
	@try {
		<Hydrate {when} onHydrated={() => calls.push('hydrated')}>
			<Child name="broken" />
		</Hydrate>
	} @catch (error: Error) {
		<strong>{error.message}</strong>
	}
}
export function Shapes() @{
	<>
		<Hydrate {when} />
		<Hydrate {when} children="text" />
		<Hydrate {when}>
			<b>one</b>
			<b>two</b>
		</Hydrate>
		<svg>
			<Hydrate {when}>
				<circle r="2" />
			</Hydrate>
		</svg>
		<table>
			<tbody>
				<Hydrate {when}>
					<tr>
						<td>cell</td>
					</tr>
				</Hydrate>
			</tbody>
		</table>
	</>
}
export function Replacement() @{
	const children = track('old');
	const strategy = track({ value: when });
	controls = { children, strategy };
	<Hydrate
		when={() => {
			const value = strategy.value.value;
			return typeof value === 'function' ? value() : value;
		}}
		{children}
		onHydrated={() => calls.push('hydrated')}
	/>
}

const storeContext = new Context<{ value: string }>();
export function Current() @{
	const store = track({ title: 'old' });
	const provided = track('old');
	const changed = track(false);
	const enabled = track(false);
	const input = track('server');
	storeContext.set(provided);
	controls = { store, provided, changed, enabled, input };
	function Data({ value }: { value: { value: { title: string } } }) @{
		const shared = storeContext.get();
		calls.push('current init');
		<>
			<input ref={bindValue(input)} />
			<span>{input.value}</span>
			<b>{value.value.title + ':' + shared!.value}</b>
			@if (changed.value) {
				<section>new</section>
			} @else {
				<p>old</p>
			}
		</>
	}
	<Hydrate when={condition(() => enabled.value)}>
		<Data value={store} />
	</Hydrate>
}
export function Navigation() @{
	const exists = track(false);
	controls = { exists };
	@if (exists.value) {
		<Hydrate when={never()} onHydrated={() => calls.push('hydrated')}>
			<button onClick={() => calls.push('click')}>live</button>
		</Hydrate>
	}
}
export function Priority() @{
	context.set('context');
	<>
		<Activity mode="hidden">
			<Child name="background" />
		</Activity>
		<Hydrate {when}>
			<Child name="urgent" />
		</Hydrate>
	</>
}
export function DynamicFactory() @{
	context.set('context');
	<Hydrate {when}>
		<Hydrate when={() => nested}>
			<Child name="dynamic" />
		</Hydrate>
	</Hydrate>
}
export function CallbackError() @{
	@try {
		<Hydrate
			{when}
			onHydrated={() => {
				throw new Error('completion failure');
			}}
		>
			<button>button</button>
		</Hydrate>
	} @catch (error: Error) {
		<strong>{error.message}</strong>
	}
}

export function Branches() @{
	const choice = track(Number(initial) || 0);
	const enabled = track(false);
	controls = { choice, enabled };
	<Hydrate when={condition(() => enabled.value)}>
		<div id="if-chain">
			@if (choice.value === 0) {
				<p>first</p>
			} @else if (choice.value === 1) {
				<p>second</p>
			} @else if (choice.value === 2) {
				<p>third</p>
			}
		</div>
		<div id="switch">
			@switch (choice.value) {
				@case 0: {
					<p>first</p>
				}
				@case 1: {
					<p>second</p>
				}
				@case 2: {
					<p>third</p>
				}
			}
		</div>
	</Hydrate>
}

export function DerivedChildren() @{
	const enabled = track(false);
	const value = track('old');
	const children = track(() => {
		calls.push('children read');
		return value.value;
	});
	controls = { enabled, value };
	<Hydrate when={condition(() => enabled.value)} {children} />
}

function ActivityComposition({ activityOutside }: { activityOutside: boolean }) @{
	const mode = track<'hidden' | 'visible'>(initial === 'visible' ? 'visible' : 'hidden');
	const enabled = track(false);
	const exists = track(true);
	context.set('context');
	controls = { mode, enabled, exists };
	<main>
		@if (exists.value) {
			@if (activityOutside) {
				<Activity {mode}>
					<Hydrate {when} onHydrated={() => calls.push('hydrated')}>
						<Child name="composed" />
					</Hydrate>
				</Activity>
			} @else {
				<Hydrate {when} onHydrated={() => calls.push('hydrated')}>
					<Activity {mode}>
						<Child name="composed" />
					</Activity>
				</Hydrate>
			}
		}
		<footer>untouched</footer>
	</main>
}

export function ActivityOutsideHydrate() {
	return <ActivityComposition activityOutside={true} />;
}

export function HydrateOutsideActivity() {
	return <ActivityComposition activityOutside={false} />;
}

export function HydrateActivityHydrate() @{
	context.set('context');
	<Hydrate {when} onHydrated={() => calls.push('outer hydrated')}>
		<Activity>
			<Hydrate when={nested} onHydrated={() => calls.push('inner hydrated')}>
				<Child name="composed" />
			</Hydrate>
		</Activity>
	</Hydrate>
}
