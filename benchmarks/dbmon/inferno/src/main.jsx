import { createComponentVNode, render, rerender } from 'inferno';
import App from './App.jsx';
import { tickFull, tickPartial, remount, sortRows } from './ops.js';

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
window.__tick = () => run(tickFull);
window.__tickPartial = () => run(tickPartial);
window.__remount = () => run(remount);
window.__sort = () => run(sortRows);
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
};
window.__ready = true;
