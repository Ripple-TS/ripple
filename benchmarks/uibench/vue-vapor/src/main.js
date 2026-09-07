import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import '../../octane-tsrx/src/style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let app = null;

window.__mount = () => {
	app = createVaporApp(App);
	app.mount(target);
};

window.__reset = () => {
	if (app !== null) app.unmount();
	app = null;
	clearSetter();
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__prepare = (name) => {
	commit(caseByName(name).before);
	return nextTick();
};
window.__run = (name) => {
	commit(caseByName(name).after);
	return nextTick();
};
window.__ready = true;
