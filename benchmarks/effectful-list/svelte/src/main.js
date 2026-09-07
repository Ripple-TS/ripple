import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import './fx.js';
import { remove100, toEmpty, toFresh1k, updateDeps, updateNodeps } from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;

const run = (fn) => flushSync(fn);

window.__mount = () => {
	flushSync(() => {
		app = mount(App, { target });
	});
};

window.__toEmpty = () => run(toEmpty);
window.__toFresh1k = () => run(toFresh1k);

window.__opMount1k = () => run(toFresh1k);
window.__opUpdateNodeps = () => run(updateNodeps);
window.__opUpdateDeps = () => run(updateDeps);
window.__opClear = () => run(toEmpty);
window.__opRemount = () => run(toFresh1k);
window.__opRemove100 = () => run(remove100);

window.__unmount = () => {
	if (!app) return;
	const current = app;
	app = null;
	return unmount(current);
};
window.__ready = true;
