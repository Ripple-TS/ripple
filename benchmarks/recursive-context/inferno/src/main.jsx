import { createComponentVNode, render, rerender } from 'inferno';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.jsx';

const target = document.getElementById('main');
let mounted = false;
const run = (operation) => {
	operation();
	rerender();
};

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	render(createComponentVNode(4, App, { depth: 10 }), target);
	mounted = true;
};
window.__updateRoot = () => run(bumpRoot);
window.__updatePartial = () => run(bumpPartial);
window.__partialUnmount = () => run(hideMid);
window.__partialRemount = () => run(showMid);
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
