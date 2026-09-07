// Probes must install window.__renders before anything renders.
import './probes.js';
import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import {
	parentRerenderA,
	parentRerenderB,
	oneChangeA,
	oneChangeB,
	ctxA,
	ctxB,
	currentState,
} from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;

// index.html does NOT auto-mount — the harness wraps each call in
// performance.now(). Vapor's initial mount renders synchronously, but UPDATES
// flush on a microtask with no public synchronous flush, so every op hook
// returns nextTick() and the harness awaits the thenable inside the timed
// window (see ../run.mjs) — the scheduling hop is Vue's own commit cost, so it
// belongs in the measurement.
const F = (fn) => () => {
	fn();
	return nextTick();
};

window.__mount = () => {
	app = createVaporApp(App);
	app.mount(target);
};
window.__tickA = F(parentRerenderA);
window.__tickB = F(parentRerenderB);
window.__oneChangeA = F(oneChangeA);
window.__oneChangeB = F(oneChangeB);
window.__ctxA = F(ctxA);
window.__ctxB = F(ctxB);
window.__state = currentState;
window.__unmount = () => {
	if (app) {
		app.unmount();
		app = null;
	}
};
window.__ready = true;
