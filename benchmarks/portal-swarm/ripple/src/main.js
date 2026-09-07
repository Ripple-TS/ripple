import { mount, flushSync } from 'ripple';
import App from './Main.tsrx';
import * as ops from './ops.js';

const target = document.getElementById('main');
let dispose = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Ripple batches + flushes async, so every hook runs inside flushSync() to force
// the DOM mutation to complete synchronously inside the timed call (matching
// the other adapters).
const F = (fn) => () => flushSync(fn);

window.__hits = 0;
window.__mount = () =>
	flushSync(() => {
		dispose = mount(App, { target });
	});
window.__unmount = () => {
	if (dispose) {
		flushSync(dispose);
		dispose = null;
	}
};
window.__reset = () => {
	if (dispose) {
		flushSync(dispose);
		dispose = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__openA = F(ops.openA);
window.__closeA = F(ops.closeA);
window.__openB = F(ops.openB);
window.__closeB = F(ops.closeB);
window.__openBS = F(ops.openBS);
window.__closeBS = F(ops.closeBS);
window.__openAll = F(ops.openAll);
window.__closeAll = F(ops.closeAll);
window.__rerenderA = F(ops.rerenderA);
window.__rerenderB = F(ops.rerenderB);
window.__rerenderBS = F(ops.rerenderBS);
window.__setDistinct = (on) => flushSync(() => ops.setDistinct(on));
window.__ready = true;
