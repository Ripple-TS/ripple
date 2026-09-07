import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
let dispose = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Solid 2.0 batches + flushes async, so `flush()` forces the DOM mutation to
// complete synchronously inside the timed call (matching the other adapters).
const F = (fn) => () => {
	fn();
	flush();
};

window.__hits = 0;
window.__mount = () => {
	dispose = render(() => <App />, target);
	flush();
};
window.__unmount = () => {
	if (dispose) {
		dispose();
		dispose = null;
	}
};
window.__reset = () => {
	if (dispose) {
		dispose();
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
window.__setDistinct = (on) => {
	ops.setDistinct(on);
	flush();
};
window.__ready = true;
