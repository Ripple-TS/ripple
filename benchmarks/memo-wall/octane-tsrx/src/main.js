// Probes must install window.__renders before anything renders.
import './probes.js';
import { createRoot, flushSync } from 'octane';
import App from './App.tsrx';
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
let root = null;

// index.html does NOT auto-mount; the harness wraps each call in performance.now().
window.__mount = () => {
	root = createRoot(target);
	root.render(App);
};
window.__tickA = () => flushSync(parentRerenderA);
window.__tickB = () => flushSync(parentRerenderB);
window.__oneChangeA = () => flushSync(oneChangeA);
window.__oneChangeB = () => flushSync(oneChangeB);
window.__ctxA = () => flushSync(ctxA);
window.__ctxB = () => flushSync(ctxB);
window.__state = currentState;
window.__unmount = () => {
	if (root) {
		root.unmount();
		root = null;
	}
};
window.__ready = true;
