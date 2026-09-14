import { track, trackAsync } from 'ripple';

interface Control {
	promise: Promise<string>;
	resolve: (value: string) => void;
	reject: (reason?: unknown) => void;
}

function make(): Control {
	let resolve: (value: string) => void = () => {};
	let reject: (reason?: unknown) => void = () => {};
	const promise = new Promise<string>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

export const controls: Record<string, Control> = {};

export function resetControls() {
	controls.basic = make();
	controls.catchOnly = make();
	controls.rejects = make();
	controls.noCatch = make();
	controls.outer = make();
	controls.inner = make();
	controls.rootDirect = make();
	controls.head = make();
}

resetControls();

function BasicContent() @{
	const data = trackAsync(() => controls.basic.promise);
	const count = track(0);
	<div class="resolved">
		<span class="value">{data.value + ':' + count.value}</span>
		<button class="inc" onClick={() => count.value++}>{'inc'}</button>
	</div>
}

export function StreamPending() @{
	<>
		<span class="before">{'before'}</span>
		@try {
			<>
				<BasicContent />
				<footer class="after-async">{'after-async'}</footer>
			</>
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
		<span class="sibling-after">{'sibling-after'}</span>
	</>
}

function CatchOnlyContent() @{
	const data = trackAsync(() => controls.catchOnly.promise);
	<p class="resolved">{data.value}</p>
}

export function StreamCatchOnly() @{
	<>
		<span class="before">{'before'}</span>
		@try {
			<CatchOnlyContent />
		} @catch (e: Error) {
			<em class="caught">{e.message}</em>
		}
	</>
}

function RejectContent() @{
	const data = trackAsync(() => controls.rejects.promise);
	<p class="resolved">{data.value}</p>
}

export function StreamRejects() @{
	@try {
		<RejectContent />
	} @pending {
		<p class="loading">{'loading...'}</p>
	} @catch (e: Error) {
		<em class="caught">{e.message}</em>
	}
}

function NoCatchContent() @{
	const data = trackAsync(() => controls.noCatch.promise);
	<p class="resolved">{data.value}</p>
}

export function StreamNoCatch() @{
	@try {
		<NoCatchContent />
	} @pending {
		<p class="loading">{'loading...'}</p>
	}
}

export function RootCatch({ error, reset }: { error: Error; reset: () => void }) @{
	<section class="root-catch" onClick={reset}>{error.message}</section>
}

export function RootPending() @{
	<p class="root-pending">{'root-loading'}</p>
}

function HeadContent() @{
	const data = trackAsync(() => controls.head.promise);
	<>
		@if (data.value) {
			<>
				<head>
					<title>{'title:' + data.value}</title>
				</head>
				<p class="head-content">{data.value}</p>
			</>
		}
	</>
}

export function StreamHead() @{
	@try {
		<HeadContent />
	} @pending {
		<p class="loading">{'loading...'}</p>
	}
}

export function StreamRootDirect() @{
	const data = trackAsync(() => controls.rootDirect.promise);
	<p class="root-async">{data.value}</p>
}

function OuterContent() @{
	const data = trackAsync(() => controls.outer.promise);
	<p class="outer">{data.value}</p>
}

function InnerContent() @{
	const data = trackAsync(() => controls.inner.promise);
	<p class="inner">{data.value}</p>
}

export function StreamNested() @{
	@try {
		<>
			<OuterContent />
			@try {
				<InnerContent />
			} @pending {
				<p class="inner-loading">{'inner-loading'}</p>
			}
		</>
	} @pending {
		<p class="outer-loading">{'outer-loading'}</p>
	}
}
