import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	flushSync(() => {
		app = mount(App, { target });
	});
};
window.__unmount = () => {
	if (!app) return;
	const current = app;
	app = null;
	return unmount(current);
};
window.__reset = () => {
	if (app) {
		void unmount(app);
		app = null;
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
