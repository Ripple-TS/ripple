import { mount, flushSync } from 'ripple';
import App from './App.tsrx';
import { tickFull, tickPartial, remount, sortRows } from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let unmount = null;

window.__mount = () => {
	unmount = mount(App, { target });
};
window.__tick = () => flushSync(tickFull);
window.__tickPartial = () => flushSync(tickPartial);
window.__remount = () => flushSync(remount);
window.__sort = () => flushSync(sortRows);
window.__unmount = () => {
	if (unmount) {
		unmount();
		unmount = null;
	}
};
window.__reset = () => {
	if (unmount) {
		unmount();
		unmount = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
