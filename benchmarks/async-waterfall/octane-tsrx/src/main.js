import { createRoot } from 'octane';
import { Main } from './Main.tsrx';
import { LEVELS } from './data.js';

const target = document.getElementById('main');
const DEEP = `[data-level="${LEVELS - 1}"] .val`;

// Resolve with elapsed ms once the deepest level shows `text` — MutationObserver
// so the sample ends on the exact commit, not a poll tick.
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

// Harness contract (same in every target app):
//   __init()   → mount, resolve ms until the deepest level renders v0
//   __update() → bump the version, resolve ms until the deepest level shows it
window.__init = () => {
	const t0 = performance.now();
	createRoot(target).render(Main);
	return waitForDeep(`L${LEVELS - 1}:v0`, t0);
};

window.__update = () => {
	version += 1;
	const t0 = performance.now();
	window.__bump();
	return waitForDeep(`L${LEVELS - 1}:v${version}`, t0);
};
