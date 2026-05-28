import { track, trackAsync } from 'ripple';

module server {
	export async function formatValue(n: number): Promise<string> {
		return `server-${n}`;
	}
}

import { formatValue } from server;

export function AsyncWithServerCall() {
	return <>
		let &[count] = track(0);
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>
			{'increment'}
		</button>
		try {
			let &[data] = trackAsync(() => formatValue(count));
			<p class="result">{data}</p>
		} pending {
			<p class="loading">{'loading...'}</p>
		}
	</>;
}

export function AsyncSimpleValue() {
	return <>
		try {
			let &[data] = trackAsync(() => Promise.resolve('hydrated value'));
			<p class="result">{data}</p>
		} pending {
			<p class="loading">{'loading...'}</p>
		}
	</>;
}

export function AsyncNumericValue() {
	return <>
		try {
			let &[count] = trackAsync(() => Promise.resolve(42));
			<span class="count">{count}</span>
		} pending {
			<span class="pending">{'...'}</span>
		}
	</>;
}

export function AsyncObjectValue() {
	return <>
		try {
			let &[user] = trackAsync(() => Promise.resolve({ name: 'Alice', age: 30 }));
			<div class="user">
				<span class="name">{user.name}</span>
				<span class="age">{user.age}</span>
			</div>
		} pending {
			<div class="loading">{'loading user...'}</div>
		}
	</>;
}

export function AsyncMultipleValues() {
	return <>
		try {
			let &[first] = trackAsync(() => Promise.resolve('alpha'));
			let &[second] = trackAsync(() => Promise.resolve('beta'));
			<div class="multi">
				<span class="first">{first}</span>
				<span class="second">{second}</span>
			</div>
		} pending {
			<div class="loading">{'loading...'}</div>
		}
	</>;
}

export function AsyncWithCatch() {
	return <>
		try {
			let &[data] = trackAsync(() => Promise.reject(new Error('fetch failed')));
			<p class="result">{data}</p>
		} pending {
			<p class="loading">{'loading...'}</p>
		} catch (e) {
			<p class="error">{(e as Error).message}</p>
		}
	</>;
}

export function ChildWithError() {
	return <>
		try {
			let &[data] = trackAsync(() => Promise.reject(new Error('child error')));
			<p class="result">{data}</p>
		} pending {
			<p class="pending">{'loading...'}</p>
		}
	</>;
}

export function ParentWithCatch() {
	return <>
		try {
			<ChildWithError />
		} catch (e) {
			<p class="parent-error">{(e as Error).message}</p>
		}
	</>;
}

export function AsyncWithReactiveDependency() {
	return <>
		let &[count] = track(0);
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>
			{'increment'}
		</button>
		try {
			let &[data] = trackAsync(() => Promise.resolve(`count-${count}`));
			<p class="result">{data}</p>
		} pending {
			<p class="loading">{'loading...'}</p>
		}
	</>;
}
