import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;

// Vue commits updates on a microtask (queueJob → flushJobs) and — unlike the
// flushSync/flush() adapters — exposes no public synchronous flush. So every
// op returns nextTick(), which settles after flushJobs completes (DOM mutated
// AND the post-flush queue — the __fx-counting watchPostEffects — drained).
// The harness detects a returned thenable and extends the timed window until
// it settles (see ../run.mjs); the microtask hop is Vue's own scheduling cost,
// so it belongs inside the measurement.
const run = (fn) => {
	fn();
	return nextTick();
};

window.__mount = () => {
	app = createVaporApp(App);
	app.mount(target);
};

window.__toEmpty = () => run(toEmpty);
window.__toFresh1k = () => run(toFresh1k);

window.__opMount1k = () => run(toFresh1k);
window.__opUpdateNodeps = () => run(updateNodeps);
window.__opUpdateDeps = () => run(updateDeps);
window.__opClear = () => run(toEmpty);
window.__opRemount = () => run(toFresh1k);
window.__opRemove100 = () => run(remove100);

window.__ready = true;
