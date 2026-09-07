import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;

window.__hits = 0;
window.__mount = () => {
	flushSync(() => {
		app = mount(App, { target });
	});
};
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
window.__openA = () => flushSync(ops.openA);
window.__closeA = () => flushSync(ops.closeA);
window.__openB = () => flushSync(ops.openB);
window.__closeB = () => flushSync(ops.closeB);
window.__openBS = () => flushSync(ops.openBS);
window.__closeBS = () => flushSync(ops.closeBS);
window.__openAll = () => flushSync(ops.openAll);
window.__closeAll = () => flushSync(ops.closeAll);
window.__rerenderA = () => flushSync(ops.rerenderA);
window.__rerenderB = () => flushSync(ops.rerenderB);
window.__rerenderBS = () => flushSync(ops.rerenderBS);
window.__setDistinct = (on) => flushSync(() => ops.setDistinct(on));
window.__ready = true;
