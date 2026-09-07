// Probes must install window.__renders before anything renders.
import './probes.js';
import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App from './App.jsx';
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
// performance.now(). Solid 2.0 batches + flushes async, so every op hook calls
// flush() to force the commit to complete synchronously inside the timed
// window (matching the other adapters).
const F = (fn) => () => {
	fn();
	flush();
};

window.__mount = () => {
	dispose = render(() => <App />, target);
	flush();
};
window.__tickA = F(parentRerenderA);
window.__tickB = F(parentRerenderB);
window.__oneChangeA = F(oneChangeA);
window.__oneChangeB = F(oneChangeB);
window.__ctxA = F(ctxA);
window.__ctxB = F(ctxB);
window.__state = currentState;
window.__unmount = () => {
	if (dispose) {
		dispose();
		dispose = null;
	}
};
window.__ready = true;
