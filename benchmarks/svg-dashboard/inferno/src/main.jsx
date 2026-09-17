import { createComponentVNode, render, rerender } from 'inferno';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let mounted = false;
const run = (operation) => {
	operation();
	rerender();
};

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	render(createComponentVNode(4, App), target);
	mounted = true;
};
window.__unmount = () => {
	if (mounted) {
		render(null, target);
		mounted = false;
	}
};
window.__reset = () => {
	if (mounted) {
		render(null, target);
		mounted = false;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
	ops.reset();
};
window.__tick = () => run(ops.tick);
window.__tickSparse = () => run(ops.tickSparse);
window.__dragFrame = () => run(ops.dragFrame);
window.__panZoomStep = () => run(ops.panZoomStep);
window.__toggleSelect = () => run(ops.toggleSelect);
window.__churnTopology = () => run(ops.churnTopology);
window.__labelChurn = () => run(ops.labelChurn);
window.__tooltipStep = () => run(ops.tooltipStep);
window.__swapIcons = () => run(ops.swapIcons);
window.__toggleSeries = () => run(ops.toggleSeries);
window.__pulseEdges = () => run(ops.pulseEdges);
window.__state = () => ops.currentState();
window.__ready = true;
