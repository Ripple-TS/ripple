import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import { bumpAt } from './bumps.js';

const target = document.getElementById('main');
let app = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
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
// Vue batches updates and flushes on a microtask (queueJob → flushJobs) with
// no public synchronous flush, so every bump returns nextTick() — it settles
// after flushJobs completes, i.e. after the DOM mutation has landed. The
// harness awaits a returned thenable inside the timed window (and BETWEEN
// reps, so bumps can't coalesce); the microtask hop is Vue's own scheduling
// cost, so it belongs inside the measurement (see ../run.mjs).
window.__bumpAt1 = () => {
	bumpAt(1);
	return nextTick();
};
window.__bumpAt11 = () => {
	bumpAt(11);
	return nextTick();
};
window.__bumpAt21 = () => {
	bumpAt(21);
	return nextTick();
};
window.__bumpAt31 = () => {
	bumpAt(31);
	return nextTick();
};
window.__bumpAt41 = () => {
	bumpAt(41);
	return nextTick();
};
window.__bumpAt51 = () => {
	bumpAt(51);
	return nextTick();
};
window.__bumpAt61 = () => {
	bumpAt(61);
	return nextTick();
};
window.__bumpAt71 = () => {
	bumpAt(71);
	return nextTick();
};
window.__bumpAt81 = () => {
	bumpAt(81);
	return nextTick();
};
window.__bumpAt91 = () => {
	bumpAt(91);
	return nextTick();
};
// Batched sweep: enqueue all 10 stateful bumps, then ONE nextTick() — Vue's
// natural microtask coalescing (one flushJobs pass). Contrast bump_sweep,
// where the harness awaits each bump's nextTick() (a flush per change).
window.__sweepBatched = () => {
	bumpAt(1);
	bumpAt(11);
	bumpAt(21);
	bumpAt(31);
	bumpAt(41);
	bumpAt(51);
	bumpAt(61);
	bumpAt(71);
	bumpAt(81);
	bumpAt(91);
	return nextTick();
};
// Same batch queued DESCENDANT-first (deepest stateful node first).
window.__sweepBatchedReverse = () => {
	bumpAt(91);
	bumpAt(81);
	bumpAt(71);
	bumpAt(61);
	bumpAt(51);
	bumpAt(41);
	bumpAt(31);
	bumpAt(21);
	bumpAt(11);
	bumpAt(1);
	return nextTick();
};
window.__ready = true;
