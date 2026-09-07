import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createElement } from 'react';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Every op is flushSync-wrapped so React commits synchronously inside the timed
// window (React 19's createRoot otherwise schedules the commit after the call
// returns). NOT wrapping App in StrictMode keeps render counts apples-to-apples
// with the other adapters.
window.__hits = 0;
window.__mount = () => {
	root = createRoot(target);
	flushSync(() => root.render(createElement(App)));
};
window.__unmount = () => {
	if (root) {
		root.unmount();
		root = null;
	}
};
window.__reset = () => {
	if (root) {
		root.unmount();
		root = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__openA = () => flushSync(ops.openA);
window.__closeA = () => flushSync(ops.closeA);
window.__openB = () => flushSync(ops.openB);
window.__closeB = () => flushSync(ops.closeB);
window.__openBS = () => flushSync(ops.openBS);
window.__closeBS = () => flushSync(ops.closeBS);
window.__openAll = () => flushSync(ops.openAll);
window.__closeAll = () => flushSync(ops.closeAll);
window.__rerenderA = () => flushSync(ops.rerenderA);
window.__rerenderB = () => flushSync(ops.rerenderB);
window.__rerenderBS = () => flushSync(ops.rerenderBS);
window.__setDistinct = (on) => flushSync(() => ops.setDistinct(on));
window.__ready = true;
