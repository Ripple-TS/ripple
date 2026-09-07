import { createElement, render } from 'preact';
import App from './App.jsx';
import { remount, sortRows, tickFull, tickPartial } from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let mounted = false;
const update = (run) => {
	run();
	return Promise.resolve();
};

window.__mount = () => {
	render(createElement(App), target);
	mounted = true;
};
window.__tick = () => update(tickFull);
window.__tickPartial = () => update(tickPartial);
window.__remount = () => update(remount);
window.__sort = () => update(sortRows);
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
