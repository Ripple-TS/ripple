import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import { bumpPartial, bumpRoot, hideMid, showMid } from './ops.js';

const target = document.getElementById('main');
let app = null;

window.__mount = () => {
	flushSync(() => {
		app = mount(App, { target, props: { depth: 10 } });
	});
};
window.__updateRoot = () => flushSync(bumpRoot);
window.__updatePartial = () => flushSync(bumpPartial);
window.__partialUnmount = () => flushSync(hideMid);
window.__partialRemount = () => flushSync(showMid);
window.__unmount = () => {
	if (!app) return;
	const current = app;
	app = null;
	let result;
	flushSync(() => {
		result = unmount(current);
	});
	return result;
};
window.__reset = () => {
	if (app) {
		void unmount(app);
		app = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
