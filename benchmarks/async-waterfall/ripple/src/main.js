import { flushSync, mount } from 'ripple';
import { Main } from './Main.tsrx';
import { LEVELS } from './data.js';

const target = document.getElementById('main');
const DEEP = `[data-level="${LEVELS - 1}"] .val`;

function waitForDeep(text, t0) {
	return new Promise((resolve) => {
		const check = () => {
			const el = document.querySelector(DEEP);
			if (el && el.textContent === text) {
				obs.disconnect();
				resolve(performance.now() - t0);
			}
		};
		const obs = new MutationObserver(check);
		obs.observe(document.body, { childList: true, characterData: true, subtree: true });
		check();
	});
}

let version = 0;

// Effects run in a microtask after `mount()` returns; `flushSync` runs them
// before it does, so every level's request starts inside the mount, as the
// Svelte fixture's `flushSync(() => mount(...))` and Inferno's synchronous
// `componentDidMount` do.
window.__init = () => {
	const t0 = performance.now();
	flushSync(() => mount(Main, { rootBoundary: false, target }));
	return waitForDeep(`L${LEVELS - 1}:v0`, t0);
};

window.__update = () => {
	version += 1;
	const t0 = performance.now();
	flushSync(window.__bump);
	return waitForDeep(`L${LEVELS - 1}:v${version}`, t0);
};
