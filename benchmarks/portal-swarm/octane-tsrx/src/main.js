import { createRoot, flushSync } from 'octane';
import App from './App.tsrx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// index.html does NOT auto-mount; the harness wraps each call in
// performance.now(). Every op flushes synchronously (flushSync) so the timed
// window contains the full commit — same methodology as the sibling benches.
window.__hits = 0;
window.__mount = () => {
	root = createRoot(target);
	root.render(App);
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
