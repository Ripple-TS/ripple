import { trackAsync } from 'ripple';

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
