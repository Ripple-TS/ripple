// Probes must exist before any component renders.
import './probes.js';
import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import {
	ctxA,
	ctxB,
	currentState,
	oneChangeA,
	oneChangeB,
	parentRerenderA,
	parentRerenderB,
} from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let app = null;
const sync = (operation) => () => flushSync(operation);

window.__mount = () => {
	app = mount(App, { target });
	flushSync();
};
window.__tickA = sync(parentRerenderA);
window.__tickB = sync(parentRerenderB);
window.__oneChangeA = sync(oneChangeA);
window.__oneChangeB = sync(oneChangeB);
window.__ctxA = sync(ctxA);
window.__ctxB = sync(ctxB);
window.__state = currentState;
window.__unmount = () => {
	if (app) {
		const mountedApp = app;
		app = null;
		return unmount(mountedApp);
	}
};
window.__ready = true;
