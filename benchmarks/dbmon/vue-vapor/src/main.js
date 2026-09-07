import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import { tickFull, tickPartial, remount, sortRows } from './ops.js';

const target = document.getElementById('main');
let app = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Vapor's initial mount renders synchronously, but UPDATES flush on a microtask
// (queueJob → flushJobs) with no public synchronous flush, so every update op
// returns nextTick() and the harness awaits it inside the timed window (its
// measure loops detect a returned thenable — see ../run.mjs). nextTick settles
// after flushJobs completes, i.e. after the DOM mutation has landed; the
// microtask hop is Vue's own scheduling cost, so it belongs in the measurement.
window.__mount = () => {
	app = createVaporApp(App);
	app.mount(target);
};
window.__tick = () => {
	tickFull();
	return nextTick();
};
window.__tickPartial = () => {
	tickPartial();
	return nextTick();
};
window.__remount = () => {
	remount();
	return nextTick();
};
window.__sort = () => {
	sortRows();
	return nextTick();
};
window.__unmount = () => {
	if (app) {
		app.unmount();
		app = null;
	}
};
window.__reset = () => {
	if (app) {
		app.unmount();
		app = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
