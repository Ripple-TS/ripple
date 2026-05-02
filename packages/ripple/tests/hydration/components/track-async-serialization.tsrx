import { track, trackAsync } from 'ripple';

module server {
	export async function formatValue(n: number): Promise<string> {
		return `server-${n}`;
	}
}

import { formatValue } from server;

export component AsyncWithServerCall() {
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
}

export component AsyncSimpleValue() {
	try {
		let &[data] = trackAsync(() => Promise.resolve('hydrated value'));
		<p class="result">{data}</p>
	} pending {
		<p class="loading">{'loading...'}</p>
	}
}

export component AsyncNumericValue() {
	try {
		let &[count] = trackAsync(() => Promise.resolve(42));
		<span class="count">{count}</span>
	} pending {
		<span class="pending">{'...'}</span>
	}
}

export component AsyncObjectValue() {
	try {
		let &[user] = trackAsync(() => Promise.resolve({ name: 'Alice', age: 30 }));
		<div class="user">
			<span class="name">{user.name}</span>
			<span class="age">{user.age}</span>
		</div>
	} pending {
		<div class="loading">{'loading user...'}</div>
	}
}

export component AsyncMultipleValues() {
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
}

export component AsyncWithCatch() {
	try {
		let &[data] = trackAsync(() => Promise.reject(new Error('fetch failed')));
		<p class="result">{data}</p>
	} pending {
		<p class="loading">{'loading...'}</p>
	} catch (e) {
		<p class="error">{(e as Error).message}</p>
	}
}

export component ChildWithError() {
	try {
		let &[data] = trackAsync(() => Promise.reject(new Error('child error')));
		<p class="result">{data}</p>
	} pending {
		<p class="pending">{'loading...'}</p>
	}
}

export component ParentWithCatch() {
	try {
		<ChildWithError />
	} catch (e) {
		<p class="parent-error">{(e as Error).message}</p>
	}
}

export component AsyncWithReactiveDependency() {
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
}
