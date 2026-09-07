import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import '../../octane-tsrx/src/style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let root = null;

window.__mount = () => {
	root = createRoot(target);
	flushSync(() => root.render(createElement(App)));
};

window.__reset = () => {
	if (root !== null) root.unmount();
	root = null;
	clearSetter();
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__prepare = (name) => flushSync(() => commit(caseByName(name).before));
window.__run = (name) => flushSync(() => commit(caseByName(name).after));
window.__ready = true;
