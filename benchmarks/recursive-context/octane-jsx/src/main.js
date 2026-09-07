import { createRoot, flushSync } from 'octane';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.tsx';

const target = document.getElementById('main');
let root = null;

// index.html does NOT auto-mount; the harness wraps each call in performance.now().
window.__mount = () => {
	root = createRoot(target);
	root.render(App, { depth: 10 });
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
	if (root) {
		root.unmount();
		root = null;
	}
};
window.__reset = () => {
	if (root) {
		root.unmount();
		root = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
