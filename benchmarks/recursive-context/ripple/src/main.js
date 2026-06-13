import { mount, flushSync } from 'ripple';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.tsrx';

const target = document.getElementById('main');
let unmount = null;

window.__mount = () => {
	unmount = mount(App, { target, props: { depth: 10 } });
};
window.__updateRoot = () => {
	flushSync(bumpRoot);
};
window.__updatePartial = () => {
	flushSync(bumpPartial);
};
window.__partialUnmount = () => {
	flushSync(hideMid);
};
window.__partialRemount = () => {
	flushSync(showMid);
};
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
