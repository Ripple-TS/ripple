import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createElement } from 'react';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// No StrictMode: render counts stay apples-to-apples with the other adapters.
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
