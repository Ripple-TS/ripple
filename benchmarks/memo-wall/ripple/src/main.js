// Probes must install window.__renders before anything renders.
import './probes.js';
import { mount, flushSync } from 'ripple';
import App from './Main.tsrx';
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
let dispose = null;

// index.html does NOT auto-mount — the harness wraps each call in
// performance.now(). Ripple batches + flushes async, so every op hook runs
// inside flushSync() to force the commit to complete synchronously inside the
// timed window (matching the other adapters).
const F = (fn) => () => flushSync(fn);

window.__mount = () =>
	flushSync(() => {
		dispose = mount(App, { target });
	});
window.__tickA = F(parentRerenderA);
window.__tickB = F(parentRerenderB);
window.__oneChangeA = F(oneChangeA);
window.__oneChangeB = F(oneChangeB);
window.__ctxA = F(ctxA);
window.__ctxB = F(ctxB);
window.__state = currentState;
window.__unmount = () => {
	if (dispose) {
		flushSync(dispose);
		dispose = null;
	}
};
window.__ready = true;
