import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let dispose = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Solid 2.0 batches + flushes async, so `flush()` forces the DOM mutation to
// complete synchronously inside the timed call (matching the other adapters).
const run = (fn) => () => {
	fn();
	flush();
};

window.__mount = () => {
	dispose = render(() => <App />, target);
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
	ops.reset();
};
window.__tick = run(ops.tick);
window.__tickSparse = run(ops.tickSparse);
window.__dragFrame = run(ops.dragFrame);
window.__panZoomStep = run(ops.panZoomStep);
window.__toggleSelect = run(ops.toggleSelect);
window.__churnTopology = run(ops.churnTopology);
window.__labelChurn = run(ops.labelChurn);
window.__tooltipStep = run(ops.tooltipStep);
window.__swapIcons = run(ops.swapIcons);
window.__toggleSeries = run(ops.toggleSeries);
window.__pulseEdges = run(ops.pulseEdges);
window.__state = () => ops.currentState();
window.__ready = true;
