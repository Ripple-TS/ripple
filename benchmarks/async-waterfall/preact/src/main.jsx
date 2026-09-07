import { render } from 'preact';
import { useState } from 'preact/hooks';
import { startTransition, Suspense } from 'preact/compat';
import { fetchData, LEVELS } from './data.js';

const records = new WeakMap();

function read(promise) {
	let record = records.get(promise);
	if (record === undefined) {
		record = { status: 'pending', value: promise };
		record.value.then(
			(value) => {
				record.status = 'fulfilled';
				record.value = value;
			},
			(error) => {
				record.status = 'rejected';
				record.value = error;
			},
		);
		records.set(promise, record);
	}
	if (record.status === 'pending' || record.status === 'rejected') throw record.value;
	return record.value;
}

function Level({ level, version }) {
	const data = read(fetchData(level, version));
	return (
		<div class="level" data-level={level}>
			<span class="val">{data}</span>
			{level < LEVELS - 1 ? <Level level={level + 1} version={version} /> : null}
		</div>
	);
}

function Main() {
	const [version, setVersion] = useState(0);
	window.__bump = () => startTransition(() => setVersion((value) => value + 1));
	return (
		<Suspense fallback={<p class="loading">loading…</p>}>
			<Level level={0} version={version} />
		</Suspense>
	);
}

const target = document.getElementById('main');
const DEEP = `[data-level="${LEVELS - 1}"] .val`;

function waitForDeep(text, t0) {
	return new Promise((resolve) => {
		const check = () => {
			const element = document.querySelector(DEEP);
			if (element && element.textContent === text) {
				observer.disconnect();
				resolve(performance.now() - t0);
			}
		};
		const observer = new MutationObserver(check);
		observer.observe(document.body, { childList: true, characterData: true, subtree: true });
		check();
	});
}

let version = 0;

window.__init = () => {
	const t0 = performance.now();
	render(<Main />, target);
	return waitForDeep(`L${LEVELS - 1}:v0`, t0);
};

window.__update = () => {
	version += 1;
	const t0 = performance.now();
	window.__bump();
	return waitForDeep(`L${LEVELS - 1}:v${version}`, t0);
};
