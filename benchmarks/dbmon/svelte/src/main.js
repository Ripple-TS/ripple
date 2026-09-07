import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import { remount, sortRows, tickFull, tickPartial } from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;

window.__mount = () => {
	flushSync(() => {
		app = mount(App, { target });
	});
};
window.__tick = () => flushSync(tickFull);
window.__tickPartial = () => flushSync(tickPartial);
window.__remount = () => flushSync(remount);
window.__sort = () => flushSync(sortRows);
window.__unmount = () => {
	if (!app) return;
	const current = app;
	app = null;
	return unmount(current);
};
window.__reset = () => {
	if (app) {
		void unmount(app);
		app = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
