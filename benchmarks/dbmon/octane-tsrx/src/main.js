import { createRoot, flushSync } from 'octane';
import App from './App.tsrx';
import { tickFull, tickPartial, remount, sortRows } from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// index.html does NOT auto-mount; the harness wraps each call in performance.now().
window.__mount = () => {
	root = createRoot(target);
	root.render(App);
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
