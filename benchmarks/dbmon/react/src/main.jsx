import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createElement } from 'react';
import App from './App.jsx';
import { tickFull, tickPartial, remount, sortRows } from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// NOT wrapping App in StrictMode keeps render counts apples-to-apples with the
// other adapters (StrictMode double-invokes in dev).
window.__mount = () => {
	root = createRoot(target);
	flushSync(() => root.render(createElement(App)));
};
window.__tick = () => flushSync(tickFull);
window.__tickPartial = () => flushSync(tickPartial);
window.__remount = () => flushSync(remount);
window.__sort = () => flushSync(sortRows);
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
window.__ready = true;
