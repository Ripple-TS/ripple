import { createElement, render } from 'preact';
import App from './App.jsx';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import '../../octane-tsrx/src/style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let mounted = false;
const flush = () => Promise.resolve();

window.__mount = () => {
	render(createElement(App), target);
	mounted = true;
	return flush();
};

window.__reset = () => {
	if (mounted) render(null, target);
	mounted = false;
	clearSetter();
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__prepare = (name) => {
	commit(caseByName(name).before);
	return flush();
};
window.__run = (name) => {
	commit(caseByName(name).after);
	return flush();
};
window.__ready = true;
