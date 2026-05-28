import { trackAsync } from 'ripple';

export function RootPending() {
	return <><p class="root-pending">{'root loading...'}</p></>;
}

export function RootCatch({ error, reset }: { error: Error; reset: () => void }) {
	return <>
		<section class="root-catch">
			<p class="root-error">{error.message}</p>
			<button class="root-reset" onClick={reset}>{'retry'}</button>
		</section>
	</>;
}

export function RootThrows() {
	return <>
		throw new Error('root exploded');
		<p>{'should not render'}</p>
	</>;
}

export function RootAsyncDirect() {
	return <>
		let &[value] = trackAsync(() => Promise.resolve('root async value'));
		<p class="root-async-value">{value}</p>
	</>;
}

export function RootAsyncRejects() {
	return <>
		let &[value] = trackAsync(() => Promise.reject(new Error('root async failed')));
		<p class="root-async-value">{value}</p>
	</>;
}

export function AsyncListInTryPending() {
	return <>
		try {
			<AsyncList />
		} pending {
			<p class="loading">{'loading...'}</p>
		}
	</>;
}

function AsyncList() {
	return <>
		let &[items] = trackAsync(() => Promise.resolve(['alpha', 'beta', 'gamma']));
		<ul class="items">
			for (let item of items) {
				<li>{item}</li>
			}
		</ul>
	</>;
}

export function AsyncTryWithLeadingSibling() {
	return <>
		<div class="before">{'before'}</div>
		try {
			<AsyncContent />
		} pending {
			<div class="loading">{'loading async content'}</div>
		}
	</>;
}

function AsyncContent() {
	return <>
		let &[value] = trackAsync(() => Promise.resolve('ready'));
		<div class="resolved">{value}</div>
	</>;
}
