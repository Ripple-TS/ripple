import { flushSync, mount } from 'svelte';
import App from './App.svelte';
import { LEVELS } from './data.js';

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
	flushSync(() => mount(App, { target }));
	return waitForDeep(`L${LEVELS - 1}:v0`, t0);
};

window.__update = () => {
	version += 1;
	const t0 = performance.now();
	flushSync(window.__bump);
	return waitForDeep(`L${LEVELS - 1}:v${version}`, t0);
};
