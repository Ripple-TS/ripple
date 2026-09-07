import { createComponentVNode, render, rerender } from 'inferno';
import App from './App.jsx';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import '../../octane-tsrx/src/style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let mounted = false;

window.__mount = () => {
	render(createComponentVNode(4, App), target);
	mounted = true;
};

window.__reset = () => {
	if (mounted) render(null, target);
	mounted = false;
	clearSetter();
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__prepare = (name) => {
	commit(caseByName(name).before);
	rerender();
};
window.__run = (name) => {
	commit(caseByName(name).after);
	rerender();
};
window.__ready = true;
