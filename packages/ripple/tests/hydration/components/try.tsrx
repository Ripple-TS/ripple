import { trackAsync } from 'ripple';

export component AsyncListInTryPending() {
	try {
		<AsyncList />
	} pending {
		<p class="loading">{'loading...'}</p>
	}
}

component AsyncList() {
	let &[items] = trackAsync(() => Promise.resolve(['alpha', 'beta', 'gamma']));

	<ul class="items">
		for (let item of items) {
			<li>{item}</li>
		}
	</ul>
}

export component AsyncTryWithLeadingSibling() {
	<div class="before">{'before'}</div>
	try {
		<AsyncContent />
	} pending {
		<div class="loading">{'loading async content'}</div>
	}
}

component AsyncContent() {
	let &[value] = trackAsync(() => Promise.resolve('ready'));
	<div class="resolved">{value}</div>
}
