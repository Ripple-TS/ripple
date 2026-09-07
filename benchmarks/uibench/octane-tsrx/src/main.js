import { createRoot, flushSync } from 'octane';
import App from './App.tsrx';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import './style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let root = null;

window.__mount = () => {
	root = createRoot(target);
	root.render(App);
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
