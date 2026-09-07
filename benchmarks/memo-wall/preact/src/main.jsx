// Probes must exist before any component renders.
import './probes.js';
import { createElement, render } from 'preact';
import App from './App.jsx';
import {
	ctxA,
	ctxB,
	currentState,
	oneChangeA,
	oneChangeB,
	parentRerenderA,
	parentRerenderB,
} from './ops.js';

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
window.__tickA = () => update(parentRerenderA);
window.__tickB = () => update(parentRerenderB);
window.__oneChangeA = () => update(oneChangeA);
window.__oneChangeB = () => update(oneChangeB);
window.__ctxA = () => update(ctxA);
window.__ctxB = () => update(ctxB);
window.__state = currentState;
window.__unmount = () => {
	if (mounted) {
		render(null, target);
		mounted = false;
	}
};
window.__ready = true;
