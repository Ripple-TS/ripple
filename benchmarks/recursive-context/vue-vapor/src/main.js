import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import { bumpRoot, bumpPartial, hideMid, showMid, D } from './state.js';

const target = document.getElementById('main');
let app = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	app = createVaporApp(App, { depth: D });
	app.mount(target);
};
// Vue batches updates and flushes on a microtask (queueJob → flushJobs) with
// no public synchronous flush, so every update op returns nextTick() — it
// settles after flushJobs completes, i.e. after the DOM mutation has landed.
// The harness detects a returned thenable and extends the timed window until
// it settles (see ../run.mjs); the microtask hop is Vue's own scheduling
// cost, so it belongs inside the measurement.
window.__updateRoot = () => {
	bumpRoot();
	return nextTick();
};
window.__updatePartial = () => {
	bumpPartial();
	return nextTick();
};
// Partial unmount/remount of the Mid subtree.
window.__partialUnmount = () => {
	hideMid();
	return nextTick();
};
window.__partialRemount = () => {
	showMid();
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
