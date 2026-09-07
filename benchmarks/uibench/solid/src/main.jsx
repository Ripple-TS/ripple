import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App from './App.jsx';
import { caseByName } from '../../shared/workloads.js';
import { clearSetter, commit } from '../../shared/bridge.js';
import '../../octane-tsrx/src/style.css';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

let dispose = null;
let preparedCase = null;

window.__mount = () => {
	dispose = render(() => <App />, target);
	flush();
};

window.__reset = () => {
	if (dispose !== null) dispose();
	dispose = null;
	preparedCase = null;
	clearSetter();
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__prepare = (name) => {
	const entry = caseByName(name);
	// Solid's reconcile owns its input; prepare private endpoints outside the timer.
	preparedCase = {
		name,
		after: structuredClone(entry.after),
	};
	commit(structuredClone(entry.before));
	flush();
};
window.__run = (name) => {
	const after =
		preparedCase?.name === name ? preparedCase.after : structuredClone(caseByName(name).after);
	preparedCase = null;
	commit(after);
	flush();
};
window.__ready = true;
