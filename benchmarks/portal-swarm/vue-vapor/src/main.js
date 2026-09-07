import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import * as ops from './ops.js';

const target = document.getElementById('main');
let app = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Vapor's initial mount renders synchronously, but UPDATES flush on a microtask
// with no public synchronous flush, so every state-changing op returns
// nextTick() and the harness awaits the thenable inside the timed window (see
// ../run.mjs) — the scheduling hop is Vue's own commit cost, so it belongs in
// the measurement.
const F = (fn) => () => {
	fn();
	return nextTick();
};

window.__hits = 0;
window.__mount = () => {
	app = createVaporApp(App);
	app.mount(target);
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
window.__openA = F(ops.openA);
window.__closeA = F(ops.closeA);
window.__openB = F(ops.openB);
window.__closeB = F(ops.closeB);
window.__openBS = F(ops.openBS);
window.__closeBS = F(ops.closeBS);
window.__openAll = F(ops.openAll);
window.__closeAll = F(ops.closeAll);
window.__rerenderA = F(ops.rerenderA);
window.__rerenderB = F(ops.rerenderB);
window.__rerenderBS = F(ops.rerenderBS);
window.__setDistinct = (on) => {
	ops.setDistinct(on);
	return nextTick();
};
window.__ready = true;
