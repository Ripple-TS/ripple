import { flushSync, mount } from 'ripple';
import App from './App.tsrx';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import '../../octane-tsrx/src/style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let unmount = null;

window.__mount = () => {
	unmount = mount(App, { target });
};

window.__reset = () => {
	if (unmount !== null) unmount();
	unmount = null;
	clearSetter();
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__prepare = (name) => flushSync(() => commit(caseByName(name).before));
window.__run = (name) => flushSync(() => commit(caseByName(name).after));
window.__ready = true;
