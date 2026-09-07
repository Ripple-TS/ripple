import { createElement, render } from 'preact';
import App, { bumpPartial, bumpRoot, hideMid, showMid } from './App.jsx';

const target = document.getElementById('main');
let mounted = false;
const update = (run) => {
	run();
	return Promise.resolve();
};

window.__mount = () => {
	render(createElement(App, { depth: 10 }), target);
	mounted = true;
};
window.__updateRoot = () => update(bumpRoot);
window.__updatePartial = () => update(bumpPartial);
window.__partialUnmount = () => update(hideMid);
window.__partialRemount = () => update(showMid);
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
