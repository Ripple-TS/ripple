import { mount, flushSync } from 'ripple';
import App from './App.tsrx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let dispose = null;

// index.html does NOT auto-mount; the harness wraps each call in
// performance.now(). Every op hook commits synchronously via flushSync.
window.__mount = () =>
	flushSync(() => {
		dispose = mount(App, { target, rootBoundary: false });
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
	ops.reset();
};
window.__tick = () => flushSync(ops.tick);
window.__tickSparse = () => flushSync(ops.tickSparse);
window.__dragFrame = () => flushSync(ops.dragFrame);
window.__panZoomStep = () => flushSync(ops.panZoomStep);
window.__toggleSelect = () => flushSync(ops.toggleSelect);
window.__churnTopology = () => flushSync(ops.churnTopology);
window.__labelChurn = () => flushSync(ops.labelChurn);
window.__tooltipStep = () => flushSync(ops.tooltipStep);
window.__swapIcons = () => flushSync(ops.swapIcons);
window.__toggleSeries = () => flushSync(ops.toggleSeries);
window.__pulseEdges = () => flushSync(ops.pulseEdges);
window.__state = () => ops.currentState();
window.__ready = true;
