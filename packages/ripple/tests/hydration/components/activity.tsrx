import { Activity, bindValue, Context, effect, track, trackAsync } from 'ripple';

export const calls: string[] = [];
export let controls: any;
export let initial = 'value';
export let fail = false;
export let duringInit: (() => void) | undefined;
export function setDuringInit(fn?: () => void) {
	duringInit = fn;
}
export let stream: Promise<string> = Promise.resolve('streamed');
export function setInitial(value: string) {
	initial = value;
}
export function setFail(value: boolean) {
	fail = value;
}
export function setStream(value: Promise<string>) {
	stream = value;
}
const context = new Context<string>();

function Child({ name }: { name: string }) @{
	const label = context.get();
	const value = track('server');
	calls.push(`init:${name}:${label}`);
	duringInit?.();
	effect(() => {
		calls.push(`effect:${name}`);
		return () => calls.push(`cleanup:${name}`);
	});
	<div data-name={name}>
		<input ref={bindValue(value)} />
		<span>{value.value}</span>
	</div>
}

export function App() @{
	const first = track<'visible' | 'hidden'>('hidden');
	const second = track<'visible' | 'hidden'>('hidden');
	const exists = track(true);
	context.set('context');
	controls = { first, second, exists };
	<main>
		@if (exists.value) {
			<Activity mode={first}>
				<Child name="first" />
			</Activity>
		}
		<Activity mode={second}>
			<Child name="second" />
		</Activity>
		<Child name="sibling" />
	</main>
}

export function Visible() @{
	context.set('context');
	<main>
		<Activity>
			<Child name="visible" />
		</Activity>
		<Child name="sibling" />
	</main>
}

export function Nested() @{
	const mode = track<'visible' | 'hidden'>('hidden');
	context.set('context');
	controls = { mode };
	<Activity mode={mode}>
		<Child name="parent" />
		<Activity>
			<Child name="nested" />
		</Activity>
	</Activity>
}

export function Text() @{
	const mode = track<'visible' | 'hidden'>('hidden');
	controls = { mode };
	<Activity mode={mode}>
		{'a < b & c'}
		<span style="display:grid!important">{'grid'}</span>
	</Activity>
}

export function Async() @{
	const mode = track<'visible' | 'hidden'>('hidden');
	const input = track(initial);
	controls = { mode, input };
	function AsyncChild() @{
		const data = trackAsync(async () => {
			calls.push('fetch');
			return input.value;
		});
		<p>{data.value}</p>
	}
	<Activity mode={mode}>
		<AsyncChild />
	</Activity>
}

export function Recovery() @{
	const mode = track<'visible' | 'hidden'>('hidden');
	const changed = track(false);
	controls = { mode, changed };
	<main>
		<Activity {mode}>
			@if (changed.value) {
				<section>new</section>
			} @else {
				<p>old</p>
			}
		</Activity>
		<footer>untouched</footer>
	</main>
}

function Broken() @{
	if (fail) throw new Error('deferred failure');
	<p>ok</p>
}

export function Errors() @{
	context.set('context');
	<>
		@try {
			<Activity mode="hidden">
				<Broken />
			</Activity>
		} @catch (error: Error) {
			<strong>{error.message}</strong>
		}
		<Activity mode="hidden">
			<Child name="after-error" />
		</Activity>
	</>
}

export function Stream() @{
	const mode = track<'visible' | 'hidden'>('hidden');
	controls = { mode };
	function Data() @{
		const data = trackAsync(() => stream);
		effect(() => {
			calls.push('stream effect');
		});
		<p class="stream-value">{data.value}</p>
	}
	<>
		<Activity {mode}>
			@try {
				<Data />
			} @pending {
				<span class="stream-pending">waiting</span>
			}
		</Activity>
		<button>ordinary sibling</button>
	</>
}
