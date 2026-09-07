// Probes must install window.__renders before anything renders.
import './probes.js';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createElement } from 'react';
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
let root = null;

// index.html does NOT auto-mount — the harness wraps each call in
// performance.now(). Every op hook is flushSync-wrapped so React commits the
// update SYNCHRONOUSLY inside the timed window, the way octane flushes (the
// work is identical — each op is a single state update, nothing to batch).
// NOT wrapping App in StrictMode keeps render counts apples-to-apples with the
// octane adapters (StrictMode double-invokes in dev).
window.__mount = () => {
	root = createRoot(target);
	flushSync(() => root.render(createElement(App)));
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
