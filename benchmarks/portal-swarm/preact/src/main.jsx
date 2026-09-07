import { createElement, render } from 'preact';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let mounted = false;
const update = (run) => {
	run();
	return Promise.resolve();
};
window.__hits = 0;
window.__mount = () => {
	render(createElement(App), target);
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
};
window.__openA = () => update(ops.openA);
window.__closeA = () => update(ops.closeA);
window.__openB = () => update(ops.openB);
window.__closeB = () => update(ops.closeB);
window.__openBS = () => update(ops.openBS);
window.__closeBS = () => update(ops.closeBS);
window.__openAll = () => update(ops.openAll);
window.__closeAll = () => update(ops.closeAll);
window.__rerenderA = () => update(ops.rerenderA);
window.__rerenderB = () => update(ops.rerenderB);
window.__rerenderBS = () => update(ops.rerenderBS);
window.__setDistinct = (on) => update(() => ops.setDistinct(on));
window.__ready = true;
